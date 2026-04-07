import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { LinkItem } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface LinkCardProps {
  link: LinkItem
  colors: ColorTokens
  disabled?: boolean
  onOpen: (url: string) => void
  onEdit: (link: LinkItem) => void
  onRemove: (linkId: string) => void
}

export function LinkCard({ link, colors, disabled, onOpen, onEdit, onRemove }: LinkCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="vb-card"
      data-dragging={isDragging ? 'true' : undefined}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        marginBottom: '4px',
        background: colors.bgCard,
        borderRadius: '10px',
        fontSize: '12px',
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow,
        userSelect: 'none',
      }}
    >
      <div
        style={{ flex: 1, overflow: 'hidden', cursor: 'pointer', minWidth: 0 }}
        onClick={() => onOpen(link.url)}
      >
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: colors.text,
            fontWeight: 500,
          }}
          title={link.title}
        >
          {link.title}
        </div>
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: colors.accent,
            fontSize: '11px',
            opacity: 0.7,
          }}
          title={link.url}
        >
          {link.url}
        </div>
      </div>

      <button
        aria-label="edit link"
        title="Edit link"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(link) }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: colors.textMuted,
          fontSize: '13px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        ✎
      </button>

      <button
        aria-label="remove link"
        title="Remove link"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onRemove(link.id) }}
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
  )
}
