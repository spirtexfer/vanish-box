import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkspaceStore, migrateStore } from './useWorkspaceStore'
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

  it('default tab has four sections: files, notes, sketches, links', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const types = result.current.tabs[0].sections.map((s) => s.type)
    expect(types).toEqual(['files', 'notes', 'sketches', 'links'])
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

  it('new tab has four default sections', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('Dev', 'green') })
    const types = result.current.tabs[1].sections.map((s) => s.type)
    expect(types).toEqual(['files', 'notes', 'sketches', 'links'])
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

describe('deleteTab', () => {
  it('removes the specified tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('Extra', 'rose') })
    const extraId = result.current.tabs[1].id
    act(() => { result.current.deleteTab(extraId) })
    expect(result.current.tabs).toHaveLength(1)
    expect(result.current.tabs[0].name).toBe('Workspace')
  })

  it('does not delete the last remaining tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const id = result.current.tabs[0].id
    act(() => { result.current.deleteTab(id) })
    expect(result.current.tabs).toHaveLength(1)
  })

  it('switches to another tab when deleting the active tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('B', 'green') })
    const bId = result.current.tabs[1].id
    act(() => { result.current.setActiveTab(bId) })
    act(() => { result.current.deleteTab(bId) })
    expect(result.current.activeTabId).toBe(result.current.tabs[0].id)
  })

  it('keeps the active tab unchanged when deleting a non-active tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    act(() => { result.current.createTab('B', 'green') })
    const firstId = result.current.tabs[0].id
    const bId = result.current.tabs[1].id
    act(() => { result.current.setActiveTab(bId) })
    act(() => { result.current.deleteTab(firstId) })
    expect(result.current.activeTabId).toBe(bId)
    expect(result.current.tabs).toHaveLength(1)
    expect(result.current.tabs[0].name).toBe('B')
  })
})

describe('clearTab', () => {
  it('empties files, notes, and sketches of the target tab', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => {
      result.current.addFiles(tabId, [
        { id: 'f1', originalName: 'a.txt', storedPath: '/tmp/a.txt', sourcePath: '/original/a.txt', size: 10, addedAt: 0 },
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
      result.current.addFiles(tabAId, [{ id: 'f1', originalName: 'x.txt', storedPath: '/x', sourcePath: '/original/x.txt', size: 1, addedAt: 0 }])
    })
    expect(result.current.tabs[0].files).toHaveLength(1)
    expect(result.current.tabs[1].files).toHaveLength(0)
    void tabBId
  })

  it('sourcePath is preserved through addFiles', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => {
      result.current.addFiles(tabId, [
        { id: 'f1', originalName: 'a.txt', storedPath: '/stored/a.txt', sourcePath: '/original/a.txt', size: 1, addedAt: 0 },
      ])
    })
    expect(result.current.tabs[0].files[0].sourcePath).toBe('/original/a.txt')
  })

  it('removeFile removes from correct tab only', () => {
    const { result } = renderHook(() => useWorkspaceStore())
    const tabId = result.current.tabs[0].id
    act(() => {
      result.current.addFiles(tabId, [
        { id: 'f1', originalName: 'a.txt', storedPath: '/a', sourcePath: '/original/a.txt', size: 1, addedAt: 0 },
        { id: 'f2', originalName: 'b.txt', storedPath: '/b', sourcePath: '/original/b.txt', size: 1, addedAt: 0 },
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
    const beforeUpdate = result.current.tabs[0].notes[0].updatedAt
    act(() => { result.current.updateNote(tabId, noteId, { title: 'Hello', body: 'World' }) })
    const note = result.current.tabs[0].notes[0]
    expect(note.title).toBe('Hello')
    expect(note.body).toBe('World')
    expect(note.updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
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
    const beforeUpdate = result.current.tabs[0].sketches[0].updatedAt
    act(() => { result.current.updateSketch(tabId, sketchId, { title: 'My sketch', dataUrl: 'data:...' }) })
    expect(result.current.tabs[0].sketches[0].title).toBe('My sketch')
    expect(result.current.tabs[0].sketches[0].dataUrl).toBe('data:...')
    expect(result.current.tabs[0].sketches[0].updatedAt).toBeGreaterThanOrEqual(beforeUpdate)
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

describe('persist migration — v0 → v1', () => {
  it('backfills links:[] and links section on a tab that was persisted without them', () => {
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
    const migrated = migrateStore(oldState, 0) as any
    expect(migrated.tabs[0].links).toEqual([])
    expect(migrated.tabs[0].sections.map((s: any) => s.type)).toContain('links')
  })
})

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
