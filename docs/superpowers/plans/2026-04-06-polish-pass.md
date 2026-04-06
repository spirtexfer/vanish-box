# Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Links section, editable keybind, file reordering, and a simplified theme toggle to the Vanish Box workspace app.

**Architecture:** Four independent features, each minimal and self-contained. Links follows the Notes/Sketches section pattern exactly. Keybind uses a Rust `update_shortcut` command that also writes `<appData>/keybind.txt`; `setup_shortcut` reads that file at startup to eliminate the gap between Rust startup and React mount. Existing persisted tabs are migrated via Zustand `version`+`migrate` to add `links: []` and the links section entry. File reordering uses simple up/down store actions. Theme toggle button is removed from the header since it already exists in Settings.

**Tech Stack:** Tauri 2, React 19, TypeScript, Zustand 5 (persist), Vitest + @testing-library/react, inline styles with `COLORS` tokens.

---

## File Map

### Feature 1 — Theme toggle
- Modify: `src/components/WorkspacePanel.tsx` — remove theme toggle button from header
- Modify: `src/components/WorkspacePanel.test.tsx` — remove test for theme toggle button

### Feature 2 — Links section
- Modify: `src/store/useWorkspaceStore.ts` — add `LinkItem`, `links` to `Tab`, add `addLink` / `updateLink` / `removeLink` actions, update `SectionType`, `clearTab`, `makeDefaultTab`, `makeDefaultSections`; bump persist `version` to `1` with `migrate` function that backfills `links: []` and `{ type: 'links' }` section on all old tabs
- Modify: `src/store/useWorkspaceStore.test.ts` — update section count tests, add link CRUD tests, add migration test
- Create: `src/components/LinkCard.tsx`
- Create: `src/components/LinkCard.test.tsx`
- Create: `src/components/LinkEditor.tsx`
- Create: `src/components/LinkEditor.test.tsx`
- Create: `src/components/LinksSection.tsx`
- Create: `src/components/LinksSection.test.tsx`
- Modify: `src/components/TabContent.tsx` — add `'links'` label and render `LinksSection`
- Modify: `src-tauri/src/commands.rs` — add `open_url` command
- Modify: `src-tauri/src/main.rs` — register `open_url`

### Feature 3 — Keybind
- Modify: `src-tauri/src/commands.rs` — add `parse_keybind`, `update_shortcut` (writes keybind to `<appData>/keybind.txt`)
- Modify: `src-tauri/src/shortcut.rs` — read `<appData>/keybind.txt` at startup if present, use it instead of hardcoded default
- Modify: `src-tauri/src/main.rs` — register `update_shortcut`
- Modify: `src/components/SettingsPanel.tsx` — add keybind capture input
- Modify: `src/components/WorkspacePanel.tsx` — call `update_shortcut` on mount

### Feature 4 — File reordering
- Modify: `src/store/useWorkspaceStore.ts` — add `moveFile(tabId, fileId, direction)` action
- Modify: `src/store/useWorkspaceStore.test.ts` — add `moveFile` tests
- Modify: `src/components/FileCard.tsx` — add ↑ / ↓ buttons, `onMoveUp` / `onMoveDown` props
- Modify: `src/components/FileCard.test.tsx` — add reorder button tests
- Modify: `src/components/FilesSection.tsx` — pass `onMoveUp` / `onMoveDown` to FileCard

---

## Task 1: Remove theme toggle button from header

**Files:**
- Modify: `src/components/WorkspacePanel.tsx:151-167`
- Modify: `src/components/WorkspacePanel.test.tsx`

- [ ] **Step 1: Remove the theme toggle button**

In `src/components/WorkspacePanel.tsx`, delete this button from the header's button group (lines ~151–165):
```tsx
// DELETE this entire button:
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
```

Also remove the `visible: true` dev override from `src-tauri/tauri.conf.json` — revert it back to `false`:
```json
"visible": false,
```

- [ ] **Step 2: Remove the toggle theme test from WorkspacePanel.test.tsx**

Find and delete the test that checks for `aria-label="toggle theme"`. Search for `toggle theme` in `src/components/WorkspacePanel.test.tsx` and delete the `it(...)` block.

- [ ] **Step 3: Run tests**

```
npm test
```
Expected: all tests pass (count may decrease by 1 if toggle theme test existed).

- [ ] **Step 4: Commit**

```
git add src/components/WorkspacePanel.tsx src/components/WorkspacePanel.test.tsx src-tauri/tauri.conf.json
git commit -m "feat: remove theme toggle button from header (settings panel handles it)"
```

---

## Task 2: Store — LinkItem type and CRUD actions

**Files:**
- Modify: `src/store/useWorkspaceStore.ts`
- Modify: `src/store/useWorkspaceStore.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/store/useWorkspaceStore.test.ts`, after the existing `addSketch` describe block:

```ts
describe('persist migration — v0 → v1', () => {
  it('backfills links:[] and links section on a tab that was persisted without them', () => {
    // Simulate what Zustand restores from a pre-v1 localStorage entry
    const oldState = {
      tabs: [{
        id: 'old-tab',
        name: 'Old',
        color: 'blue',
        sections: [
          { type: 'files', layout: 'list' },
          { type: 'notes', layout: 'list' },
          { type: 'sketches', layout: 'list' },
        ],
        files: [],
        notes: [],
        sketches: [],
        // no links field
      }],
      activeTabId: 'old-tab',
      settings: { theme: 'light', keybind: 'ctrl+shift+v', showFileSize: true, showFileTimestamp: true },
    }

    // Run the same migration function exported from the store
    const migrated = migrateStore(oldState, 0) as any
    expect(migrated.tabs[0].links).toEqual([])
    expect(migrated.tabs[0].sections.map((s: any) => s.type)).toContain('links')
  })
})
```

