# Vanish Box — Workspace Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Vanish Box from a flat temporary file shelf into a tabbed local workspace where each tab holds files, notes, and sketches.

**Architecture:** Central Zustand store (`useWorkspaceStore`) owns tabs; each tab carries its own files/notes/sketches arrays and a `sections` config array (for future layout customization). Rust commands `copy_file` and `delete_file` manage app-owned file storage alongside the existing `open_file`. All UI uses inline styles with a `COLORS` token object (light/dark) from `src/theme.ts`.

**Tech Stack:** React 19, TypeScript, Zustand 5 (persisted to `'vanish-box-workspace'`), Tauri 2, Vite, Vitest + @testing-library/react

---

## Pre-implementation overview

### What to reuse

| Item | Decision |
|---|---|
| `tray.rs`, `shortcut.rs`, `window.rs` | Keep as-is |
| `commands.rs: open_file` | Keep as-is |
| Drag-drop `cancelled`-flag `useEffect` pattern | Reuse in `FilesSection` |
| Vitest + @testing-library/react + `src/test-setup.ts` | Keep |

### What to remove

- `src/store/useShelfStore.ts` — replaced by `useWorkspaceStore`
- `src/store/useShelfStore.test.ts`
- `src/store/appStore.ts` — `isPanelReady` is unused by current `App.tsx`
- `src/store/appStore.test.ts`
- `src/components/ShelfPanel.tsx` — replaced by `WorkspacePanel`
- `src/components/ShelfPanel.test.tsx`
- `src/components/FileItem.tsx` — replaced by `FileCard`
- `src/components/FileItem.test.tsx`
- `src/components/SettingsRow.tsx` — replaced by `SettingsPanel`
- `src-tauri/src/commands.rs: get_file_infos` — replaced by `copy_file`

### New file map

```
src/
  theme.ts                          # COLORS token object (light/dark) + TAB_COLOR_VALUES
  store/
    useWorkspaceStore.ts            # All workspace state + actions
    useWorkspaceStore.test.ts       # Store unit tests
  components/
    WorkspacePanel.tsx              # Root panel: header + tab bar + tab content
    WorkspacePanel.test.tsx
    TabBar.tsx                      # Tab strip + create/rename/color
    TabBar.test.tsx
    TabContent.tsx                  # Renders sections for active tab (updated each phase)
    FilesSection.tsx                # Drag-drop + file list (Phase 2)
    FilesSection.test.tsx
    FileCard.tsx                    # File row: open / remove / delete (Phase 2)
    FileCard.test.tsx
    NotesSection.tsx                # Note cards + add button (Phase 3)
    NotesSection.test.tsx
    NoteCard.tsx                    # Collapsible note card (Phase 3)
    NoteEditor.tsx                  # Modal note editor (Phase 3)
    SketchesSection.tsx             # Sketch cards + add button (Phase 4)
    SketchesSection.test.tsx
    SketchCard.tsx                  # Collapsible sketch card with thumbnail (Phase 4)
    SketchEditor.tsx                # Canvas sketch editor modal (Phase 4)
    SettingsPanel.tsx               # Bottom-sheet settings overlay (Phase 5)
src-tauri/src/
  commands.rs                       # Add copy_file + delete_file; keep open_file
  main.rs                           # Register new commands
```

---

## Phase 1 — Store + Tab Shell

### Task 1: Create `useWorkspaceStore`

**Files:**
- Create: `src/store/useWorkspaceStore.ts`
- Create: `src/store/useWorkspaceStore.test.ts`

- [ ] **Step 1.1 — Write the failing tests**

```typescript
// src/store/useWorkspaceStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkspaceStore } from './useWorkspaceStore'
import type { TabColor } from './useWorkspaceStore'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

describe('initial state', () => {
  it('has one default tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    expect(result.current.tabs).toHaveLength(1)
    expect(result.current.tabs[0].name).toBe('Workspace')
  })

  it('activeTabId matches the default tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    expect(result.current.activeTabId).toBe(result.current.tabs[0].id)
  })

  it('default tab has three sections: files, notes, sketches', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const types = result.current.tabs[0].sections.map((s) => s.type)
    expect(types).toEqual(['files', 'notes', 'sketches'])
  })

  it('default tab has empty files, notes, and sketches', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tab = result.current.tabs[0]
    expect(tab.files).toEqual([])
    expect(tab.notes).toEqual([])
    expect(tab.sketches).toEqual([])
  })
})

describe('createTab', () => {
  it('adds a tab and makes it active', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('Design', 'purple') })
    expect(result.current.tabs).toHaveLength(2)
    expect(result.current.tabs[1].name).toBe('Design')
    expect(result.current.activeTabId).toBe(result.current.tabs[1].id)
  })

  it('truncates name at TAB_NAME_MAX_LEN (20 chars)', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('A'.repeat(30), 'blue') })
    expect(result.current.tabs[1].name).toBe('A'.repeat(20))
  })

  it('new tab has three default sections', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('Dev', 'green') })
    const types = result.current.tabs[1].sections.map((s) => s.type)
    expect(types).toEqual(['files', 'notes', 'sketches'])
  })
})

describe('updateTab', () => {
  it('updates name of a tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const id = result.current.tabs[0].id
    act(() => { result.current.updateTab(id, { name: 'Renamed' }) })
    expect(result.current.tabs[0].name).toBe('Renamed')
  })

  it('truncates name on updateTab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const id = result.current.tabs[0].id
    act(() => { result.current.updateTab(id, { name: 'B'.repeat(25) }) })
    expect(result.current.tabs[0].name).toBe('B'.repeat(20))
  })

  it('updates color of a tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const id = result.current.tabs[0].id
    act(() => { result.current.updateTab(id, { color: 'rose' as TabColor }) })
    expect(result.current.tabs[0].color).toBe('rose')
  })
})

describe('setActiveTab', () => {
  it('switches the active tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('Work', 'blue') })
    const firstId = result.current.tabs[0].id
    act(() => { result.current.setActiveTab(firstId) })
    expect(result.current.activeTabId).toBe(firstId)
  })
})

describe('clearTab', () => {
  it('empties files, notes, and sketches of the target tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => {
      result.current.addFiles(tabId, [
        { id: 'f1', originalName: 'a.txt', storedPath: '/tmp/a.txt', size: 10, addedAt: 0 },
      ])
      result.current.addNote(tabId)
      result.current.addSketch(tabId)
    })
    expect(result.current.tabs[0].files).toHaveLength(1)
    expect(result.current.tabs[0].notes).toHaveLength(1)
    expect(result.current.tabs[0].sketches).toHaveLength(1)

    act(() => { result.current.clearTab(tabId) })

    expect(result.current.tabs[0].files).toEqual([])
    expect(result.current.tabs[0].notes).toEqual([])
    expect(result.current.tabs[0].sketches).toEqual([])
  })
})

describe('addFiles / removeFile', () => {
  it('adds files to the correct tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('B', 'green') })
    const tabAId = result.current.tabs[0].id
    const tabBId = result.current.tabs[1].id
    act(() => {
      result.current.addFiles(tabAId, [{ id: 'f1', originalName: 'x.txt', storedPath: '/x', size: 1, addedAt: 0 }])
    })
    expect(result.current.tabs[0].files).toHaveLength(1)
    expect(result.current.tabs[1].files).toHaveLength(0)
    void tabBId
  })

  it('removeFile removes from correct tab only', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => {
      result.current.addFiles(tabId, [
        { id: 'f1', originalName: 'a.txt', storedPath: '/a', size: 1, addedAt: 0 },
        { id: 'f2', originalName: 'b.txt', storedPath: '/b', size: 1, addedAt: 0 },
      ])
    })
    act(() => { result.current.removeFile(tabId, 'f1') })
    expect(result.current.tabs[0].files).toHaveLength(1)
    expect(result.current.tabs[0].files[0].id).toBe('f2')
  })
})

describe('addNote / updateNote / removeNote', () => {
  it('addNote creates a note with empty body', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addNote(tabId) })
    const notes = result.current.tabs[0].notes
    expect(notes).toHaveLength(1)
    expect(notes[0].body).toBe('')
    expect(notes[0].collapsed).toBe(false)
  })

  it('updateNote patches the note', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addNote(tabId) })
    const noteId = result.current.tabs[0].notes[0].id
    act(() => { result.current.updateNote(tabId, noteId, { title: 'Hello', body: 'World' }) })
    const note = result.current.tabs[0].notes[0]
    expect(note.title).toBe('Hello')
    expect(note.body).toBe('World')
  })

  it('removeNote removes the correct note', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addNote(tabId); result.current.addNote(tabId) })
    const noteId = result.current.tabs[0].notes[0].id
    act(() => { result.current.removeNote(tabId, noteId) })
    expect(result.current.tabs[0].notes).toHaveLength(1)
    expect(result.current.tabs[0].notes[0].id).not.toBe(noteId)
  })
})

describe('addSketch / updateSketch / removeSketch', () => {
  it('addSketch creates a sketch with null dataUrl', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addSketch(tabId) })
    const sketch = result.current.tabs[0].sketches[0]
    expect(sketch.dataUrl).toBeNull()
    expect(sketch.collapsed).toBe(false)
  })

  it('updateSketch patches the sketch', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addSketch(tabId) })
    const sketchId = result.current.tabs[0].sketches[0].id
    act(() => { result.current.updateSketch(tabId, sketchId, { title: 'My sketch', dataUrl: 'data:...' }) })
    expect(result.current.tabs[0].sketches[0].title).toBe('My sketch')
    expect(result.current.tabs[0].sketches[0].dataUrl).toBe('data:...')
  })

  it('removeSketch removes the correct sketch', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addSketch(tabId); result.current.addSketch(tabId) })
    const sketchId = result.current.tabs[0].sketches[0].id
    act(() => { result.current.removeSketch(tabId, sketchId) })
    expect(result.current.tabs[0].sketches).toHaveLength(1)
    expect(result.current.tabs[0].sketches[0].id).not.toBe(sketchId)
  })
})

describe('updateSettings', () => {
  it('merges partial settings without clobbering other fields', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.updateSettings({ theme: 'dark' }) })
    expect(result.current.settings.theme).toBe('dark')
    expect(result.current.settings.showFileSize).toBe(true)
    expect(result.current.settings.keybind).toBe('ctrl+shift+v')
  })
})

describe('reset', () => {
  it('restores to a single default tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('Extra', 'rose') })
    expect(result.current.tabs).toHaveLength(2)
    act(() => { result.current.reset() })
    expect(result.current.tabs).toHaveLength(1)
    expect(result.current.tabs[0].name).toBe('Workspace')
  })

  it('resets settings to defaults', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.updateSettings({ theme: 'dark' }) })
    act(() => { result.current.reset() })
    expect(result.current.settings.theme).toBe('light')
  })
})
```

