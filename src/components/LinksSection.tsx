import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useWorkspaceStore, LinkItem } from '../store/useWorkspaceStore'
import { LinkCard } from './LinkCard'
import { LinkEditor } from './LinkEditor'
import { MoveItemModal } from './MoveItemModal'
import { SortableList } from './SortableList'
import { ColorTokens } from '../theme'
import { useUndoStore } from '../store/useUndoStore'
import { UndoToast } from './UndoToast'

interface LinksSectionProps {
  tabId: string
  colors: ColorTokens
}

export function LinksSection({ tabId, colors }: LinksSectionProps) {
  const { tabs, addLink, updateLink, removeLink, reorderLinks, moveLink, restoreLink } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const links = tab?.links ?? []
  const [editing, setEditing] = useState<LinkItem | 'new' | null>(null)
  const [movingLinkId, setMovingLinkId] = useState<string | null>(null)
  const { push: pushUndo } = useUndoStore()
  const [undoVisible, setUndoVisible] = useState(false)

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
      {undoVisible && (
        <UndoToast
          message="Link removed"
          colors={colors}
          onUndo={() => {
            const entry = useUndoStore.getState().pop()
            if (entry && entry.type === 'link') {
              restoreLink(entry.tabId, entry.item as LinkItem)
            }
            setUndoVisible(false)
          }}
          onDismiss={() => {
            useUndoStore.getState().pop()
            setUndoVisible(false)
          }}
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
          items={links}
          onReorder={(from, to) => reorderLinks(tabId, from, to)}
        >
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              colors={colors}
              disabled={links.length < 2}
              onOpen={handleOpen}
              onEdit={setEditing}
              onRemove={(id) => {
                  const link = links.find((l) => l.id === id)
                  if (link) {
                    pushUndo({ type: 'link', tabId, item: link })
                    setUndoVisible(true)
                  }
                  removeLink(tabId, id)
                }}
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
