import { ShelfFile, Settings } from '../store/useShelfStore'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface FileItemProps {
  file: ShelfFile
  settings: Settings
  onRemove: (id: string) => void
  onOpen: (path: string) => void
}

export function FileItem({ file, settings, onRemove, onOpen }: FileItemProps) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 10px',
        marginBottom: '4px',
        background: '#f9fafb',
        borderRadius: '6px',
        fontSize: '12px',
      }}
    >
      <span
        onClick={() => onOpen(file.path)}
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: '#111827',
          cursor: 'pointer',
        }}
        title={file.path}
      >
        {file.name}
      </span>

      {settings.showTimestamp && (
        <span
          data-testid="file-timestamp"
          style={{ color: '#9ca3af', flexShrink: 0, fontSize: '11px' }}
        >
          {formatTime(file.addedAt)}
        </span>
      )}

      {settings.showSize && (
        <span style={{ color: '#9ca3af', flexShrink: 0 }}>
          {formatSize(file.size)}
        </span>
      )}

      <button
        aria-label="remove"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(file.id)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#d1d5db',
          fontSize: '14px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </li>
  )
}
