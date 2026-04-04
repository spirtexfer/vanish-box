import { Settings } from '../store/useShelfStore'

interface SettingsRowProps {
  settings: Settings
  onUpdate: (s: Partial<Settings>) => void
}

export function SettingsRow({ settings, onUpdate }: SettingsRowProps) {
  return (
    <footer
      style={{
        display: 'flex',
        gap: '12px',
        padding: '6px 12px',
        borderTop: '1px solid #e5e7eb',
        fontSize: '11px',
        color: '#9ca3af',
        alignItems: 'center',
        flexShrink: 0,
        background: '#ffffff',
      }}
    >
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings.showSize}
          onChange={(e) => onUpdate({ showSize: e.target.checked })}
        />
        size
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings.showTimestamp}
          onChange={(e) => onUpdate({ showTimestamp: e.target.checked })}
        />
        time
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings.showCountdown}
          onChange={(e) => onUpdate({ showCountdown: e.target.checked })}
        />
        timer
      </label>
    </footer>
  )
}
