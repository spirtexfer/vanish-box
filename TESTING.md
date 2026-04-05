# TESTING.md

## Test infrastructure

- Framework: Vitest + @testing-library/react
- Test files co-located with components (`*.test.tsx`) and store (`*.test.ts`)
- Tauri APIs mocked via `vi.mock`:
  - `@tauri-apps/api/window` → `getCurrentWindow` returns a mock with `onDragDropEvent`
  - `@tauri-apps/api/core` → `invoke` is a `vi.fn()` with configurable return values
- Store reset in `beforeEach`: `useWorkspaceStore.getState().reset()`

Run all tests:
```bash
npm test
```

---

## Store tests (`useWorkspaceStore.test.ts`)

### Initial state
- [ ] Has one default tab named 'Workspace'
- [ ] `activeTabId` matches the default tab's id
- [ ] Default tab has three sections: files, notes, sketches (in that order)
- [ ] Default tab has empty files, notes, and sketches arrays

### Tab management
- [ ] `createTab` adds a tab and makes it active
- [ ] `createTab` truncates name to TAB_NAME_MAX_LEN (20 chars)
- [ ] New tab has three default sections
- [ ] `updateTab` updates tab name
- [ ] `updateTab` truncates name if over limit
- [ ] `updateTab` updates tab color
- [ ] `setActiveTab` switches the active tab
- [ ] `clearTab` empties files, notes, and sketches of the target tab
- [ ] `clearTab` does not affect other tabs

### File management
- [ ] `addFiles` adds files to the correct tab only
- [ ] `removeFile` removes the correct file from the correct tab
- [ ] Other tabs' files are not affected by operations on one tab

### Note management
- [ ] `addNote` creates a note with empty body and `collapsed: false`
- [ ] `updateNote` patches title and body
- [ ] `updateNote` updates `updatedAt`
- [ ] `removeNote` removes the correct note

### Sketch management
- [ ] `addSketch` creates a sketch with `dataUrl: null` and `collapsed: false`
- [ ] `updateSketch` patches title and dataUrl
- [ ] `updateSketch` updates `updatedAt`
- [ ] `removeSketch` removes the correct sketch

### Settings
- [ ] `updateSettings` merges partial settings without overwriting other fields

### Reset
- [ ] `reset` restores to a single default tab
- [ ] `reset` resets settings to defaults

---

## TabBar tests (`TabBar.test.tsx`)

- [ ] Renders the default tab name
- [ ] + button is present
- [ ] Clicking + shows create form with name input
- [ ] Pressing Enter in create form adds a tab and hides the form
- [ ] Pressing Escape in create form cancels without adding a tab
- [ ] Add button submits the create form
- [ ] Empty name defaults to 'Workspace'
- [ ] Clicking a tab makes it active in the store
- [ ] Double-clicking a tab shows rename input
- [ ] Renaming on Enter updates the store
- [ ] Color picker buttons (6) are shown when creating a tab

---

## WorkspacePanel tests (`WorkspacePanel.test.tsx`)

- [ ] Renders "Vanish Box" header
- [ ] Renders default tab name in tab bar
- [ ] Renders "Files", "Notes", "Sketches" section headings
- [ ] Renders drop-zone hints for each empty section
- [ ] Theme toggle button is present
- [ ] Clicking theme toggle switches theme in store
- [ ] Clear-tab (⊘) button is present
- [ ] Clicking ⊘ shows confirmation dialog
- [ ] Confirming clear-tab clears the active tab in the store
- [ ] Cancelling clear-tab dialog leaves content untouched
- [ ] Settings (⚙) button is present
- [ ] Clicking ⚙ opens the settings panel
- [ ] Settings panel dark-mode checkbox toggles theme in store

---

## FileCard tests (`FileCard.test.tsx`)

