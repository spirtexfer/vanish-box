import type { Tab } from '../store/useWorkspaceStore'

export interface SearchResult {
  type: 'tab' | 'file' | 'note' | 'link'
  tabId: string
  itemId?: string
  label: string
  sublabel?: string
}

export function searchStore(tabs: Tab[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results: SearchResult[] = []
  for (const tab of tabs) {
    if (tab.name.toLowerCase().includes(q)) {
      results.push({ type: 'tab', tabId: tab.id, label: tab.name })
    }
    for (const file of tab.files) {
      if (file.originalName.toLowerCase().includes(q)) {
        results.push({ type: 'file', tabId: tab.id, itemId: file.id, label: file.originalName, sublabel: tab.name })
      }
    }
    for (const note of tab.notes) {
      if (note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q)) {
        results.push({ type: 'note', tabId: tab.id, itemId: note.id, label: note.title, sublabel: tab.name })
      }
    }
    for (const link of tab.links) {
      if (link.title.toLowerCase().includes(q) || link.url.toLowerCase().includes(q)) {
        results.push({ type: 'link', tabId: tab.id, itemId: link.id, label: link.title, sublabel: link.url })
      }
    }
  }
  return results
}
