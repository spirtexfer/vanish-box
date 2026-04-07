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
        fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
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
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 250,
          }}
        >
          <div
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
              Clear all files, notes, and sketches from this tab? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmClear(false)}
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
                onClick={handleClearConfirmed}
                aria-label="confirm clear tab"
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
                Clear tab
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        data-tauri-drag-region
        style={{
          padding: '10px 14px',
          boxShadow: `0 1px 0 ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          cursor: 'grab',
          WebkitAppRegion: 'drag',
          background: colors.bg,
        } as React.CSSProperties}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '-0.01em',
            color: colors.accent,
          }}
        >
          Vanish Box
        </span>
        <div
          style={{
            display: 'flex',
            gap: '2px',
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
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
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
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