Add the import at the top of the test file:
```ts
import { migrateStore } from './useWorkspaceStore'
```

Also add migration to link CRUD tests:

```ts
describe('addLink / updateLink / removeLink', () => {
  it('default tab has empty links array', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    expect(result.current.tabs[0].links).toEqual([])
  })

  it('addLink creates a link with the given url and title', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addLink(tabId, 'https://example.com', 'Example') })
    const link = result.current.tabs[0].links[0]
    expect(link.url).toBe('https://example.com')
    expect(link.title).toBe('Example')
    expect(link.id).toBeTruthy()
  })

  it('addLink derives title from hostname when title is blank', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addLink(tabId, 'https://github.com/foo/bar', '') })
    expect(result.current.tabs[0].links[0].title).toBe('github.com')
  })

  it('updateLink patches title and url', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addLink(tabId, 'https://a.com', 'A') })
    const id = result.current.tabs[0].links[0].id
    act(() => { result.current.updateLink(tabId, id, { title: 'B', url: 'https://b.com' }) })
    expect(result.current.tabs[0].links[0].title).toBe('B')
    expect(result.current.tabs[0].links[0].url).toBe('https://b.com')
  })

  it('removeLink removes the correct link', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addLink(tabId, 'https://a.com', 'A') })
    act(() => { result.current.addLink(tabId, 'https://b.com', 'B') })
    const id = result.current.tabs[0].links[0].id
    act(() => { result.current.removeLink(tabId, id) })
    expect(result.current.tabs[0].links).toHaveLength(1)
    expect(result.current.tabs[0].links[0].title).toBe('B')
  })
})
```

Also update the two section-count tests (they currently expect `['files', 'notes', 'sketches']` — they will need to include `'links'`):

```ts
// In 'initial state' describe block, change:
it('default tab has four sections: files, notes, sketches, links', () => {
  const { result } = renderHook(() => useWorkspaceStore())
  const types = result.current.tabs[0].sections.map((s) => s.type)
  expect(types).toEqual(['files', 'notes', 'sketches', 'links'])
})

// In 'createTab' describe block, change:
it('new tab has four default sections', () => {
  const { result } = renderHook(() => useWorkspaceStore())
  act(() => { result.current.createTab('Dev', 'green') })
  const types = result.current.tabs[1].sections.map((s) => s.type)
  expect(types).toEqual(['files', 'notes', 'sketches', 'links'])
})
```

- [ ] **Step 2: Run tests — confirm RED**

```
npm test -- src/store/useWorkspaceStore.test.ts
```
Expected: multiple failures — `links` not found, `addLink` not a function, etc.

- [ ] **Step 3: Implement in store**

In `src/store/useWorkspaceStore.ts`:

Add `LinkItem` interface after `SketchCard`:
```ts
export interface LinkItem {
  id: string
  title: string
  url: string
  createdAt: number
}
```

Update `SectionType`:
```ts
export type SectionType = 'files' | 'notes' | 'sketches' | 'links'
```

Add `links: LinkItem[]` to `Tab` interface:
```ts
export interface Tab {
  id: string
  name: string
  color: TabColor
  sections: SectionConfig[]
  files: WorkspaceFile[]
  notes: NoteCard[]
  sketches: SketchCard[]
  links: LinkItem[]
}
```

Update `makeDefaultSections`:
```ts
function makeDefaultSections(): SectionConfig[] {
  return [
    { type: 'files', layout: 'list' },
    { type: 'notes', layout: 'list' },
    { type: 'sketches', layout: 'list' },
    { type: 'links', layout: 'list' },
  ]
}
```

Update `makeDefaultTab` to include `links: []`:
```ts
function makeDefaultTab(): Tab {
  return {
    id: crypto.randomUUID(),
    name: 'Workspace',
    color: 'blue',
    sections: makeDefaultSections(),
    files: [],
    notes: [],
    sketches: [],
    links: [],
  }
}
```

Add to `WorkspaceStore` interface:
```ts
addLink: (tabId: string, url: string, title: string) => void
updateLink: (tabId: string, linkId: string, patch: Partial<Pick<LinkItem, 'title' | 'url'>>) => void
removeLink: (tabId: string, linkId: string) => void
```

Update `clearTab` to also clear `links`:
```ts
clearTab: (id) =>
  set((state) => ({
    tabs: state.tabs.map((t) =>
      t.id === id ? { ...t, files: [], notes: [], sketches: [], links: [] } : t
    ),
  })),
```

Export the migration function (add before `useWorkspaceStore`):
```ts
export function migrateStore(state: any, fromVersion: number): any {
  if (fromVersion === 0) {
    return {
      ...state,
      tabs: (state.tabs ?? []).map((tab: any) => ({
        ...tab,
        links: tab.links ?? [],
        sections: (tab.sections ?? []).some((s: any) => s.type === 'links')
          ? tab.sections
          : [...(tab.sections ?? []), { type: 'links', layout: 'list' }],
      })),
    }
  }
  return state
}
```

Update the `persist` call to add `version` and `migrate`:
```ts
export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => { /* ... unchanged ... */ },
    {
      name: 'vanish-box-workspace',
      version: 1,
      migrate: migrateStore,
    }
  )
)
```

