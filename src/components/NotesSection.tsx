import { useState } from 'react'
import { useWorkspaceStore, NoteCard as NoteCardType } from '../store/useWorkspaceStore'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { MoveItemModal } from './MoveItemModal'
import { SortableList } from './SortableList'
import { ColorTokens } from '../theme'
import { sortPinned } from '../utils/sortPinned'
import { useUndoStore } from '../store/useUndoStore'
import { UndoToast } from './UndoToast'

interface NotesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function NotesSection({ tabId, colors }: NotesSectionProps) {
  const { tabs, addNote, updateNote, removeNote, reorderNotes, moveNote, restoreNote } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const notes = tab?.notes ?? []
  const sorted = sortPinned(notes)
  const [editingNote, setEditingNote] = useState<NoteCardType | null>(null)
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null)
  const { push: pushUndo } = useUndoStore()
  const [undoVisible, setUndoVisible] = useState(false)

  return (
    <div>
      {movingNoteId && (
        <MoveItemModal
          tabs={tabs}
          currentTabId={tabId}
          colors={colors}
          onMove={(targetTabId) => moveNote(tabId, targetTabId, movingNoteId)}
          onClose={() => setMovingNoteId(null)}
        />
      )}
      {editingNote && (
        <NoteEditor
          note={editingNote}
          colors={colors}
          onSave={(patch) => {
            updateNote(tabId, editingNote.id, patch)
          }}
          onClose={() => setEditingNote(null)}
        />
      )}
      {undoVisible && (
        <UndoToast
          message="Note removed"
          colors={colors}
          onUndo={() => {
            const entry = useUndoStore.getState().pop()
            if (entry && entry.type === 'note') {
              restoreNote(entry.tabId, entry.item as NoteCardType)
            }
            setUndoVisible(false)
          }}
          onDismiss={() => {
            useUndoStore.getState().pop()
            setUndoVisible(false)
          }}
        />
      )}

      {notes.length === 0 ? (
        <div
          style={{
            padding: '10px 0 6px',
            textAlign: 'center',
            fontSize: '12px',
            color: colors.textMuted,
            opacity: 0.7,
          }}
        >
          No notes yet
        </div>
      ) : (
        <SortableList
          items={sorted}
          onReorder={(fromIdx, toIdx) => {
            const fromId = sorted[fromIdx].id
            const toId = sorted[toIdx].id
            reorderNotes(
              tabId,
              notes.findIndex((n) => n.id === fromId),
              notes.findIndex((n) => n.id === toId),
            )
          }}
        >
          {sorted.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              colors={colors}
              disabled={notes.length < 2}
              onEdit={setEditingNote}
              onRemove={(id) => {
                  const note = notes.find((n) => n.id === id)
                  if (note) {
                    pushUndo({ type: 'note', tabId, item: note })
                    setUndoVisible(true)
                  }
                  removeNote(tabId, id)
                }}
              onToggleCollapse={(id) =>
                updateNote(tabId, id, { collapsed: !note.collapsed })
              }
              onTogglePin={(id) => updateNote(tabId, id, { pinned: !sorted.find(n => n.id === id)?.pinned })}
              onMove={setMovingNoteId}
            />
          ))}
        </SortableList>
      )}

      <button
        onClick={() => addNote(tabId)}
        aria-label="Add note"
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
        + Add note
      </button>
    </div>
  )
}
