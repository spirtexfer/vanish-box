# Vanish Box Phase 2 — Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the working Vanish Box prototype with remove, open, timestamps, dark mode, settings, reset scheduler, notepad, screenshot capture, and configurable keybind.

**Architecture:** All UI state moves from `useState` in `ShelfPanel` into a persisted Zustand store (`useShelfStore`). Rust gains new commands for opening files, capturing screenshots, and updating the global shortcut at runtime. A second transparent Tauri window handles screenshot area selection.

**Tech Stack:** React 19, TypeScript, Zustand (with persist middleware), Tauri 2, Rust, xcap crate (screenshot), tauri-plugin-global-shortcut (already installed), localStorage (via zustand/middleware)

---

## Architecture Summary

### State before (Phase 1 prototype)
- `ShelfPanel.tsx` owns `files: DroppedFile[]` in local `useState`
- `appStore.ts` has unused `isPanelReady` only
- No persistence, no settings, no IDs, no timestamps

### State after (this plan)
- `useShelfStore.ts` — central Zustand store persisted to localStorage:
  - `files: ShelfFile[]` (id, name, size, path, addedAt)
  - `notepad: string`
  - `settings: Settings` (showSize, showTimestamp, showCountdown, theme, resetConfig, keybind)
  - actions: addFiles, removeFile, setNotepad, updateSettings, reset
- `useTheme.ts` — reads theme from store, applies to DOM
- `useReset.ts` — countdown + scheduler + auto-reset trigger
- `ShelfPanel.tsx` — wired to store, smaller, delegates to sub-components
- New sub-components: `FileItem`, `Notepad`, `CountdownTimer`, `SettingsPanel`

### Risky areas
1. **Duplicate file bug** — caused by React 18 Strict Mode running `useEffect` twice. The async `onDragDropEvent` Promise resolves after cleanup, leaving a dangling listener. Fix: `cancelled` flag guards the Promise resolution.
2. **Screenshot capture** — requires a second Tauri window + `xcap` crate. Cross-crate + window coordination is complex. Flag as highest risk.
3. **Keybind updating** — `tauri-plugin-global-shortcut` doesn't expose a clean "replace" API. Must unregister all then re-register. Risk: leaving a window where no shortcut is active.
4. **Reset scheduling** — no Tauri timer API; must use JS `setInterval` for countdown and trigger. Risk: drift on long intervals.

---

## File Structure

### Create
- `src/store/useShelfStore.ts` — central store replacing scattered useState
- `src/hooks/useReset.ts` — reset config, countdown, auto-reset trigger
- `src/components/FileItem.tsx` — single file row with remove btn, open on click, timestamp
- `src/components/Notepad.tsx` — textarea persisted to store, cleared on reset
- `src/components/CountdownTimer.tsx` — live formatted countdown
- `src/components/SettingsPanel.tsx` — settings drawer (display toggles, keybind, reset config)
- `src-tauri/src/screenshot.rs` — screenshot capture logic (Phase 4)

### Modify
- `src/components/ShelfPanel.tsx` — wire store, fix duplicate listener, compose sub-components
- `src/App.tsx` — apply theme class to root
- `src-tauri/src/commands.rs` — add open_file, take_screenshot, update_shortcut
- `src-tauri/src/main.rs` — register new commands, add screenshot module (Phase 4)
- `src-tauri/src/shortcut.rs` — make shortcut replaceable at runtime (Phase 5)
- `src-tauri/Cargo.toml` — add xcap (Phase 4)
- `src-tauri/capabilities/default.json` — add needed permissions

---

## Phase 1: Fix Duplicate + Remove + Open + Timestamps + Display Settings

---

### Task 1: Fix duplicate file drop listener (React Strict Mode bug)

**Files:**
- Modify: `src/components/ShelfPanel.tsx`
- Test: `src/components/ShelfPanel.test.tsx`

**Root cause:** React 18 Strict Mode (dev only) runs `useEffect` twice per mount (mount → cleanup → mount). `onDragDropEvent` returns a `Promise<() => void>`. If cleanup fires before the Promise resolves, `unlisten` is still `undefined`, so cleanup does nothing. The second mount adds a second listener. Both fire on every drop.

- [ ] **Step 1: Write the failing test that proves double-fire**

In `src/components/ShelfPanel.test.tsx`, add to the existing test suite (after the existing mocks):

```typescript
it('registers the drag-drop listener exactly once', async () => {
  const mockOnDragDropEvent = vi.fn(() => Promise.resolve(() => undefined))
  vi.mocked(getCurrentWindow).mockReturnValue({
    onDragDropEvent: mockOnDragDropEvent,
  } as ReturnType<typeof getCurrentWindow>)

  render(<ShelfPanel />)
  await act(async () => { await new Promise(r => setTimeout(r, 10)) })

  // In Strict Mode dev, useEffect runs twice. Without the fix, this is 2.
  // With the fix, the second invocation immediately cancels itself.
  // The listener count is still 2 calls but only 1 is active. We verify
  // that a drop only adds files once:
  mockInvoke.mockResolvedValue([{ name: 'test.png', size: 100 }])
  await act(async () => {
    await capturedCallback?.({ payload: { type: 'drop', paths: ['C:\\test.png'] } })
  })
  expect(screen.queryAllByText('test.png')).toHaveLength(1)
})
```

- [ ] **Step 2: Run test, confirm it currently fails (shows length 2)**

```bash
npm test -- --run
```

Expected: test fails — `queryAllByText('test.png')` returns 2 elements.

- [ ] **Step 3: Fix the listener in `ShelfPanel.tsx`**

Replace the `useEffect` block:

```typescript
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
        const paths = (event.payload as { type: 'drop'; paths: string[] }).paths ?? []
        console.log('[VanishBox] Native drop event fired:', paths)
        if (paths.length > 0) {
          const infos = await invoke<DroppedFile[]>('get_file_infos', { paths })
          setFiles((prev) => [...prev, ...infos])
        }
      }
    })
    .then((fn) => {
      if (cancelled) {
        fn() // already cleaned up, immediately unlisten
      } else {
        unlisten = fn
      }
    })

  return () => {
    cancelled = true
    unlisten?.()
  }
}, [])
```

- [ ] **Step 4: Run tests, confirm pass**

```bash
npm test -- --run
```

Expected: all tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/components/ShelfPanel.tsx src/components/ShelfPanel.test.tsx
git commit -m "fix: prevent duplicate drag-drop listener in React Strict Mode"
```

---

### Task 2: Introduce `useShelfStore` — central persisted state

**Files:**
- Create: `src/store/useShelfStore.ts`
- Test: `src/store/useShelfStore.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/useShelfStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useShelfStore } from './useShelfStore'

