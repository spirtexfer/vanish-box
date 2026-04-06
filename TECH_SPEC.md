# TECH_SPEC.md

## Stack

| Layer | Technology | Reason |
|---|---|---|
| Desktop shell | Tauri 2 | Local-first, lightweight, no Electron overhead |
| UI | React 19 + TypeScript | Component model fits workspace UI |
| Build | Vite | Fast HMR, standard React tooling |
| State | Zustand 5 + persist middleware | Simple, no boilerplate, works with localStorage |
| File storage | OS filesystem via Tauri commands | Real files, no blob encoding overhead |
| Tests | Vitest + @testing-library/react | Co-located tests, fast, matches React idioms |

## Architecture overview

```
Tauri shell
├── main.rs          — builder: tray + shortcut + invoke handler
├── commands.rs      — copy_file, open_file, delete_file, trash_file, open_url, update_shortcut
├── tray.rs          — system tray icon, click → toggle_panel
├── shortcut.rs      — reads keybind.txt on startup (falls back to ctrl+shift+v), registers shortcut
└── window.rs        — toggle_panel: show/hide/focus the webview window

React app (WebView)
├── useWorkspaceStore  — all persistent state (tabs, files, notes, sketches, settings)
├── theme.ts           — COLORS token object (light/dark), TAB_COLOR_VALUES
└── components/        — see component tree in CLAUDE.md
```

## State storage

- All workspace state is persisted to localStorage under key `vanish-box-workspace`
- Persisted via Zustand's `persist` middleware — automatic on every state change
- State includes: tabs array, activeTabId, settings
- Each tab carries its own files[], notes[], sketches[], links[], and sections[] in-place
- Sketch canvas data is stored as base64 PNG strings in the workspace state
- No separate metadata database; state is the single source of truth

## File storage

- Tauri command `copy_file(source)`:
  - Resolves `<appData>/files/` via `app_handle.path().app_data_dir()`
  - Creates the directory if it does not exist
  - Copies the source file to `<appData>/files/<timestamp_ms>_<originalName>`
  - Returns `CopiedFileInfo { id, original_name, stored_path, size }`
- Tauri command `trash_file(sourcePath, storedPath)` (used by the 🗑 delete action):
  - Calls `trash::delete(sourcePath)` — moves the original source file to system trash
  - Calls `std::fs::remove_file(storedPath)` — deletes the app's stored copy
  - If trashing the original fails, returns an error; the UI shows an alert and does NOT remove the card
- Tauri command `delete_file(path)`:
  - Calls `std::fs::remove_file(path)` — internal use only
- Tauri command `open_url(url)`:
  - Same OS-dispatch pattern as `open_file`; opens in system default browser
- Tauri command `update_shortcut(keybind)`:
  - Persists keybind string to `<appData>/keybind.txt`
  - Unregisters all existing global shortcuts, registers the new one
  - Called from `WorkspacePanel` on mount and from `SettingsPanel` on capture
- Tauri command `open_file(path)`:
  - Windows: `cmd /c start "" <path>`
  - macOS: `open <path>`
  - Linux: `xdg-open <path>`

## Section model

Each tab contains a `sections: SectionConfig[]` field:

```typescript
interface SectionConfig {
  type: 'files' | 'notes' | 'sketches' | 'links'
  layout: 'list' | 'grid'
}
```

Default order: files → notes → sketches → links. Default layout: list.
This structure exists so future layout customization (drag reorder, grid mode) can be implemented without a store migration. The UI currently renders all four sections in their default order regardless of layout value.

## Styling

- All UI uses inline styles — no CSS files, no CSS modules, no Tailwind
- Colors come from `COLORS[settings.theme]` (a `ColorTokens` object from `src/theme.ts`)
- Tab accent colors come from `TAB_COLOR_VALUES[tab.color]`
- No ThemeProvider, no CSS variables — just plain object lookup

## Module responsibilities

| Module | Responsibility |
|---|---|
| `useWorkspaceStore` | All state + actions for tabs, files, notes, sketches, links, settings |
| `theme.ts` | Color token definitions only — no logic |
| `WorkspacePanel` | Root layout; owns clear-tab and settings panel open/close state; applies keybind on mount |
| `TabBar` | Tab list rendering; owns create-tab, rename-tab, and delete-tab (confirm) local state |
| `TabContent` | Iterates `tab.sections` and renders the appropriate section component |
| `FilesSection` | Owns drag-drop event listener; renders file cards; owns delete-confirm state |
| `FileCard` | Stateless: renders one file row, fires onOpen/onRemove/onDelete/onMoveUp/onMoveDown |
| `NotesSection` | Renders note cards; owns open-editor state |
| `NoteCard` | Stateless: renders one note row, fires onEdit/onRemove/onToggleCollapse |
| `NoteEditor` | Local state for title/body while editing; calls onSave on commit |
| `SketchesSection` | Renders sketch cards; owns open-editor state |
| `SketchCard` | Stateless: renders one sketch row + thumbnail, fires events |
| `SketchEditor` | Canvas ref + drawing state + undo/redo history; calls onSave with dataUrl on commit |
| `LinksSection` | Renders link cards; owns open-editor state |
| `LinkCard` | Stateless: renders one link row, fires onOpen/onEdit/onRemove |
| `LinkEditor` | Local state for title/url while editing; calls onSave on commit |
| `SettingsPanel` | Overlay: receives settings + onUpdate; owns KeybindCapture local state |

## Testing approach

- Unit tests co-located with components (`*.test.tsx`) and store (`*.test.ts`)
- Tauri APIs (`@tauri-apps/api/window`, `@tauri-apps/api/core`) are mocked via `vi.mock`
- Store is reset in `beforeEach` via `useWorkspaceStore.getState().reset()`
- No snapshot tests — behavior tests only
- See TESTING.md for full coverage checklist

## v1 constraints

- No backend
- No sync
- No remote storage
- No OS deep hooks beyond shortcut, tray, and normal file operations
- No automatic deletion of any kind