- [ ] **Step 1.2 — Run tests, confirm they fail**

```bash
cd /mnt/c/Users/victo/miniProjects/vanishBox
npm test -- src/store/useWorkspaceStore.test.ts
```

Expected: FAIL — `Cannot find module './useWorkspaceStore'`

- [ ] **Step 1.3 — Implement `useWorkspaceStore.ts`**

```typescript
// src/store/useWorkspaceStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const TAB_COLORS = ['slate', 'blue', 'purple', 'green', 'amber', 'rose'] as const
export type TabColor = (typeof TAB_COLORS)[number]
export const TAB_NAME_MAX_LEN = 20

export type SectionLayout = 'list' | 'grid'
export type SectionType = 'files' | 'notes' | 'sketches'

export interface SectionConfig {
  type: SectionType
  layout: SectionLayout
}

export interface WorkspaceFile {
  id: string
  originalName: string
  storedPath: string
  size: number
  addedAt: number
}

export interface NoteCard {
  id: string
  title: string
  body: string
  collapsed: boolean
  createdAt: number
  updatedAt: number
}

export interface SketchCard {
  id: string
  title: string
  dataUrl: string | null
  collapsed: boolean
  createdAt: number
  updatedAt: number
}

export interface Tab {
  id: string
  name: string
  color: TabColor
  sections: SectionConfig[]
  files: WorkspaceFile[]
  notes: NoteCard[]
  sketches: SketchCard[]
}

export type Theme = 'light' | 'dark'

export interface Settings {
  theme: Theme
  keybind: string
  showFileSize: boolean
  showFileTimestamp: boolean
}

function makeDefaultSections(): SectionConfig[] {
  return [
    { type: 'files', layout: 'list' },
    { type: 'notes', layout: 'list' },
    { type: 'sketches', layout: 'list' },
  ]
}

function makeDefaultTab(): Tab {
  return {
    id: crypto.randomUUID(),
    name: 'Workspace',
    color: 'blue',
    sections: makeDefaultSections(),
    files: [],
    notes: [],
    sketches: [],
  }
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  keybind: 'ctrl+shift+v',
  showFileSize: true,
  showFileTimestamp: true,
}

interface WorkspaceStore {
  tabs: Tab[]
  activeTabId: string
  settings: Settings

  createTab: (name: string, color: TabColor) => void
  updateTab: (id: string, patch: Partial<Pick<Tab, 'name' | 'color'>>) => void
  setActiveTab: (id: string) => void
  clearTab: (id: string) => void

  addFiles: (tabId: string, files: WorkspaceFile[]) => void
  removeFile: (tabId: string, fileId: string) => void

  addNote: (tabId: string) => void
  updateNote: (tabId: string, noteId: string, patch: Partial<Pick<NoteCard, 'title' | 'body' | 'collapsed'>>) => void
  removeNote: (tabId: string, noteId: string) => void

  addSketch: (tabId: string) => void
  updateSketch: (tabId: string, sketchId: string, patch: Partial<Pick<SketchCard, 'title' | 'dataUrl' | 'collapsed'>>) => void
  removeSketch: (tabId: string, sketchId: string) => void

  updateSettings: (s: Partial<Settings>) => void
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => {
      const initialTab = makeDefaultTab()
      return {
        tabs: [initialTab],
        activeTabId: initialTab.id,
        settings: DEFAULT_SETTINGS,

        createTab: (name, color) => {
          const tab: Tab = {
            id: crypto.randomUUID(),
            name: name.slice(0, TAB_NAME_MAX_LEN),
            color,
            sections: makeDefaultSections(),
            files: [],
            notes: [],
            sketches: [],
          }
          set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }))
        },

        updateTab: (id, patch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...patch,
                    name:
                      patch.name !== undefined
                        ? patch.name.slice(0, TAB_NAME_MAX_LEN)
                        : t.name,
                  }
                : t
            ),
          })),

        setActiveTab: (id) => set({ activeTabId: id }),

        clearTab: (id) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === id ? { ...t, files: [], notes: [], sketches: [] } : t
            ),
          })),

        addFiles: (tabId, files) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, files: [...t.files, ...files] } : t
            ),
          })),

        removeFile: (tabId, fileId) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, files: t.files.filter((f) => f.id !== fileId) }
                : t
            ),
          })),

        addNote: (tabId) => {
          const note: NoteCard = {
            id: crypto.randomUUID(),
            title: 'New note',
            body: '',
            collapsed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, notes: [...t.notes, note] } : t
            ),
          }))
        },

        updateNote: (tabId, noteId, patch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    notes: t.notes.map((n) =>
                      n.id === noteId
                        ? { ...n, ...patch, updatedAt: Date.now() }
                        : n
                    ),
                  }
                : t
            ),
          })),

        removeNote: (tabId, noteId) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) }
                : t
            ),
          })),

        addSketch: (tabId) => {
          const sketch: SketchCard = {
            id: crypto.randomUUID(),
            title: 'New sketch',
            dataUrl: null,
            collapsed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, sketches: [...t.sketches, sketch] } : t
            ),
          }))
        },

        updateSketch: (tabId, sketchId, patch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    sketches: t.sketches.map((s) =>
                      s.id === sketchId
                        ? { ...s, ...patch, updatedAt: Date.now() }
                        : s
                    ),
                  }
                : t
            ),
          })),

        removeSketch: (tabId, sketchId) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, sketches: t.sketches.filter((s) => s.id !== sketchId) }
                : t
            ),
          })),

        updateSettings: (s) =>
          set((state) => ({ settings: { ...state.settings, ...s } })),

        reset: () => {
          const tab = makeDefaultTab()
          set({ tabs: [tab], activeTabId: tab.id, settings: DEFAULT_SETTINGS })
        },
      }
    },
    { name: 'vanish-box-workspace' }
  )
)
```

- [ ] **Step 1.4 — Run tests, confirm they pass**

```bash
npm test -- src/store/useWorkspaceStore.test.ts
```

Expected: All tests PASS.

- [ ] **Step 1.5 — Commit**

```bash
git add src/store/useWorkspaceStore.ts src/store/useWorkspaceStore.test.ts
git commit -m "feat: add useWorkspaceStore with tab/file/note/sketch model"
```

---

### Task 2: Create `theme.ts` and `TabBar`

**Files:**
- Create: `src/theme.ts`
- Create: `src/components/TabBar.tsx`
- Create: `src/components/TabBar.test.tsx`

- [ ] **Step 2.1 — Create `theme.ts`**

```typescript
// src/theme.ts
import type { Theme } from './store/useWorkspaceStore'

export interface ColorTokens {
  bg: string
  bgSecondary: string
  bgHover: string
  border: string
  text: string
  textMuted: string
  accent: string
}

export const COLORS: Record<Theme, ColorTokens> = {
  light: {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    bgHover: '#f3f4f6',
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#9ca3af',
    accent: '#6366f1',
  },
  dark: {
    bg: '#1f2937',
    bgSecondary: '#111827',
    bgHover: '#374151',
    border: '#374151',
    text: '#f9fafb',
    textMuted: '#6b7280',
    accent: '#818cf8',
  },
}

export const TAB_COLOR_VALUES: Record<string, string> = {
  slate: '#64748b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#22c55e',
  amber: '#f59e0b',
  rose: '#f43f5e',
}
```

