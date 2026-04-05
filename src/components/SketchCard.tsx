import { SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface SketchCardProps {
  sketch: SketchCardType
  colors: ColorTokens
  onEdit: (sketch: SketchCardType) => void
  onRemove: (sketchId: string) => void
  onToggleCollapse: (sketchId: string) => void
}

export function SketchCard({ sketch, colors, onEdit, onRemove, onToggleCollapse }: SketchCardProps) {
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
        onClick={() => onEdit(sketch)}
      >
        <button
          aria-label="toggle collapse"
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(sketch.id)
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
          {sketch.collapsed ? '▶' : '▼'}
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
          {sketch.title}
        </span>
        <button
          aria-label="remove sketch"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(sketch.id)
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
      {!sketch.collapsed && sketch.dataUrl && (
        <div style={{ padding: '0 10px 8px 10px' }}>
          <img
            src={sketch.dataUrl}
            alt={sketch.title}
            style={{
              maxWidth: '100%',
              borderRadius: '4px',
              border: `1px solid ${colors.border}`,
            }}
          />
        </div>
      )}
    </div>
  )
}