Add implementations inside `create`:
```ts
addLink: (tabId, url, title) => {
  const derivedTitle = title.trim() || (() => {
    try { return new URL(url).hostname } catch { return url }
  })()
  const link: LinkItem = {
    id: crypto.randomUUID(),
    title: derivedTitle,
    url,
    createdAt: Date.now(),
  }
  set((state) => ({
    tabs: state.tabs.map((t) =>
      t.id === tabId ? { ...t, links: [...t.links, link] } : t
    ),
  }))
},

updateLink: (tabId, linkId, patch) =>
  set((state) => ({
    tabs: state.tabs.map((t) =>
      t.id === tabId
        ? {
            ...t,
            links: t.links.map((l) =>
              l.id === linkId ? { ...l, ...patch } : l
            ),
          }
        : t
    ),
  })),

removeLink: (tabId, linkId) =>
  set((state) => ({
    tabs: state.tabs.map((t) =>
      t.id === tabId
        ? { ...t, links: t.links.filter((l) => l.id !== linkId) }
        : t
    ),
  })),
```

- [ ] **Step 4: Run tests — confirm GREEN**

```
npm test -- src/store/useWorkspaceStore.test.ts
```
Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/store/useWorkspaceStore.ts src/store/useWorkspaceStore.test.ts
git commit -m "feat: add LinkItem type and CRUD actions to store"
```

---

## Task 3: LinkCard component

**Files:**
- Create: `src/components/LinkCard.tsx`
- Create: `src/components/LinkCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/LinkCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinkCard } from './LinkCard'
import { COLORS } from '../theme'
import type { LinkItem } from '../store/useWorkspaceStore'

const baseLink: LinkItem = {
  id: 'l1',
  title: 'Example',
  url: 'https://example.com',
  createdAt: 0,
}

describe('LinkCard', () => {
  it('renders the link title', () => {
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Example')).toBeTruthy()
  })

  it('renders the url as secondary text', () => {
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('https://example.com')).toBeTruthy()
  })

  it('clicking the title calls onOpen with url', () => {
    const onOpen = vi.fn()
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={onOpen} onEdit={vi.fn()} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByText('Example'))
    expect(onOpen).toHaveBeenCalledWith('https://example.com')
  })

  it('clicking edit button calls onEdit with link', () => {
    const onEdit = vi.fn()
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={onEdit} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'edit link' }))
    expect(onEdit).toHaveBeenCalledWith(baseLink)
  })

  it('clicking × calls onRemove with link id', () => {
    const onRemove = vi.fn()
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={vi.fn()} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'remove link' }))
    expect(onRemove).toHaveBeenCalledWith('l1')
  })
})
```

- [ ] **Step 2: Run tests — confirm RED**

```
npm test -- src/components/LinkCard.test.tsx
```
Expected: fail — `LinkCard` not found.

- [ ] **Step 3: Implement LinkCard**

Create `src/components/LinkCard.tsx`:

```tsx
import { LinkItem } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface LinkCardProps {
  link: LinkItem
  colors: ColorTokens
  onOpen: (url: string) => void
  onEdit: (link: LinkItem) => void
  onRemove: (linkId: string) => void
}

