import { useState } from 'react'
import { LinkItem } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface LinkEditorProps {
  link: LinkItem
  colors: ColorTokens
  onSave: (patch: Partial<Pick<LinkItem, 'title' | 'url'>>) => void
  onClose: () => void
}

export function LinkEditor({ link, colors, onSave, onClose }: LinkEditorProps) {
  const [title, setTitle] = useState(link.title)
  const [url, setUrl] = useState(link.url)

  function save() {
    const derivedTitle = title.trim() || (() => {
      try { return new URL(url).hostname } catch { return url }
    })()
    onSave({ title: derivedTitle, url })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
    >
      <div
        style={{
          background: colors.bg, border: `1px solid ${colors.border}`,
          borderRadius: '12px', padding: '16px', width: '320px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="link title"
          placeholder="Title"
          style={{
            fontSize: '14px', fontWeight: 600, border: 'none',
            borderBottom: `1px solid ${colors.border}`, padding: '4px 0',
            background: 'transparent', color: colors.text, outline: 'none',
          }}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="link url"
          placeholder="https://"
          autoFocus
          style={{
            fontSize: '13px', border: `1px solid ${colors.border}`,
            borderRadius: '6px', padding: '8px',
            background: colors.bgSecondary, color: colors.text, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px', cursor: 'pointer', borderRadius: '6px',
              border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '6px 12px', cursor: 'pointer', borderRadius: '6px',
              background: '#6366f1', color: '#fff', border: 'none',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
