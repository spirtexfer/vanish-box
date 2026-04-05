import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useWorkspaceStore, WorkspaceFile } from '../store/useWorkspaceStore'
import { FileCard } from './FileCard'
import { ColorTokens } from '../theme'

interface CopiedFileInfo {
  id: string
  original_name: string
  stored_path: string
  size: number
}

interface FilesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function FilesSection({ tabId, colors }: FilesSectionProps) {
  const { tabs, settings, addFiles, removeFile } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const files = tab?.files ?? []

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    fileId: string
    storedPath: string
  } | null>(null)

  async function handleOpen(path: string) {
    try {
      await invoke('open_file', { path })
    } catch (e) {
      console.error('[VanishBox] Failed to open file:', path, e)
    }
  }

  async function confirmDelete() {
    if (!deleteConfirm) return
    try {
      await invoke('delete_file', { path: deleteConfirm.storedPath })
    } catch (e) {
      console.error('[VanishBox] Failed to delete file:', e)
    }
    removeFile(tabId, deleteConfirm.fileId)
    setDeleteConfirm(null)
  }

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
          const paths =
            (event.payload as { type: 'drop'; paths: string[] }).paths ?? []
          if (paths.length > 0) {
            const results = await Promise.allSettled(
              paths.map((p) => invoke<CopiedFileInfo>('copy_file', { source: p }))
            )
            const newFiles: WorkspaceFile[] = results
              .filter(
                (r): r is PromiseFulfilledResult<CopiedFileInfo> =>
                  r.status === 'fulfilled'
              )
              .map((r) => ({
                id: r.value.id,
                originalName: r.value.original_name,
                storedPath: r.value.stored_path,
                size: r.value.size,
                addedAt: Date.now(),
              }))
            if (newFiles.length > 0) {
              addFiles(tabId, newFiles)
            }
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
  }, [tabId, addFiles])

  return (
    <>
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '280px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                color: colors.text,
                fontSize: '13px',
                margin: '0 0 16px 0',
              }}
            >
              Delete this file from your computer? This cannot be undone.
            </p>
            <div
              style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: isDraggingOver ? '#eef2ff' : colors.bgSecondary,
          border: isDraggingOver
            ? '2px dashed #6366f1'
            : `1px solid ${colors.border}`,
          borderRadius: '8px',
          minHeight: '60px',
          transition: 'all 0.15s',
        }}
      >
        {files.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60px',
              color: isDraggingOver ? '#6366f1' : colors.textMuted,
              fontSize: '12px',
            }}
          >
            Drop files here
          </div>
        ) : (
          <ul style={{ margin: 0, padding: '6px', listStyle: 'none' }}>
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                settings={settings}
                colors={colors}
                onOpen={handleOpen}
                onRemove={(id) => removeFile(tabId, id)}
                onDelete={(id, path) => setDeleteConfirm({ fileId: id, storedPath: path })}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
