import { useState } from 'react'
import { useWorkspaceStore, SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { SketchCard } from './SketchCard'
import { SketchEditor } from './SketchEditor'
import { MoveItemModal } from './MoveItemModal'
import { SortableList } from './SortableList'
import { ColorTokens } from '../theme'
import { sortPinned } from '../utils/sortPinned'

interface SketchesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function SketchesSection({ tabId, colors }: SketchesSectionProps) {
  const { tabs, addSketch, updateSketch, removeSketch, reorderSketches, moveSketch } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const sketches = tab?.sketches ?? []
  const sorted = sortPinned(sketches)
  const [editingSketch, setEditingSketch] = useState<SketchCardType | null>(null)
  const [movingSketchId, setMovingSketchId] = useState<string | null>(null)

  return (
    <div>
      {movingSketchId && (
        <MoveItemModal
          tabs={tabs}
          currentTabId={tabId}
          colors={colors}
          onMove={(targetTabId) => moveSketch(tabId, targetTabId, movingSketchId)}
          onClose={() => setMovingSketchId(null)}
        />
      )}
      {editingSketch && (
        <SketchEditor
          sketch={editingSketch}
          colors={colors}
          onSave={(patch) => {
            updateSketch(tabId, editingSketch.id, patch)
            setEditingSketch(null)
          }}
          onClose={() => setEditingSketch(null)}
        />
      )}

      {sketches.length === 0 ? (
        <div
          style={{
            padding: '10px 0 6px',
            textAlign: 'center',
            fontSize: '12px',
            color: colors.textMuted,
            opacity: 0.7,
          }}
        >
          No sketches yet
        </div>
      ) : (
        <SortableList
          items={sorted}
          onReorder={(fromIdx, toIdx) => {
            const fromId = sorted[fromIdx].id
            const toId = sorted[toIdx].id
            reorderSketches(
              tabId,
              sketches.findIndex((s) => s.id === fromId),
              sketches.findIndex((s) => s.id === toId),
            )
          }}
        >
          {sorted.map((sketch) => (
            <SketchCard
              key={sketch.id}
              sketch={sketch}
              colors={colors}
              disabled={sketches.length < 2}
              onEdit={setEditingSketch}
              onRemove={(id) => removeSketch(tabId, id)}
              onToggleCollapse={(id) =>
                updateSketch(tabId, id, { collapsed: !sketch.collapsed })
              }
              onTogglePin={(id) => updateSketch(tabId, id, { pinned: !sorted.find(s => s.id === id)?.pinned })}
              onMove={setMovingSketchId}
            />
          ))}
        </SortableList>
      )}

      <button
        onClick={() => addSketch(tabId)}
        aria-label="Add sketch"
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
        + Add sketch
      </button>
    </div>
  )
}
