import React from 'react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'
import { TabBar } from './TabBar'
import { TabContent } from './TabContent'

export function WorkspacePanel() {
  const { tabs, activeTabId, settings, updateSettings } = useWorkspaceStore()
  const colors = COLORS[settings.theme]
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]

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
        <button
          onClick={() =>
            updateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })
          }
          aria-label="toggle theme"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            color: colors.textMuted,
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {settings.theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <TabBar colors={colors} />

      {activeTab && <TabContent tab={activeTab} colors={colors} />}
    </div>
  )
}