- [ ] Renders original file name
- [ ] Shows size when `showFileSize` is true
- [ ] Hides size when `showFileSize` is false
- [ ] Shows timestamp element when `showFileTimestamp` is true
- [ ] Hides timestamp element when `showFileTimestamp` is false
- [ ] Clicking filename calls `onOpen` with `storedPath`
- [ ] Clicking × calls `onRemove` with file id; does not call `onOpen`
- [ ] Clicking 🗑 calls `onDelete` with file id and storedPath; does not call `onOpen`

---

## FilesSection tests (`FilesSection.test.tsx`)

- [ ] Shows "Drop files here" when no files
- [ ] Renders file list after native drop event resolves
- [ ] Calls `copy_file` invoke for each dropped path
- [ ] Does not crash if `copy_file` fails for some files (partial success)
- [ ] Shows delete confirmation dialog when 🗑 is clicked
- [ ] Confirming delete calls `delete_file` and removes card from UI
- [ ] Cancelling delete dialog leaves the file in place
- [ ] Drag-drop listener is registered and unlistened on unmount (Strict Mode)

---

## NotesSection tests (`NotesSection.test.tsx`)

- [ ] Shows "No notes yet" when empty
- [ ] Shows "+ Add note" button
- [ ] Clicking "+ Add note" creates a note in the store
- [ ] Note card renders after adding
- [ ] Clicking a note card opens the editor
- [ ] Saving the editor updates the note title in the store
- [ ] Clicking × removes the note from the store
- [ ] Clicking collapse toggle toggles `collapsed` in the store

---

## SketchesSection tests (`SketchesSection.test.tsx`)

- [ ] Shows "No sketches yet" when empty
- [ ] Shows "+ Add sketch" button
- [ ] Clicking "+ Add sketch" creates a sketch in the store
- [ ] Sketch card renders after adding
- [ ] Clicking a sketch card opens the editor (Pen, Eraser, Clear buttons present)
- [ ] Clicking × removes the sketch from the store
- [ ] Clicking collapse toggle toggles `collapsed` in the store
- [ ] Cancelling the editor does not save (dataUrl remains null)

---

## Manual tests (require `npx tauri dev`)

### Tabs
- Create a tab with a name and color; verify tab bar updates
- Rename a tab with double-click; verify name truncates at 20 chars
- Switch between two tabs; verify each tab shows its own content independently

### Files
- Drag a PNG, a PDF, and a DOCX onto the Files section; all should appear
- Click a file name; verify it opens in the default OS application
- Click × on a file; verify it disappears but the file is still on disk
- Click 🗑 on a file; confirm the dialog; verify the file is gone from disk
- Restart the app; verify files still appear (persistence check)
- Move or delete a dragged-in file's original before it's copied; copy should succeed (it's a copy, not a reference)

### Notes
- Add a note; click it; edit title and body; save; verify updated card
- Collapse and expand a note; verify body preview hides/shows
- Delete a note; verify it's gone

### Sketches
- Add a sketch; click it; draw something; save; verify thumbnail appears
- Adjust brush size; switch to eraser; clear canvas; save empty
- Collapse and expand a sketch; verify thumbnail hides/shows

### Clear tab
- Add a file, note, and sketch; click ⊘; cancel; verify content intact
- Click ⊘ again; confirm; verify all three sections are empty

### Settings
- Toggle dark mode in the settings panel; verify colors update immediately
- Toggle file size off; verify size disappears from file cards
- Toggle file timestamp off; verify timestamp disappears

### Persistence
- Add items across multiple tabs; close the panel; reopen; verify everything is restored

---

## Edge cases

- [ ] Tab name at exactly 20 characters — accepted
- [ ] Tab name at 21 characters — truncated to 20
- [ ] Drop with no paths in payload — no crash, no empty cards added
- [ ] `copy_file` fails for one file in a multi-file drop — other files still added
- [ ] `delete_file` fails (file already gone) — card still removed from UI, error logged
- [ ] `open_file` fails (file missing) — no UI crash, error logged to console
- [ ] Store with no tabs (corrupt state) — `WorkspacePanel` falls back to `tabs[0]`
- [ ] Very long sketch saved to localStorage — no crash (may approach storage limits)
