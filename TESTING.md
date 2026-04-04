# TESTING.md

## Core scenarios

* Import file by drag-and-drop
* Import file by file picker
* Import supported clipboard content
* Open imported file
* Reveal imported file in folder
* Drag imported file out into another app
* Auto-delete after expiry
* Remove manually
* Restore active list after restart

## Edge cases

* Duplicate filenames
* Very large file import
* Unsupported clipboard content
* Missing file on disk
* App closes during import
* Expiry occurs while UI is open
* Item deleted while selected

## File type checks

* PNG/JPG screenshots
* PDF documents
* DOCX files
* MP4 videos
* TXT/code files
* ZIP archives

## Acceptance criteria

* Common flows work without sign-in or network access
* No permanent clutter outside managed temp directory is created by the app itself
* Expiry cleanup behaves consistently
* UI remains fast and understandable
