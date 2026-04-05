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
  onOpen: (storedPath: string) => void
  onRemove: (fileId: string) => void
  onDelete: (fileId: string, storedPath: string) => void
}

export function FileCard({ file, settings, colors, onOpen, onRemove, onDelete }: FileCardProps) {
  return (
    <li
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
      <span
        onClick={() => onOpen(file.storedPath)}
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: colors.text,
          cursor: 'pointer',
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
        <span style={{ color: colors.textMuted, flexShrink: 0 }}>
          {formatSize(file.size)}
        </span>
      )}

      <button
        aria-label="remove"
        title="Remove from Vanish Box"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(file.id)
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

      <button
        aria-label="delete"
        title="Delete file from computer"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(file.id, file.storedPath)
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
