import { useState } from 'react'
import { useWorkspaceStore, SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { SketchCard } from './SketchCard'
import { SketchEditor } from './SketchEditor'
import { MoveItemModal } from './MoveItemModal'
import { SortableList } from './SortableList'
import { ColorTokens } from '../theme'
import { useUndoStore } from '../store/useUndoStore'
import { UndoToast } from './UndoToast'

interface SketchesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function SketchesSection({ tabId, colors }: SketchesSectionProps) {
  const { tabs, addSketch, updateSketch, removeSketch, reorderSketches, moveSketch, restoreSketch } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const sketches = tab?.sketches ?? []
  const [editingSketch, setEditingSketch] = useState<SketchCardType | null>(null)
  const [movingSketchId, setMovingSketchId] = useState<string | null>(null)
  const { push: pushUndo } = useUndoStore()
  const [undoVisible, setUndoVisible] = useState(false)

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
      {undoVisible && (
        <UndoToast
          message="Sketch removed"
          colors={colors}
          onUndo={() => {
            const entry = useUndoStore.getState().pop()
            if (entry && entry.type === 'sketch') {
              restoreSketch(entry.tabId, entry.item as SketchCardType)
            }
            setUndoVisible(false)
          }}
          onDismiss={() => {
            useUndoStore.getState().pop()
            setUndoVisible(false)
          }}
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
          items={sketches}
          onReorder={(from, to) => reorderSketches(tabId, from, to)}
        >
          {sketches.map((sketch) => (
            <SketchCard
              key={sketch.id}
              sketch={sketch}
              colors={colors}
              disabled={sketches.length < 2}
              onEdit={setEditingSketch}
              onRemove={(id) => {
                  const sketch = sketches.find((s) => s.id === id)
                  if (sketch) {
                    pushUndo({ type: 'sketch', tabId, item: sketch })
                    setUndoVisible(true)
                  }
                  removeSketch(tabId, id)
                }}
              onToggleCollapse={(id) =>
                updateSketch(tabId, id, { collapsed: !sketch.collapsed })
              }
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
