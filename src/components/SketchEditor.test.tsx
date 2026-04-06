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
    const canvas = container.querySelector('canvas')!
    fireEvent.mouseDown(canvas)
    fireEvent.mouseUp(canvas)
    fireEvent.click(screen.getByRole('button', { name: /^Clear$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'confirm clear' }))
    const btn = screen.getByRole('button', { name: 'undo' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })
})