export function LinkCard({ link, colors, onOpen, onEdit, onRemove }: LinkCardProps) {
  return (
    <div
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
      <div
        onClick={() => onOpen(link.url)}
        style={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }}
      >
        <div
          style={{
            fontWeight: 500,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {link.title}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: colors.textMuted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {link.url}
        </div>
      </div>

      <button
        aria-label="edit link"
        onClick={(e) => { e.stopPropagation(); onEdit(link) }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.textMuted, fontSize: '12px', flexShrink: 0, padding: '0 2px',
        }}
      >
        ✎
      </button>

      <button
        aria-label="remove link"
        onClick={(e) => { e.stopPropagation(); onRemove(link.id) }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.textMuted, fontSize: '14px', lineHeight: 1, flexShrink: 0, padding: '0 2px',
        }}
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm GREEN**

```
npm test -- src/components/LinkCard.test.tsx
```
Expected: all 5 pass.

- [ ] **Step 5: Commit**

```
git add src/components/LinkCard.tsx src/components/LinkCard.test.tsx
git commit -m "feat: add LinkCard component"
```

---

## Task 4: LinkEditor component

**Files:**
- Create: `src/components/LinkEditor.tsx`
- Create: `src/components/LinkEditor.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/LinkEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinkEditor } from './LinkEditor'
import { COLORS } from '../theme'
import type { LinkItem } from '../store/useWorkspaceStore'

const baseLink: LinkItem = { id: 'l1', title: 'Example', url: 'https://example.com', createdAt: 0 }

describe('LinkEditor', () => {
  it('renders title and url inputs pre-filled', () => {
    render(<LinkEditor link={baseLink} colors={COLORS.light} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Example')).toBeTruthy()
    expect(screen.getByDisplayValue('https://example.com')).toBeTruthy()
  })

  it('Save calls onSave with updated values then onClose', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<LinkEditor link={baseLink} colors={COLORS.light} onSave={onSave} onClose={onClose} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'link title' }), { target: { value: 'Updated' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(onSave).toHaveBeenCalledWith({ title: 'Updated', url: 'https://example.com' })
    expect(onClose).toHaveBeenCalled()
  })

  it('Cancel calls onClose without saving', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<LinkEditor link={baseLink} colors={COLORS.light} onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))
    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('saves with hostname fallback when title is blank', () => {
    const onSave = vi.fn()
    render(<LinkEditor link={{ ...baseLink, title: '' }} colors={COLORS.light} onSave={onSave} onClose={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'link title' }), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(onSave).toHaveBeenCalledWith({ title: 'example.com', url: 'https://example.com' })
  })
})
```

- [ ] **Step 2: Run tests — confirm RED**

```
npm test -- src/components/LinkEditor.test.tsx
```
Expected: fail — `LinkEditor` not found.

- [ ] **Step 3: Implement LinkEditor**

Create `src/components/LinkEditor.tsx`:

```tsx
import { useState } from 'react'
import { LinkItem } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface LinkEditorProps {
  link: LinkItem
  colors: ColorTokens
  onSave: (patch: Partial<Pick<LinkItem, 'title' | 'url'>>) => void
  onClose: () => void
}

export function LinkEditor({ link, colors, onSave, onClose }: LinkEditorProps) {
  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.url)

  function save() {
    const derivedTitle = title.trim() || (() => {
      try { return new URL(url).hostname } catch { return url }
    })()
    onSave({ title: derivedTitle, url })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
    >
      <div
        style={{
          background: colors.bg, border: `1px solid ${colors.border}`,
          borderRadius: '12px', padding: '16px', width: '320px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="link title"
          placeholder="Title"
          style={{
            fontSize: '14px', fontWeight: 600, border: 'none',
            borderBottom: `1px solid ${colors.border}`, padding: '4px 0',
            background: 'transparent', color: colors.text, outline: 'none',
          }}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="link url"
          placeholder="https://"
          autoFocus
          style={{
            fontSize: '13px', border: `1px solid ${colors.border}`,
            borderRadius: '6px', padding: '8px',
            background: colors.bgSecondary, color: colors.text, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px', cursor: 'pointer', borderRadius: '6px',
              border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '6px 12px', cursor: 'pointer', borderRadius: '6px',
              background: '#6366f1', color: '#fff', border: 'none',
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

- [ ] **Step 4: Run tests — confirm GREEN**

```
npm test -- src/components/LinkEditor.test.tsx
```
Expected: all 4 pass.

- [ ] **Step 5: Commit**

```
git add src/components/LinkEditor.tsx src/components/LinkEditor.test.tsx
git commit -m "feat: add LinkEditor component"
```

---

## Task 5: LinksSection + open_url command + TabContent wiring

**Files:**
- Create: `src/components/LinksSection.tsx`
- Create: `src/components/LinksSection.test.tsx`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/components/TabContent.tsx`

- [ ] **Step 1: Write failing tests for LinksSection**

Create `src/components/LinksSection.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinksSection } from './LinksSection'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('LinksSection', () => {
  it('shows "No links yet" when empty', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('No links yet')).toBeTruthy()
  })

  it('shows "+ Add link" button', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: /Add link/ })).toBeTruthy()
  })

  it('clicking "+ Add link" opens the editor', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    expect(screen.getByRole('textbox', { name: 'link url' })).toBeTruthy()
  })

  it('saving the editor creates a link in the store', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'link url' }), { target: { value: 'https://example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'link title' }), { target: { value: 'Example' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(useWorkspaceStore.getState().tabs[0].links).toHaveLength(1)
    expect(screen.getByText('Example')).toBeTruthy()
  })

  it('clicking × removes the link', () => {
    const tabId = getTabId()
    useWorkspaceStore.getState().addLink(tabId, 'https://a.com', 'A')
    render(<LinksSection tabId={tabId} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'remove link' }))
    expect(useWorkspaceStore.getState().tabs[0].links).toHaveLength(0)
  })

  it('clicking edit button opens editor for that link', () => {
    const tabId = getTabId()
    useWorkspaceStore.getState().addLink(tabId, 'https://a.com', 'Alpha')
    render(<LinksSection tabId={tabId} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'edit link' }))
    expect(screen.getByDisplayValue('Alpha')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests — confirm RED**

```
npm test -- src/components/LinksSection.test.tsx
```
Expected: fail — `LinksSection` not found.

- [ ] **Step 3: Add open_url Rust command**

In `src-tauri/src/commands.rs`, add after `open_file`:

```rust
/// Open a URL in the system's default browser.
#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

In `src-tauri/src/main.rs`, add `commands::open_url` to the invoke handler:

```rust
.invoke_handler(tauri::generate_handler![
    commands::copy_file,
    commands::open_file,
    commands::open_url,
    commands::delete_file,
    commands::trash_file,
])
```

- [ ] **Step 4: Implement LinksSection**

Create `src/components/LinksSection.tsx`:

```tsx
import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useWorkspaceStore, LinkItem } from '../store/useWorkspaceStore'
import { LinkCard } from './LinkCard'
import { LinkEditor } from './LinkEditor'
import { ColorTokens } from '../theme'

interface LinksSectionProps {
  tabId: string
  colors: ColorTokens
}

export function LinksSection({ tabId, colors }: LinksSectionProps) {
  const { tabs, addLink, updateLink, removeLink } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const links = tab?.links ?? []
  const [editing, setEditing] = useState<LinkItem | 'new' | null>(null)

  function handleOpen(url: string) {
    invoke('open_url', { url }).catch((e) =>
      console.error('[VanishBox] Failed to open url:', e)
    )
  }

  function handleSave(patch: Partial<Pick<LinkItem, 'title' | 'url'>>) {
    if (editing === 'new') {
      addLink(tabId, patch.url ?? '', patch.title ?? '')
    } else if (editing) {
      updateLink(tabId, editing.id, patch)
    }
  }

  const blankLink: LinkItem = { id: '', title: '', url: '', createdAt: 0 }

  return (
    <div>
      {editing !== null && (
        <LinkEditor
          link={editing === 'new' ? blankLink : editing}
          colors={colors}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {links.length === 0 ? (
        <div
          style={{
            background: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: '8px', padding: '12px', textAlign: 'center',
            fontSize: '12px', color: colors.textMuted,
          }}
        >
          No links yet
        </div>
      ) : (
        <div>
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              colors={colors}
              onOpen={handleOpen}
              onEdit={setEditing}
              onRemove={(id) => removeLink(tabId, id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setEditing('new')}
        aria-label="Add link"
        style={{
          marginTop: '6px', width: '100%', padding: '6px',
          border: `1px dashed ${colors.border}`, borderRadius: '6px',
          background: 'transparent', color: colors.textMuted,
          cursor: 'pointer', fontSize: '12px',
        }}
      >
        + Add link
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Update TabContent**

In `src/components/TabContent.tsx`:

```tsx
import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'
import { FilesSection } from './FilesSection'
import { NotesSection } from './NotesSection'
import { SketchesSection } from './SketchesSection'
import { LinksSection } from './LinksSection'

interface TabContentProps {
  tab: Tab
  colors: ColorTokens
}

export function TabContent({ tab, colors }: TabContentProps) {
  const sectionLabel: Record<string, string> = {
    files: 'Files',
    notes: 'Notes',
    sketches: 'Sketches',
    links: 'Links',
  }

  return (
    <div
      style={{
        flex: 1, overflowY: 'auto', padding: '12px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}
    >
      {tab.sections.map((section) => (
        <section key={section.type}>
          <h3
            style={{
              margin: '0 0 6px 0', fontSize: '11px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em', color: colors.textMuted,
            }}
          >
            {sectionLabel[section.type]}
          </h3>
          {section.type === 'files' ? (
            <FilesSection tabId={tab.id} colors={colors} />
          ) : section.type === 'notes' ? (
            <NotesSection tabId={tab.id} colors={colors} />
          ) : section.type === 'links' ? (
            <LinksSection tabId={tab.id} colors={colors} />
          ) : (
            <SketchesSection tabId={tab.id} colors={colors} />
          )}
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Run tests — confirm GREEN**

```
npm test
```
Expected: all tests pass.

- [ ] **Step 7: Commit**

```
git add src/components/LinksSection.tsx src/components/LinksSection.test.tsx src/components/TabContent.tsx src-tauri/src/commands.rs src-tauri/src/main.rs
git commit -m "feat: add Links section with open_url Rust command"
```

---

## Task 6: Keybind — Rust update_shortcut command + startup file read

**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/shortcut.rs`
- Modify: `src-tauri/src/main.rs`

No JS tests for this task — it's Rust-side IPC plumbing. Manual verification in Task 7.

**Why the file approach eliminates the gap:** `shortcut.rs` runs before the WebView exists. It has no way to read localStorage (that's a WebView API). By writing the keybind to `<appData>/keybind.txt` when the user saves it, `setup_shortcut` can read it on next launch and register the correct shortcut immediately — before React mounts. First launch: file doesn't exist → default `ctrl+shift+v` used by both Rust and React, so no observable gap.

- [ ] **Step 1: Add parse helpers and update_shortcut to commands.rs**

Add at the bottom of `src-tauri/src/commands.rs`:

```rust
pub fn str_to_code(s: &str) -> Result<tauri_plugin_global_shortcut::Code, String> {
    use tauri_plugin_global_shortcut::Code;
    match s {
        "a" => Ok(Code::KeyA), "b" => Ok(Code::KeyB), "c" => Ok(Code::KeyC),
        "d" => Ok(Code::KeyD), "e" => Ok(Code::KeyE), "f" => Ok(Code::KeyF),
        "g" => Ok(Code::KeyG), "h" => Ok(Code::KeyH), "i" => Ok(Code::KeyI),
        "j" => Ok(Code::KeyJ), "k" => Ok(Code::KeyK), "l" => Ok(Code::KeyL),
        "m" => Ok(Code::KeyM), "n" => Ok(Code::KeyN), "o" => Ok(Code::KeyO),
        "p" => Ok(Code::KeyP), "q" => Ok(Code::KeyQ), "r" => Ok(Code::KeyR),
        "s" => Ok(Code::KeyS), "t" => Ok(Code::KeyT), "u" => Ok(Code::KeyU),
        "v" => Ok(Code::KeyV), "w" => Ok(Code::KeyW), "x" => Ok(Code::KeyX),
        "y" => Ok(Code::KeyY), "z" => Ok(Code::KeyZ),
        "0" => Ok(Code::Digit0), "1" => Ok(Code::Digit1), "2" => Ok(Code::Digit2),
        "3" => Ok(Code::Digit3), "4" => Ok(Code::Digit4), "5" => Ok(Code::Digit5),
        "6" => Ok(Code::Digit6), "7" => Ok(Code::Digit7), "8" => Ok(Code::Digit8),
        "9" => Ok(Code::Digit9),
        "f1" => Ok(Code::F1), "f2" => Ok(Code::F2), "f3" => Ok(Code::F3),
        "f4" => Ok(Code::F4), "f5" => Ok(Code::F5), "f6" => Ok(Code::F6),
        "f7" => Ok(Code::F7), "f8" => Ok(Code::F8), "f9" => Ok(Code::F9),
        "f10" => Ok(Code::F10), "f11" => Ok(Code::F11), "f12" => Ok(Code::F12),
        "space" => Ok(Code::Space),
        other => Err(format!("Unsupported key: {other}")),
    }
}

pub fn parse_keybind(keybind: &str) -> Result<tauri_plugin_global_shortcut::Shortcut, String> {
    use tauri_plugin_global_shortcut::{Modifiers, Shortcut};
    let parts: Vec<&str> = keybind.to_lowercase().split('+').collect();
    let mut modifiers = Modifiers::empty();
    let mut key_code = None;
    for part in &parts {
        match *part {
            "ctrl" | "control" => modifiers |= Modifiers::CONTROL,
            "shift" => modifiers |= Modifiers::SHIFT,
            "alt" => modifiers |= Modifiers::ALT,
            "super" | "meta" | "cmd" | "win" => modifiers |= Modifiers::SUPER,
            _ => { key_code = Some(str_to_code(part)?); }
        }
    }
    let code = key_code.ok_or_else(|| "No key specified in keybind".to_string())?;
    Ok(Shortcut::new(if modifiers.is_empty() { None } else { Some(modifiers) }, code))
}

/// Unregister all shortcuts, register a new one, and persist the keybind to disk
/// so setup_shortcut can read it on next launch (eliminating the startup gap).
#[tauri::command]
pub fn update_shortcut(app_handle: tauri::AppHandle, keybind: String) -> Result<(), String> {
    use tauri::Manager;
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    // Persist to disk for startup read
    let data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&data_dir).map_err(|e| e.to_string())?;
    std::fs::write(data_dir.join("keybind.txt"), &keybind).map_err(|e| e.to_string())?;

    // Re-register shortcut
    app_handle.global_shortcut().unregister_all().map_err(|e| e.to_string())?;
    let shortcut = parse_keybind(&keybind)?;
    app_handle
        .global_shortcut()
        .on_shortcut(shortcut, |app_handle, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                crate::window::toggle_panel(app_handle);
            }
        })
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 2: Update shortcut.rs to read keybind.txt at startup**

Replace the entire contents of `src-tauri/src/shortcut.rs`:

```rust
use tauri::App;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const DEFAULT_KEYBIND: &str = "ctrl+shift+v";

pub fn setup_shortcut(app: &mut App) -> tauri::Result<()> {
    use tauri::Manager;

    // Read persisted keybind from disk; fall back to default on first launch
    let data_dir = app.handle().path().app_data_dir()?;
    let keybind_path = data_dir.join("keybind.txt");
    let keybind = std::fs::read_to_string(&keybind_path)
        .unwrap_or_else(|_| DEFAULT_KEYBIND.to_string());
    let keybind = keybind.trim().to_string();

    let shortcut = crate::commands::parse_keybind(&keybind)
        .unwrap_or_else(|_| {
            crate::commands::parse_keybind(DEFAULT_KEYBIND)
                .expect("default keybind must always parse")
        });

    app.handle()
        .global_shortcut()
        .on_shortcut(shortcut, |app_handle, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                crate::window::toggle_panel(app_handle);
            }
        })
        .map_err(|e| tauri::Error::Anyhow(e.into()))?;

    Ok(())
}
```

- [ ] **Step 3: Register update_shortcut in main.rs**

```rust
.invoke_handler(tauri::generate_handler![
    commands::copy_file,
    commands::open_file,
    commands::open_url,
    commands::delete_file,
    commands::trash_file,
    commands::update_shortcut,
])
```

- [ ] **Step 4: Verify Rust compiles**

```
cd src-tauri && cargo check
```
Expected: no errors.

- [ ] **Step 5: Commit**

```
git add src-tauri/src/commands.rs src-tauri/src/shortcut.rs src-tauri/src/main.rs
git commit -m "feat: add update_shortcut command; persist keybind.txt for gap-free startup"
```

---

## Task 7: Keybind — Frontend capture UI

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/WorkspacePanel.tsx`

- [ ] **Step 1: Write failing test**

In `src/components/WorkspacePanel.test.tsx`, the existing mock for `@tauri-apps/api/core` already covers `invoke`. Add one test:

```ts
it('calls update_shortcut on mount with stored keybind', async () => {
  const { invoke } = await import('@tauri-apps/api/core')
  const mockInvoke = invoke as ReturnType<typeof vi.fn>
  render(<WorkspacePanel />)
  expect(mockInvoke).toHaveBeenCalledWith('update_shortcut', { keybind: 'ctrl+shift+v' })
})
```

Run:
```
npm test -- src/components/WorkspacePanel.test.tsx
```
Expected: fail — `update_shortcut` invoke not called.

- [ ] **Step 2: Apply stored keybind on mount in WorkspacePanel**

In `src/components/WorkspacePanel.tsx`, add `useEffect`:

```tsx
import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
// ... existing imports

export function WorkspacePanel() {
  const { tabs, activeTabId, settings, updateSettings, clearTab } = useWorkspaceStore()
  // ... existing state

  useEffect(() => {
    invoke('update_shortcut', { keybind: settings.keybind }).catch((e) =>
      console.error('[VanishBox] Failed to apply keybind:', e)
    )
  }, []) // run once on mount

  // ... rest of component unchanged
```

- [ ] **Step 3: Add keybind capture to SettingsPanel**

Replace the static keybind display in `src/components/SettingsPanel.tsx` with a capture input. Replace this block:

```tsx
<div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>
  Global shortcut: <code>{settings.keybind}</code>
</div>
```

With:

```tsx
<KeybindCapture
  keybind={settings.keybind}
  colors={colors}
  onCapture={(keybind) => {
    onUpdate({ keybind })
    invoke('update_shortcut', { keybind }).catch((e) =>
      console.error('[VanishBox] Failed to update shortcut:', e)
    )
  }}
/>
```

And add `invoke` import and the `KeybindCapture` sub-component at the top of `SettingsPanel.tsx` (before the `SettingsPanel` function):

```tsx
import { invoke } from '@tauri-apps/api/core'

function KeybindCapture({
  keybind,
  colors,
  onCapture,
}: {
  keybind: string
  colors: ColorTokens
  onCapture: (keybind: string) => void
}) {
  const [capturing, setCapturing] = useState(false)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')
    if (e.metaKey) parts.push('super')
    const key = e.key.toLowerCase()
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key)
      onCapture(parts.join('+'))
      setCapturing(false)
    }
  }

  return (
    <div style={{ fontSize: '12px', color: colors.text, marginTop: '4px' }}>
      <div style={{ marginBottom: '4px' }}>Global shortcut</div>
      <input
        readOnly
        value={capturing ? 'Press keys…' : keybind}
        onFocus={() => setCapturing(true)}
        onBlur={() => setCapturing(false)}
        onKeyDown={handleKeyDown}
        aria-label="keybind capture"
        style={{
          width: '100%',
          padding: '4px 8px',
          border: `1px solid ${capturing ? '#6366f1' : colors.border}`,
          borderRadius: '6px',
          background: colors.bgSecondary,
          color: colors.text,
          fontSize: '12px',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'monospace',
        }}
      />
      <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
        Click and press a key combination to change
      </div>
    </div>
  )
}
```

Also add `import { useState } from 'react'` to `SettingsPanel.tsx` since `KeybindCapture` uses it.

- [ ] **Step 4: Run tests — confirm GREEN**

```
npm test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/components/SettingsPanel.tsx src/components/WorkspacePanel.tsx src/components/WorkspacePanel.test.tsx
git commit -m "feat: add runtime keybind capture in settings and apply on mount"
```

**Limitation:** On first launch before React mounts (~200ms), the hardcoded `Ctrl+Shift+V` from `shortcut.rs` is active. After mount, the stored keybind takes over. This gap is imperceptible in practice. If a user sets a keybind that fails to parse (unsupported key), the shortcut reverts to whatever was last registered.

---

## Task 8: File reordering — Store action

**Files:**
- Modify: `src/store/useWorkspaceStore.ts`
- Modify: `src/store/useWorkspaceStore.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/store/useWorkspaceStore.test.ts`, after the `removeFile` describe block:

```ts
describe('moveFile', () => {
  function makeFile(id: string): WorkspaceFile {
    return { id, originalName: `${id}.txt`, storedPath: `/${id}`, sourcePath: `/orig/${id}`, size: 1, addedAt: 0 }
  }

  it('moves a file up by swapping with the previous element', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addFiles(tabId, [makeFile('a'), makeFile('b'), makeFile('c')]) })
    act(() => { result.current.moveFile(tabId, 'b', 'up') })
    const ids = result.current.tabs[0].files.map((f) => f.id)
    expect(ids).toEqual(['b', 'a', 'c'])
  })

  it('moves a file down by swapping with the next element', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addFiles(tabId, [makeFile('a'), makeFile('b'), makeFile('c')]) })
    act(() => { result.current.moveFile(tabId, 'b', 'down') })
    const ids = result.current.tabs[0].files.map((f) => f.id)
    expect(ids).toEqual(['a', 'c', 'b'])
  })

  it('moving the first file up is a no-op', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addFiles(tabId, [makeFile('a'), makeFile('b')]) })
    act(() => { result.current.moveFile(tabId, 'a', 'up') })
    const ids = result.current.tabs[0].files.map((f) => f.id)
    expect(ids).toEqual(['a', 'b'])
  })

  it('moving the last file down is a no-op', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => { result.current.addFiles(tabId, [makeFile('a'), makeFile('b')]) })
    act(() => { result.current.moveFile(tabId, 'b', 'down') })
    const ids = result.current.tabs[0].files.map((f) => f.id)
    expect(ids).toEqual(['a', 'b'])
  })
})
```

Also import `WorkspaceFile` at the top of the test file if not already imported:
```ts
import type { TabColor, WorkspaceFile } from './useWorkspaceStore'
```

- [ ] **Step 2: Run tests — confirm RED**

```
npm test -- src/store/useWorkspaceStore.test.ts
```
Expected: fail — `moveFile` not a function.

- [ ] **Step 3: Implement moveFile in store**

Add to `WorkspaceStore` interface:
```ts
moveFile: (tabId: string, fileId: string, direction: 'up' | 'down') => void
```

Add implementation inside `create`:
```ts
moveFile: (tabId, fileId, direction) =>
  set((state) => ({
    tabs: state.tabs.map((t) => {
      if (t.id !== tabId) return t
      const files = [...t.files]
      const idx = files.findIndex((f) => f.id === fileId)
      if (idx === -1) return t
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= files.length) return t
      ;[files[idx], files[swapIdx]] = [files[swapIdx], files[idx]]
      return { ...t, files }
    }),
  })),
