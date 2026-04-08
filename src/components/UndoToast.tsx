import { useEffect } from 'react'
import { ColorTokens } from '../theme'

interface UndoToastProps {
  message: string
  colors: ColorTokens
  onUndo: () => void
  onDismiss: () => void
}

export function UndoToast({ message, colors, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      style={{
        position: 'fixed', bottom: '16px', left: '50%',
        transform: 'translateX(-50%)',
        background: colors.text, color: colors.bg,
        borderRadius: '10px', padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        fontSize: '12px', fontWeight: 500, zIndex: 500,
        boxShadow: colors.shadowModal, whiteSpace: 'nowrap',
      }}
    >
      <span>{message}</span>
      <button
        onClick={onUndo}
        style={{
          background: 'none', border: `1px solid ${colors.bg}`,
          color: colors.bg, borderRadius: '6px', padding: '3px 8px',
          cursor: 'pointer', fontSize: '11px', fontWeight: 600, opacity: 0.85,
        }}
      >
        Undo
      </button>
    </div>
  )
}