// Reset store between tests
beforeEach(() => {
  useShelfStore.getState().reset()
  useShelfStore.setState({
    files: [],
    notepad: '',
    settings: {
      showSize: true,
      showTimestamp: true,
      showCountdown: true,
      theme: 'light',
      keybind: 'ctrl+shift+v',
      resetConfig: { type: 'daily', time: '00:00' },
    },
  })
})

describe('useShelfStore', () => {
  it('starts with no files', () => {
    const { result } = renderHook(() => useShelfStore())
    expect(result.current.files).toEqual([])
  })

  it('addFiles appends to the list', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.addFiles([
        { id: '1', name: 'a.png', size: 100, path: 'C:\\a.png', addedAt: 1000 },
      ])
    })
    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].name).toBe('a.png')
  })

  it('removeFile removes by id', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.addFiles([
        { id: '1', name: 'a.png', size: 100, path: 'C:\\a.png', addedAt: 1000 },
        { id: '2', name: 'b.png', size: 200, path: 'C:\\b.png', addedAt: 2000 },
      ])
    })
    act(() => {
      result.current.removeFile('1')
    })
    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].id).toBe('2')
  })

  it('reset clears files and notepad', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.addFiles([
        { id: '1', name: 'a.png', size: 100, path: 'C:\\a.png', addedAt: 1000 },
      ])
      result.current.setNotepad('hello')
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.files).toEqual([])
    expect(result.current.notepad).toBe('')
  })

  it('updateSettings merges partial settings', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.updateSettings({ showSize: false })
    })
    expect(result.current.settings.showSize).toBe(false)
    expect(result.current.settings.showTimestamp).toBe(true) // unchanged
  })
})
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm test -- --run
```

Expected: `Cannot find module './useShelfStore'`

- [ ] **Step 3: Create `src/store/useShelfStore.ts`**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ShelfFile {
  id: string
  name: string
  size: number
  path: string
  addedAt: number // Date.now() ms
}

export type Theme = 'light' | 'dark'

export type ResetConfig =
  | { type: 'daily'; time: string } // "HH:MM" e.g. "00:00"
  | { type: 'interval'; minutes: number }

export interface Settings {
  showSize: boolean
  showTimestamp: boolean
  showCountdown: boolean
  theme: Theme
  keybind: string
  resetConfig: ResetConfig
}

interface ShelfStore {
  files: ShelfFile[]
  notepad: string
  settings: Settings
  addFiles: (files: ShelfFile[]) => void
  removeFile: (id: string) => void
  setNotepad: (text: string) => void
  updateSettings: (s: Partial<Settings>) => void
  reset: () => void
}

const defaultSettings: Settings = {
  showSize: true,
  showTimestamp: true,
  showCountdown: true,
  theme: 'light',
  keybind: 'ctrl+shift+v',
  resetConfig: { type: 'daily', time: '00:00' },
}

export const useShelfStore = create<ShelfStore>()(
  persist(
    (set) => ({
      files: [],
      notepad: '',
      settings: defaultSettings,
      addFiles: (files) => set((state) => ({ files: [...state.files, ...files] })),
      removeFile: (id) =>
        set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
      setNotepad: (text) => set({ notepad: text }),
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      reset: () => set({ files: [], notepad: '' }),
    }),
    { name: 'vanish-box-shelf' }
  )
)
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/useShelfStore.ts src/store/useShelfStore.test.ts
git commit -m "feat: add useShelfStore with persisted files, notepad, settings"
```

---

### Task 3: Migrate `ShelfPanel` to use the store + add file ID and path

**Files:**
- Modify: `src/components/ShelfPanel.tsx`
- Modify: `src/components/ShelfPanel.test.tsx`
- Modify: `src-tauri/src/commands.rs`

The `get_file_infos` Rust command needs to also return `path`. The frontend needs to generate UUIDs (`crypto.randomUUID()`).

- [ ] **Step 1: Update `commands.rs` to include path in response**

```rust
use serde::Serialize;

#[derive(Serialize)]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub path: String,
}

#[tauri::command]
pub fn get_file_infos(paths: Vec<String>) -> Vec<FileInfo> {
    paths
        .iter()
        .filter_map(|path| {
            let p = std::path::Path::new(path);
            let name = p.file_name()?.to_string_lossy().to_string();
            let size = std::fs::metadata(p).map(|m| m.len()).unwrap_or(0);
            Some(FileInfo {
                name,
                size,
                path: path.clone(),
            })
        })
        .collect()
}
```

- [ ] **Step 2: Rewrite `ShelfPanel.tsx` to use the store**

Full replacement of the component body (keep imports at top, keep `formatSize`):

```typescript
import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useShelfStore, ShelfFile } from '../store/useShelfStore'

interface RawFileInfo {
  name: string
  size: number
  path: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ShelfPanel() {
  const { files, addFiles } = useShelfStore()
  const [isDraggingOver, setIsDraggingOver] = useState(false)

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
          const paths = (event.payload as { type: 'drop'; paths: string[] }).paths ?? []
          console.log('[VanishBox] Native drop event fired:', paths)
          if (paths.length > 0) {
            const raw = await invoke<RawFileInfo[]>('get_file_infos', { paths })
            const newFiles: ShelfFile[] = raw.map((r) => ({
              id: crypto.randomUUID(),
              name: r.name,
              size: r.size,
              path: r.path,
              addedAt: Date.now(),
            }))
            addFiles(newFiles)
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
  }, [addFiles])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'system-ui, sans-serif',
        background: isDraggingOver ? '#eef2ff' : '#ffffff',
        transition: 'background 0.15s',
      }}
    >
      <header
        data-tauri-drag-region
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '14px',
          flexShrink: 0,
          textAlign: 'center',
          cursor: 'grab',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        Vanish Box
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {files.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDraggingOver ? '#6366f1' : '#9ca3af',
              fontSize: '13px',
              border: isDraggingOver ? '2px dashed #6366f1' : '2px dashed transparent',
              margin: '12px',
              borderRadius: '8px',
              transition: 'all 0.15s',
            }}
          >
            Drop files here
          </div>
        ) : (
          <ul
            style={{
              flex: 1,
              overflowY: 'auto',
              margin: 0,
              padding: '8px',
              listStyle: 'none',
            }}
          >
            {files.map((file) => (
              <li
                key={file.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  marginBottom: '4px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: '8px',
                    color: '#111827',
                  }}
                >
                  {file.name}
                </span>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}>
                  {formatSize(file.size)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Update `ShelfPanel.test.tsx` mocks to return path**

In the existing mock, `mockInvoke.mockResolvedValue` currently returns `{ name, size }`. Update all `mockResolvedValue` calls in the test file to include `path`:

```typescript
mockInvoke.mockResolvedValue([
  { name: 'photo.png', size: 204800, path: 'C:\\Users\\test\\photo.png' },
  { name: 'report.pdf', size: 1048576, path: 'C:\\Users\\test\\report.pdf' },
])
```

And the single-file tests:
```typescript
mockInvoke.mockResolvedValue([{ name: 'image.jpg', size: 512, path: 'C:\\image.jpg' }])
```

Also add a reset of the store before each test in `ShelfPanel.test.tsx`:
```typescript
import { useShelfStore } from '../store/useShelfStore'

