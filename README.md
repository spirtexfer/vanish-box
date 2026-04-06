# Vanish Box

A fast local desktop workspace utility built with Tauri 2, React 19, and TypeScript.

## What it does

Vanish Box opens instantly from a tray icon or global shortcut. Inside, you organize active task materials into tabs. Each tab is a mini workspace containing:

- **Files** — drag files in; they are copied into app-managed storage and persist until you remove them
- **Notes** — create multiple note cards per tab; click to open in a lightweight inline editor
- **Sketches** — create freehand sketch cards per tab; click to open a canvas editor with pen, eraser, brush controls, undo/redo, and clear
- **Links** — save named URLs per tab; click to open in the system browser

There is no expiry, no auto-deletion, and no cloud. Files stay until you remove them or clear the tab.

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 |
| UI | React 19 + TypeScript |
| Build | Vite |
| State | Zustand 5 (localStorage) |
| File storage | `<appData>/files/` |
| Tests | Vitest + @testing-library/react |

## Development

Install dependencies and run Tauri commands from **PowerShell** (Windows), not WSL — the Tauri CLI binary requires Windows-native node_modules:

```powershell
npm install
npm run tauri dev
```

Run the Vite dev server only (no Tauri, works from WSL):

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Architecture

```
src/
  store/useWorkspaceStore.ts   # All workspace state (tabs, files, notes, sketches, links, settings)
  theme.ts                     # COLORS token object (light/dark) + TAB_COLOR_VALUES
  components/
    WorkspacePanel.tsx         # Root layout; owns clear-tab confirm + settings open state
    TabBar.tsx                 # Tab strip + create/rename/delete tab
    TabContent.tsx             # Renders sections for the active tab
    FilesSection.tsx           # Drag-drop + file list per tab
    FileCard.tsx               # File row: open / reorder / remove / delete
    NotesSection.tsx           # Note cards + editor per tab
    NoteCard.tsx               # Collapsible note card
    NoteEditor.tsx             # Modal note editor
    SketchesSection.tsx        # Sketch cards per tab
    SketchCard.tsx             # Collapsible sketch card with thumbnail
    SketchEditor.tsx           # Canvas sketch editor with undo/redo and clear confirmation
    LinksSection.tsx           # Link list + add/edit per tab
    LinkCard.tsx               # Link row: open / edit / remove
    LinkEditor.tsx             # Modal link editor (title + URL)
    SettingsPanel.tsx          # Bottom-sheet settings overlay with keybind capture

src-tauri/src/
  main.rs                      # Entry: tray, shortcut, invoke handler
  commands.rs                  # copy_file, open_file, delete_file, trash_file, open_url, update_shortcut
  tray.rs                      # System tray setup
  shortcut.rs                  # Global shortcut setup (reads keybind.txt on startup)
  window.rs                    # Toggle panel visibility
```

## IDE Setup

- VS Code + [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
