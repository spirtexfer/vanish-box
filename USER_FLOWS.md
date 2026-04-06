# USER_FLOWS.md

## Flow 1: Open the app

1. User presses global shortcut (Ctrl+Shift+V, or custom) or clicks the tray icon
2. The Vanish Box panel appears, showing the last active tab
3. User sees Files, Notes, Sketches, and Links sections for that tab

## Flow 2: Create a new tab

1. User clicks the + button in the tab bar
2. A create form appears: name input and color picker
3. User types a name (up to 20 characters) and picks a color
4. User presses Enter or clicks Add
5. A new tab is created and becomes the active tab
6. All sections are empty

## Flow 3: Rename a tab

1. User double-clicks a tab in the tab bar
2. The tab name becomes an editable input
3. User types a new name (up to 20 characters)
4. User presses Enter or clicks away
5. Tab updates with the new name

## Flow 4: Drag a file into a tab

1. User activates the desired tab
2. User drags one or more files from their OS onto the Vanish Box panel
3. App copies each file into `<appData>/files/` with a unique stored name
4. Each file appears as a card in the Files section: name, optional size, optional timestamp
5. Files persist across app restarts

## Flow 5: Open a file

1. User clicks the filename in the file card
2. App invokes the OS default application for that file type
3. If the file is missing from disk, the error is logged silently; no UI crash

## Flow 6: Remove a file from Vanish Box

1. User clicks the × button on a file card
2. File is removed from the Files section immediately
3. The stored copy in `<appData>/files/` is NOT deleted — use Flow 7 to permanently delete

## Flow 7: Delete a file from the computer

1. User clicks the 🗑 button on a file card
2. A confirmation dialog appears: "Delete this file from your computer? This cannot be undone."
3. User clicks Delete
4. App invokes `trash_file`: moves the original source file to the system trash AND deletes the stored copy from `<appData>/files/`
5. The card is removed from the Files section
6. If the original source file cannot be trashed (e.g. it was already moved or deleted), an error alert is shown and the card is NOT removed

## Flow 8: Create and edit a note

1. User clicks "+ Add note" in the Notes section
2. A new note card appears titled "New note"
3. User clicks the note card to open the editor
4. User edits the title and body in the modal editor
5. User clicks Save
6. Card updates with the new title; body preview shows first 120 characters when not collapsed

## Flow 9: Collapse and expand a note

1. User clicks the ▼/▶ toggle on a note card
2. Card collapses to show only the title (body preview hidden)
3. Clicking the toggle again expands it

## Flow 10: Delete a note

1. User clicks × on a note card
2. Note is removed from the Notes section immediately
3. No confirmation required (notes have no file on disk)

## Flow 11: Create and draw a sketch

1. User clicks "+ Add sketch" in the Sketches section
2. A new sketch card appears titled "New sketch"
3. User clicks the sketch card to open the canvas editor
4. Canvas opens blank (400×300). User draws with pen or eraser
5. User can adjust brush thickness with the slider
6. User can undo/redo strokes: ↩ Undo / ↪ Redo buttons or Ctrl+Z / Ctrl+Y
7. User can clear the canvas: clicking Clear shows an inline confirmation; clicking Clear again wipes the canvas (clearable with undo)
8. User clicks Save
9. Sketch thumbnail appears inside the card when not collapsed

## Flow 12: Clear a tab

1. User clicks the ⊘ (clear) icon in the header
2. A confirmation dialog appears: "Clear all files, notes, and sketches from this tab? This cannot be undone."
3. User clicks Clear tab
4. All files, notes, sketches, and links are removed from the tab
5. Stored file copies are NOT automatically deleted from disk — use Flow 7 to delete individual files before clearing, or the files remain in `<appData>/files/` as orphans

## Flow 13: Change settings

1. User clicks the ⚙ gear icon in the header
2. Settings panel slides up from the bottom
3. User toggles dark mode, file size display, or file timestamp display
4. To change the global shortcut: user clicks the keybind field and presses a key combination; the shortcut updates immediately and persists across restarts
5. Changes apply immediately
6. User clicks outside the panel or presses the backdrop to close

## Flow 14: Delete a tab

1. User clicks the × button on a tab in the tab bar (visible when more than one tab exists)
2. A confirmation dialog appears: "Delete this tab and all its content? This cannot be undone."
3. User clicks Delete
4. The tab is removed; if it was the active tab, the last remaining tab becomes active
5. The last tab cannot be deleted — its × button is not shown

## Flow 15: Reorder files

1. User clicks ↑ or ↓ on a file card
2. The file swaps position with the adjacent file in that direction
3. Order is visual only — no file paths are changed

## Flow 16: Add a link

1. User clicks "+ Add link" in the Links section
2. A modal editor opens with Title and URL fields
3. User enters the URL and optionally a title (if title is blank, the URL hostname is used)
4. User clicks Save
5. A link card appears showing the title and URL

## Flow 17: Open a link

1. User clicks the link title in a link card
2. App invokes `open_url`; the URL opens in the system default browser

## Flow 18: Edit or remove a link

1. To edit: user clicks the pencil (✎) button → link editor opens pre-filled → user updates and saves
2. To remove: user clicks × on the link card → link is removed immediately (no confirmation)

## Flow 19: Dismiss the panel

1. User presses global shortcut again, or clicks the tray icon
2. Panel hides; state is preserved
3. Reopening the panel restores all tabs and their content
