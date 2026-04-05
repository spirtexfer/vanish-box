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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '16px',
          width: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="note title"
          style={{
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: `1px solid ${colors.border}`,
            padding: '4px 0',
            background: 'transparent',
            color: colors.text,
            outline: 'none',
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
            borderRadius: '6px',
            padding: '8px',
            background: colors.bgSecondary,
            color: colors.text,
            minHeight: '120px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: '6px',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
