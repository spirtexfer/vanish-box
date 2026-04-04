# DATA_MODEL.md

## TempItem

* id: string
* originalName: string
* storedName: string
* storedPath: string
* originalPath?: string
* mimeType?: string
* extension?: string
* sizeBytes: number
* importedAt: string
* expiresAt: string
* importMethod: "drag_drop" | "paste" | "file_picker"
* previewType?: "image" | "video" | "text" | "none"
* pinned?: boolean

## Settings

* defaultExpiryHours: number
* launchOnStartup: boolean
* globalShortcut: string
* theme: "light" | "system"
* showSecondsInExpiry: boolean

## Lifecycle states

* active
* expired
* deleted

## Notes

For the first prototype, state can remain simple and only persist active items plus user settings.