- [ ] **Step 2.2 — Write failing tests for `TabBar`**

```typescript
// src/components/TabBar.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from './TabBar'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

describe('TabBar', () => {
  it('renders the default tab name', () => {
    render(<TabBar colors={COLORS.light} />)
    expect(screen.getByText('Workspace')).toBeTruthy()
  })

  it('shows the + button', () => {
    render(<TabBar colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: 'new tab' })).toBeTruthy()
  })

  it('clicking + reveals create form with name input', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    expect(screen.getByPlaceholderText('Tab name')).toBeTruthy()
  })

  it('pressing Enter in create form adds a tab and hides the form', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    const input = screen.getByPlaceholderText('Tab name')
    fireEvent.change(input, { target: { value: 'Research' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useWorkspaceStore.getState().tabs).toHaveLength(2)
    expect(useWorkspaceStore.getState().tabs[1].name).toBe('Research')
    expect(screen.queryByPlaceholderText('Tab name')).toBeNull()
  })

  it('pressing Escape in create form cancels without adding a tab', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    fireEvent.keyDown(screen.getByPlaceholderText('Tab name'), { key: 'Escape' })
    expect(useWorkspaceStore.getState().tabs).toHaveLength(1)
  })

  it('clicking Add button submits the create form', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    const input = screen.getByPlaceholderText('Tab name')
    fireEvent.change(input, { target: { value: 'Tasks' } })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }))
    expect(useWorkspaceStore.getState().tabs[1].name).toBe('Tasks')
  })

  it('empty name defaults to "Workspace"', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    fireEvent.keyDown(screen.getByPlaceholderText('Tab name'), { key: 'Enter' })
    expect(useWorkspaceStore.getState().tabs[1].name).toBe('Workspace')
  })

  it('clicking a tab makes it active', () => {
    const store = useWorkspaceStore.getState()
    store.createTab('Dev', 'green')
    const tabs = useWorkspaceStore.getState().tabs
    // set first tab active before render
    store.setActiveTab(tabs[0].id)
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByText('Dev'))
    expect(useWorkspaceStore.getState().activeTabId).toBe(tabs[1].id)
  })

  it('double-clicking a tab shows rename input', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.dblClick(screen.getByText('Workspace'))
    const input = screen.getByDisplayValue('Workspace')
    expect(input.tagName).toBe('INPUT')
  })

  it('renaming a tab on Enter updates the store', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.dblClick(screen.getByText('Workspace'))
    const input = screen.getByDisplayValue('Workspace')
    fireEvent.change(input, { target: { value: 'Main' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useWorkspaceStore.getState().tabs[0].name).toBe('Main')
  })

  it('color picker buttons are shown when creating a tab', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    // 6 colors
    expect(screen.getAllByRole('button', { name: /^color-/ })).toHaveLength(6)
  })
})
```

- [ ] **Step 2.3 — Run tests, confirm they fail**

```bash
npm test -- src/components/TabBar.test.tsx
```

Expected: FAIL — `Cannot find module './TabBar'`

- [ ] **Step 2.4 — Implement `TabBar.tsx`**

```tsx
// src/components/TabBar.tsx
import { useState } from 'react'
import { useWorkspaceStore, TAB_COLORS, TAB_NAME_MAX_LEN, Tab, TabColor } from '../store/useWorkspaceStore'
import { ColorTokens, TAB_COLOR_VALUES } from '../theme'

interface TabBarProps {
  colors: ColorTokens
}

export function TabBar({ colors }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab, createTab, updateTab } = useWorkspaceStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<TabColor>('blue')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function submitCreate() {
    const name = newName.trim() || 'Workspace'
    createTab(name, newColor)
    setCreating(false)
    setNewName('')
    setNewColor('blue')
  }

  function startEdit(tab: Tab) {
    setEditingId(tab.id)
    setEditName(tab.name)
  }

  function submitEdit() {
    if (editingId) {
      updateTab(editingId, { name: editName.trim() || 'Workspace' })
    }
    setEditingId(null)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 8px',
        borderBottom: `1px solid ${colors.border}`,
        background: colors.bg,
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onDoubleClick={() => startEdit(tab)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: tab.id === activeTabId ? colors.bgSecondary : 'transparent',
            border:
              tab.id === activeTabId
                ? `1px solid ${colors.border}`
                : '1px solid transparent',
            borderLeft: `3px solid ${TAB_COLOR_VALUES[tab.color]}`,
            maxWidth: '140px',
            flexShrink: 0,
          }}
        >
          {editingId === tab.id ? (
            <input
              autoFocus
              value={editName}
              maxLength={TAB_NAME_MAX_LEN}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={submitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitEdit()
                if (e.key === 'Escape') setEditingId(null)
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: colors.text,
                width: '100px',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: '12px',
                color: colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.name}
            </span>
          )}
        </div>
      ))}

      {creating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <input
            autoFocus
            value={newName}
            maxLength={TAB_NAME_MAX_LEN}
            placeholder="Tab name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            style={{
              fontSize: '12px',
              padding: '2px 6px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.bg,
              color: colors.text,
              width: '100px',
            }}
          />
          <div style={{ display: 'flex', gap: '3px' }}>
            {TAB_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                aria-label={`color-${c}`}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: TAB_COLOR_VALUES[c],
                  border: newColor === c ? '2px solid #000' : '1px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <button
            onClick={submitCreate}
            style={{ fontSize: '11px', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
          >
            Add
          </button>
          <button
            onClick={() => setCreating(false)}
            style={{ fontSize: '11px', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          aria-label="new tab"
          style={{
            background: 'none',
            border: `1px dashed ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: '14px',
            color: colors.textMuted,
            flexShrink: 0,
          }}
        >
          +
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2.5 — Run tests, confirm they pass**

```bash
npm test -- src/components/TabBar.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 2.6 — Commit**

```bash
git add src/theme.ts src/components/TabBar.tsx src/components/TabBar.test.tsx
git commit -m "feat: add theme tokens and TabBar component"
```

---

### Task 3: `WorkspacePanel` + `TabContent` shell, wire `App.tsx`, delete old files

**Files:**
- Create: `src/components/TabContent.tsx`
- Create: `src/components/WorkspacePanel.tsx`
- Create: `src/components/WorkspacePanel.test.tsx`
- Modify: `src/App.tsx`
- Delete: `src/store/useShelfStore.ts`, `src/store/useShelfStore.test.ts`, `src/store/appStore.ts`, `src/store/appStore.test.ts`, `src/components/ShelfPanel.tsx`, `src/components/ShelfPanel.test.tsx`, `src/components/FileItem.tsx`, `src/components/FileItem.test.tsx`, `src/components/SettingsRow.tsx`

- [ ] **Step 3.1 — Write failing tests for `WorkspacePanel`**

```tsx
// src/components/WorkspacePanel.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspacePanel } from './WorkspacePanel'
import { useWorkspaceStore } from '../store/useWorkspaceStore'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

describe('WorkspacePanel', () => {
  it('renders the app name', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Vanish Box')).toBeTruthy()
  })

  it('renders the default tab name in the tab bar', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Workspace')).toBeTruthy()
  })

  it('renders section headings for files, notes, sketches', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Files')).toBeTruthy()
    expect(screen.getByText('Notes')).toBeTruthy()
    expect(screen.getByText('Sketches')).toBeTruthy()
  })

  it('renders drop-zone hints for each empty section', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Drop files here')).toBeTruthy()
    expect(screen.getByText('No notes yet')).toBeTruthy()
    expect(screen.getByText('No sketches yet')).toBeTruthy()
  })

  it('theme toggle button is present', () => {
    render(<WorkspacePanel />)
    expect(screen.getByRole('button', { name: 'toggle theme' })).toBeTruthy()
  })

  it('clicking theme toggle switches theme in store', () => {
    render(<WorkspacePanel />)
    expect(useWorkspaceStore.getState().settings.theme).toBe('light')
    fireEvent.click(screen.getByRole('button', { name: 'toggle theme' }))
    expect(useWorkspaceStore.getState().settings.theme).toBe('dark')
  })
})
```

- [ ] **Step 3.2 — Run tests, confirm they fail**

```bash
npm test -- src/components/WorkspacePanel.test.tsx
```

Expected: FAIL — `Cannot find module './WorkspacePanel'`

- [ ] **Step 3.3 — Create `TabContent.tsx`**

```tsx
// src/components/TabContent.tsx
import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface TabContentProps {
  tab: Tab
  colors: ColorTokens
}

