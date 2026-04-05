import { useState } from 'react'
import { useWorkspaceStore, NoteCard as NoteCardType } from '../store/useWorkspaceStore'
import { NoteCard } from './NoteCard'
import { NoteEditor } from './NoteEditor'
import { ColorTokens } from '../theme'

interface NotesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function NotesSection({ tabId, colors }: NotesSectionProps) {
  const { tabs, addNote, updateNote, removeNote } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const notes = tab?.notes ?? []
  const [editingNote, setEditingNote] = useState<NoteCardType | null>(null)

  return (
    <div>
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

      {notes.length === 0 ? (
        <div
          style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            fontSize: '12px',
            color: colors.textMuted,
          }}
        >
          No notes yet
        </div>
      ) : (
        <div>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              colors={colors}
              onEdit={setEditingNote}
              onRemove={(id) => removeNote(tabId, id)}
              onToggleCollapse={(id) =>
                updateNote(tabId, id, { collapsed: !note.collapsed })
              }
            />
          ))}
        </div>
      )}

      <button
        onClick={() => addNote(tabId)}
        aria-label="Add note"
        style={{
          marginTop: '6px',
          width: '100%',
          padding: '6px',
          border: `1px dashed ${colors.border}`,
          borderRadius: '6px',
          background: 'transparent',
          color: colors.textMuted,
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        + Add note
      </button>
    </div>
  )
}
