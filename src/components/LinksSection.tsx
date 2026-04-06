import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useWorkspaceStore, LinkItem } from '../store/useWorkspaceStore'
import { LinkCard } from './LinkCard'
import { LinkEditor } from './LinkEditor'
import { ColorTokens } from '../theme'

interface LinksSectionProps {
  tabId: string
  colors: ColorTokens
}

export function LinksSection({ tabId, colors }: LinksSectionProps) {
  const { tabs, addLink, updateLink, removeLink } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const links = tab?.links ?? []
  const [editing, setEditing] = useState<LinkItem | 'new' | null>(null)

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
            background: colors.bgSecondary, border: `1px solid ${colors.border}`,
            borderRadius: '8px', padding: '12px', textAlign: 'center',
            fontSize: '12px', color: colors.textMuted,
          }}
        >
          No links yet
        </div>
      ) : (
        <div>
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              colors={colors}
              onOpen={handleOpen}
              onEdit={setEditing}
              onRemove={(id) => removeLink(tabId, id)}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setEditing('new')}
        aria-label="Add link"
        style={{
          marginTop: '6px', width: '100%', padding: '6px',
          border: `1px dashed ${colors.border}`, borderRadius: '6px',
          background: 'transparent', color: colors.textMuted,
          cursor: 'pointer', fontSize: '12px',
        }}
      >
        + Add link
      </button>
    </div>
  )
}
