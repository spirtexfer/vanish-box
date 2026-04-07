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

  const hasUrl = !!url.trim()

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
    >
      <div
        style={{
          background: colors.bgCard,
          borderRadius: '16px',
          padding: '20px 24px',
          width: '340px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          boxShadow: colors.shadowModal,
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="link title"
          placeholder="Title"
          style={{
            fontSize: '15px', fontWeight: 700, border: 'none',
            borderBottom: `1px solid ${colors.border}`, padding: '4px 0 8px',
            background: 'transparent', color: colors.text, outline: 'none',
            letterSpacing: '-0.01em',
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
            borderRadius: '8px', padding: '10px 12px',
            background: colors.bgSecondary, color: colors.text, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', cursor: 'pointer', borderRadius: '8px',
              border: 'none', background: colors.bgSecondary, color: colors.text,
              fontSize: '13px', fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!hasUrl}
            style={{
              padding: '8px 18px', borderRadius: '8px', border: 'none',
              background: hasUrl ? colors.accentGrad : colors.bgHover,
              color: hasUrl ? '#fff' : colors.textMuted,
              cursor: hasUrl ? 'pointer' : 'default',
              fontSize: '13px', fontWeight: 600,
              opacity: hasUrl ? 1 : 0.6,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
