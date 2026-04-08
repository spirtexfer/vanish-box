import { useState, useEffect } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import {
  useWorkspaceStore,
  TAB_COLORS,
  TAB_NAME_MAX_LEN,
  Tab,
  TabColor,
} from '../store/useWorkspaceStore'
import { ColorTokens, TAB_COLOR_VALUES } from '../theme'

interface TabBarProps {
  colors: ColorTokens
  triggerNewTab?: boolean
  onTriggerNewTabDone?: () => void
}

interface SortableTabProps {
  tab: Tab
  isActive: boolean
  isEditing: boolean
  editName: string
  canDelete: boolean
  colors: ColorTokens
  onActivate: () => void
  onDoubleClick: () => void
  onEditChange: (name: string) => void
  onEditSubmit: () => void
  onEditCancel: () => void
  onDelete: () => void
}

function SortableTab({
  tab,
  isActive,
  isEditing,
  editName,
  canDelete,
  colors,
  onActivate,
  onDoubleClick,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onDelete,
}: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
    disabled: isEditing,
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onActivate}
      onDoubleClick={onDoubleClick}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 9px',
        borderRadius: '7px',
        background: isActive ? colors.bgCard : 'transparent',
        boxShadow: isActive ? colors.shadow : 'none',
        borderLeft: `3px solid ${isActive ? TAB_COLOR_VALUES[tab.color] : 'transparent'}`,
        maxWidth: '140px',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editName}
          maxLength={TAB_NAME_MAX_LEN}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit()
            if (e.key === 'Escape') onEditCancel()
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '12px',
            fontWeight: 500,
            color: colors.text,
            width: '100px',
            cursor: 'text',
          }}
        />
      ) : (
        <span
          style={{
            fontSize: '12px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? colors.text : colors.textMuted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tab.name}
        </span>
      )}
      {canDelete && (
        <button
          aria-label="delete tab"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.textMuted,
            fontSize: '12px',
            lineHeight: 1,
            padding: '0 1px',
            flexShrink: 0,
            opacity: isActive ? 0.7 : 0.4,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

export function TabBar({ colors, triggerNewTab, onTriggerNewTabDone }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab, createTab, updateTab, deleteTab, reorderTabs } =
    useWorkspaceStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<TabColor>('blue')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    if (triggerNewTab) {
      setCreating(true)
      onTriggerNewTabDone?.()
    }
  }, [triggerNewTab, onTriggerNewTabDone])

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || tabs.length < 2) return
    const fromIndex = tabs.findIndex((t) => t.id === active.id)
    const toIndex = tabs.findIndex((t) => t.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    reorderTabs(fromIndex, toIndex)
  }

  function submitCreate() {
    const name = newName.trim() || 'Workspace'
    createTab(name, newColor)
    setCreating(false)
    setNewName('')
    setNewColor('blue')
  }

  function startEdit(tab: Tab) {
    setEditingId(tab.id)
    setEditName(tab.name)
  }

  function submitEdit() {
    if (editingId) {
      updateTab(editingId, { name: editName.trim() || 'Workspace' })
    }
    setEditingId(null)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        padding: '6px 10px',
        background: colors.bgSecondary,
        boxShadow: `0 1px 0 ${colors.border}`,
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {confirmDeleteId && (
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
            zIndex: 250,
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
            <p style={{ color: colors.text, fontSize: '13px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Delete this tab and all its content? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
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
                aria-label="confirm delete tab"
                onClick={() => {
                  deleteTab(confirmDeleteId)
                  setConfirmDeleteId(null)
                }}
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

      <DndContext
        sensors={sensors}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tabs.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
          {tabs.map((tab) => (
            <SortableTab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              isEditing={editingId === tab.id}
              editName={editName}
              canDelete={tabs.length > 1}
              colors={colors}
              onActivate={() => setActiveTab(tab.id)}
              onDoubleClick={() => startEdit(tab)}
              onEditChange={setEditName}
              onEditSubmit={submitEdit}
              onEditCancel={() => setEditingId(null)}
              onDelete={() => setConfirmDeleteId(tab.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {creating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <input
            autoFocus
            value={newName}
            maxLength={TAB_NAME_MAX_LEN}
            placeholder="Tab name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitCreate()
              if (e.key === 'Escape') setCreating(false)
            }}
            style={{
              fontSize: '12px',
              padding: '3px 8px',
              border: `1px solid ${colors.accent}`,
              borderRadius: '6px',
              background: colors.bgCard,
              color: colors.text,
              width: '100px',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '3px' }}>
            {TAB_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                aria-label={`color-${c}`}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: TAB_COLOR_VALUES[c],
                  border: newColor === c ? `2px solid ${colors.text}` : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  outline: 'none',
                }}
              />
            ))}
          </div>
          <button
            onClick={submitCreate}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              cursor: 'pointer',
              borderRadius: '6px',
              background: colors.accent,
              color: '#fff',
              border: 'none',
              fontWeight: 600,
            }}
          >
            Add
          </button>
          <button
            onClick={() => setCreating(false)}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              cursor: 'pointer',
              borderRadius: '6px',
              background: colors.bgHover,
              color: colors.textMuted,
              border: 'none',
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          aria-label="new tab"
          style={{
            background: 'none',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '14px',
            color: colors.textMuted,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          +
        </button>
      )}
    </div>
  )
}