beforeEach(() => {
  capturedCallback = null
  mockInvoke.mockReset()
  useShelfStore.getState().reset()
})
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ShelfPanel.tsx src/components/ShelfPanel.test.tsx src-tauri/src/commands.rs
git commit -m "feat: migrate ShelfPanel to useShelfStore, add file id/path/addedAt"
```

---

### Task 4: Extract `FileItem` component with remove button

**Files:**
- Create: `src/components/FileItem.tsx`
- Create: `src/components/FileItem.test.tsx`
- Modify: `src/components/ShelfPanel.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/FileItem.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileItem } from './FileItem'

const baseFile = {
  id: 'test-id',
  name: 'photo.png',
  size: 204800,
  path: 'C:\\Users\\test\\photo.png',
  addedAt: new Date('2026-04-04T10:00:00').getTime(),
}

const baseSettings = {
  showSize: true,
  showTimestamp: true,
  showCountdown: true,
  theme: 'light' as const,
  keybind: 'ctrl+shift+v',
  resetConfig: { type: 'daily' as const, time: '00:00' },
}

describe('FileItem', () => {
  it('renders file name', () => {
    render(
      <FileItem file={baseFile} settings={baseSettings} onRemove={vi.fn()} onOpen={vi.fn()} />
    )
    expect(screen.getByText('photo.png')).toBeTruthy()
  })

  it('shows size when showSize is true', () => {
    render(
      <FileItem file={baseFile} settings={baseSettings} onRemove={vi.fn()} onOpen={vi.fn()} />
    )
    expect(screen.getByText('200.0 KB')).toBeTruthy()
  })

  it('hides size when showSize is false', () => {
    render(
      <FileItem
        file={baseFile}
        settings={{ ...baseSettings, showSize: false }}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
      />
    )
    expect(screen.queryByText('200.0 KB')).toBeNull()
  })

  it('calls onRemove with file id when remove button clicked', () => {
    const onRemove = vi.fn()
    render(
      <FileItem file={baseFile} settings={baseSettings} onRemove={onRemove} onOpen={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onRemove).toHaveBeenCalledWith('test-id')
  })

  it('calls onOpen with file path when name clicked', () => {
    const onOpen = vi.fn()
    render(
      <FileItem file={baseFile} settings={baseSettings} onRemove={vi.fn()} onOpen={onOpen} />
    )
    fireEvent.click(screen.getByText('photo.png'))
    expect(onOpen).toHaveBeenCalledWith('C:\\Users\\test\\photo.png')
  })

  it('shows timestamp when showTimestamp is true', () => {
    render(
      <FileItem file={baseFile} settings={baseSettings} onRemove={vi.fn()} onOpen={vi.fn()} />
    )
    // Should show some time text - format is HH:MM
    expect(screen.getByTestId('file-timestamp')).toBeTruthy()
  })

  it('hides timestamp when showTimestamp is false', () => {
    render(
      <FileItem
        file={baseFile}
        settings={{ ...baseSettings, showTimestamp: false }}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
      />
    )
    expect(screen.queryByTestId('file-timestamp')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm test -- --run
```

Expected: `Cannot find module './FileItem'`

- [ ] **Step 3: Create `src/components/FileItem.tsx`**

```typescript
import { ShelfFile, Settings } from '../store/useShelfStore'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface FileItemProps {
  file: ShelfFile
  settings: Settings
  onRemove: (id: string) => void
  onOpen: (path: string) => void
}

export function FileItem({ file, settings, onRemove, onOpen }: FileItemProps) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 10px',
        marginBottom: '4px',
        background: '#f9fafb',
        borderRadius: '6px',
        fontSize: '12px',
      }}
    >
      {/* File name — clickable to open */}
      <span
        onClick={() => onOpen(file.path)}
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#111827',
          cursor: 'pointer',
        }}
        title={file.path}
      >
        {file.name}
      </span>

      {/* Timestamp */}
      {settings.showTimestamp && (
        <span
          data-testid="file-timestamp"
          style={{ color: '#9ca3af', flexShrink: 0, fontSize: '11px' }}
        >
          {formatTime(file.addedAt)}
        </span>
      )}

      {/* Size */}
      {settings.showSize && (
        <span style={{ color: '#9ca3af', flexShrink: 0 }}>
          {formatSize(file.size)}
        </span>
      )}

      {/* Remove button */}
      <button
        aria-label="remove"
        onClick={() => onRemove(file.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#d1d5db',
          fontSize: '14px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </li>
  )
}
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Wire `FileItem` into `ShelfPanel`**

In `ShelfPanel.tsx`, add `open_file` invoke and use `FileItem`. Replace the `<ul>` block:

```typescript
import { FileItem } from './FileItem'

// Inside the component, add:
const { files, addFiles, removeFile, settings } = useShelfStore()

async function handleOpen(path: string) {
  await invoke('open_file', { path })
}

// Replace the <ul>...</ul> block with:
<ul
  style={{
    flex: 1,
    overflowY: 'auto',
    margin: 0,
    padding: '8px',
    listStyle: 'none',
  }}
>
  {files.map((file) => (
    <FileItem
      key={file.id}
      file={file}
      settings={settings}
      onRemove={removeFile}
      onOpen={handleOpen}
    />
  ))}
</ul>
```

- [ ] **Step 6: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/FileItem.tsx src/components/FileItem.test.tsx src/components/ShelfPanel.tsx
git commit -m "feat: extract FileItem with remove button, timestamps, open-on-click"
```

---

### Task 5: Add `open_file` Rust command

**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Add `open_file` command to `commands.rs`**

```rust
use serde::Serialize;

#[derive(Serialize)]
pub struct FileInfo {
    pub name: String,
    pub size: u64,
    pub path: String,
}

#[tauri::command]
pub fn get_file_infos(paths: Vec<String>) -> Vec<FileInfo> {
    paths
        .iter()
        .filter_map(|path| {
            let p = std::path::Path::new(path);
            let name = p.file_name()?.to_string_lossy().to_string();
            let size = std::fs::metadata(p).map(|m| m.len()).unwrap_or(0);
            Some(FileInfo {
                name,
                size,
                path: path.clone(),
            })
        })
        .collect()
}

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
```

- [ ] **Step 2: Register `open_file` in `main.rs`**

```rust
.invoke_handler(tauri::generate_handler![
    commands::get_file_infos,
    commands::open_file,
])
```

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/main.rs
git commit -m "feat: add open_file Rust command for default app launch"
```

---

### Task 6: Add display settings toggles to the UI

**Files:**
- Create: `src/components/SettingsRow.tsx`
- Modify: `src/components/ShelfPanel.tsx`

This is a minimal inline settings strip at the bottom. Full `SettingsPanel` comes in Phase 2.

- [ ] **Step 1: Create `src/components/SettingsRow.tsx`**

```typescript
import { Settings } from '../store/useShelfStore'

interface SettingsRowProps {
  settings: Settings
  onUpdate: (s: Partial<Settings>) => void
}

export function SettingsRow({ settings, onUpdate }: SettingsRowProps) {
  return (
    <footer
      style={{
        display: 'flex',
        gap: '8px',
        padding: '6px 10px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '11px',
        color: '#9ca3af',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings.showSize}
          onChange={(e) => onUpdate({ showSize: e.target.checked })}
        />
        size
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings.showTimestamp}
          onChange={(e) => onUpdate({ showTimestamp: e.target.checked })}
        />
        time
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings.showCountdown}
          onChange={(e) => onUpdate({ showCountdown: e.target.checked })}
        />
        timer
      </label>
    </footer>
  )
}
```

- [ ] **Step 2: Add `SettingsRow` to `ShelfPanel.tsx`**

Add after `</main>` and before the closing `</div>`:

```typescript
import { SettingsRow } from './SettingsRow'

// Inside ShelfPanel, destructure updateSettings from store:
const { files, addFiles, removeFile, settings, updateSettings } = useShelfStore()

// Add after </main>:
<SettingsRow settings={settings} onUpdate={updateSettings} />
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass (new component has no tests needed yet — it's pure UI with no logic).

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsRow.tsx src/components/ShelfPanel.tsx
git commit -m "feat: add display settings row for size/timestamp/countdown visibility"
```

---

## Phase 2: Dark/Light Mode + Settings UI + Persist

---

### Task 7: Add `useTheme` hook and dark mode application

**Files:**
- Create: `src/hooks/useTheme.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/ShelfPanel.tsx`

Theme is stored in `useShelfStore.settings.theme` (already persisted). This hook just reads from the store.

- [ ] **Step 1: Create `src/hooks/useTheme.ts`**

```typescript
import { useShelfStore, Theme } from '../store/useShelfStore'

export const COLORS = {
  light: {
    bg: '#ffffff',
    bgHover: '#eef2ff',
    bgItem: '#f9fafb',
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#9ca3af',
    accent: '#6366f1',
    headerBg: '#ffffff',
  },
  dark: {
    bg: '#1a1a2e',
    bgHover: '#16213e',
    bgItem: '#0f3460',
    border: '#2d2d4e',
    text: '#e2e8f0',
    textMuted: '#718096',
    accent: '#818cf8',
    headerBg: '#16213e',
  },
} satisfies Record<Theme, Record<string, string>>

export function useTheme() {
  const theme = useShelfStore((s) => s.settings.theme)
  const updateSettings = useShelfStore((s) => s.updateSettings)

  function toggleTheme() {
    updateSettings({ theme: theme === 'light' ? 'dark' : 'light' })
  }

  return { theme, colors: COLORS[theme], toggleTheme }
}
```

- [ ] **Step 2: Apply theme in `ShelfPanel.tsx`**

Add the import and replace hardcoded color values:

```typescript
import { useTheme } from '../hooks/useTheme'

// Inside ShelfPanel():
const { colors, theme, toggleTheme } = useTheme()

// Update root div background:
background: isDraggingOver ? colors.bgHover : colors.bg,

// Update header:
background: colors.headerBg,
borderBottom: `1px solid ${colors.border}`,
color: colors.text,

// Update drop zone text:
color: isDraggingOver ? colors.accent : colors.textMuted,
border: isDraggingOver ? `2px dashed ${colors.accent}` : '2px dashed transparent',

// Add theme toggle button inside header (alongside title):
```

Replace the header content with:
```typescript
<header
  data-tauri-drag-region
  style={{
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: '14px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    background: colors.headerBg,
    color: colors.text,
    cursor: 'grab',
    WebkitAppRegion: 'drag',
  } as React.CSSProperties}
>
  Vanish Box
  <button
    onClick={toggleTheme}
    aria-label="toggle theme"
    style={{
      position: 'absolute',
      right: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      color: colors.textMuted,
      WebkitAppRegion: 'no-drag',
    } as React.CSSProperties}
  >
    {theme === 'light' ? '🌙' : '☀️'}
  </button>
</header>
```

- [ ] **Step 3: Update `FileItem.tsx` to accept colors**

Add `colors` prop to `FileItemProps`:

```typescript
import { COLORS } from '../hooks/useTheme'

interface FileItemProps {
  file: ShelfFile
  settings: Settings
  colors: typeof COLORS['light']
  onRemove: (id: string) => void
  onOpen: (path: string) => void
}
```

Update background and text colors in `FileItem` to use `colors.bgItem`, `colors.text`, `colors.textMuted`.

Pass `colors` from `ShelfPanel` to `FileItem`:
```typescript
<FileItem
  key={file.id}
  file={file}
  settings={settings}
  colors={colors}
  onRemove={removeFile}
  onOpen={handleOpen}
/>
```

- [ ] **Step 4: Update `SettingsRow.tsx` to accept colors**

Add `colors` prop, apply to background and text:
```typescript
import { COLORS } from '../hooks/useTheme'
interface SettingsRowProps {
  settings: Settings
  colors: typeof COLORS['light']
  onUpdate: (s: Partial<Settings>) => void
}
```

Pass `colors` from `ShelfPanel`.

- [ ] **Step 5: Update `FileItem.test.tsx` to pass colors**

Import `COLORS` and add to all `FileItem` render calls:
```typescript
import { COLORS } from '../hooks/useTheme'
// In each render:
<FileItem file={baseFile} settings={baseSettings} colors={COLORS.light} onRemove={...} onOpen={...} />
```

- [ ] **Step 6: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useTheme.ts src/components/ShelfPanel.tsx src/components/FileItem.tsx src/components/FileItem.test.tsx src/components/SettingsRow.tsx
git commit -m "feat: add dark/light theme toggle persisted in store"
```

---

### Task 8: Expand SettingsRow into a full SettingsPanel

**Files:**
- Create: `src/components/SettingsPanel.tsx`
- Modify: `src/components/ShelfPanel.tsx`
- Delete approach: keep `SettingsRow` but replace with `SettingsPanel`

The panel slides open from a gear icon. Contains: display toggles (size, timestamp, countdown), theme toggle (already in header), reset config (time/interval), keybind display (editable in Phase 5).

- [ ] **Step 1: Create `src/components/SettingsPanel.tsx`**

```typescript
import { Settings, ResetConfig } from '../store/useShelfStore'
import { COLORS } from '../hooks/useTheme'

interface SettingsPanelProps {
  settings: Settings
  colors: typeof COLORS['light']
  onUpdate: (s: Partial<Settings>) => void
}

export function SettingsPanel({ settings, colors, onUpdate }: SettingsPanelProps) {
  function updateResetConfig(rc: ResetConfig) {
    onUpdate({ resetConfig: rc })
  }

  return (
    <div
      style={{
        borderTop: `1px solid ${colors.border}`,
        padding: '10px 12px',
        fontSize: '12px',
        color: colors.textMuted,
        background: colors.bg,
        flexShrink: 0,
      }}
    >
      {/* Display toggles */}
      <div style={{ marginBottom: '8px', fontWeight: 600, color: colors.text }}>Display</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.showSize}
            onChange={(e) => onUpdate({ showSize: e.target.checked })}
          />
          Show file size
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.showTimestamp}
            onChange={(e) => onUpdate({ showTimestamp: e.target.checked })}
          />
          Show added time
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={settings.showCountdown}
            onChange={(e) => onUpdate({ showCountdown: e.target.checked })}
          />
          Show reset timer
        </label>
      </div>

      {/* Reset config */}
      <div style={{ marginBottom: '8px', fontWeight: 600, color: colors.text }}>Auto-reset</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="radio"
            name="reset-type"
            checked={settings.resetConfig.type === 'daily'}
            onChange={() => updateResetConfig({ type: 'daily', time: '00:00' })}
          />
          {' '}Daily at
        </label>
        <label style={{ cursor: 'pointer' }}>
          <input
            type="radio"
            name="reset-type"
            checked={settings.resetConfig.type === 'interval'}
            onChange={() => updateResetConfig({ type: 'interval', minutes: 60 })}
          />
          {' '}Every
        </label>
      </div>
      {settings.resetConfig.type === 'daily' && (
        <input
          type="time"
          value={settings.resetConfig.time}
          onChange={(e) => updateResetConfig({ type: 'daily', time: e.target.value })}
          style={{
            fontSize: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            padding: '2px 4px',
            background: colors.bgItem,
            color: colors.text,
          }}
        />
      )}
      {settings.resetConfig.type === 'interval' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="number"
            min={1}
            value={settings.resetConfig.minutes}
            onChange={(e) =>
              updateResetConfig({ type: 'interval', minutes: Number(e.target.value) })
            }
            style={{
              width: '60px',
              fontSize: '12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              padding: '2px 4px',
              background: colors.bgItem,
              color: colors.text,
            }}
          />
          minutes
        </div>
      )}

      {/* Keybind — display only for now (Phase 5 makes it editable) */}
      <div style={{ marginTop: '12px', marginBottom: '4px', fontWeight: 600, color: colors.text }}>
        Shortcut
      </div>
      <div style={{ color: colors.textMuted }}>{settings.keybind}</div>
    </div>
  )
}
```

- [ ] **Step 2: Add settings toggle button and wire into `ShelfPanel.tsx`**

Add `showSettings` state and gear button. Replace `SettingsRow` import with `SettingsPanel`:

```typescript
import { SettingsPanel } from './SettingsPanel'
// Remove import of SettingsRow

