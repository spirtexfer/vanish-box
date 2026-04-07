import { useState } from 'react'
import { LinkItem, hostnameOrUrl } from '../store/useWorkspaceStore'
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
    if (!url.trim()) return
    onSave({ title: title.trim() || hostnameOrUrl(url), url: url.trim() })
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
            disabled={!url.trim()}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              background: url.trim() ? '#6366f1' : '#a5b4fc',
              color: '#fff',
              cursor: url.trim() ? 'pointer' : 'default',
              opacity: url.trim() ? 1 : 0.6,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
