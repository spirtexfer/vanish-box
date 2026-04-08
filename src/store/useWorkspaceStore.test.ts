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