// Add state:
const [showSettings, setShowSettings] = useState(false)

// Add gear button in header (left side, position absolute):
<button
  onClick={() => setShowSettings(s => !s)}
  aria-label="settings"
  style={{
    position: 'absolute',
    left: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: colors.textMuted,
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties}
>
  ⚙
</button>

// Replace <SettingsRow .../> with:
{showSettings && (
  <SettingsPanel
    settings={settings}
    colors={colors}
    onUpdate={updateSettings}
  />
)}
```

- [ ] **Step 3: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/ShelfPanel.tsx
git commit -m "feat: add full SettingsPanel with display toggles and reset config UI"
```

---

## Phase 3: Reset Scheduler + Countdown + Notepad

---

### Task 9: Add `useReset` hook with countdown

**Files:**
- Create: `src/hooks/useReset.ts`
- Create: `src/hooks/useReset.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/useReset.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { computeNextReset, formatCountdown } from './useReset'

describe('computeNextReset', () => {
  it('daily: returns next occurrence of given time today if not passed', () => {
    // Fake now = 2026-04-04 10:00:00
    const now = new Date('2026-04-04T10:00:00').getTime()
    const result = computeNextReset({ type: 'daily', time: '23:00' }, now)
    const expected = new Date('2026-04-04T23:00:00').getTime()
    expect(result).toBe(expected)
  })

  it('daily: advances to next day if reset time already passed today', () => {
    const now = new Date('2026-04-04T23:30:00').getTime()
    const result = computeNextReset({ type: 'daily', time: '23:00' }, now)
    const expected = new Date('2026-04-05T23:00:00').getTime()
    expect(result).toBe(expected)
  })

  it('interval: returns now + minutes in ms', () => {
    const now = 1000000
    const result = computeNextReset({ type: 'interval', minutes: 60 }, now)
    expect(result).toBe(now + 60 * 60 * 1000)
  })
})

describe('formatCountdown', () => {
  it('shows hours and minutes when >= 1 hour', () => {
    expect(formatCountdown(7200)).toBe('2h 0m')
    expect(formatCountdown(3661)).toBe('1h 1m')
  })

  it('shows minutes when >= 1 minute and < 1 hour', () => {
    expect(formatCountdown(3599)).toBe('59m')
    expect(formatCountdown(90)).toBe('1m')
  })

  it('shows seconds when < 1 minute', () => {
    expect(formatCountdown(59)).toBe('59s')
    expect(formatCountdown(1)).toBe('1s')
    expect(formatCountdown(0)).toBe('0s')
  })
})
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm test -- --run
```

Expected: `Cannot find module './useReset'`

- [ ] **Step 3: Create `src/hooks/useReset.ts`**

```typescript
import { useState, useEffect, useRef } from 'react'
import { useShelfStore, ResetConfig } from '../store/useShelfStore'

export function computeNextReset(config: ResetConfig, now: number): number {
  if (config.type === 'interval') {
    return now + config.minutes * 60 * 1000
  }
  // daily
  const [hours, minutes] = config.time.split(':').map(Number)
  const target = new Date(now)
  target.setHours(hours, minutes, 0, 0)
  if (target.getTime() <= now) {
    target.setDate(target.getDate() + 1)
  }
  return target.getTime()
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    return `${h}h ${m}m`
  }
  if (totalSeconds >= 60) {
    const m = Math.floor(totalSeconds / 60)
    return `${m}m`
  }
  return `${Math.max(0, totalSeconds)}s`
}

export function useReset() {
  const { settings, reset } = useShelfStore()
  const [nextReset, setNextReset] = useState<number>(() =>
    computeNextReset(settings.resetConfig, Date.now())
  )
  const [secondsLeft, setSecondsLeft] = useState<number>(
    Math.max(0, Math.floor((nextReset - Date.now()) / 1000))
  )
  const nextResetRef = useRef(nextReset)
  nextResetRef.current = nextReset

  // Recompute next reset when resetConfig changes
  useEffect(() => {
    const next = computeNextReset(settings.resetConfig, Date.now())
    setNextReset(next)
  }, [settings.resetConfig])

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.floor((nextResetRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        reset()
        const next = computeNextReset(settings.resetConfig, Date.now())
        setNextReset(next)
        setSecondsLeft(Math.floor((next - Date.now()) / 1000))
      } else {
        setSecondsLeft(remaining)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [reset, settings.resetConfig])

  return { secondsLeft, formatted: formatCountdown(secondsLeft) }
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useReset.ts src/hooks/useReset.test.ts
git commit -m "feat: add useReset hook with configurable daily/interval schedule and countdown"
```

---

### Task 10: Add `CountdownTimer` and `Notepad` components

**Files:**
- Create: `src/components/CountdownTimer.tsx`
- Create: `src/components/Notepad.tsx`
- Modify: `src/components/ShelfPanel.tsx`

- [ ] **Step 1: Create `src/components/CountdownTimer.tsx`**

```typescript
import { useReset } from '../hooks/useReset'
import { COLORS } from '../hooks/useTheme'

interface CountdownTimerProps {
  colors: typeof COLORS['light']
}

export function CountdownTimer({ colors }: CountdownTimerProps) {
  const { formatted } = useReset()

  return (
    <div
      style={{
        padding: '4px 12px',
        fontSize: '11px',
        color: colors.textMuted,
        textAlign: 'right',
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}
    >
      Resets in {formatted}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/Notepad.tsx`**

```typescript
import { useShelfStore } from '../store/useShelfStore'
import { COLORS } from '../hooks/useTheme'

interface NotepadProps {
  colors: typeof COLORS['light']
}

export function Notepad({ colors }: NotepadProps) {
  const { notepad, setNotepad } = useShelfStore()

  return (
    <div
      style={{
        borderTop: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}
    >
      <textarea
        value={notepad}
        onChange={(e) => setNotepad(e.target.value)}
        placeholder="Quick notes…"
        style={{
          width: '100%',
          height: '80px',
          resize: 'none',
          border: 'none',
          outline: 'none',
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          background: colors.bg,
          color: colors.text,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Wire both into `ShelfPanel.tsx`**

Add imports at top:
```typescript
import { CountdownTimer } from './CountdownTimer'
import { Notepad } from './Notepad'
```

After `</header>`, add countdown conditionally:
```typescript
{settings.showCountdown && <CountdownTimer colors={colors} />}
```

After `</main>` (before settings panel):
```typescript
<Notepad colors={colors} />
```

Keep `{showSettings && <SettingsPanel .../>}` last.

- [ ] **Step 4: Run tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/CountdownTimer.tsx src/components/Notepad.tsx src/components/ShelfPanel.tsx
git commit -m "feat: add countdown timer and notepad, both wired to reset system"
```

---

## Phase 4: Screenshot Capture

---

### Task 11: Add screenshot Rust infrastructure

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/screenshot.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/tauri.conf.json`

**Risk:** Highest risk item. `xcap` crate works on Windows/macOS/Linux but screen area selection requires a second Tauri window. If the overlay window approach causes issues, fallback is to use the OS built-in snipping tool and watch a temp folder.

- [ ] **Step 1: Add `xcap` to `Cargo.toml`**

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
xcap = "0.4"
```

- [ ] **Step 2: Add screenshot overlay window to `tauri.conf.json`**

Add a second window entry in the `windows` array:

```json
{
  "label": "screenshot-overlay",
  "title": "Screenshot",
  "width": 1920,
  "height": 1080,
  "decorations": false,
  "transparent": true,
  "alwaysOnTop": true,
  "visible": false,
  "resizable": false,
  "skipTaskbar": true,
  "fullscreen": true
}
```

The full `windows` array becomes:
```json
"windows": [
  {
    "title": "Vanish Box",
    "width": 360,
    "height": 520,
    "decorations": false,
    "resizable": false,
    "alwaysOnTop": true,
    "visible": false,
    "center": true,
    "skipTaskbar": true
  },
  {
    "label": "screenshot-overlay",
    "title": "Screenshot",
    "decorations": false,
    "transparent": true,
    "alwaysOnTop": true,
    "visible": false,
    "resizable": false,
    "skipTaskbar": true,
    "fullscreen": true
  }
]
```

- [ ] **Step 3: Create `src-tauri/src/screenshot.rs`**

```rust
use xcap::Monitor;

pub struct Region {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

pub fn capture_region(region: Region) -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;
    let monitor = monitors.into_iter().next().ok_or("No monitor found")?;

    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    // Crop to the selected region
    let cropped = image::imageops::crop_imm(
        &image,
        region.x.max(0) as u32,
        region.y.max(0) as u32,
        region.width,
        region.height,
    )
    .to_image();

    // Save to temp dir
    let path = std::env::temp_dir().join(format!(
        "vanishbox-screenshot-{}.png",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    ));

    cropped.save(&path).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}
```

- [ ] **Step 4: Add `image` crate dependency to `Cargo.toml`**

The `xcap` crate returns an `image::DynamicImage`. We need `image` for `imageops::crop_imm`.

```toml
xcap = "0.4"
image = "0.25"
```

- [ ] **Step 5: Add screenshot commands to `commands.rs`**

```rust
#[tauri::command]
pub fn begin_screenshot(app: tauri::AppHandle) -> Result<(), String> {
    // Hide main window
    if let Some(w) = app.get_webview_window("main") {
        w.hide().map_err(|e| e.to_string())?;
    }
    // Show overlay
    if let Some(overlay) = app.get_webview_window("screenshot-overlay") {
        overlay.show().map_err(|e| e.to_string())?;
        overlay.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn capture_screenshot(
    app: tauri::AppHandle,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<String, String> {
    // Capture the region
    let path = crate::screenshot::capture_region(crate::screenshot::Region { x, y, width, height })?;
    // Hide overlay
    if let Some(overlay) = app.get_webview_window("screenshot-overlay") {
        overlay.hide().map_err(|e| e.to_string())?;
    }
    // Show main window
    if let Some(w) = app.get_webview_window("main") {
        w.show().map_err(|e| e.to_string())?;
        w.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(path)
}

#[tauri::command]
pub fn cancel_screenshot(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("screenshot-overlay") {
        overlay.hide().map_err(|e| e.to_string())?;
    }
    if let Some(w) = app.get_webview_window("main") {
        w.show().map_err(|e| e.to_string())?;
        w.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
```

- [ ] **Step 6: Register screenshot module and commands in `main.rs`**

```rust
mod commands;
mod screenshot;
mod shortcut;
mod tray;
mod window;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::get_file_infos,
            commands::open_file,
            commands::begin_screenshot,
            commands::capture_screenshot,
            commands::cancel_screenshot,
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

- [ ] **Step 7: Run cargo check from Windows PowerShell to verify compile**

```powershell
cd C:\Users\victo\miniProjects\vanishBox
npm run tauri -- build --no-bundle 2>&1 | Select-String -Pattern "error"
```

Or for faster feedback: `cargo check` inside `src-tauri`:
```powershell
cd C:\Users\victo\miniProjects\vanishBox\src-tauri
cargo check
```

Expected: no errors. If `xcap` has compile errors on Windows, check its GitHub issues — some versions need Visual C++ build tools.

- [ ] **Step 8: Commit Rust changes**

```bash
git add src-tauri/src/screenshot.rs src-tauri/src/commands.rs src-tauri/src/main.rs src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "feat: add screenshot Rust infrastructure with xcap and overlay window"
```

---

### Task 12: Add screenshot overlay frontend

**Files:**
- Create: `src/components/ScreenshotOverlay.tsx`
- Create: `src/pages/ScreenshotPage.tsx` (or `src/ScreenshotApp.tsx`)
- Modify: `src/main.tsx` (conditionally render based on window label)
- Modify: `src/components/ShelfPanel.tsx` (add screenshot button)

- [ ] **Step 1: Create `src/ScreenshotOverlay.tsx`**

This is the UI rendered in the `screenshot-overlay` window. User drags to select area.

```typescript
import { useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Selection {
  startX: number
  startY: number
  endX: number
  endY: number
}

export function ScreenshotOverlay() {
  const [selecting, setSelecting] = useState(false)
  const [sel, setSel] = useState<Selection | null>(null)

  function getRect(s: Selection) {
    return {
      x: Math.min(s.startX, s.endX),
      y: Math.min(s.startY, s.endY),
      width: Math.abs(s.endX - s.startX),
      height: Math.abs(s.endY - s.startY),
    }
  }

  function handleMouseDown(e: React.MouseEvent) {
    setSelecting(true)
    setSel({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY })
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!selecting) return
    setSel((prev) => prev ? { ...prev, endX: e.clientX, endY: e.clientY } : null)
  }

  async function handleMouseUp() {
    setSelecting(false)
    if (!sel) return
    const { x, y, width, height } = getRect(sel)
    if (width < 5 || height < 5) {
      await invoke('cancel_screenshot')
      return
    }
    await invoke('capture_screenshot', { x, y, width, height })
    setSel(null)
  }

  async function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      await invoke('cancel_screenshot')
      setSel(null)
    }
  }

  const rect = sel ? getRect(sel) : null

  return (
    <div
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        cursor: 'crosshair',
        background: 'rgba(0,0,0,0.3)',
        userSelect: 'none',
      }}
    >
      {rect && rect.width > 0 && (
        <div
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            border: '2px solid #6366f1',
            background: 'rgba(99,102,241,0.1)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          pointerEvents: 'none',
        }}
      >
        Drag to select area · Esc to cancel
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/main.tsx` to route by window label**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ScreenshotOverlay } from './ScreenshotOverlay'
import './App.css'
import { getCurrentWindow } from '@tauri-apps/api/window'

const win = getCurrentWindow()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {win.label === 'screenshot-overlay' ? <ScreenshotOverlay /> : <App />}
  </React.StrictMode>
)
```

