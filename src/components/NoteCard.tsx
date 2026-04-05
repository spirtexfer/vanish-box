import { NoteCard as NoteCardType } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface NoteCardProps {
  note: NoteCardType
  colors: ColorTokens
  onEdit: (note: NoteCardType) => void
  onRemove: (noteId: string) => void
  onToggleCollapse: (noteId: string) => void
}

export function NoteCard({ note, colors, onEdit, onRemove, onToggleCollapse }: NoteCardProps) {
  return (
    <div
      style={{
        background: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        marginBottom: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 10px',
          cursor: 'pointer',
          gap: '4px',
        }}
        onClick={() => onEdit(note)}
      >
        <button
          aria-label="toggle collapse"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(note.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 4px 0 0',
            color: colors.textMuted,
            fontSize: '10px',
            flexShrink: 0,
          }}
        >
          {note.collapsed ? '▶' : '▼'}
        </button>
        <span
          style={{
            flex: 1,
            fontSize: '12px',
            fontWeight: 500,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {note.title}
        </span>
        <button
          aria-label="remove note"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(note.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: '14px',
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      {!note.collapsed && note.body && (
        <div
          style={{
            padding: '0 10px 8px 24px',
            fontSize: '12px',
            color: colors.textMuted,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {note.body.length > 120 ? note.body.slice(0, 120) + '…' : note.body}
        </div>
      )}
    </div>
  )
}