export function TabContent({ tab, colors }: TabContentProps) {
  const sectionLabel: Record<string, string> = {
    files: 'Files',
    notes: 'Notes',
    sketches: 'Sketches',
  }
  const emptyMessage: Record<string, string> = {
    files: 'Drop files here',
    notes: 'No notes yet',
    sketches: 'No sketches yet',
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {tab.sections.map((section) => (
        <section key={section.type}>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.textMuted,
            }}
          >
            {sectionLabel[section.type]}
          </h3>
          <div
            style={{
              background: colors.bgSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: colors.textMuted,
              textAlign: 'center',
              minHeight: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {emptyMessage[section.type]}
          </div>
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 3.4 — Create `WorkspacePanel.tsx`**

```tsx
// src/components/WorkspacePanel.tsx
import React from 'react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'
import { TabBar } from './TabBar'
import { TabContent } from './TabContent'

export function WorkspacePanel() {
  const { tabs, activeTabId, settings, updateSettings } = useWorkspaceStore()
  const colors = COLORS[settings.theme]
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'system-ui, sans-serif',
        background: colors.bg,
        color: colors.text,
      }}
    >
      <header
        data-tauri-drag-region
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
          fontSize: '13px',
          flexShrink: 0,
          cursor: 'grab',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <span>Vanish Box</span>
        <button
          onClick={() =>
            updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })
          }
          aria-label="toggle theme"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: colors.textMuted,
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {settings.theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <TabBar colors={colors} />

      {activeTab && <TabContent tab={activeTab} colors={colors} />}
    </div>
  )
}
```

- [ ] **Step 3.5 — Run tests, confirm they pass**

```bash
npm test -- src/components/WorkspacePanel.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 3.6 — Update `App.tsx`**

```tsx
// src/App.tsx
import { WorkspacePanel } from './components/WorkspacePanel'

function App() {
  return <WorkspacePanel />
}

export default App
```

- [ ] **Step 3.7 — Delete old files**

```bash
rm src/store/useShelfStore.ts src/store/useShelfStore.test.ts
rm src/store/appStore.ts src/store/appStore.test.ts
rm src/components/ShelfPanel.tsx src/components/ShelfPanel.test.tsx
rm src/components/FileItem.tsx src/components/FileItem.test.tsx
rm src/components/SettingsRow.tsx
```

- [ ] **Step 3.8 — Run full test suite, confirm it passes**

```bash
npm test
```

Expected: All tests PASS (no references to deleted files remain).

- [ ] **Step 3.9 — Commit**

```bash
git add -A
git commit -m "feat: Phase 1 — tabbed workspace shell replaces flat shelf"
```

---

**Phase 1 pause checklist:**
1. What changed: store refactored to workspace model, tab bar added, three section placeholders, theme toggle, old shelf code deleted.
2. Files changed: `src/store/useWorkspaceStore.ts` (new), `src/theme.ts` (new), `src/components/TabBar.tsx` (new), `src/components/TabContent.tsx` (new), `src/components/WorkspacePanel.tsx` (new), `src/App.tsx` (updated), 9 old files deleted.
3. Manual test: `npm run dev` (within WSL via `npx tauri dev` or Vite only). Tab bar shows "Workspace" tab. Clicking + shows create form. Creating a tab adds it and makes it active. Double-clicking renames. Theme toggle switches colors.
4. Risks: Tauri drag region may not work in browser-only dev; test with `npx tauri dev`. Persisted store key changed from `vanish-box-shelf` to `vanish-box-workspace` — old localStorage is abandoned (no migration needed, clean slate).
5. Safe to continue: Yes, once tests pass.

---

## Phase 2 — Files per Tab

### Task 4: Rust `copy_file` + `delete_file` commands

**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 4.1 — Update `commands.rs`**

Replace the entire file with:

```rust
// src-tauri/src/commands.rs
use serde::Serialize;

#[derive(Serialize)]
pub struct CopiedFileInfo {
    pub id: String,
    pub original_name: String,
    pub stored_path: String,
    pub size: u64,
}

/// Copy a file from `source` into the app's managed files directory.
/// Returns metadata about the copied file including its new path.
#[tauri::command]
pub fn copy_file(
    app_handle: tauri::AppHandle,
    source: String,
) -> Result<CopiedFileInfo, String> {
    use tauri::Manager;

    let data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let files_dir = data_dir.join("files");
    std::fs::create_dir_all(&files_dir).map_err(|e| e.to_string())?;

    let source_path = std::path::Path::new(&source);
    let original_name = source_path
        .file_name()
        .ok_or_else(|| "No filename in path".to_string())?
        .to_string_lossy()
        .to_string();

    // Unique stored name: timestamp_ms + original name
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let stored_name = format!("{}_{}", ts, original_name);
    let dest = files_dir.join(&stored_name);

    std::fs::copy(source_path, &dest).map_err(|e| e.to_string())?;
    let size = std::fs::metadata(&dest).map(|m| m.len()).unwrap_or(0);

    Ok(CopiedFileInfo {
        id: stored_name,
        original_name,
        stored_path: dest.to_string_lossy().to_string(),
        size,
    })
}

/// Open a file with the default OS application.
#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Permanently delete a file from the app's managed storage.
#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    std::fs::remove_file(&path).map_err(|e| e.to_string())
}
```

- [ ] **Step 4.2 — Register new commands in `main.rs`**

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod shortcut;
mod tray;
mod window;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::copy_file,
            commands::open_file,
            commands::delete_file,
        ])
        .setup(|app| {
            tray::setup_tray(app)?;
            shortcut::setup_shortcut(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4.3 — Verify Rust compiles**

```bash
cd /mnt/c/Users/victo/miniProjects/vanishBox
npx tauri build --no-bundle 2>&1 | tail -20
```

Expected: No compile errors.

- [ ] **Step 4.4 — Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/main.rs
git commit -m "feat: add copy_file and delete_file Tauri commands"
```

---

### Task 5: `FileCard` component

**Files:**
- Create: `src/components/FileCard.tsx`
- Create: `src/components/FileCard.test.tsx`

- [ ] **Step 5.1 — Write failing tests**

```tsx
// src/components/FileCard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileCard } from './FileCard'
import { COLORS } from '../theme'
import type { WorkspaceFile, Settings } from '../store/useWorkspaceStore'

const baseFile: WorkspaceFile = {
  id: 'f1',
  originalName: 'photo.png',
  storedPath: '/app/files/123_photo.png',
  size: 204800,
  addedAt: new Date('2026-04-05T10:00:00').getTime(),
}

const baseSettings: Settings = {
  theme: 'light',
  keybind: 'ctrl+shift+v',
  showFileSize: true,
  showFileTimestamp: true,
}

describe('FileCard', () => {
  it('renders the original file name', () => {
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('photo.png')).toBeTruthy()
  })

  it('shows size when showFileSize is true', () => {
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('200.0 KB')).toBeTruthy()
  })

  it('hides size when showFileSize is false', () => {
    render(
      <FileCard
        file={baseFile}
        settings={{ ...baseSettings, showFileSize: false }}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.queryByText('200.0 KB')).toBeNull()
  })

  it('shows timestamp when showFileTimestamp is true', () => {
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByTestId('file-timestamp')).toBeTruthy()
  })

  it('hides timestamp when showFileTimestamp is false', () => {
    render(
      <FileCard
        file={baseFile}
        settings={{ ...baseSettings, showFileTimestamp: false }}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    expect(screen.queryByTestId('file-timestamp')).toBeNull()
  })

  it('clicking name calls onOpen with storedPath', () => {
    const onOpen = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={onOpen}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('photo.png'))
    expect(onOpen).toHaveBeenCalledWith('/app/files/123_photo.png')
  })

  it('clicking × calls onRemove with file id and does not call onOpen', () => {
    const onRemove = vi.fn()
    const onOpen = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={onOpen}
        onRemove={onRemove}
        onDelete={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(onRemove).toHaveBeenCalledWith('f1')
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('clicking 🗑 calls onDelete with file id and storedPath and does not call onOpen', () => {
    const onDelete = vi.fn()
    const onOpen = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={onOpen}
        onRemove={vi.fn()}
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    expect(onDelete).toHaveBeenCalledWith('f1', '/app/files/123_photo.png')
    expect(onOpen).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 5.2 — Run tests, confirm they fail**

```bash
npm test -- src/components/FileCard.test.tsx
```

Expected: FAIL — `Cannot find module './FileCard'`

- [ ] **Step 5.3 — Implement `FileCard.tsx`**

```tsx
// src/components/FileCard.tsx
import { WorkspaceFile, Settings } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface FileCardProps {
  file: WorkspaceFile
  settings: Settings
  colors: ColorTokens
  onOpen: (storedPath: string) => void
  onRemove: (fileId: string) => void
  onDelete: (fileId: string, storedPath: string) => void
}

export function FileCard({ file, settings, colors, onOpen, onRemove, onDelete }: FileCardProps) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        marginBottom: '4px',
        background: colors.bgSecondary,
        borderRadius: '6px',
        fontSize: '12px',
        border: `1px solid ${colors.border}`,
      }}
    >
      <span
        onClick={() => onOpen(file.storedPath)}
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: colors.text,
          cursor: 'pointer',
        }}
        title={file.originalName}
      >
        {file.originalName}
      </span>

      {settings.showFileTimestamp && (
        <span
          data-testid="file-timestamp"
          style={{ color: colors.textMuted, flexShrink: 0, fontSize: '11px' }}
        >
          {formatTime(file.addedAt)}
        </span>
      )}

      {settings.showFileSize && (
        <span style={{ color: colors.textMuted, flexShrink: 0 }}>
          {formatSize(file.size)}
        </span>
      )}

      <button
        aria-label="remove"
        title="Remove from Vanish Box"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(file.id)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: colors.textMuted,
          fontSize: '14px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        ×
      </button>

      <button
        aria-label="delete"
        title="Delete file from computer"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(file.id, file.storedPath)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#ef4444',
          fontSize: '12px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        🗑
      </button>
    </li>
  )
}
```

- [ ] **Step 5.4 — Run tests, confirm they pass**

```bash
npm test -- src/components/FileCard.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 5.5 — Commit**

