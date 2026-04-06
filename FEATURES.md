# FEATURES.md

## Implemented

- Tray icon (click to toggle panel)
- Global shortcut (Ctrl+Shift+V) to toggle panel
- Floating panel window (drag region in header)
- Light/dark theme toggle
- Persisted workspace state (Zustand + localStorage, key: `vanish-box-workspace`)

## Implemented (workspace features)

### Tabs
- Default tab on first launch
- Create tab with name (max 20 chars) and color
- Rename tab (double-click)
- Delete tab with confirmation (× on tab; disabled when only one tab remains; activates adjacent tab)
- Switch tabs
- Tab color indicator (left border)
- Clear-tab action with confirmation dialog

### Files per tab
- Drag-and-drop import (copies file to `<appData>/files/`)
- File card: filename, optional size, optional timestamp
- Open with default OS app (click filename)
- Reorder files within a tab (↑/↓ buttons — UI order only, no file path change)
- Remove from Vanish Box (× button — removes card only; stored copy stays on disk)
- Delete from computer (🗑 button — confirmation dialog; moves original source file to system trash AND deletes stored copy)
- Drag-over visual feedback on drop zone
- Graceful handling of missing/moved files

### Notes per tab
- Multiple note cards per tab
- Create note (+ Add note button)
- Click card to open inline editor (title + body)
- Body preview (first 120 chars) in card when not collapsed
- Collapse/expand toggle
- Delete note (× button)

### Sketches per tab
- Multiple sketch cards per tab
- Create sketch (+ Add sketch button)
- Canvas editor: pen tool, eraser tool, brush size slider
- Clear canvas with confirmation prompt
- Undo/redo (↩/↪ buttons or Ctrl+Z / Ctrl+Y)
- Saves as base64 PNG (stored in workspace state)
- Thumbnail shown in card when not collapsed
- Collapse/expand toggle
- Delete sketch (× button)

### Links per tab
- Multiple link items per tab
- Add link (+ Add link button) with title and URL; title defaults to hostname if left blank
- Edit link (pencil button)
- Open link in system browser (click title)
- Remove link (× button)

### Settings
- Light/dark theme (dark mode toggle in settings panel)
- Show/hide file size
- Show/hide file timestamp
- Editable global shortcut (click-to-capture field; updates immediately; persists across restarts)

## Nice-to-have (future)

- Drag-file-out to other apps (stored paths are accessible; requires Tauri drag-out API integration)
- File picker import
- Clipboard paste import
- Section layout customization (list vs grid — state structure already supports it)
- Tab reordering
- Pinned or starred notes/sketches
- Sketch title rename in-place
- Note search/filter
- Media preview thumbnails for images
- Touch/stylus support in sketch editor
- Per-tab color themes

## Explicitly out of scope

- Auto-expiry or timed deletion of any kind
- Cloud storage or sync
- Accounts or authentication
- OS context menu integration
- Cross-device features
- AI features
- Backend services
