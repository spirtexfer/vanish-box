import { Tab } from '../store/useWorkspaceStore'
import { ColorTokens, TAB_COLOR_VALUES } from '../theme'

interface MoveItemModalProps {
  tabs: Tab[]
  currentTabId: string
  colors: ColorTokens
  onMove: (targetTabId: string) => void
  onClose: () => void
}

export function MoveItemModal({ tabs, currentTabId, colors, onMove, onClose }: MoveItemModalProps) {
  const otherTabs = tabs.filter((t) => t.id !== currentTabId)

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.bgCard, borderRadius: '16px',
          padding: '16px', width: '240px', boxShadow: colors.shadowModal,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{
          margin: '0 0 12px 0', fontSize: '11px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.textMuted,
        }}>
          Move to tab
        </p>
        {otherTabs.length === 0 ? (
          <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
            No other tabs available.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {otherTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { onMove(tab.id); onClose() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  width: '100%', padding: '8px 10px', borderRadius: '8px',
                  border: 'none', background: 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  fontSize: '13px', fontWeight: 500, color: colors.text,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: TAB_COLOR_VALUES[tab.color], flexShrink: 0,
                }} />
                {tab.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
