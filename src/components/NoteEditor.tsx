import { useState } from 'react'
import { NoteCard } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface NoteEditorProps {
  note: NoteCard
  colors: ColorTokens
  onSave: (patch: Partial<Pick<NoteCard, 'title' | 'body'>>) => void
  onClose: () => void
}

export function NoteEditor({ note, colors, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)

  function save() {
    onSave({ title: title.trim() || 'New note', body })
    onClose()
  }

  return (
    <div
      className="vb-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        className="vb-modal"
        style={{
          background: colors.bgCard,
          borderRadius: '16px',
          padding: '20px 24px',
          width: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: colors.shadowModal,
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="note title"
          style={{
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            borderBottom: `1px solid ${colors.border}`,
            padding: '4px 0 8px',
            background: 'transparent',
            color: colors.text,
            outline: 'none',
            letterSpacing: '-0.01em',
          }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          autoFocus
          aria-label="note body"
          style={{
            fontSize: '13px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '10px 12px',
            background: colors.bgSecondary,
            color: colors.text,
            minHeight: '130px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              background: colors.bgSecondary,
              color: colors.text,
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '8px 18px',
              cursor: 'pointer',
              borderRadius: '8px',
              background: colors.accentGrad,
              color: '#fff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
