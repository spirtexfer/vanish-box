import { describe, it, expect, beforeEach } from 'vitest'
import { useWorkspaceStore } from './useWorkspaceStore'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

describe('pinned flag', () => {
  it('updateFile toggles pinned on a file', () => {
    const store = useWorkspaceStore.getState()
    const tabId = store.tabs[0].id
    store.addFiles(tabId, [{
      id: 'f1', originalName: 'test.txt', storedPath: '/s/test.txt',
      sourcePath: '/src/test.txt', size: 100, addedAt: Date.now(),
    }])
    store.updateFile(tabId, 'f1', { pinned: true })
    expect(useWorkspaceStore.getState().tabs[0].files[0].pinned).toBe(true)
  })

  it('updateNote accepts pinned in patch', () => {
    const store = useWorkspaceStore.getState()
    const tabId = store.tabs[0].id
    store.addNote(tabId)
    const noteId = useWorkspaceStore.getState().tabs[0].notes[0].id
    store.updateNote(tabId, noteId, { pinned: true })
    expect(useWorkspaceStore.getState().tabs[0].notes[0].pinned).toBe(true)
  })

  it('updateSketch accepts pinned in patch', () => {
    const store = useWorkspaceStore.getState()
    const tabId = store.tabs[0].id
    store.addSketch(tabId)
    const sketchId = useWorkspaceStore.getState().tabs[0].sketches[0].id
    store.updateSketch(tabId, sketchId, { pinned: true })
    expect(useWorkspaceStore.getState().tabs[0].sketches[0].pinned).toBe(true)
  })

  it('updateLink accepts pinned in patch', () => {
    const store = useWorkspaceStore.getState()
    const tabId = store.tabs[0].id
    store.addLink(tabId, 'https://example.com', 'Example')
    const linkId = useWorkspaceStore.getState().tabs[0].links[0].id
    store.updateLink(tabId, linkId, { pinned: true })
    expect(useWorkspaceStore.getState().tabs[0].links[0].pinned).toBe(true)
  })
})

describe('moveItem', () => {
  it('moveNote moves a note from one tab to another', () => {
    const store = useWorkspaceStore.getState()
    const tab1Id = store.tabs[0].id
    store.createTab('Tab B', 'green')
    const tab2Id = useWorkspaceStore.getState().tabs[1].id
    store.addNote(tab1Id)
    const noteId = useWorkspaceStore.getState().tabs[0].notes[0].id
    store.moveNote(tab1Id, tab2Id, noteId)
    const s = useWorkspaceStore.getState()
    expect(s.tabs[0].notes).toHaveLength(0)
    expect(s.tabs[1].notes).toHaveLength(1)
    expect(s.tabs[1].notes[0].id).toBe(noteId)
  })

  it('moveLink moves a link from one tab to another', () => {
    const store = useWorkspaceStore.getState()
    const tab1Id = store.tabs[0].id
    store.createTab('Tab C', 'rose')
    const tab2Id = useWorkspaceStore.getState().tabs[1].id
    store.addLink(tab1Id, 'https://example.com', 'Ex')
    const linkId = useWorkspaceStore.getState().tabs[0].links[0].id
    store.moveLink(tab1Id, tab2Id, linkId)
    const s = useWorkspaceStore.getState()
    expect(s.tabs[0].links).toHaveLength(0)
    expect(s.tabs[1].links[0].id).toBe(linkId)
  })
})

describe('createTabFromTemplate', () => {
  it('creates a Research tab with Sources and Summary notes', () => {
    const store = useWorkspaceStore.getState()
    store.createTabFromTemplate('research', 'blue')
    const s = useWorkspaceStore.getState()
    const newTab = s.tabs[s.tabs.length - 1]
    expect(newTab.name).toBe('Research')
    expect(newTab.notes).toHaveLength(2)
    expect(newTab.notes[0].title).toBe('Sources')
    expect(newTab.notes[1].title).toBe('Summary')
  })

  it('creates a blank tab with no starter notes', () => {
    const store = useWorkspaceStore.getState()
    store.createTabFromTemplate('blank', 'slate')
    const s = useWorkspaceStore.getState()
    const newTab = s.tabs[s.tabs.length - 1]
    expect(newTab.notes).toHaveLength(0)
  })
})