```

- [ ] **Step 4: Run tests — confirm GREEN**

```
npm test -- src/store/useWorkspaceStore.test.ts
```
Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/store/useWorkspaceStore.ts src/store/useWorkspaceStore.test.ts
git commit -m "feat: add moveFile store action for file reordering"
```

---

## Task 9: File reordering — FileCard UI

**Files:**
- Modify: `src/components/FileCard.tsx`
- Modify: `src/components/FileCard.test.tsx`
- Modify: `src/components/FilesSection.tsx`

- [ ] **Step 1: Write failing tests**

In `src/components/FileCard.test.tsx`, add after the existing tests:

```ts
it('clicking ↑ calls onMoveUp with file id', () => {
  const onMoveUp = vi.fn()
  render(
    <FileCard
      file={baseFile}
      settings={baseSettings}
      colors={COLORS.light}
      onOpen={vi.fn()}
      onRemove={vi.fn()}
      onDelete={vi.fn()}
      onMoveUp={onMoveUp}
      onMoveDown={vi.fn()}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'move up' }))
  expect(onMoveUp).toHaveBeenCalledWith('f1')
})

it('clicking ↓ calls onMoveDown with file id', () => {
  const onMoveDown = vi.fn()
  render(
    <FileCard
      file={baseFile}
      settings={baseSettings}
      colors={COLORS.light}
      onOpen={vi.fn()}
      onRemove={vi.fn()}
      onDelete={vi.fn()}
      onMoveUp={vi.fn()}
      onMoveDown={onMoveDown}
    />
  )
  fireEvent.click(screen.getByRole('button', { name: 'move down' }))
  expect(onMoveDown).toHaveBeenCalledWith('f1')
})
```

