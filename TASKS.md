# TASKS.md

## Phase 0: Foundation (complete)

- Initialize Tauri 2 + React 19 + TypeScript + Vite project
- Configure system tray icon
- Configure floating panel window with drag region
- Add global shortcut (Ctrl+Shift+V) to toggle panel visibility
- Set up Vitest + @testing-library/react
- Implement native drag-drop via `getCurrentWindow().onDragDropEvent`
- Implement `open_file` Tauri command
- Implement `get_file_infos` Tauri command (superseded in Phase 2)
- Set up `useShelfStore` with persisted state (superseded in Phase 1)

---

## Phase 1: Workspace/tab data model (current)

Replace the flat shelf model with a tabbed workspace model.

- [ ] Define `useWorkspaceStore` with full type system:
  - `Tab`, `WorkspaceFile`, `NoteCard`, `SketchCard`, `SectionConfig`, `Settings`
  - Actions: `createTab`, `updateTab`, `setActiveTab`, `clearTab`
  - Actions: `addFiles`, `removeFile`
  - Actions: `addNote`, `updateNote`, `removeNote`
  - Actions: `addSketch`, `updateSketch`, `removeSketch`
  - Actions: `updateSettings`, `reset`
- [ ] Write tests for all store actions
- [ ] Create `src/theme.ts` with `COLORS` and `TAB_COLOR_VALUES`
- [ ] Build `TabBar` component with create/rename/color flow
- [ ] Write tests for `TabBar`
- [ ] Build `WorkspacePanel` (header + tab bar + section placeholders)
- [ ] Build `TabContent` with section placeholder rendering
- [ ] Write tests for `WorkspacePanel`
- [ ] Update `App.tsx` to render `WorkspacePanel`
- [ ] Delete old files: `useShelfStore`, `appStore`, `ShelfPanel`, `FileItem`, `SettingsRow`
- [ ] Commit: `feat: Phase 1 — tabbed workspace shell replaces flat shelf`

---

## Phase 2: Persistent per-tab file sections

Replace `get_file_infos` with file copying. Implement full file management per tab.

- [ ] Add `copy_file` Tauri command (copies to `<appData>/files/`, returns `CopiedFileInfo`)
- [ ] Add `delete_file` Tauri command
- [ ] Register both commands in `main.rs`
- [ ] Verify Rust compiles
- [ ] Build `FileCard` component (open / remove / delete buttons)
- [ ] Write tests for `FileCard`
- [ ] Build `FilesSection` component (drag-drop listener, file list, delete confirm dialog)
- [ ] Write tests for `FilesSection`
- [ ] Update `TabContent` to render `FilesSection`
- [ ] Commit: `feat: Phase 2 — files section with copy, open, remove, and delete`

---

## Phase 3: Note cards per tab

Replace the single notepad string with multiple note cards.

- [ ] Build `NoteCard` component (collapsible, title, body preview, × button)
- [ ] Build `NoteEditor` component (modal: title input + textarea + save/cancel)
- [ ] Build `NotesSection` component (card list + add button + open-editor state)
- [ ] Write tests for `NotesSection`
- [ ] Update `TabContent` to render `NotesSection`
- [ ] Commit: `feat: Phase 3 — per-tab note cards with inline editor`

---

## Phase 4: Sketch cards per tab

Add freehand sketch cards with a canvas editor.

- [ ] Build `SketchCard` component (collapsible, title, thumbnail, × button)
- [ ] Build `SketchEditor` component (canvas, pen, eraser, brush size, clear, save/cancel)
- [ ] Build `SketchesSection` component (card list + add button + open-editor state)
- [ ] Write tests for `SketchesSection`
- [ ] Update `TabContent` to render `SketchesSection` (final version)
- [ ] Commit: `feat: Phase 4 — sketch cards with canvas editor`

---

## Phase 5: Clear-tab flow + settings panel + polish

- [ ] Build `SettingsPanel` component (bottom-sheet overlay: theme, file size, file time, keybind display)
- [ ] Update `WorkspacePanel` to add clear-tab button (⊘) with confirmation dialog
- [ ] Update `WorkspacePanel` to add settings gear (⚙) opening `SettingsPanel`
- [ ] Update `WorkspacePanel.test.tsx` with new button tests
- [ ] Update `CLAUDE.md` to reflect final product direction
- [ ] Run full test suite and Rust compile check
- [ ] Commit: `feat: Phase 5 — clear-tab confirmation, settings panel, final cleanup`

---

## Future / backlog

- Drag-file-out support (stored paths are available; requires Tauri drag-out API)
- File picker import
- Clipboard paste import
- Tab reordering
- Section layout toggle (list/grid — state structure already supports it)
- Touch/stylus support for sketch editor
- Image preview thumbnails in file cards
- Note search
- Sketch title rename in-place
- Per-tab workspace statistics (file count, note count)
