import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'
import { TabBar } from './TabBar'
import { TabContent } from './TabContent'
import { SettingsPanel } from './SettingsPanel'

export function WorkspacePanel() {
  const { tabs, activeTabId, settings, updateSettings, clearTab } = useWorkspaceStore()
  const colors = COLORS[settings.theme]
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

  const [showSettings, setShowSettings] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    invoke('update_shortcut', { keybind: settings.keybind }).catch((e) =>
      console.error('[VanishBox] Failed to apply keybind:', e)
    )
  }, []) // run once on mount

  function handleClearConfirmed() {
    if (activeTab) clearTab(activeTab.id)
    setConfirmClear(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'system-ui, sans-serif',
        background: colors.bg,
        color: colors.text,
      }}
    >
      {showSettings && (
        <SettingsPanel
          settings={settings}
          colors={colors}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {confirmClear && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 250,
          }}
        >
          <div
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              padding: '20px',
              maxWidth: '280px',
              textAlign: 'center',
            }}
          >
            <p style={{ color: colors.text, fontSize: '13px', margin: '0 0 16px 0' }}>
              Clear all files, notes, and sketches from this tab? This cannot be
              undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmClear(false)}
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  background: colors.bg,
                  color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearConfirmed}
                aria-label="confirm clear tab"
                style={{
                  padding: '6px 14px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                }}
              >
                Clear tab
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        data-tauri-drag-region
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 600,
          fontSize: '13px',
          flexShrink: 0,
          cursor: 'grab',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <span>Vanish Box</span>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <button
            onClick={() => setConfirmClear(true)}
            aria-label="clear tab"
            title="Clear this tab"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              color: colors.textMuted,
            }}
          >
            ⊘
          </button>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="open settings"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: colors.textMuted,
            }}
          >
            ⚙
          </button>
        </div>
      </header>

      <TabBar colors={colors} />

      {activeTab && <TabContent tab={activeTab} colors={colors} />}
    </div>
  )
}
