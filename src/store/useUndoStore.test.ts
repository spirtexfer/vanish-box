import { describe, it, expect, beforeEach } from 'vitest'
import { useUndoStore } from './useUndoStore'

beforeEach(() => useUndoStore.getState().clear())

describe('useUndoStore', () => {
  it('push adds an entry to the stack', () => {
    useUndoStore.getState().push({
      type: 'note',
      tabId: 't1',
      item: { id: 'n1', title: 'Test', body: '', collapsed: false, createdAt: 0, updatedAt: 0 },
    })
    expect(useUndoStore.getState().stack).toHaveLength(1)
    expect(useUndoStore.getState().stack[0].type).toBe('note')
  })

  it('pop removes and returns the top entry', () => {
    useUndoStore.getState().push({
      type: 'note',
      tabId: 't1',
      item: { id: 'n1', title: 'Test', body: '', collapsed: false, createdAt: 0, updatedAt: 0 },
    })
    const entry = useUndoStore.getState().pop()
    expect(entry?.item.id).toBe('n1')
    expect(useUndoStore.getState().stack).toHaveLength(0)
  })

  it('clear empties the stack', () => {
    useUndoStore.getState().push({
      type: 'link',
      tabId: 't1',
      item: { id: 'l1', title: 'Ex', url: 'https://ex.com', createdAt: 0 },
    })
    useUndoStore.getState().clear()
    expect(useUndoStore.getState().stack).toHaveLength(0)
  })
})
