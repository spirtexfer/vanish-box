# Vanish Box

A fast local desktop workspace utility built with Tauri 2, React 19, and TypeScript.

## What it does

Vanish Box opens instantly from a tray icon or global shortcut. Inside, you organize active task materials into tabs. Each tab is a mini workspace containing:

- **Files** — drag files in; they are copied into app-managed storage and persist until you remove them
- **Notes** — create multiple note cards per tab; click to open in a lightweight inline editor
- **Sketches** — create freehand sketch cards per tab; click to open a canvas editor with pen, eraser, and brush controls

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

Install dependencies from WSL (required for Linux binaries):

```bash
npm install
```

Run the Vite dev server (no Tauri):

```bash
npm run dev
```

Run with full Tauri integration:

```bash
npx tauri dev
```

Run tests:

```bash
npm test
```

## Architecture

```
src/
  store/useWorkspaceStore.ts   # All workspace state (tabs, files, notes, sketches, settings)
  theme.ts                     # COLORS token object (light/dark) + TAB_COLOR_VALUES
  components/
    WorkspacePanel.tsx         # Root layout
    TabBar.tsx                 # Tab strip + create/rename tab
    TabContent.tsx             # Renders sections for the active tab
    FilesSection.tsx           # Drag-drop + file list per tab
    FileCard.tsx               # File row: open / remove / delete
    NotesSection.tsx           # Note cards + editor per tab
    NoteCard.tsx               # Collapsible note card
    NoteEditor.tsx             # Modal note editor
    SketchesSection.tsx        # Sketch cards per tab
    SketchCard.tsx             # Collapsible sketch card with thumbnail
    SketchEditor.tsx           # Canvas sketch editor
    SettingsPanel.tsx          # Bottom-sheet settings overlay

src-tauri/src/
  main.rs                      # Entry: tray, shortcut, invoke handler
  commands.rs                  # copy_file, open_file, delete_file
  tray.rs                      # System tray setup
  shortcut.rs                  # Global shortcut (Ctrl+Shift+V)
  window.rs                    # Toggle panel visibility
```

## IDE Setup

- VS Code + [Tauri extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
