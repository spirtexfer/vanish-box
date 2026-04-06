# DATA_MODEL.md

All types are defined in `src/store/useWorkspaceStore.ts`. The full workspace state is persisted to localStorage under key `vanish-box-workspace`.

---

## Top-level store shape

```typescript
{
  tabs: Tab[]          // ordered list of all tabs
  activeTabId: string  // id of the currently visible tab
  settings: Settings
}
```

---

## Tab

```typescript
interface Tab {
  id: string           // crypto.randomUUID()
  name: string         // max TAB_NAME_MAX_LEN (20) characters
  color: TabColor      // one of: 'slate' | 'blue' | 'purple' | 'green' | 'amber' | 'rose'
  sections: SectionConfig[]  // defines section order and layout; default: files → notes → sketches → links
  files: WorkspaceFile[]
  notes: NoteCard[]
  sketches: SketchCard[]
  links: LinkItem[]
}
```

On first launch, a single default tab is created:
- name: `'Workspace'`
- color: `'blue'`
- sections: default four sections in list layout (files, notes, sketches, links)

---

## SectionConfig

```typescript
type SectionType   = 'files' | 'notes' | 'sketches' | 'links'
type SectionLayout = 'list' | 'grid'

interface SectionConfig {
  type: SectionType
  layout: SectionLayout
}
```

The `sections` array on each tab controls which sections appear and in what order. Default order: files → notes → sketches → links. Layout customization is not exposed in the UI in v1 but the state structure supports it without migration.

---

## WorkspaceFile

```typescript
interface WorkspaceFile {
  id: string           // stored filename (e.g. "1712312345678_photo.png") — unique within the app
  originalName: string // original filename before copy (e.g. "photo.png")
  storedPath: string   // absolute path to the copy in <appData>/files/
  sourcePath: string   // absolute path to the original file at time of import
  size: number         // bytes
  addedAt: number      // Date.now() ms when the file was imported
}
```

Files are real copies on disk. `storedPath` is the app-managed copy. `sourcePath` is the original file location at import time (may no longer exist). `originalName` is for display only.

**Remove vs delete:**
- Remove (`onRemove`): deletes the `WorkspaceFile` record from the store only. The stored copy at `storedPath` is NOT deleted from disk.
- Delete (`onDelete`): calls `trash_file(sourcePath, storedPath)` Tauri command — moves the original source file to the system trash AND permanently deletes the stored copy. Both operations are attempted; if trashing the original fails (e.g. it was already moved), an error is shown and the card is NOT removed from the UI.

---

## NoteCard

```typescript
interface NoteCard {
  id: string           // crypto.randomUUID()
  title: string        // display title; default: 'New note'
  body: string         // full note content (plain text)
  collapsed: boolean   // whether body preview is hidden in the section view
  createdAt: number    // Date.now() ms
  updatedAt: number    // Date.now() ms, updated on every save
}
```

Notes are stored entirely in the workspace state (no files on disk). Body preview in the section view shows the first 120 characters when not collapsed.

---

## SketchCard

```typescript
interface SketchCard {
  id: string           // crypto.randomUUID()
  title: string        // display title; default: 'New sketch'
  dataUrl: string | null  // base64 PNG data URL from canvas.toDataURL('image/png'); null until first save
  collapsed: boolean   // whether thumbnail is hidden in the section view
  createdAt: number    // Date.now() ms
  updatedAt: number    // Date.now() ms, updated on every save
}
```

Sketches are stored as base64 PNG strings in the workspace state. Large or numerous sketches will increase localStorage usage. For v1 this is acceptable; future versions may store sketch files on disk.

---

## LinkItem

```typescript
interface LinkItem {
  id: string           // crypto.randomUUID()
  title: string        // display title; defaults to URL hostname if empty
  url: string          // full URL string
  createdAt: number    // Date.now() ms
}
```

Links are stored entirely in the workspace state (no files on disk). Clicking a link invokes the `open_url` Tauri command, which opens the URL in the system default browser.

---

## Settings

```typescript
type Theme = 'light' | 'dark'

interface Settings {
  theme: Theme           // UI color scheme
  keybind: string        // global shortcut; editable via settings panel; persisted to <appData>/keybind.txt
  showFileSize: boolean  // show file size in FileCard
  showFileTimestamp: boolean  // show addedAt time in FileCard
}
```

Default settings:
```typescript
{
  theme: 'light',
  keybind: 'ctrl+shift+v',
  showFileSize: true,
  showFileTimestamp: true,
}
```

---

## TabColor

```typescript
const TAB_COLORS = ['slate', 'blue', 'purple', 'green', 'amber', 'rose'] as const
type TabColor = typeof TAB_COLORS[number]
```

Color values are defined in `src/theme.ts` as `TAB_COLOR_VALUES`:

```typescript
{
  slate:  '#64748b',
  blue:   '#3b82f6',
  purple: '#8b5cf6',
  green:  '#22c55e',
  amber:  '#f59e0b',
  rose:   '#f43f5e',
}
```

---

## CopiedFileInfo (Rust → TypeScript)

Returned by the `copy_file` Tauri command:

```typescript
interface CopiedFileInfo {
  id: string            // stored filename used as WorkspaceFile.id
  original_name: string // original filename (snake_case from Rust serialization)
  stored_path: string   // absolute path to the copy
  source_path: string   // original file path at time of drag-drop
  size: number          // bytes
}
```

---

## What no longer exists

The following types from the old shelf model have been removed:

- `ShelfFile` — replaced by `WorkspaceFile`
- `TempItem` — never implemented; concept retired
- `ResetConfig` — removed; no expiry model
- `Settings.showCountdown` — removed
- `Settings.showTimestamp` — renamed to `showFileTimestamp`
- `Settings.showSize` — renamed to `showFileSize`
- `Settings.resetConfig` — removed
- `Settings.defaultExpiryHours` — removed
- Lifecycle states (`active`, `expired`, `deleted`) — removed; files persist until explicitly removed
