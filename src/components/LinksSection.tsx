import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useWorkspaceStore, LinkItem } from '../store/useWorkspaceStore'
import { LinkCard } from './LinkCard'
import { LinkEditor } from './LinkEditor'
import { MoveItemModal } from './MoveItemModal'
import { SortableList } from './SortableList'
import { ColorTokens } from '../theme'
import { sortPinned } from '../utils/sortPinned'

interface LinksSectionProps {
  tabId: string
  colors: ColorTokens
}

export function LinksSection({ tabId, colors }: LinksSectionProps) {
  const { tabs, addLink, updateLink, removeLink, reorderLinks, moveLink } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const links = tab?.links ?? []
  const sorted = sortPinned(links)
  const [editing, setEditing] = useState<LinkItem | 'new' | null>(null)
  const [movingLinkId, setMovingLinkId] = useState<string | null>(null)

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
      {movingLinkId && (
        <MoveItemModal
          tabs={tabs}
          currentTabId={tabId}
          colors={colors}
          onMove={(targetTabId) => moveLink(tabId, targetTabId, movingLinkId)}
          onClose={() => setMovingLinkId(null)}
        />
      )}
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
            padding: '10px 0 6px',
            textAlign: 'center',
            fontSize: '12px',
            color: colors.textMuted,
            opacity: 0.7,
          }}
        >
          No links yet
        </div>
      ) : (
        <SortableList
          items={sorted}
          onReorder={(fromIdx, toIdx) => {
            const fromId = sorted[fromIdx].id
            const toId = sorted[toIdx].id
            reorderLinks(
              tabId,
              links.findIndex((l) => l.id === fromId),
              links.findIndex((l) => l.id === toId),
            )
          }}
        >
          {sorted.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              colors={colors}
              disabled={links.length < 2}
              onOpen={handleOpen}
              onEdit={setEditing}
              onRemove={(id) => removeLink(tabId, id)}
              onTogglePin={(id) => updateLink(tabId, id, { pinned: !sorted.find(l => l.id === id)?.pinned })}
              onMove={setMovingLinkId}
            />
          ))}
        </SortableList>
      )}

      <button
        onClick={() => setEditing('new')}
        aria-label="Add link"
        style={{
          marginTop: '4px',
          width: '100%',
          padding: '6px',
          border: 'none',
          borderRadius: '8px',
          background: 'transparent',
          color: colors.accent,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          opacity: 0.75,
          textAlign: 'left',
        }}
      >
        + Add link
      </button>
    </div>
  )
}
