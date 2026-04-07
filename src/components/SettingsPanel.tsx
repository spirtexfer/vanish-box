import React, { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Settings } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

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
    // Only accept keys that the Rust str_to_code supports
    const valid = /^([a-z0-9]|f([1-9]|1[0-2])|space)$/.test(rawKey)
    if (!valid) return

    parts.push(rawKey)
    onCapture(parts.join('+'))
    setCapturing(false)
  }

  return (
    <div style={{ fontSize: '12px', color: colors.text, marginTop: '4px' }}>
      <div style={{ marginBottom: '4px' }}>Global shortcut</div>
      <input
        readOnly
        value={capturing ? 'Press keys…' : keybind}
        onFocus={() => setCapturing(true)}
        onBlur={() => setCapturing(false)}
        onKeyDown={handleKeyDown}
        aria-label="keybind capture"
        style={{
          width: '100%',
          padding: '4px 8px',
          border: `1px solid ${capturing ? '#6366f1' : colors.border}`,
          borderRadius: '6px',
          background: colors.bgSecondary,
          color: colors.text,
          fontSize: '12px',
          cursor: 'pointer',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'monospace',
        }}
      />
      <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
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
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 300,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px 12px 0 0',
          padding: '16px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: colors.text,
          }}
        >
          Settings
        </h3>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: colors.text,
            cursor: 'pointer',
          }}
        >
          Dark mode
          <input
            type="checkbox"
            checked={settings.theme === 'dark'}
            onChange={(e) => onUpdate({ theme: e.target.checked ? 'dark' : 'light' })}
          />
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: colors.text,
            cursor: 'pointer',
          }}
        >
          Show file size
          <input
            type="checkbox"
            checked={settings.showFileSize}
            onChange={(e) => onUpdate({ showFileSize: e.target.checked })}
          />
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: colors.text,
            cursor: 'pointer',
          }}
        >
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