```bash
git add src/components/FileCard.tsx src/components/FileCard.test.tsx
git commit -m "feat: add FileCard with remove and delete actions"
```

---

### Task 6: `FilesSection` with drag-drop + delete confirmation

**Files:**
- Create: `src/components/FilesSection.tsx`
- Create: `src/components/FilesSection.test.tsx`
- Modify: `src/components/TabContent.tsx`

- [ ] **Step 6.1 — Write failing tests**

```tsx
// src/components/FilesSection.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { FilesSection } from './FilesSection'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

type DragDropCallback = (event: { payload: { type: string; paths?: string[] } }) => Promise<void>
let capturedCallback: DragDropCallback | null = null

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = invoke as ReturnType<typeof vi.fn>

beforeEach(() => {
  capturedCallback = null
  mockInvoke.mockReset()
  useWorkspaceStore.getState().reset()
  vi.mocked(getCurrentWindow).mockReturnValue({
    onDragDropEvent: (cb: DragDropCallback) => {
      capturedCallback = cb
      return Promise.resolve(() => undefined)
    },
  } as ReturnType<typeof getCurrentWindow>)
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('FilesSection', () => {
  it('shows drop zone hint when no files are present', () => {
    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('Drop files here')).toBeTruthy()
  })

  it('renders file list after native drop event', async () => {
    mockInvoke.mockResolvedValue({
      id: '123_photo.png',
      original_name: 'photo.png',
      stored_path: '/app/files/123_photo.png',
      size: 204800,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/source/photo.png'] } })
    })

    expect(screen.getByText('photo.png')).toBeTruthy()
    expect(screen.queryByText('Drop files here')).toBeNull()
  })

  it('calls copy_file invoke for each dropped path', async () => {
    mockInvoke.mockResolvedValue({
      id: 'ts_a.txt',
      original_name: 'a.txt',
      stored_path: '/app/files/ts_a.txt',
      size: 100,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({
        payload: { type: 'drop', paths: ['/src/a.txt', '/src/b.txt'] },
      })
    })

    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(mockInvoke).toHaveBeenCalledWith('copy_file', { source: '/src/a.txt' })
    expect(mockInvoke).toHaveBeenCalledWith('copy_file', { source: '/src/b.txt' })
  })

  it('does not crash if copy_file fails for some files', async () => {
    mockInvoke
      .mockResolvedValueOnce({ id: 'ts_ok.txt', original_name: 'ok.txt', stored_path: '/app/ok.txt', size: 10 })
      .mockRejectedValueOnce(new Error('permission denied'))

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({
        payload: { type: 'drop', paths: ['/src/ok.txt', '/src/locked.txt'] },
      })
    })

    expect(screen.getByText('ok.txt')).toBeTruthy()
  })

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    mockInvoke.mockResolvedValue({
      id: 'ts_img.png',
      original_name: 'img.png',
      stored_path: '/app/img.png',
      size: 512,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/src/img.png'] } })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    })

    expect(screen.getByText(/Delete this file from your computer/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Delete$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeTruthy()
  })

  it('confirming delete calls delete_file and removes file from store', async () => {
    mockInvoke
      .mockResolvedValueOnce({ id: 'ts_doc.pdf', original_name: 'doc.pdf', stored_path: '/app/doc.pdf', size: 1024 })
      .mockResolvedValueOnce(undefined) // delete_file

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/src/doc.pdf'] } })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Delete$/ }))
    })

    expect(mockInvoke).toHaveBeenCalledWith('delete_file', { path: '/app/doc.pdf' })
    expect(screen.queryByText('doc.pdf')).toBeNull()
  })

  it('cancelling the delete dialog leaves the file in place', async () => {
    mockInvoke.mockResolvedValue({
      id: 'ts_keep.txt',
      original_name: 'keep.txt',
      stored_path: '/app/keep.txt',
      size: 100,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/src/keep.txt'] } })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    })
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))

    expect(screen.getByText('keep.txt')).toBeTruthy()
  })
})
```

- [ ] **Step 6.2 — Run tests, confirm they fail**

```bash
npm test -- src/components/FilesSection.test.tsx
```

Expected: FAIL — `Cannot find module './FilesSection'`

- [ ] **Step 6.3 — Implement `FilesSection.tsx`**

```tsx
// src/components/FilesSection.tsx
import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useWorkspaceStore, WorkspaceFile } from '../store/useWorkspaceStore'
import { FileCard } from './FileCard'
import { ColorTokens } from '../theme'

interface CopiedFileInfo {
  id: string
  original_name: string
  stored_path: string
  size: number
}

interface FilesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function FilesSection({ tabId, colors }: FilesSectionProps) {
  const { tabs, settings, addFiles, removeFile } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const files = tab?.files ?? []

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    fileId: string
    storedPath: string
  } | null>(null)

  async function handleOpen(path: string) {
    try {
      await invoke('open_file', { path })
    } catch (e) {
      console.error('[VanishBox] Failed to open file:', path, e)
    }
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    try {
      await invoke('delete_file', { path: deleteConfirm.storedPath })
    } catch (e) {
      console.error('[VanishBox] Failed to delete file:', e)
    }
    removeFile(tabId, deleteConfirm.fileId)
    setDeleteConfirm(null)
  }

  useEffect(() => {
    let cancelled = false
    let unlisten: (() => void) | undefined

    getCurrentWindow()
      .onDragDropEvent(async (event) => {
        const { type } = event.payload
        if (type === 'enter' || type === 'over') {
          setIsDraggingOver(true)
        } else if (type === 'leave') {
          setIsDraggingOver(false)
        } else if (type === 'drop') {
          setIsDraggingOver(false)
          const paths =
            (event.payload as { type: 'drop'; paths: string[] }).paths ?? []
          if (paths.length > 0) {
            const results = await Promise.allSettled(
              paths.map((p) => invoke<CopiedFileInfo>('copy_file', { source: p }))
            )
            const newFiles: WorkspaceFile[] = results
              .filter(
                (r): r is PromiseFulfilledResult<CopiedFileInfo> =>
                  r.status === 'fulfilled'
              )
              .map((r) => ({
                id: r.value.id,
                originalName: r.value.original_name,
                storedPath: r.value.stored_path,
                size: r.value.size,
                addedAt: Date.now(),
              }))
            if (newFiles.length > 0) {
              addFiles(tabId, newFiles)
            }
          }
        }
      })
      .then((fn) => {
        if (cancelled) {
          fn()
        } else {
          unlisten = fn
        }
      })

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [tabId, addFiles])

  return (
    <>
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '280px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: colors.text,
                fontSize: '13px',
                margin: '0 0 16px 0',
              }}
            >
              Delete this file from your computer? This cannot be undone.
            </p>
            <div
              style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: isDraggingOver ? '#eef2ff' : colors.bgSecondary,
          border: isDraggingOver
            ? '2px dashed #6366f1'
            : `1px solid ${colors.border}`,
          borderRadius: '8px',
          minHeight: '60px',
          transition: 'all 0.15s',
        }}
      >
        {files.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              color: isDraggingOver ? '#6366f1' : colors.textMuted,
              fontSize: '12px',
            }}
          >
            Drop files here
          </div>
        ) : (
          <ul style={{ margin: 0, padding: '6px', listStyle: 'none' }}>
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                settings={settings}
                colors={colors}
                onOpen={handleOpen}
                onRemove={(id) => removeFile(tabId, id)}
                onDelete={(id, path) => setDeleteConfirm({ fileId: id, storedPath: path })}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 6.4 — Update `TabContent.tsx` to use `FilesSection`**

```tsx
// src/components/TabContent.tsx
import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'
import { FilesSection } from './FilesSection'

interface TabContentProps {
  tab: Tab
  colors: ColorTokens
}

