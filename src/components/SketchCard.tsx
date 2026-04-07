import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface SketchCardProps {
  sketch: SketchCardType
  colors: ColorTokens
  disabled?: boolean
  onEdit: (sketch: SketchCardType) => void
  onRemove: (sketchId: string) => void
  onToggleCollapse: (sketchId: string) => void
}

export function SketchCard({ sketch, colors, disabled, onEdit, onRemove, onToggleCollapse }: SketchCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sketch.id,
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
        onClick={() => onEdit(sketch)}
      >
        <button
          aria-label="toggle collapse"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(sketch.id)
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
          {sketch.collapsed ? '▶' : '▼'}
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
          {sketch.title}
        </span>
        <button
          aria-label="remove sketch"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(sketch.id)
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
      {!sketch.collapsed && sketch.dataUrl && (
        <div style={{ padding: '0 10px 10px 10px' }}>
          <img
            src={sketch.dataUrl}
            alt={sketch.title}
            style={{
              maxWidth: '100%',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  )
}
