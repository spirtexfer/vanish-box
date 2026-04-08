import { describe, it, expect } from 'vitest'
import { sortPinned } from './sortPinned'

describe('sortPinned', () => {
  it('returns empty array unchanged', () => {
    expect(sortPinned([])).toEqual([])
  })

  it('puts pinned items before unpinned items', () => {
    const items = [
      { id: 'a', pinned: false },
      { id: 'b', pinned: true },
      { id: 'c' },
      { id: 'd', pinned: true },
    ]
    const result = sortPinned(items)
    expect(result[0].id).toBe('b')
    expect(result[1].id).toBe('d')
    expect(result[2].id).toBe('a')
    expect(result[3].id).toBe('c')
  })

  it('preserves original array (does not mutate)', () => {
    const items = [{ id: 'x', pinned: false }, { id: 'y', pinned: true }]
    const original = [...items]
    sortPinned(items)
    expect(items).toEqual(original)
  })

  it('returns all items when none are pinned', () => {
    const items: { id: string; pinned?: boolean }[] = [{ id: '1' }, { id: '2' }]
    const result = sortPinned(items)
    expect(result).toHaveLength(2)
  })
})
