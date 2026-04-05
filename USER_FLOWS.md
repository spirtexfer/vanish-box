# USER_FLOWS.md

## Flow 1: Open the app

1. User presses global shortcut (Ctrl+Shift+V) or clicks the tray icon
2. The Vanish Box panel appears, showing the last active tab
3. User sees Files, Notes, and Sketches sections for that tab

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
4. App deletes the file from `<appData>/files/` and removes it from the Files section
5. If the file is already gone from disk, the error is logged and the card is removed from the UI anyway

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
6. User can clear the canvas with the Clear button
7. User clicks Save
8. Sketch thumbnail appears inside the card when not collapsed

## Flow 12: Clear a tab

1. User clicks the ⊘ (clear) icon in the header
2. A confirmation dialog appears: "Clear all files, notes, and sketches from this tab? This cannot be undone."
3. User clicks Clear tab
4. All files, notes, and sketches are removed from the tab
5. Stored file copies are NOT automatically deleted from disk — use Flow 7 to delete individual files before clearing, or the files remain in `<appData>/files/` as orphans

## Flow 13: Change settings

1. User clicks the ⚙ gear icon in the header
2. Settings panel slides up from the bottom
3. User toggles dark mode, file size display, or file timestamp display
4. Changes apply immediately
5. User clicks outside the panel or presses the backdrop to close

## Flow 14: Dismiss the panel

1. User presses global shortcut again, or clicks the tray icon
2. Panel hides; state is preserved
3. Reopening the panel restores all tabs and their content
