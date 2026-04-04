import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useShelfStore, ShelfFile } from '../store/useShelfStore'

interface RawFileInfo {
  name: string
  size: number
  path: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ShelfPanel() {
  const { files, addFiles } = useShelfStore()
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  useEffect(() => {
    let cancelled = false
    let unlisten: (() => void) | undefined

    getCurrentWindow()
      .onDragDropEvent(async (event) => {
        const { type } = event.payload

        if (type === 'enter' || type === 'over') {
          setIsDraggingOver(true)
        } else if (type === 'leave') {
          setIsDraggingOver(false)
        } else if (type === 'drop') {
          setIsDraggingOver(false)
          const paths = (event.payload as { type: 'drop'; paths: string[] }).paths ?? []
          console.log('[VanishBox] Native drop event fired:', paths)
          if (paths.length > 0) {
            const raw = await invoke<RawFileInfo[]>('get_file_infos', { paths })
            const newFiles: ShelfFile[] = raw.map((r) => ({
              id: crypto.randomUUID(),
              name: r.name,
              size: r.size,
              path: r.path,
              addedAt: Date.now(),
            }))
            addFiles(newFiles)
          }
        }
      })
      .then((fn) => {
        if (cancelled) {
          fn()
        } else {
          unlisten = fn
        }
      })

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [addFiles])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'system-ui, sans-serif',
        background: isDraggingOver ? '#eef2ff' : '#ffffff',
        transition: 'background 0.15s',
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
            {files.map((file) => (
              <li
                key={file.id}
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