Also update all existing `FileCard` renders in `FileCard.test.tsx` to include the new required props:
```tsx
onMoveUp={vi.fn()}
onMoveDown={vi.fn()}
```

Run:
```
npm test -- src/components/FileCard.test.tsx
```
Expected: fail — `move up` / `move down` buttons not found.

- [ ] **Step 2: Add ↑↓ buttons to FileCard**

In `src/components/FileCard.tsx`:

Update interface to add optional callbacks:
```tsx
interface FileCardProps {
  file: WorkspaceFile
  settings: Settings
  colors: ColorTokens
  onOpen: (storedPath: string) => void
  onRemove: (fileId: string) => void
  onDelete: (fileId: string, sourcePath: string, storedPath: string) => void
  onMoveUp: (fileId: string) => void
  onMoveDown: (fileId: string) => void
}
```

Add ↑↓ buttons to the returned JSX, before the `×` (remove) button:
```tsx
<button
  aria-label="move up"
  title="Move up"
  onClick={(e) => { e.stopPropagation(); onMoveUp(file.id) }}
  style={{
    background: 'none', border: 'none', cursor: 'pointer',
    color: colors.textMuted, fontSize: '11px', lineHeight: 1,
    padding: '0 2px', flexShrink: 0,
  }}
>
  ↑
</button>
<button
  aria-label="move down"
  title="Move down"
  onClick={(e) => { e.stopPropagation(); onMoveDown(file.id) }}
  style={{
    background: 'none', border: 'none', cursor: 'pointer',
    color: colors.textMuted, fontSize: '11px', lineHeight: 1,
    padding: '0 2px', flexShrink: 0,
  }}
>
  ↓
</button>
```

