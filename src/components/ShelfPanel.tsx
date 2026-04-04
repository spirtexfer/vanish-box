import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useShelfStore, ShelfFile } from '../store/useShelfStore'
import { FileItem } from './FileItem'
import { SettingsRow } from './SettingsRow'

interface RawFileInfo {
  name: string
  size: number
  path: string
}


export function ShelfPanel() {
  const { files, addFiles, removeFile, settings, updateSettings } = useShelfStore()

  async function handleOpen(path: string) {
    await invoke('open_file', { path })
  }
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
              <FileItem
                key={file.id}
                file={file}
                settings={settings}
                onRemove={removeFile}
                onOpen={handleOpen}
              />
            ))}
          </ul>
        )}
      </main>
      <SettingsRow settings={settings} onUpdate={updateSettings} />
    </div>
  )
}