export function TabContent({ tab, colors }: TabContentProps) {
  const sectionLabel: Record<string, string> = {
    files: 'Files',
    notes: 'Notes',
    sketches: 'Sketches',
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {tab.sections.map((section) => (
        <section key={section.type}>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.textMuted,
            }}
          >
            {sectionLabel[section.type]}
          </h3>
          {section.type === 'files' ? (
            <FilesSection tabId={tab.id} colors={colors} />
          ) : (
            <div
              style={{
                background: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: colors.textMuted,
                textAlign: 'center',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {section.type === 'notes' && 'No notes yet'}
              {section.type === 'sketches' && 'No sketches yet'}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 6.5 — Run tests, confirm they pass**

```bash
npm test -- src/components/FilesSection.test.tsx src/components/FileCard.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 6.6 — Run full suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6.7 — Commit**

```bash
git add src/components/FilesSection.tsx src/components/FilesSection.test.tsx src/components/TabContent.tsx
git commit -m "feat: Phase 2 — files section with copy, open, remove, and delete"
```

---

**Phase 2 pause checklist:**
1. What changed: Files are now copied into app-managed storage on drop. Open/remove/delete actions all work. Delete shows confirmation dialog. Per-tab file isolation.
2. Files changed: `commands.rs`, `main.rs`, `FileCard.tsx` (new), `FilesSection.tsx` (new), `TabContent.tsx` (updated).
3. Manual test: `npx tauri dev`. Drop a file onto the Files section. Verify it appears. Click filename to open. Click × to remove from shelf. Click 🗑 and confirm to delete from disk. Verify file is gone from filesystem.
4. Risks: App data dir path differs per OS. `copy_file` uses `SystemTime` for unique names — two drops in the same millisecond on the same file would overwrite. Acceptable for v1. `delete_file` errors (file already gone) are caught and logged but still removes from store — intended behavior.
5. Safe to continue: Yes.

---

## Phase 3 — Notes per Tab

### Task 7: `NoteCard`, `NoteEditor`, `NotesSection`

**Files:**
- Create: `src/components/NoteCard.tsx`
- Create: `src/components/NoteEditor.tsx`
- Create: `src/components/NotesSection.tsx`
- Create: `src/components/NotesSection.test.tsx`
- Modify: `src/components/TabContent.tsx`

- [ ] **Step 7.1 — Write failing tests**

```tsx
// src/components/NotesSection.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotesSection } from './NotesSection'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('NotesSection', () => {
  it('shows "No notes yet" when empty', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('No notes yet')).toBeTruthy()
  })

  it('shows "+ Add note" button', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: /Add note/ })).toBeTruthy()
  })

  it('clicking "+ Add note" creates a note in the store', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(1)
  })

  it('note card is rendered after adding', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    expect(screen.getByText('New note')).toBeTruthy()
  })

  it('clicking note card opens the editor', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    fireEvent.click(screen.getByText('New note'))
    // Editor should render a textarea
    expect(screen.getByRole('textbox', { name: /note body/i })).toBeTruthy()
  })

  it('saving the editor updates the note title in the store', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    // open editor by clicking the note card title span
    fireEvent.click(screen.getByText('New note'))
    const titleInput = screen.getByDisplayValue('New note')
    fireEvent.change(titleInput, { target: { value: 'My ideas' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(useWorkspaceStore.getState().tabs[0].notes[0].title).toBe('My ideas')
  })

  it('clicking × removes the note', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    fireEvent.click(screen.getByRole('button', { name: 'remove note' }))
    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(0)
  })

  it('clicking collapse toggle collapses the note', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    expect(useWorkspaceStore.getState().tabs[0].notes[0].collapsed).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'toggle collapse' }))
    expect(useWorkspaceStore.getState().tabs[0].notes[0].collapsed).toBe(true)
  })
})
```

- [ ] **Step 7.2 — Run tests, confirm they fail**

```bash
npm test -- src/components/NotesSection.test.tsx
```

Expected: FAIL — `Cannot find module './NotesSection'`

- [ ] **Step 7.3 — Implement `NoteCard.tsx`**

```tsx
// src/components/NoteCard.tsx
import { NoteCard as NoteCardType } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface NoteCardProps {
  note: NoteCardType
  colors: ColorTokens
  onEdit: (note: NoteCardType) => void
  onRemove: (noteId: string) => void
  onToggleCollapse: (noteId: string) => void
}

