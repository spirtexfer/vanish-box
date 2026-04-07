import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { NoteCard as NoteCardType } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface NoteCardProps {
  note: NoteCardType
  colors: ColorTokens
  disabled?: boolean
  onEdit: (note: NoteCardType) => void
  onRemove: (noteId: string) => void
  onToggleCollapse: (noteId: string) => void
}

export function NoteCard({ note, colors, disabled, onEdit, onRemove, onToggleCollapse }: NoteCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        marginBottom: '4px',
        boxShadow: colors.shadow,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 10px',
          cursor: isDragging ? 'grabbing' : 'pointer',
          gap: '6px',
        }}
        onClick={() => onEdit(note)}
      >
        <button
          aria-label="toggle collapse"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(note.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            color: colors.textMuted,
            fontSize: '9px',
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {note.collapsed ? '▶' : '▼'}
        </button>
        <span
          style={{
            flex: 1,
            fontSize: '12px',
            fontWeight: 600,
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
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(note.id)
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: '15px',
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
            padding: '0 12px 10px 26px',
            fontSize: '12px',
            color: colors.textMuted,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.5,
          }}
        >
          {note.body.length > 120 ? note.body.slice(0, 120) + '…' : note.body}
        </div>
      )}
    </div>
  )
}
