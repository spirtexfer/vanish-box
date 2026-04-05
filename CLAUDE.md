# CLAUDE.md

## Project overview

Vanish Box is a fast local desktop workspace utility. Users organize active task materials into tabs. Each tab contains files, notes, and sketches. The app opens instantly via tray icon or global shortcut and is entirely local — no accounts, no cloud, no backend.

## Product name

Vanish Box

## Core promise

A fast, local, no-account desktop app that acts as a personal workspace. Users open it instantly, drag files in, write notes, sketch ideas, and keep everything organized by task in tabs.

## Stack

- Desktop: Tauri 2
- UI: React 19 + TypeScript + Vite
- State: Zustand 5 (persisted to localStorage key `vanish-box-workspace`)
- File storage: app data dir — `<appData>/files/`
- Tests: Vitest + @testing-library/react
- No backend, no accounts, no cloud

## App structure

```
WorkspacePanel
├── header (drag region, theme toggle, clear-tab, settings gear)
├── TabBar (tab strip + create-tab form)
└── TabContent (active tab)
    ├── Files section  → FilesSection
    ├── Notes section  → NotesSection
    └── Sketches section → SketchesSection
```

Each section renders a list of cards. Section order and layout (list vs grid) are stored in tab state so layout customization can be added later without a store rewrite.

## Tauri commands

| Command | Description |
|---|---|
| `copy_file(source)` | Copies a file into `<appData>/files/`. Returns `CopiedFileInfo` (id, original_name, stored_path, size). |
| `open_file(path)` | Opens a stored file with the default OS application. |
| `delete_file(path)` | Permanently deletes a file from `<appData>/files/`. |

## Store key types (src/store/useWorkspaceStore.ts)

- `Tab` — id, name (max 20 chars), color (TabColor), sections (SectionConfig[]), files, notes, sketches
- `WorkspaceFile` — id, originalName, storedPath, size, addedAt
- `NoteCard` — id, title, body, collapsed, createdAt, updatedAt
- `SketchCard` — id, title, dataUrl (base64 PNG or null), collapsed, createdAt, updatedAt
- `SectionConfig` — type ('files'|'notes'|'sketches'), layout ('list'|'grid')
- `Settings` — theme, keybind, showFileSize, showFileTimestamp

## Engineering principles

- TDD: write failing tests before implementation
- Inline styles with `COLORS` token object from `src/theme.ts` (no CSS classes)
- No overengineering — implement what is needed per phase
- Each phase is independently testable and committable
- Keep file-level responsibilities focused and narrow

## Claude behavior instructions

- Prioritize shipping working software over speculative architecture
- Follow TDD: write tests first, implement second
- Do not add features beyond the current phase
- Do not introduce backend, cloud, or accounts
- Keep inline styles consistent with the COLORS token object
- When making tradeoffs, prefer simplicity and local reliability
- Explain major technical decisions briefly in DECISIONS.md