export function NoteCard({ note, colors, onEdit, onRemove, onToggleCollapse }: NoteCardProps) {
  return (
    <div
      style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        marginBottom: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 10px',
          cursor: 'pointer',
          gap: '4px',
        }}
        onClick={() => onEdit(note)}
      >
        <button
          aria-label="toggle collapse"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(note.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 4px 0 0',
            color: colors.textMuted,
            fontSize: '10px',
            flexShrink: 0,
          }}
        >
          {note.collapsed ? '▶' : '▼'}
        </button>
        <span
          style={{
            flex: 1,
            fontSize: '12px',
            fontWeight: 500,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {note.title}
        </span>
        <button
          aria-label="remove note"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(note.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: '14px',
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      {!note.collapsed && note.body && (
        <div
          style={{
            padding: '0 10px 8px 24px',
            fontSize: '12px',
            color: colors.textMuted,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {note.body.length > 120 ? note.body.slice(0, 120) + '…' : note.body}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7.4 — Implement `NoteEditor.tsx`**

```tsx
// src/components/NoteEditor.tsx
import { useState } from 'react'
import { NoteCard } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface NoteEditorProps {
  note: NoteCard
  colors: ColorTokens
  onSave: (patch: Partial<Pick<NoteCard, 'title' | 'body'>>) => void
  onClose: () => void
}

export function NoteEditor({ note, colors, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)

  function save() {
    onSave({ title: title.trim() || 'New note', body })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '16px',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="note title"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: `1px solid ${colors.border}`,
            padding: '4px 0',
            background: 'transparent',
            color: colors.text,
            outline: 'none',
          }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          autoFocus
          aria-label="note body"
          style={{
            fontSize: '13px',
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            padding: '8px',
            background: colors.bgSecondary,
            color: colors.text,
            minHeight: '120px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: '6px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7.5 — Implement `NotesSection.tsx`**

```tsx
// src/components/NotesSection.tsx
import { useState } from 'react'
import { useWorkspaceStore, NoteCard as NoteCardType } from '../store/useWorkspaceStore'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { ColorTokens } from '../theme'

interface NotesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function NotesSection({ tabId, colors }: NotesSectionProps) {
  const { tabs, addNote, updateNote, removeNote } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const notes = tab?.notes ?? []
  const [editingNote, setEditingNote] = useState<NoteCardType | null>(null)

  return (
    <div>
      {editingNote && (
        <NoteEditor
          note={editingNote}
          colors={colors}
          onSave={(patch) => {
            updateNote(tabId, editingNote.id, patch)
          }}
          onClose={() => setEditingNote(null)}
        />
      )}

      {notes.length === 0 ? (
        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            fontSize: '12px',
            color: colors.textMuted,
          }}
        >
          No notes yet
        </div>
      ) : (
        <div>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              colors={colors}
              onEdit={setEditingNote}
              onRemove={(id) => removeNote(tabId, id)}
              onToggleCollapse={(id) =>
                updateNote(tabId, id, { collapsed: !note.collapsed })
              }
            />
          ))}
        </div>
      )}

      <button
        onClick={() => addNote(tabId)}
        aria-label="Add note"
        style={{
          marginTop: '6px',
          width: '100%',
          padding: '6px',
          border: `1px dashed ${colors.border}`,
          borderRadius: '6px',
          background: 'transparent',
          color: colors.textMuted,
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        + Add note
      </button>
    </div>
  )
}
```

- [ ] **Step 7.6 — Run tests, confirm they pass**

```bash
npm test -- src/components/NotesSection.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 7.7 — Update `TabContent.tsx` to use `NotesSection`**

```tsx
// src/components/TabContent.tsx
import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'
import { FilesSection } from './FilesSection'
import { NotesSection } from './NotesSection'

interface TabContentProps {
  tab: Tab
  colors: ColorTokens
}

export function TabContent({ tab, colors }: TabContentProps) {
  const sectionLabel: Record<string, string> = {
    files: 'Files',
    notes: 'Notes',
    sketches: 'Sketches',
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {tab.sections.map((section) => (
        <section key={section.type}>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.textMuted,
            }}
          >
            {sectionLabel[section.type]}
          </h3>
          {section.type === 'files' ? (
            <FilesSection tabId={tab.id} colors={colors} />
          ) : section.type === 'notes' ? (
            <NotesSection tabId={tab.id} colors={colors} />
          ) : (
            <div
              style={{
                background: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '12px',
                fontSize: '12px',
                color: colors.textMuted,
                textAlign: 'center',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              No sketches yet
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 7.8 — Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 7.9 — Commit**

```bash
git add src/components/NoteCard.tsx src/components/NoteEditor.tsx src/components/NotesSection.tsx src/components/NotesSection.test.tsx src/components/TabContent.tsx
git commit -m "feat: Phase 3 — per-tab note cards with inline editor"
```

---

**Phase 3 pause checklist:**
1. What changed: Notes section is now functional. Multiple note cards per tab. Collapse/expand. Click to edit with title + body. × to delete.
2. Files changed: `NoteCard.tsx` (new), `NoteEditor.tsx` (new), `NotesSection.tsx` (new), `TabContent.tsx` (updated).
3. Manual test: Click "+ Add note". Click the new card. Edit title and body in modal. Click Save. Verify updated title in card. Body preview shows in collapsed view. Click ▼ to collapse. Click × to delete.
4. Risks: `NoteEditor` renders inside a portal-less fixed overlay — clicking outside does not dismiss it (intentional, use Cancel/Save). `updateNote` sets `updatedAt` to `Date.now()` on every save.
5. Safe to continue: Yes.

---

## Phase 4 — Sketches per Tab

### Task 8: `SketchCard`, `SketchEditor`, `SketchesSection`

**Files:**
- Create: `src/components/SketchCard.tsx`
- Create: `src/components/SketchEditor.tsx`
- Create: `src/components/SketchesSection.tsx`
- Create: `src/components/SketchesSection.test.tsx`
- Modify: `src/components/TabContent.tsx`

- [ ] **Step 8.1 — Write failing tests**

```tsx
// src/components/SketchesSection.test.tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SketchesSection } from './SketchesSection'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('SketchesSection', () => {
  it('shows "No sketches yet" when empty', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('No sketches yet')).toBeTruthy()
  })

  it('shows "+ Add sketch" button', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: /Add sketch/ })).toBeTruthy()
  })

  it('clicking "+ Add sketch" creates a sketch in the store', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    expect(useWorkspaceStore.getState().tabs[0].sketches).toHaveLength(1)
  })

  it('sketch card is rendered after adding', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    expect(screen.getByText('New sketch')).toBeTruthy()
  })

  it('clicking sketch card opens the editor', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    fireEvent.click(screen.getByText('New sketch'))
    // SketchEditor renders Pen / Eraser / Clear buttons
    expect(screen.getByRole('button', { name: /^Pen$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Eraser$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Clear$/ })).toBeTruthy()
  })

  it('clicking × removes the sketch', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    fireEvent.click(screen.getByRole('button', { name: 'remove sketch' }))
    expect(useWorkspaceStore.getState().tabs[0].sketches).toHaveLength(0)
  })

  it('clicking collapse toggle collapses the sketch', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    expect(useWorkspaceStore.getState().tabs[0].sketches[0].collapsed).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'toggle collapse' }))
    expect(useWorkspaceStore.getState().tabs[0].sketches[0].collapsed).toBe(true)
  })

  it('cancelling the editor does not save', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    fireEvent.click(screen.getByText('New sketch'))
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))
    expect(useWorkspaceStore.getState().tabs[0].sketches[0].dataUrl).toBeNull()
  })
})
```

- [ ] **Step 8.2 — Run tests, confirm they fail**

```bash
npm test -- src/components/SketchesSection.test.tsx
```

Expected: FAIL — `Cannot find module './SketchesSection'`

- [ ] **Step 8.3 — Implement `SketchCard.tsx`**

```tsx
// src/components/SketchCard.tsx
import { SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface SketchCardProps {
  sketch: SketchCardType
  colors: ColorTokens
  onEdit: (sketch: SketchCardType) => void
  onRemove: (sketchId: string) => void
  onToggleCollapse: (sketchId: string) => void
}

export function SketchCard({ sketch, colors, onEdit, onRemove, onToggleCollapse }: SketchCardProps) {
  return (
    <div
      style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        marginBottom: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 10px',
          cursor: 'pointer',
          gap: '4px',
        }}
        onClick={() => onEdit(sketch)}
      >
        <button
          aria-label="toggle collapse"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(sketch.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 4px 0 0',
            color: colors.textMuted,
            fontSize: '10px',
            flexShrink: 0,
          }}
        >
          {sketch.collapsed ? '▶' : '▼'}
        </button>
        <span
          style={{
            flex: 1,
            fontSize: '12px',
            fontWeight: 500,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sketch.title}
        </span>
        <button
          aria-label="remove sketch"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(sketch.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: '14px',
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      {!sketch.collapsed && sketch.dataUrl && (
        <div style={{ padding: '0 10px 8px 10px' }}>
          <img
            src={sketch.dataUrl}
            alt={sketch.title}
            style={{
              maxWidth: '100%',
              borderRadius: '4px',
              border: `1px solid ${colors.border}`,
            }}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8.4 — Implement `SketchEditor.tsx`**

```tsx
// src/components/SketchEditor.tsx
import { useRef, useState, useEffect } from 'react'
import { ColorTokens } from '../theme'

interface SketchEditorProps {
  dataUrl: string | null
  colors: ColorTokens
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export function SketchEditor({ dataUrl, colors, onSave, onClose }: SketchEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (dataUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = dataUrl
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !lastPos.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : '#1f2937'
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function stopDrawing() {
    setIsDrawing(false)
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function save() {
    onSave(canvasRef.current!.toDataURL('image/png'))
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => setTool('pen')}
            aria-pressed={tool === 'pen'}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: tool === 'pen' ? '#6366f1' : 'transparent',
              color: tool === 'pen' ? '#fff' : colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            aria-pressed={tool === 'eraser'}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: tool === 'eraser' ? '#6366f1' : 'transparent',
              color: tool === 'eraser' ? '#fff' : colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            Eraser
          </button>
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            aria-label="brush size"
            style={{ width: '80px' }}
          />
          <button
            onClick={clearCanvas}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.text,
            }}
          >
            Clear
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
            }}
          >
            Save
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            background: '#ffffff',
            display: 'block',
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 8.5 — Implement `SketchesSection.tsx`**

```tsx
// src/components/SketchesSection.tsx
import { useState } from 'react'
import { useWorkspaceStore, SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { SketchCard } from './SketchCard'
import { SketchEditor } from './SketchEditor'
import { ColorTokens } from '../theme'

interface SketchesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function SketchesSection({ tabId, colors }: SketchesSectionProps) {
  const { tabs, addSketch, updateSketch, removeSketch } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const sketches = tab?.sketches ?? []
  const [editingSketch, setEditingSketch] = useState<SketchCardType | null>(null)

  return (
    <div>
      {editingSketch && (
        <SketchEditor
          dataUrl={editingSketch.dataUrl}
          colors={colors}
          onSave={(dataUrl) => {
            updateSketch(tabId, editingSketch.id, { dataUrl })
            setEditingSketch(null)
          }}
          onClose={() => setEditingSketch(null)}
        />
      )}

      {sketches.length === 0 ? (
        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            fontSize: '12px',
            color: colors.textMuted,
          }}
        >
          No sketches yet
        </div>
      ) : (
        <div>
          {sketches.map((sketch) => (
            <SketchCard
              key={sketch.id}
              sketch={sketch}
              colors={colors}
              onEdit={setEditingSketch}
              onRemove={(id) => removeSketch(tabId, id)}
              onToggleCollapse={(id) =>
                updateSketch(tabId, id, { collapsed: !sketch.collapsed })
              }
            />
          ))}
        </div>
      )}

      <button
        onClick={() => addSketch(tabId)}
        aria-label="Add sketch"
        style={{
          marginTop: '6px',
          width: '100%',
          padding: '6px',
          border: `1px dashed ${colors.border}`,
          borderRadius: '6px',
          background: 'transparent',
          color: colors.textMuted,
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        + Add sketch
      </button>
    </div>
  )
}
```

- [ ] **Step 8.6 — Run tests, confirm they pass**

```bash
npm test -- src/components/SketchesSection.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 8.7 — Update `TabContent.tsx` to use `SketchesSection`**

```tsx
// src/components/TabContent.tsx
import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'
import { FilesSection } from './FilesSection'
import { NotesSection } from './NotesSection'
import { SketchesSection } from './SketchesSection'

interface TabContentProps {
  tab: Tab
  colors: ColorTokens
}

export function TabContent({ tab, colors }: TabContentProps) {
  const sectionLabel: Record<string, string> = {
    files: 'Files',
    notes: 'Notes',
    sketches: 'Sketches',
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {tab.sections.map((section) => (
        <section key={section.type}>
          <h3
            style={{
              margin: '0 0 6px 0',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.textMuted,
            }}
          >
            {sectionLabel[section.type]}
          </h3>
          {section.type === 'files' ? (
            <FilesSection tabId={tab.id} colors={colors} />
          ) : section.type === 'notes' ? (
            <NotesSection tabId={tab.id} colors={colors} />
          ) : (
            <SketchesSection tabId={tab.id} colors={colors} />
          )}
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 8.8 — Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 8.9 — Commit**

```bash
git add src/components/SketchCard.tsx src/components/SketchEditor.tsx src/components/SketchesSection.tsx src/components/SketchesSection.test.tsx src/components/TabContent.tsx
git commit -m "feat: Phase 4 — sketch cards with canvas editor"
```

---

**Phase 4 pause checklist:**
1. What changed: Sketches section is functional. Multiple sketch cards per tab. Canvas editor with pen, eraser, clear, brush thickness. Thumbnail shown when collapsed is off.
2. Files changed: `SketchCard.tsx` (new), `SketchEditor.tsx` (new), `SketchesSection.tsx` (new), `TabContent.tsx` (final version).
3. Manual test: Click "+ Add sketch". Click the card. Draw with pen. Change brush size. Use eraser. Click Clear to wipe canvas. Click Save — thumbnail appears in card. Click collapse toggle to hide/show thumbnail.
4. Risks: Sketch data is stored as base64 PNG in localStorage. Large sketches may bloat storage. Acceptable for v1. Canvas does not support touch events — mouse-only for now.
5. Safe to continue: Yes.

---

## Phase 5 — Clear Tab + Settings Panel + Cleanup

### Task 9: Clear-tab confirmation + `SettingsPanel` + CLAUDE.md update

**Files:**
- Create: `src/components/SettingsPanel.tsx`
- Modify: `src/components/WorkspacePanel.tsx`
- Modify: `CLAUDE.md`

- [ ] **Step 9.1 — Implement `SettingsPanel.tsx`**

```tsx
// src/components/SettingsPanel.tsx
import { Settings } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface SettingsPanelProps {
  settings: Settings
  colors: ColorTokens
  onUpdate: (s: Partial<Settings>) => void
  onClose: () => void
}

export function SettingsPanel({ settings, colors, onUpdate, onClose }: SettingsPanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px 12px 0 0',
          padding: '16px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: colors.text,
          }}
        >
          Settings
        </h3>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: colors.text,
            cursor: 'pointer',
          }}
        >
          Dark mode
          <input
            type="checkbox"
            checked={settings.theme === 'dark'}
            onChange={(e) => onUpdate({ theme: e.target.checked ? 'dark' : 'light' })}
          />
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: colors.text,
            cursor: 'pointer',
          }}
        >
          Show file size
          <input
            type="checkbox"
            checked={settings.showFileSize}
            onChange={(e) => onUpdate({ showFileSize: e.target.checked })}
          />
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: colors.text,
            cursor: 'pointer',
          }}
        >
          Show file time added
          <input
            type="checkbox"
            checked={settings.showFileTimestamp}
            onChange={(e) => onUpdate({ showFileTimestamp: e.target.checked })}
          />
        </label>

        <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>
          Global shortcut: <code>{settings.keybind}</code>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 9.2 — Update `WorkspacePanel.tsx` with clear-tab confirmation + settings gear**

