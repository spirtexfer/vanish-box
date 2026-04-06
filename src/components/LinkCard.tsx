import { LinkItem } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

interface LinkCardProps {
  link: LinkItem
  colors: ColorTokens
  onOpen: (url: string) => void
  onEdit: (link: LinkItem) => void
  onRemove: (linkId: string) => void
}

export function LinkCard({ link, colors, onOpen, onEdit, onRemove }: LinkCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        marginBottom: '4px',
        background: colors.bgSecondary,
        borderRadius: '6px',
        fontSize: '12px',
        border: `1px solid ${colors.border}`,
      }}
    >
      <div
        style={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => onOpen(link.url)}
      >
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: colors.text,
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
            color: colors.textMuted,
            fontSize: '11px',
          }}
          title={link.url}
        >
          {link.url}
        </div>
      </div>

      <button
        aria-label="edit link"
        title="Edit link"
        onClick={(e) => { e.stopPropagation(); onEdit(link) }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: colors.textMuted,
          fontSize: '12px',
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
        onClick={(e) => { e.stopPropagation(); onRemove(link.id) }}
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
  )
}
