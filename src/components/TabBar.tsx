// src/components/TabBar.tsx
import { useState } from 'react'
import { useWorkspaceStore, TAB_COLORS, TAB_NAME_MAX_LEN, Tab, TabColor } from '../store/useWorkspaceStore'
import { ColorTokens, TAB_COLOR_VALUES } from '../theme'

interface TabBarProps {
  colors: ColorTokens
}

export function TabBar({ colors }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab, createTab, updateTab } = useWorkspaceStore()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<TabColor>('blue')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

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
        gap: '4px',
        padding: '6px 8px',
        borderBottom: `1px solid ${colors.border}`,
        background: colors.bg,
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onDoubleClick={() => startEdit(tab)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: tab.id === activeTabId ? colors.bgSecondary : 'transparent',
            border:
              tab.id === activeTabId
                ? `1px solid ${colors.border}`
                : '1px solid transparent',
            borderLeft: `3px solid ${TAB_COLOR_VALUES[tab.color]}`,
            maxWidth: '140px',
            flexShrink: 0,
          }}
        >
          {editingId === tab.id ? (
            <input
              autoFocus
              value={editName}
              maxLength={TAB_NAME_MAX_LEN}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={submitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitEdit()
                if (e.key === 'Escape') setEditingId(null)
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: colors.text,
                width: '100px',
              }}
            />
          ) : (
            <span
              style={{
                fontSize: '12px',
                color: colors.text,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.name}
            </span>
          )}
        </div>
      ))}

      {creating ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
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
              padding: '2px 6px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.bg,
              color: colors.text,
              width: '100px',
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
                  border: newColor === c ? '2px solid #000' : '1px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <button
            onClick={submitCreate}
            style={{ fontSize: '11px', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
          >
            Add
          </button>
          <button
            onClick={() => setCreating(false)}
            style={{ fontSize: '11px', padding: '2px 6px', cursor: 'pointer', borderRadius: '4px' }}
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
            border: `1px dashed ${colors.border}`,
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: '14px',
            color: colors.textMuted,
            flexShrink: 0,
          }}
        >
          +
        </button>
      )}
    </div>
  )
}