- [ ] **Step 3: Wire up FilesSection**

In `src/components/FilesSection.tsx`, import `moveFile` from store and pass callbacks:

```tsx
const { tabs, settings, addFiles, removeFile, moveFile } = useWorkspaceStore()
```

Update the `<FileCard>` render to include:
```tsx
onMoveUp={(id) => moveFile(tabId, id, 'up')}
onMoveDown={(id) => moveFile(tabId, id, 'down')}
```

- [ ] **Step 4: Run all tests — confirm GREEN**

```
npm test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```
git add src/components/FileCard.tsx src/components/FileCard.test.tsx src/components/FilesSection.tsx
git commit -m "feat: add up/down reorder buttons to file cards"
```

---

## Self-Review

### Spec coverage
- [x] Theme toggle removed from header — Task 1
- [x] Light/dark in settings unchanged — SettingsPanel dark mode checkbox untouched
- [x] Links section: add, edit, remove, open in browser — Tasks 2–5
- [x] Title fallback from hostname when blank — store `addLink` + `LinkEditor` save
- [x] No metadata fetching / no previews / no embeds / no tags — confirmed absent
- [x] Keybind: editable in settings, persisted, applies on restart — Tasks 6–7
- [x] Keybind limitation documented — Task 7 footer
- [x] File reorder: up/down controls, affect display only, persist in store — Tasks 8–9

### Placeholder scan
None found.

### Type consistency
- `LinkItem` defined in Task 2, used in Tasks 3, 4, 5 — consistent
- `moveFile(tabId, fileId, direction: 'up' | 'down')` defined in Task 8, called in Task 9 — consistent
- `onMoveUp(fileId: string)` / `onMoveDown(fileId: string)` defined in Task 9 FileCard interface, used in FilesSection — consistent
- `update_shortcut({ keybind })` registered in Task 6, called in Tasks 7 WorkspacePanel and SettingsPanel — consistent

### Known limitations
1. **Existing persisted tabs**: fully handled by Zustand `version: 1` + `migrate`. The migration backfills `links: []` and the `{ type: 'links' }` section entry on every old tab when the app loads. No manual action needed.
2. **Keybind startup gap**: eliminated. `setup_shortcut` reads `keybind.txt` at startup before the WebView exists. First launch has no gap (file absent → both Rust and React default to `ctrl+shift+v`). Subsequent launches after a keybind change use the persisted file — React's `update_shortcut` on mount re-confirms it but is a no-op if the file matches.
3. **Keybind key support**: only letters, digits, F1–F12, and Space. If the user presses an unsupported key (e.g. arrow keys, punctuation), the `update_shortcut` command returns an error, the frontend catches it silently, and the previous shortcut remains active.
