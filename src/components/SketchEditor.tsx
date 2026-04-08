import { useRef, useState, useEffect } from 'react'
import { SketchCard } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'

const MAX_HISTORY = 50

interface SketchEditorProps {
  sketch: SketchCard
  colors: ColorTokens
  onSave: (patch: Partial<Pick<SketchCard, 'title' | 'dataUrl'>>) => void
  onClose: () => void
}

function drawDataUrl(ctx: CanvasRenderingContext2D, src: string, onDone?: () => void) {
  const img = new Image()
  img.onload = () => {
    ctx.drawImage(img, 0, 0)
    onDone?.()
  }
  img.src = src
}

export function SketchEditor({ sketch, colors, onSave, onClose }: SketchEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [title, setTitle] = useState(sketch.title)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [brushSize, setBrushSize] = useState(3)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const hasMoved = useRef(false)

  const historySnaps = useRef<string[]>([])
  const historyIdxRef = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (sketch.dataUrl) {
      drawDataUrl(ctx, sketch.dataUrl, pushHistory)
    } else {
      pushHistory()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function pushHistory() {
    const canvas = canvasRef.current
    if (!canvas) return
    const snap = canvas.toDataURL('image/png')
    const sliced = historySnaps.current.slice(0, historyIdxRef.current + 1)
    historySnaps.current = [...sliced, snap].slice(-MAX_HISTORY)
    historyIdxRef.current = historySnaps.current.length - 1
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(false)
  }

  function restoreCanvas(idx: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawDataUrl(ctx, historySnaps.current[idx])
  }

  function undo() {
    if (historyIdxRef.current <= 0) return
    historyIdxRef.current -= 1
    restoreCanvas(historyIdxRef.current)
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(true)
  }

  function redo() {
    if (historyIdxRef.current >= historySnaps.current.length - 1) return
    historyIdxRef.current += 1
    restoreCanvas(historyIdxRef.current)
    setCanUndo(true)
    setCanRedo(historyIdxRef.current < historySnaps.current.length - 1)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      } else if (
        (e.ctrlKey && e.key.toLowerCase() === 'y') ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault()
        redo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    hasMoved.current = false
    lastPos.current = getPos(e)
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!lastPos.current) return
    hasMoved.current = true
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : '#1f2937'
    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  function stopDrawing() {
    if (lastPos.current !== null && hasMoved.current) pushHistory()
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function handleConfirmClear() {
    clearCanvas()
    pushHistory()
    setConfirmClear(false)
  }

  function save() {
    onSave({
      title: title.trim() || 'New sketch',
      dataUrl: canvasRef.current!.toDataURL('image/png'),
    })
    onClose()
  }

  const toolBtnStyle = (active: boolean) => ({
    padding: '5px 12px',
    borderRadius: '7px',
    cursor: 'pointer',
    background: active ? colors.accent : colors.bgHover,
    color: active ? '#fff' : colors.text,
    border: 'none',
    fontSize: '12px',
    fontWeight: active ? 600 : 500,
  })

  const ghostBtnStyle = (enabled = true) => ({
    padding: '5px 12px',
    borderRadius: '7px',
    cursor: enabled ? 'pointer' : 'default',
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: enabled ? colors.text : colors.textMuted,
    fontSize: '12px',
    opacity: enabled ? 1 : 0.4,
  })

  return (
    <div
      className="vb-overlay"
      onClick={save}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        className="vb-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.bgCard,
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          boxShadow: colors.shadowModal,
        }}
      >
        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="sketch title"
          style={{
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            borderBottom: `1px solid ${colors.border}`,
            padding: '4px 0 8px',
            background: 'transparent',
            color: colors.text,
            outline: 'none',
            letterSpacing: '-0.01em',
          }}
        />

        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            flexWrap: 'wrap',
            background: colors.bgSecondary,
            borderRadius: '10px',
            padding: '8px 10px',
          }}
        >
          <button onClick={() => setTool('pen')} aria-pressed={tool === 'pen'} style={toolBtnStyle(tool === 'pen')}>
            Pen
          </button>
          <button onClick={() => setTool('eraser')} aria-pressed={tool === 'eraser'} style={toolBtnStyle(tool === 'eraser')}>
            Eraser
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 4px',
            }}
          >
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              aria-label="brush size"
              style={{ width: '72px', accentColor: colors.accent }}
            />
            <span style={{ fontSize: '11px', color: colors.textMuted, minWidth: '18px' }}>
              {brushSize}
            </span>
          </div>

          <div style={{ width: '1px', height: '18px', background: colors.border, margin: '0 2px' }} />

          {confirmClear ? (
            <>
              <span style={{ fontSize: '12px', color: colors.text }}>Clear all?</span>
              <button aria-label="cancel clear" onClick={() => setConfirmClear(false)} style={ghostBtnStyle()}>
                No
              </button>
              <button
                aria-label="confirm clear"
                onClick={handleConfirmClear}
                style={{ ...ghostBtnStyle(), color: '#ef4444', borderColor: '#ef4444' }}
              >
                Clear
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmClear(true)} style={ghostBtnStyle()}>
              Clear
            </button>
          )}

          <button onClick={undo} aria-label="undo" disabled={!canUndo} style={ghostBtnStyle(canUndo)}>
            ↩ Undo
          </button>
          <button onClick={redo} aria-label="redo" disabled={!canRedo} style={ghostBtnStyle(canRedo)}>
            ↪ Redo
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={onClose}
            aria-label="close editor"
            style={{
              padding: '5px 12px', borderRadius: '7px', cursor: 'pointer',
              border: 'none', background: colors.bgHover, color: colors.text, fontSize: '12px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '5px 12px', borderRadius: '7px', cursor: 'pointer',
              background: colors.accentGrad, color: '#fff', border: 'none',
              fontSize: '12px', fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            background: '#ffffff',
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>
    </div>
  )
}
