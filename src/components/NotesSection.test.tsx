import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotesSection } from './NotesSection'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('NotesSection', () => {
  it('shows "No notes yet" when empty', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('No notes yet')).toBeTruthy()
  })

  it('shows "+ Add note" button', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: /Add note/ })).toBeTruthy()
  })

  it('clicking "+ Add note" creates a note in the store', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(1)
  })

  it('note card is rendered after adding', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    expect(screen.getByText('New note')).toBeTruthy()
  })

  it('clicking note card opens the editor', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    fireEvent.click(screen.getByText('New note'))
    // Editor should render a textarea
    expect(screen.getByRole('textbox', { name: /note body/i })).toBeTruthy()
  })

  it('saving the editor updates the note title in the store', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    // open editor by clicking the note card title span
    fireEvent.click(screen.getByText('New note'))
    const titleInput = screen.getByDisplayValue('New note')
    fireEvent.change(titleInput, { target: { value: 'My ideas' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(useWorkspaceStore.getState().tabs[0].notes[0].title).toBe('My ideas')
  })

  it('clicking × removes the note', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    fireEvent.click(screen.getByRole('button', { name: 'remove note' }))
    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(0)
  })

  it('clicking collapse toggle collapses the note', () => {
    render(<NotesSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add note/ }))
    expect(useWorkspaceStore.getState().tabs[0].notes[0].collapsed).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'toggle collapse' }))
    expect(useWorkspaceStore.getState().tabs[0].notes[0].collapsed).toBe(true)
  })
})
