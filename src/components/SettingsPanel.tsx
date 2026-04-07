import React, { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Settings } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

const VALID_KEY_RE = /^([a-z0-9]|f([1-9]|1[0-2])|space)$/

function KeybindCapture({
  keybind,
  colors,
  onCapture,
}: {
  keybind: string
  colors: ColorTokens
  onCapture: (keybind: string) => void
}) {
  const [capturing, setCapturing] = useState(false)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey) parts.push('ctrl')
    if (e.shiftKey) parts.push('shift')
    if (e.altKey) parts.push('alt')
    if (e.metaKey) parts.push('super')

    // Require at least one modifier — bare keys are not safe as global shortcuts
    if (parts.length === 0) return

    // Normalize spacebar; map e.key to the token str_to_code expects
    const rawKey = e.key === ' ' ? 'space' : e.key.toLowerCase()
    const valid = VALID_KEY_RE.test(rawKey)
    if (!valid) return

    parts.push(rawKey)
    onCapture(parts.join('+'))
    setCapturing(false)
  }

  return (
    <div style={{ fontSize: '12px', color: colors.text }}>
      <div style={{ marginBottom: '6px', fontWeight: 500 }}>Global shortcut</div>
      <input
        readOnly
        value={capturing ? 'Press keys…' : keybind}
        onFocus={() => setCapturing(true)}
        onBlur={() => setCapturing(false)}
        onKeyDown={handleKeyDown}
        aria-label="keybind capture"
        style={{
          width: '100%',
          padding: '8px 10px',
          border: `1px solid ${capturing ? colors.accent : colors.border}`,
          borderRadius: '8px',
          background: colors.bgSecondary,
          color: colors.text,
          fontSize: '12px',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'monospace',
          transition: 'border-color 0.15s',
        }}
      />
      <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
        Click and press a key combination to change
      </div>
    </div>
  )
}

interface SettingsPanelProps {
  settings: Settings
  colors: ColorTokens
  onUpdate: (s: Partial<Settings>) => void
  onClose: () => void
}

export function SettingsPanel({ settings, colors, onUpdate, onClose }: SettingsPanelProps) {
  const toggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: colors.text,
    cursor: 'pointer',
    padding: '4px 0',
  }

  return (
    <div
      className="vb-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        className="vb-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bgCard,
          borderRadius: '16px 16px 0 0',
          padding: '20px 20px 24px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: colors.shadowModal,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '-0.01em',
            }}
          >
            Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              fontSize: '18px',
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            height: '1px',
            background: colors.border,
            margin: '-4px 0',
          }}
        />

        <label style={toggleStyle}>
          Dark mode
          <input
            type="checkbox"
            checked={settings.theme === 'dark'}
            onChange={(e) => onUpdate({ theme: e.target.checked ? 'dark' : 'light' })}
          />
        </label>

        <label style={toggleStyle}>
          Show file size
          <input
            type="checkbox"
            checked={settings.showFileSize}
            onChange={(e) => onUpdate({ showFileSize: e.target.checked })}
          />
        </label>

        <label style={toggleStyle}>
          Show file time added
          <input
            type="checkbox"
            checked={settings.showFileTimestamp}
            onChange={(e) => onUpdate({ showFileTimestamp: e.target.checked })}
          />
        </label>

        <KeybindCapture
          keybind={settings.keybind}
          colors={colors}
          onCapture={(keybind) => {
            onUpdate({ keybind })
            invoke('update_shortcut', { keybind }).catch((e) =>
              console.error('[VanishBox] Failed to update shortcut:', e)
            )
          }}
        />
      </div>
    </div>
  )
}
