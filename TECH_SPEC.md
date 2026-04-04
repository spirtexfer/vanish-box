# TECH_SPEC.md

## Recommended stack

* Tauri for desktop shell
* React for UI
* TypeScript for app code
* Local filesystem APIs through Tauri

## Reasoning

Tauri is a strong fit because the app is local-first, lightweight, and should avoid Electron-level overhead when possible. It supports local filesystem access without needing a backend.

## Architecture overview

* UI layer: React app rendering the floating shelf panel
* Desktop shell: Tauri app handling window behavior, tray integration, shortcut registration, and filesystem access
* Storage layer: local managed temp directory plus metadata index

## Initial modules

* Window and tray manager
* Global shortcut handler
* File import service
* Clipboard import service
* Temp storage manager
* Metadata index manager
* Expiry cleanup service
* UI state store

## Storage design

* App creates a dedicated temp storage directory
* Files copied into that directory use generated IDs or safe filenames
* Metadata stored locally in JSON or lightweight local database

## Suggested metadata fields

* id
* originalName
* storedName
* originalPath if applicable
* mimeType or extension
* sizeBytes
* createdAt
* expiresAt
* importMethod
* previewEligible

## Cleanup model

* Expiry check on app open
* Expiry check periodically while app is running
* Delete metadata and file together
* Handle missing files gracefully

## v1 technical constraints

* No backend
* No sync
* No remote storage
* No OS deep hooks beyond shortcut, tray, and normal file operations
