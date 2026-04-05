import { Settings } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

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

        <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>
          Global shortcut: <code>{settings.keybind}</code>
        </div>
      </div>
    </div>
  )
}
