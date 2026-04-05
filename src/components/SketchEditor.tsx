import { useRef, useState, useEffect } from 'react'
import { ColorTokens } from '../theme'

interface SketchEditorProps {
  dataUrl: string | null
  colors: ColorTokens
  onSave: (dataUrl: string) => void
  onClose: () => void
}

export function SketchEditor({ dataUrl, colors, onSave, onClose }: SketchEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [brushSize, setBrushSize] = useState(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (dataUrl) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = dataUrl
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !lastPos.current) return
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
    setIsDrawing(false)
    lastPos.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function save() {
    onSave(canvasRef.current!.toDataURL('image/png'))
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => setTool('pen')}
            aria-pressed={tool === 'pen'}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: tool === 'pen' ? '#6366f1' : 'transparent',
              color: tool === 'pen' ? '#fff' : colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            aria-pressed={tool === 'eraser'}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: tool === 'eraser' ? '#6366f1' : 'transparent',
              color: tool === 'eraser' ? '#fff' : colors.text,
              border: `1px solid ${colors.border}`,
            }}
          >
            Eraser
          </button>
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            aria-label="brush size"
            style={{ width: '80px' }}
          />
          <button
            onClick={clearCanvas}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.text,
            }}
          >
            Clear
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: `1px solid ${colors.border}`,
              background: colors.bg,
              color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
            }}
          >
            Save
          </button>
        </div>
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
            borderRadius: '8px',
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