- [ ] **Step 3: Add screenshot button to `ShelfPanel.tsx` header**

Add a camera button in the header (alongside gear and theme toggle):

```typescript
async function handleScreenshot() {
  await invoke('begin_screenshot')
}

// Inside header, add after the gear button:
<button
  onClick={handleScreenshot}
  aria-label="screenshot"
  style={{
    position: 'absolute',
    left: '36px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    color: colors.textMuted,
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties}
>
  📷
</button>
```

- [ ] **Step 4: After capture, screenshot path is returned — add to file list**

The `capture_screenshot` command returns a path string. The overlay calls `invoke('capture_screenshot', ...)` which returns the path. But the overlay is in a different window — it cannot directly add to the main window's Zustand store (stores are per-window).

**Solution:** Use Tauri's event system. The overlay emits a `screenshot-captured` event, and the main window listens for it.

In `ScreenshotOverlay.tsx`, replace the capture invoke:
```typescript
import { emit } from '@tauri-apps/api/event'

async function handleMouseUp() {
  setSelecting(false)
  if (!sel) return
  const { x, y, width, height } = getRect(sel)
  if (width < 5 || height < 5) {
    await invoke('cancel_screenshot')
    return
  }
  const path = await invoke<string>('capture_screenshot', { x, y, width, height })
  await emit('screenshot-captured', { path })
  setSel(null)
}
```

