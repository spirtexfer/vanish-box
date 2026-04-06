# Sketch Undo/Redo and Clear Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add undo/redo (with Ctrl+Z/Ctrl+Y shortcuts) and a clear-drawing confirmation to the SketchEditor canvas.

**Architecture:** All changes are contained in `SketchEditor.tsx`. History is a `useRef` array of canvas data-URL snapshots; a `historyIdxRef` ref tracks the current position; `canUndo`/`canRedo` boolean state drives button disabled state and triggers re-renders. Undo/redo is registered via a `document` keydown listener (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z). Clear is guarded by an inline confirmation (replacing the Clear button with "Clear all? [Cancel] [Clear]"). Notes are excluded — `<textarea>` already has native browser undo/redo. Links and files are discrete one-shot operations with no inline canvas to undo.

**Tech Stack:** React 19, TypeScript, Vitest + @testing-library/react, inline styles with `COLORS` tokens.

---

## File Map

- Modify: `src/components/SketchEditor.tsx` — add history refs/state, pushHistory, restoreCanvas, undo, redo, keyboard effect, confirmClear state, handleConfirmClear; update stopDrawing, clearCanvas, toolbar
- Create: `src/components/SketchEditor.test.tsx` — direct unit tests for undo/redo buttons and clear confirmation
- No changes to store, SketchesSection, or SketchCard

---

## Task 1: Undo/Redo history in SketchEditor

**Files:**
- Create: `src/components/SketchEditor.test.tsx`
- Modify: `src/components/SketchEditor.tsx`

- [ ] **Step 1: Create the test file**

