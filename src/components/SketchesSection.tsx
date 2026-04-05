import { useState } from 'react'
import { useWorkspaceStore, SketchCard as SketchCardType } from '../store/useWorkspaceStore'
import { SketchCard } from './SketchCard'
import { SketchEditor } from './SketchEditor'
import { ColorTokens } from '../theme'

interface SketchesSectionProps {
  tabId: string
  colors: ColorTokens
}

export function SketchesSection({ tabId, colors }: SketchesSectionProps) {
  const { tabs, addSketch, updateSketch, removeSketch } = useWorkspaceStore()
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
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            fontSize: '12px',
            color: colors.textMuted,
          }}
        >
          No sketches yet
        </div>
      ) : (
        <div>
          {sketches.map((sketch) => (
            <SketchCard
              key={sketch.id}
              sketch={sketch}
              colors={colors}
              onEdit={setEditingSketch}
              onRemove={(id) => removeSketch(tabId, id)}
              onToggleCollapse={(id) =>
                updateSketch(tabId, id, { collapsed: !sketch.collapsed })
              }
            />
          ))}
        </div>
      )}

      <button
        onClick={() => addSketch(tabId)}
        aria-label="Add sketch"
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
        + Add sketch
      </button>
    </div>
  )
}
