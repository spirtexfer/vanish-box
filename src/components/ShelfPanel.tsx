import { useState } from 'react'

interface DroppedFile {
  name: string
  size: number
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ShelfPanel() {
  const [files, setFiles] = useState<DroppedFile[]>([])
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  function handleDragLeave() {
    setIsDraggingOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDraggingOver(false)
    const incoming = Array.from(e.dataTransfer.files).map((f) => ({
      name: f.name,
      size: f.size,
    }))
    setFiles((prev) => [...prev, ...incoming])
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'system-ui, sans-serif',
        background: '#ffffff',
      }}
    >
      <header
        data-tauri-drag-region
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '14px',
          flexShrink: 0,
          textAlign: 'center',
          cursor: 'grab',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        Vanish Box
      </header>

      <main
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {files.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDraggingOver ? '#6366f1' : '#9ca3af',
              fontSize: '13px',
              border: isDraggingOver ? '2px dashed #6366f1' : '2px dashed transparent',
              margin: '12px',
              borderRadius: '8px',
              transition: 'all 0.15s',
            }}
          >
            Drop files here
          </div>
        ) : (
          <ul
            style={{
              flex: 1,
              overflowY: 'auto',
              margin: 0,
              padding: '8px',
              listStyle: 'none',
            }}
          >
            {files.map((file, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 10px',
                  marginBottom: '4px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginRight: '8px',
                    color: '#111827',
                  }}
                >
                  {file.name}
                </span>
                <span style={{ color: '#9ca3af', flexShrink: 0 }}>
                  {formatSize(file.size)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
