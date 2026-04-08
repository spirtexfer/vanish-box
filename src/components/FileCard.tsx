import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { WorkspaceFile, Settings } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface FileCardProps {
  file: WorkspaceFile
  settings: Settings
  colors: ColorTokens
  disabled?: boolean
  onOpen: (storedPath: string) => void
  onRemove: (fileId: string) => void
  onDelete: (fileId: string, sourcePath: string, storedPath: string) => void
  onTogglePin: (fileId: string) => void
  onMove: (fileId: string) => void
}

export function FileCard({ file, settings, colors, disabled, onOpen, onRemove, onDelete, onTogglePin, onMove }: FileCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
    disabled,
  })

  return (
    <li
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
        gap: '6px',
        padding: '7px 10px',
        marginBottom: '4px',
        background: colors.bgCard,
        borderRadius: '10px',
        fontSize: '12px',
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow,
        listStyle: 'none',
        userSelect: 'none',
      }}
    >
      <span
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onOpen(file.storedPath)}
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: colors.text,
          cursor: 'pointer',
          fontWeight: 500,
        }}
        title={file.originalName}
      >
        {file.originalName}
      </span>

      {settings.showFileTimestamp && (
        <span
          data-testid="file-timestamp"
          style={{ color: colors.textMuted, flexShrink: 0, fontSize: '11px' }}
        >
          {formatTime(file.addedAt)}
        </span>
      )}

      {settings.showFileSize && (
        <span style={{ color: colors.textMuted, flexShrink: 0, fontSize: '11px' }}>
          {formatSize(file.size)}
        </span>
      )}

      <button
        aria-label={file.pinned ? 'unpin' : 'pin'}
        title={file.pinned ? 'Unpin' : 'Pin to top'}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onTogglePin(file.id) }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: file.pinned ? colors.accent : colors.textMuted,
          fontSize: '12px', lineHeight: 1, padding: '0 2px', flexShrink: 0,
          opacity: file.pinned ? 1 : 0.4,
        }}
      >
        📌
      </button>

      <button
        aria-label="move file"
        title="Move to tab…"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onMove(file.id) }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.textMuted, fontSize: '11px', lineHeight: 1,
          padding: '0 2px', flexShrink: 0, opacity: 0.5,
        }}
      >
        ↗
      </button>

      <button
        aria-label="remove"
        title="Remove from Vanish Box"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onRemove(file.id)
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

      <button
        aria-label="delete"
        title="Delete file from computer"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(file.id, file.sourcePath, file.storedPath)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#ef4444',
          fontSize: '12px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        🗑
      </button>
    </li>
  )
}