In `ShelfPanel.tsx`, add a listener in `useEffect`:
```typescript
import { listen } from '@tauri-apps/api/event'

// In useEffect (separate from the drag-drop one):
useEffect(() => {
  let unlisten: (() => void) | undefined
  listen<{ path: string }>('screenshot-captured', async (event) => {
    const { path } = event.payload
    const raw = await invoke<RawFileInfo[]>('get_file_infos', { paths: [path] })
    const newFiles: ShelfFile[] = raw.map((r) => ({
      id: crypto.randomUUID(),
      name: r.name,
      size: r.size,
      path: r.path,
      addedAt: Date.now(),
    }))
    addFiles(newFiles)
  }).then(fn => { unlisten = fn })
  return () => { unlisten?.() }
}, [addFiles])
```

- [ ] **Step 5: Run tests**

```bash
npm test -- --run
```

Expected: all existing tests pass (ScreenshotOverlay has no unit tests — it's pure interaction UI; tested manually).

- [ ] **Step 6: Manual test**

1. Run `npm run tauri dev` from Windows PowerShell
2. Press Ctrl+Shift+V to open panel
3. Click the 📷 button
4. Panel hides, transparent dark overlay appears
5. Drag a rectangle over part of the screen
6. Release — overlay hides, panel reappears, screenshot PNG appears in the file list

- [ ] **Step 7: Commit**

```bash
git add src/ScreenshotOverlay.tsx src/main.tsx src/components/ShelfPanel.tsx
git commit -m "feat: screenshot capture flow with overlay window and event bridge"
```

---

## Phase 5: Configurable Global Shortcut

---

### Task 13: Make global shortcut updatable at runtime

**Files:**
- Modify: `src-tauri/src/shortcut.rs`
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/components/SettingsPanel.tsx`

**Risk:** `tauri-plugin-global-shortcut` stores shortcuts by value. To replace the shortcut, we must unregister all shortcuts then register the new one. There is a brief window (milliseconds) with no active shortcut.

- [ ] **Step 1: Refactor `shortcut.rs` to expose a `register_shortcut` fn**

```rust
use tauri::App;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use std::str::FromStr;

pub fn parse_shortcut(keys: &str) -> Result<Shortcut, String> {
    Shortcut::from_str(keys).map_err(|e| format!("Invalid shortcut '{}': {}", keys, e))
}

pub fn setup_shortcut(app: &mut App) -> tauri::Result<()> {
    let shortcut = parse_shortcut("ctrl+shift+v")
        .map_err(|e| tauri::Error::Anyhow(anyhow::anyhow!(e)))?;

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

- [ ] **Step 2: Add `update_shortcut` command to `commands.rs`**

```rust
#[tauri::command]
pub fn update_shortcut(app: tauri::AppHandle, keys: String) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    let new_shortcut = crate::shortcut::parse_shortcut(&keys)?;

    // Unregister all existing shortcuts
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())?;

    // Register the new one
    app.global_shortcut()
        .on_shortcut(new_shortcut, move |app_handle, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                crate::window::toggle_panel(app_handle);
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}
```

- [ ] **Step 3: Register `update_shortcut` in `main.rs`**

```rust
.invoke_handler(tauri::generate_handler![
    commands::get_file_infos,
    commands::open_file,
    commands::begin_screenshot,
    commands::capture_screenshot,
    commands::cancel_screenshot,
    commands::update_shortcut,
])
```

- [ ] **Step 4: Make `SettingsPanel` keybind input editable**

Replace the read-only keybind display in `SettingsPanel.tsx` with:

```typescript
import { invoke } from '@tauri-apps/api/core'

// Inside SettingsPanel, replace the keybind display section:
<div style={{ marginTop: '12px', marginBottom: '4px', fontWeight: 600, color: colors.text }}>
  Shortcut
</div>
<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
  <input
    type="text"
    value={settings.keybind}
    onChange={(e) => onUpdate({ keybind: e.target.value })}
    style={{
      flex: 1,
      fontSize: '12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '4px',
      padding: '4px 6px',
      background: colors.bgItem,
      color: colors.text,
    }}
  />
  <button
    onClick={async () => {
      try {
        await invoke('update_shortcut', { keys: settings.keybind })
      } catch (e) {
        console.error('Failed to update shortcut:', e)
      }
    }}
    style={{
      fontSize: '11px',
      padding: '4px 8px',
      background: colors.accent,
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    }}
  >
    Apply
  </button>
</div>
<div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '3px' }}>
  Format: ctrl+shift+v
</div>
```

- [ ] **Step 5: Add `anyhow` to `Cargo.toml` if not already present (needed for error conversion in shortcut.rs)**

```toml
anyhow = "1"
```

- [ ] **Step 6: Run cargo check**

```powershell
cd C:\Users\victo\miniProjects\vanishBox\src-tauri
cargo check
```

Expected: no errors.

- [ ] **Step 7: Run frontend tests**

```bash
npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 8: Manual test**

1. Open settings panel (⚙ icon)
2. Change shortcut field to `ctrl+shift+b`
3. Click Apply
4. Close panel
5. Press Ctrl+Shift+B — panel should toggle
6. Old shortcut Ctrl+Shift+V should no longer work

- [ ] **Step 9: Commit**

```bash
git add src-tauri/src/shortcut.rs src-tauri/src/commands.rs src-tauri/src/main.rs src/components/SettingsPanel.tsx src-tauri/Cargo.toml
git commit -m "feat: configurable global shortcut with runtime update via settings"
```

---

## Self-Review

### Spec coverage check

| Requirement | Covered by |
|-------------|------------|
| Remove items | Task 4 (FileItem remove button) |
| Open files | Task 5 (open_file command) + Task 4 (click handler) |
| Light/dark mode | Task 7 (useTheme + toggle) |
| Persist mode | Task 2 (useShelfStore persist middleware) |
| Screenshot button | Task 12 |
| App hides on screenshot | Task 11 (begin_screenshot command) |
| User selects area | Task 12 (ScreenshotOverlay drag) |
| Captured screenshot added | Task 12 (emit + listen) |
| App reopens after capture | Task 11 (capture_screenshot shows main window) |
| Daily notepad | Task 10 (Notepad component) |
| Notepad clears on reset | Task 9 (useReset calls store.reset which clears notepad) |
| Countdown timer | Task 9 (useReset.formatted) + Task 10 (CountdownTimer) |
| Countdown < 1h shows minutes | Task 9 (formatCountdown) |
| Countdown < 1m shows seconds | Task 9 (formatCountdown) |
| Global reset at configurable time | Task 9 (useReset daily/interval) |
| Settings: daily time | Task 8 (SettingsPanel time input) |
| Settings: every X minutes | Task 8 (SettingsPanel interval input) |
| Full reset clears all | Task 2 (store.reset) |
| Show countdown in UI | Task 10 (CountdownTimer) |
| Change keybind | Task 13 |
| Persist keybind | Task 2 (settings.keybind in store) |
| Apply keybind via Tauri | Task 13 (update_shortcut command) |
| Fix duplicate file drop | Task 1 |
| Timestamps on file items | Task 3 (addedAt) + Task 4 (FileItem formatTime) |
| Show/hide file size | Task 6 + Task 4 |
| Show/hide timestamp | Task 6 + Task 4 |
| Show/hide refresh timer | Task 6 + Task 10 |

All requirements covered. No placeholders found.