```tsx
// src/components/WorkspacePanel.tsx
import React, { useState } from 'react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'
import { TabBar } from './TabBar'
import { TabContent } from './TabContent'
import { SettingsPanel } from './SettingsPanel'

export function WorkspacePanel() {
  const { tabs, activeTabId, settings, updateSettings, clearTab } = useWorkspaceStore()
  const colors = COLORS[settings.theme]
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  const [showSettings, setShowSettings] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  function handleClearConfirmed() {
    if (activeTab) clearTab(activeTab.id)
    setConfirmClear(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'system-ui, sans-serif',
        background: colors.bg,
        color: colors.text,
      }}
    >
      {showSettings && (
        <SettingsPanel
          settings={settings}
          colors={colors}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {confirmClear && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 250,
          }}
        >
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '280px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: colors.text, fontSize: '13px', margin: '0 0 16px 0' }}>
              Clear all files, notes, and sketches from this tab? This cannot be
              undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearConfirmed}
                aria-label="confirm clear tab"
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Clear tab
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        data-tauri-drag-region
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
          fontSize: '13px',
          flexShrink: 0,
          cursor: 'grab',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <span>Vanish Box</span>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <button
            onClick={() => setConfirmClear(true)}
            aria-label="clear tab"
            title="Clear this tab"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: colors.textMuted,
            }}
          >
            ⊘
          </button>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="open settings"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: colors.textMuted,
            }}
          >
            ⚙
          </button>
          <button
            onClick={() =>
              updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })
            }
            aria-label="toggle theme"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: colors.textMuted,
            }}
          >
            {settings.theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <TabBar colors={colors} />

      {activeTab && <TabContent tab={activeTab} colors={colors} />}
    </div>
  )
}
```

- [ ] **Step 9.3 — Update `WorkspacePanel.test.tsx` to cover new buttons**

Add these test cases to the existing `WorkspacePanel.test.tsx` describe block:

```tsx
  it('clear tab button is present', () => {
    render(<WorkspacePanel />)
    expect(screen.getByRole('button', { name: 'clear tab' })).toBeTruthy()
  })

  it('clicking clear tab button shows confirmation dialog', () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'clear tab' }))
    expect(screen.getByText(/Clear all files, notes, and sketches/)).toBeTruthy()
  })

  it('confirming clear tab clears the active tab in the store', () => {
    const tabId = useWorkspaceStore.getState().tabs[0].id
    useWorkspaceStore.getState().addNote(tabId)
    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(1)

    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'clear tab' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirm clear tab' }))

    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(0)
  })

  it('cancelling clear tab dialog leaves tab content untouched', () => {
    const tabId = useWorkspaceStore.getState().tabs[0].id
    useWorkspaceStore.getState().addNote(tabId)

    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'clear tab' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(1)
  })

  it('settings button opens the settings panel', () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'open settings' }))
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('settings panel can toggle dark mode', () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'open settings' }))
    const darkModeCheckbox = screen.getByRole('checkbox', { name: /Dark mode/i })
    fireEvent.click(darkModeCheckbox)
    expect(useWorkspaceStore.getState().settings.theme).toBe('dark')
  })
```

- [ ] **Step 9.4 — Run the full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 9.5 — Update `CLAUDE.md` to reflect the new product direction**

Replace the entire contents of `CLAUDE.md` with:

```markdown
# CLAUDE.md

## Project overview

Vanish Box is a fast local desktop workspace utility. Users organize active task materials into tabs. Each tab contains files, notes, and sketches.

## Product name

Vanish Box

## Core promise

A fast, local, no-account desktop app that acts as a personal workspace. Users open it instantly, organize files/notes/sketches into task-based tabs, and keep everything local.

## Product goals

* Instant access to active task materials
* Multiple tabs for different tasks or projects
* Drag-and-drop files directly into app-managed storage
* Lightweight note cards and sketch pads per tab
* No cloud, no accounts, no backend

## Target users

* Knowledge workers juggling multiple active tasks
* Designers keeping assets, notes, and rough sketches together
* Students organizing research materials per project

## Platform and stack

* Desktop app: Tauri 2 + React 19 + TypeScript
* Local-only storage: Zustand (persisted to localStorage key `vanish-box-workspace`)
* File storage: app data dir (`<appData>/files/`)
* No backend, no account system

## App structure

* Tabbed workspace shell (`WorkspacePanel`)
* Each tab has three sections: Files, Notes, Sketches
* Section layout is configurable in state (list/grid) — UI customization is a future feature
* Settings panel (gear icon): theme, file display preferences
* Clear-tab confirmation before wiping tab content

## Rust commands

* `copy_file(source) → CopiedFileInfo` — copies file into `<appData>/files/`, returns metadata
* `open_file(path)` — opens with default OS app
* `delete_file(path)` — permanently removes from `<appData>/files/`

## Engineering principles

* Prefer simple, reliable local behavior
* Avoid overengineering
* Keep code modular
* TDD: write tests before implementation
* Inline styles with COLORS token object (light/dark)

## Non-goals for current version

* Cloud sync, accounts, or multi-device
* Drag files out of the app (architecture preserves path for future addition)
* Auto-expiry or timed deletion
* OS tray integration changes (tray + shortcut already work)
* Browser extension
* AI features
```

- [ ] **Step 9.6 — Run full test suite one final time**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 9.7 — Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/WorkspacePanel.tsx src/components/WorkspacePanel.test.tsx CLAUDE.md
git commit -m "feat: Phase 5 — clear-tab confirmation, settings panel, CLAUDE.md update"
```

---

**Phase 5 completion checklist:**
1. What changed: Clear-tab action with confirmation dialog. Full settings panel (theme, file size/time display). CLAUDE.md reflects new product direction.
2. Files changed: `SettingsPanel.tsx` (new), `WorkspacePanel.tsx` (final), `WorkspacePanel.test.tsx` (extended), `CLAUDE.md` (rewritten).
3. Manual test: Click ⊘ and confirm — tab clears. Cancel — tab unchanged. Click ⚙ — settings panel slides up. Toggle dark mode in settings. Close by clicking backdrop.
4. Risks: Settings panel backdrop click-to-close requires clicking outside the panel div — the `onClick={onClose}` on the outer div handles this. Stoppping propagation on the inner div prevents accidental close.
5. Safe to continue: All 5 phases complete.

---

## Post-implementation verification

Run the full test suite and verify Tauri compile:

```bash
npm test
npx tauri build --no-bundle 2>&1 | tail -30
```

All tests should pass. No Rust compile errors.
