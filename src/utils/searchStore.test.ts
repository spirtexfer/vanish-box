import { describe, it, expect } from 'vitest'
import { searchStore } from './searchStore'
import type { Tab } from '../store/useWorkspaceStore'

const now = Date.now()

function makeTab(overrides: Partial<Tab> & { id: string; name: string }): Tab {
  return {
    color: 'blue',
    sections: [],
    files: [],
    notes: [],
    sketches: [],
    links: [],
    ...overrides,
  }
}

describe('searchStore', () => {
  it('returns empty when query is blank', () => {
    const tabs = [makeTab({ id: 't1', name: 'Work' })]
    expect(searchStore(tabs, '')).toEqual([])
    expect(searchStore(tabs, '   ')).toEqual([])
  })

  it('matches tab names', () => {
    const tabs = [
      makeTab({ id: 't1', name: 'Design Work' }),
      makeTab({ id: 't2', name: 'Coding' }),
    ]
    const results = searchStore(tabs, 'design')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ type: 'tab', tabId: 't1', label: 'Design Work' })
  })

  it('matches note title and body', () => {
    const tabs = [makeTab({
      id: 't1',
      name: 'Work',
      notes: [
        { id: 'n1', title: 'Meeting notes', body: 'Action items from standup', collapsed: false, createdAt: now, updatedAt: now },
        { id: 'n2', title: 'Ideas', body: 'Nothing relevant', collapsed: false, createdAt: now, updatedAt: now },
      ],
    })]
    const results = searchStore(tabs, 'standup')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ type: 'note', tabId: 't1', itemId: 'n1' })
  })

  it('matches link title and url', () => {
    const tabs = [makeTab({
      id: 't1',
      name: 'Work',
      links: [
        { id: 'l1', title: 'GitHub', url: 'https://github.com/user/repo', createdAt: now },
        { id: 'l2', title: 'Docs', url: 'https://docs.example.com', createdAt: now },
      ],
    })]
    const results = searchStore(tabs, 'github')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ type: 'link', tabId: 't1', itemId: 'l1' })
  })

  it('matches file originalName', () => {
    const tabs = [makeTab({
      id: 't1',
      name: 'Work',
      files: [
        { id: 'f1', originalName: 'design_mockup.fig', storedPath: '', sourcePath: '', size: 0, addedAt: now },
      ],
    })]
    const results = searchStore(tabs, 'mockup')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ type: 'file', tabId: 't1', itemId: 'f1' })
  })

  it('is case-insensitive', () => {
    const tabs = [makeTab({ id: 't1', name: 'RESEARCH' })]
    expect(searchStore(tabs, 'research')).toHaveLength(1)
    expect(searchStore(tabs, 'RESEARCH')).toHaveLength(1)
    expect(searchStore(tabs, 'ReSEaRch')).toHaveLength(1)
  })
})
