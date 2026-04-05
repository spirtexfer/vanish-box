import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SketchesSection } from './SketchesSection'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('SketchesSection', () => {
  it('shows "No sketches yet" when empty', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('No sketches yet')).toBeTruthy()
  })

  it('shows "+ Add sketch" button', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: /Add sketch/ })).toBeTruthy()
  })

  it('clicking "+ Add sketch" creates a sketch in the store', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    expect(useWorkspaceStore.getState().tabs[0].sketches).toHaveLength(1)
  })

  it('sketch card is rendered after adding', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    expect(screen.getByText('New sketch')).toBeTruthy()
  })

  it('clicking sketch card opens the editor', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    fireEvent.click(screen.getByText('New sketch'))
    // SketchEditor renders Pen / Eraser / Clear buttons
    expect(screen.getByRole('button', { name: /^Pen$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Eraser$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Clear$/ })).toBeTruthy()
  })

  it('clicking × removes the sketch', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    fireEvent.click(screen.getByRole('button', { name: 'remove sketch' }))
    expect(useWorkspaceStore.getState().tabs[0].sketches).toHaveLength(0)
  })

  it('clicking collapse toggle collapses the sketch', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    expect(useWorkspaceStore.getState().tabs[0].sketches[0].collapsed).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'toggle collapse' }))
    expect(useWorkspaceStore.getState().tabs[0].sketches[0].collapsed).toBe(true)
  })

  it('cancelling the editor does not save', () => {
    render(<SketchesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add sketch/ }))
    fireEvent.click(screen.getByText('New sketch'))
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))
    expect(useWorkspaceStore.getState().tabs[0].sketches[0].dataUrl).toBeNull()
  })
})
