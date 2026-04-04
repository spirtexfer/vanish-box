# USER_FLOWS.md

## Flow 1: Drag file into shelf

1. User opens Temp Shelf
2. User drags one or more files into the panel
3. App copies files into managed temp storage
4. UI shows each item with name, type, size, added time, and expiry status
5. User leaves files there until needed

## Flow 2: Paste from clipboard

1. User copies image or file content to clipboard
2. User opens Temp Shelf
3. User pastes
4. App creates a temporary stored item when clipboard content is supported
5. Item appears in shelf with expiry timer

## Flow 3: Add with file picker

1. User opens Temp Shelf
2. User clicks add button
3. User selects one or more files
4. App copies them into temp storage
5. Items appear in shelf

## Flow 4: Use file in another app

1. User opens Temp Shelf
2. User locates target item
3. User drags item out into another app or upload field
4. Original temp copy remains until expiry unless user deletes it manually

## Flow 5: Expiry cleanup

1. File reaches expiry time
2. App removes file from shelf UI
3. App deletes local temp copy
4. Storage remains clean without user intervention

## Flow 6: Manual removal

1. User opens Temp Shelf
2. User clicks remove on an item
3. App deletes local temp copy immediately
4. Item disappears from shelf UI