Create `src/components/SketchEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SketchEditor } from './SketchEditor'
import { COLORS } from '../theme'

const noop = vi.fn()

describe('SketchEditor — undo/redo', () => {
  it('renders Undo and Redo buttons', () => {
    render(<SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />)
    expect(screen.getByRole('button', { name: 'undo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'redo' })).toBeTruthy()
  })

  it('Undo is disabled on initial render', () => {
    render(<SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />)
    const btn = screen.getByRole('button', { name: 'undo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('Redo is disabled on initial render', () => {
    render(<SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />)
    const btn = screen.getByRole('button', { name: 'redo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('Undo becomes enabled after a stroke (mousedown + mouseup)', () => {
    const { container } = render(
      <SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />
    )
    const canvas = container.querySelector('canvas')!
    fireEvent.mouseDown(canvas)
    fireEvent.mouseUp(canvas)
    const btn = screen.getByRole('button', { name: 'undo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('Redo is disabled after first stroke (no future history)', () => {
    const { container } = render(
      <SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />
    )
    const canvas = container.querySelector('canvas')!
    fireEvent.mouseDown(canvas)
    fireEvent.mouseUp(canvas)
    const btn = screen.getByRole('button', { name: 'redo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('Ctrl+Z disables Undo when back to initial state', () => {
    const { container } = render(
      <SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />
    )
    const canvas = container.querySelector('canvas')!
    fireEvent.mouseDown(canvas)
    fireEvent.mouseUp(canvas)
    // undo the stroke — back to initial (nothing to undo)
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true })
    const btn = screen.getByRole('button', { name: 'undo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('Ctrl+Z enables Redo', () => {
    const { container } = render(
      <SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />
    )
    const canvas = container.querySelector('canvas')!
    fireEvent.mouseDown(canvas)
    fireEvent.mouseUp(canvas)
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true })
    const btn = screen.getByRole('button', { name: 'redo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('Ctrl+Y re-enables Undo and disables Redo', () => {
    const { container } = render(
      <SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />
    )
    const canvas = container.querySelector('canvas')!
    fireEvent.mouseDown(canvas)
    fireEvent.mouseUp(canvas)
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true }) // undo
    fireEvent.keyDown(document, { key: 'y', ctrlKey: true }) // redo
    const undoBtn = screen.getByRole('button', { name: 'undo' }) as HTMLButtonElement
    const redoBtn = screen.getByRole('button', { name: 'redo' }) as HTMLButtonElement
    expect(undoBtn.disabled).toBe(false)
    expect(redoBtn.disabled).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — confirm RED**

```powershell
cd C:\Users\victo\miniProjects\vanishBox; npm test -- src/components/SketchEditor.test.tsx
```
Expected: fail — `undo` / `redo` buttons not found.

- [ ] **Step 3: Implement undo/redo in SketchEditor**

Replace the entire contents of `src/components/SketchEditor.tsx`:

```tsx
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

  // undo/redo history
  const historySnaps = useRef<string[]>([])
  const historyIdxRef = useRef(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (dataUrl) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        pushHistory()
      }
      img.src = dataUrl
    } else {
      pushHistory()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function pushHistory() {
    const canvas = canvasRef.current
    if (!canvas) return
    const snap = canvas.toDataURL('image/png')
    historySnaps.current = historySnaps.current.slice(0, historyIdxRef.current + 1)
    historySnaps.current.push(snap)
    historyIdxRef.current = historySnaps.current.length - 1
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(false)
  }

  function restoreCanvas(idx: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => ctx.drawImage(img, 0, 0)
    img.src = historySnaps.current[idx]
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
    if (lastPos.current !== null) pushHistory()
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTool('pen')}
            aria-pressed={tool === 'pen'}
            style={{
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
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
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
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
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
              border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text,
            }}
          >
            Clear
          </button>
          <button
            onClick={undo}
            aria-label="undo"
            disabled={!canUndo}
            style={{
              padding: '4px 10px', borderRadius: '6px',
              cursor: canUndo ? 'pointer' : 'default',
              border: `1px solid ${colors.border}`, background: 'transparent',
              color: canUndo ? colors.text : colors.textMuted,
              opacity: canUndo ? 1 : 0.4,
            }}
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            aria-label="redo"
            disabled={!canRedo}
            style={{
              padding: '4px 10px', borderRadius: '6px',
              cursor: canRedo ? 'pointer' : 'default',
              border: `1px solid ${colors.border}`, background: 'transparent',
              color: canRedo ? colors.text : colors.textMuted,
              opacity: canRedo ? 1 : 0.4,
            }}
          >
            ↪ Redo
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
              border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            style={{
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
              background: '#6366f1', color: '#fff', border: 'none',
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
```

- [ ] **Step 4: Run tests — confirm GREEN**

```powershell
cd C:\Users\victo\miniProjects\vanishBox; npm test -- src/components/SketchEditor.test.tsx
```
Expected: all 8 tests pass.

- [ ] **Step 5: Run full suite to ensure no regressions**

```powershell
cd C:\Users\victo\miniProjects\vanishBox; npm test
```
Expected: all tests pass (the existing SketchesSection test that checks for a `Clear` button still passes — the Clear button is unchanged in this task).

- [ ] **Step 6: Commit**

```
git add src/components/SketchEditor.tsx src/components/SketchEditor.test.tsx
git commit -m "feat: add undo/redo with Ctrl+Z/Ctrl+Y to sketch editor"
```

---

## Task 2: Clear drawing confirmation

**Files:**
- Modify: `src/components/SketchEditor.tsx`
- Modify: `src/components/SketchEditor.test.tsx`

- [ ] **Step 1: Add failing tests**

Append this describe block to `src/components/SketchEditor.test.tsx`:

```tsx
describe('SketchEditor — clear confirmation', () => {
  it('clicking Clear shows "Clear all?" text', () => {
    render(<SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/ }))
    expect(screen.getByText('Clear all?')).toBeTruthy()
  })

  it('clicking Clear shows cancel-clear and confirm-clear buttons', () => {
    render(<SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/ }))
    expect(screen.getByRole('button', { name: 'cancel clear' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'confirm clear' })).toBeTruthy()
  })

  it('clicking cancel-clear hides the confirmation and restores the Clear button', () => {
    render(<SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'cancel clear' }))
    expect(screen.queryByText('Clear all?')).toBeNull()
    expect(screen.getByRole('button', { name: /^Clear$/ })).toBeTruthy()
  })

  it('clicking confirm-clear hides the confirmation', () => {
    render(<SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'confirm clear' }))
    expect(screen.queryByText('Clear all?')).toBeNull()
  })

  it('confirm-clear pushes to undo history (Undo becomes enabled after clear)', () => {
    const { container } = render(
      <SketchEditor dataUrl={null} colors={COLORS.light} onSave={noop} onClose={noop} />
    )
    // Draw one stroke first so there's something to build on
    const canvas = container.querySelector('canvas')!
    fireEvent.mouseDown(canvas)
    fireEvent.mouseUp(canvas)
    // Now clear via confirmation
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'confirm clear' }))
    // Undo should still be enabled (clear was pushed to history)
    const btn = screen.getByRole('button', { name: 'undo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — confirm RED**

```powershell
cd C:\Users\victo\miniProjects\vanishBox; npm test -- src/components/SketchEditor.test.tsx
```
Expected: the 5 new clear-confirmation tests fail.

- [ ] **Step 3: Add confirmClear state and update the toolbar in SketchEditor.tsx**

In `src/components/SketchEditor.tsx`:

**Add `confirmClear` state** after the other state declarations (after `canUndo`/`canRedo`):

```tsx
const [confirmClear, setConfirmClear] = useState(false)
```

**Add `handleConfirmClear` function** after `clearCanvas`:

```tsx
function handleConfirmClear() {
  clearCanvas()
  pushHistory()
  setConfirmClear(false)
}
```

**Replace the existing Clear button** in the toolbar JSX:

Find this block:
```tsx
          <button
            onClick={clearCanvas}
            style={{
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
              border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text,
            }}
          >
            Clear
          </button>
```

Replace it with:
```tsx
          {confirmClear ? (
            <>
              <span style={{ fontSize: '12px', color: colors.text }}>Clear all?</span>
              <button
                aria-label="cancel clear"
                onClick={() => setConfirmClear(false)}
                style={{
                  padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                  border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text,
                }}
              >
                Cancel
              </button>
              <button
                aria-label="confirm clear"
                onClick={handleConfirmClear}
                style={{
                  padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                  background: '#ef4444', color: '#fff', border: 'none',
                }}
              >
                Clear
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text,
              }}
            >
              Clear
            </button>
          )}
```

- [ ] **Step 4: Run tests — confirm GREEN**

```powershell
cd C:\Users\victo\miniProjects\vanishBox; npm test -- src/components/SketchEditor.test.tsx
```
Expected: all 13 SketchEditor tests pass.

- [ ] **Step 5: Run full suite**

```powershell
cd C:\Users\victo\miniProjects\vanishBox; npm test
```
Expected: all tests pass. The existing SketchesSection test `getByRole('button', { name: /^Clear$/ })` still passes because it checks the editor immediately after opening (confirmClear=false by default, so the main Clear button is visible).

- [ ] **Step 6: Commit**

```
git add src/components/SketchEditor.tsx src/components/SketchEditor.test.tsx
git commit -m "feat: add clear drawing confirmation to sketch editor"
```

---

## Self-Review

### Spec coverage
- [x] Clear drawing warning — Task 2: clicking Clear shows inline "Clear all?" + Cancel/Confirm
- [x] Undo button — Task 1: ↩ Undo button, disabled until a stroke is made
- [x] Redo button — Task 1: ↪ Redo button, disabled until undo is used
- [x] Ctrl+Z shortcut — Task 1: `document` keydown listener
- [x] Ctrl+Y / Ctrl+Shift+Z shortcut — Task 1: same listener
- [x] Clear pushes to undo history — Task 2: `handleConfirmClear` calls `pushHistory()` after `clearCanvas()`
- [x] "Others that may need undo" — Notes use `<textarea>` with native browser undo/redo (no action needed); files/links are discrete operations (no inline editor to undo)

### Placeholder scan
None found.

### Type consistency
- `pushHistory()` defined and used in Task 1; called in Task 2's `handleConfirmClear` — consistent
- `historySnaps`, `historyIdxRef`, `canUndo`, `canRedo` — defined in Task 1, referenced in Task 2's test — consistent
- `confirmClear` state — defined and used entirely within Task 2 — consistent
