import { useState } from 'react'
import { useWorkspaceStore, SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { SketchCard } from './SketchCard'
import { SketchEditor } from './SketchEditor'
import { SortableList } from './SortableList'
import { ColorTokens } from '../theme'

interface SketchesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function SketchesSection({ tabId, colors }: SketchesSectionProps) {
  const { tabs, addSketch, updateSketch, removeSketch, reorderSketches } = useWorkspaceStore()
  const tab = tabs.find((t) => t.id === tabId)
  const sketches = tab?.sketches ?? []
  const [editingSketch, setEditingSketch] = useState<SketchCardType | null>(null)

  return (
    <div>
      {editingSketch && (
        <SketchEditor
          dataUrl={editingSketch.dataUrl}
          colors={colors}
          onSave={(dataUrl) => {
            updateSketch(tabId, editingSketch.id, { dataUrl })
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
        <SortableList items={sketches} onReorder={(from, to) => reorderSketches(tabId, from, to)}>
          {sketches.map((sketch) => (
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
