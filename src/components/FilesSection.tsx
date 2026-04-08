import { useState, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { useWorkspaceStore, WorkspaceFile } from '../store/useWorkspaceStore'
import { FileCard } from './FileCard'
import { SortableList } from './SortableList'
import { ColorTokens } from '../theme'
import { sortPinned } from '../utils/sortPinned'

interface CopiedFileInfo {
  id: string
  original_name: string
  stored_path: string
  source_path: string
  size: number
}

interface FilesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function FilesSection({ tabId, colors }: FilesSectionProps) {
  const { tabs, settings, addFiles, removeFile, reorderFiles, updateFile } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const files = tab?.files ?? []
  const sorted = sortPinned(files)

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    fileId: string
    sourcePath: string
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
    const { fileId, sourcePath, storedPath } = deleteConfirm
    setDeleteConfirm(null)
    try {
      await invoke('trash_file', { sourcePath, storedPath })
      removeFile(tabId, fileId)
    } catch (e) {
      console.error('[VanishBox] Failed to trash file:', e)
      alert('Could not move the file to trash. It may have already been removed.')
    }
  }

  async function handleAddFile() {
    const selected = await openDialog({ multiple: true, directory: false })
    if (!selected) return
    const paths = Array.isArray(selected) ? selected : [selected]
    const results = await Promise.allSettled(
      paths.map((p) => invoke<CopiedFileInfo>('copy_file', { source: p }))
    )
    const newFiles: WorkspaceFile[] = results
      .filter((r): r is PromiseFulfilledResult<CopiedFileInfo> => r.status === 'fulfilled')
      .map((r) => ({
        id: r.value.id,
        originalName: r.value.original_name,
        storedPath: r.value.stored_path,
        sourcePath: r.value.source_path,
        size: r.value.size,
        addedAt: Date.now(),
      }))
    if (newFiles.length > 0) addFiles(tabId, newFiles)
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
                sourcePath: r.value.source_path,
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
          className="vb-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            className="vb-modal"
            style={{
              background: colors.bgCard,
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '300px',
              width: '100%',
              textAlign: 'center',
              boxShadow: colors.shadowModal,
            }}
          >
            <p
              style={{
                color: colors.text,
                fontSize: '13px',
                margin: '0 0 20px 0',
                lineHeight: 1.5,
              }}
            >
              Move original file to Trash and remove the stored copy? The stored copy cannot be recovered.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '8px 18px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  border: 'none',
                  background: colors.bgSecondary,
                  color: colors.text,
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 18px',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
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
          background: isDraggingOver ? `rgba(0, 85, 215, 0.06)` : colors.bgSecondary,
          border: isDraggingOver ? `2px dashed ${colors.accent}` : `1px solid ${colors.border}`,
          borderRadius: '10px',
          minHeight: '52px',
          transition: 'all 0.15s',
        }}
      >
        {files.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '52px',
              color: isDraggingOver ? colors.accent : colors.textMuted,
              fontSize: '12px',
              gap: '6px',
            }}
          >
            <span style={{ opacity: 0.5, fontSize: '14px' }}>↓</span>
            Drop files here
          </div>
        ) : (
          <SortableList
            items={sorted}
            onReorder={(fromIdx, toIdx) => {
              const fromId = sorted[fromIdx].id
              const toId = sorted[toIdx].id
              reorderFiles(
                tabId,
                files.findIndex((f) => f.id === fromId),
                files.findIndex((f) => f.id === toId),
              )
            }}
          >
            <ul style={{ margin: 0, padding: '5px', listStyle: 'none' }}>
              {sorted.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  settings={settings}
                  colors={colors}
                  disabled={files.length < 2}
                  onOpen={handleOpen}
                  onRemove={(id) => removeFile(tabId, id)}
                  onDelete={(id, sourcePath, storedPath) =>
                    setDeleteConfirm({ fileId: id, sourcePath, storedPath })
                  }
                  onTogglePin={(id) => updateFile(tabId, id, { pinned: !sorted.find(f => f.id === id)?.pinned })}
                />
              ))}
            </ul>
          </SortableList>
        )}
      </div>

      <button
        onClick={handleAddFile}
        className="vb-btn"
        style={{
          marginTop: '4px',
          width: '100%',
          padding: '6px',
          border: 'none',
          borderRadius: '8px',
          background: 'transparent',
          color: colors.accent,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          opacity: 0.75,
          textAlign: 'left',
        }}
      >
        + Add file
      </button>
    </>
  )
}
