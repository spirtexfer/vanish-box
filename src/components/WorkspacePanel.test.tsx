import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkspacePanel } from './WorkspacePanel'
import { useWorkspaceStore } from '../store/useWorkspaceStore'

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    onDragDropEvent: vi.fn(() => Promise.resolve(() => undefined)),
  })),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

describe('WorkspacePanel', () => {
  it('renders the app name', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Vanish Box')).toBeTruthy()
  })

  it('renders the default tab name in the tab bar', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Workspace')).toBeTruthy()
  })

  it('renders section headings for files, notes, sketches', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Files')).toBeTruthy()
    expect(screen.getByText('Notes')).toBeTruthy()
    expect(screen.getByText('Sketches')).toBeTruthy()
  })

  it('renders drop-zone hints for each empty section', () => {
    render(<WorkspacePanel />)
    expect(screen.getByText('Drop files here')).toBeTruthy()
    expect(screen.getByText('No notes yet')).toBeTruthy()
    expect(screen.getByText('No sketches yet')).toBeTruthy()
  })

  it('clear tab button is present', () => {
    render(<WorkspacePanel />)
    expect(screen.getByRole('button', { name: 'clear tab' })).toBeTruthy()
  })

  it('clicking clear tab button shows confirmation dialog', () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'clear tab' }))
    expect(screen.getByText(/Clear all files, notes, and sketches/)).toBeTruthy()
  })

  it('confirming clear tab clears the active tab in the store', () => {
    const tabId = useWorkspaceStore.getState().tabs[0].id
    useWorkspaceStore.getState().addNote(tabId)
    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(1)

    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'clear tab' }))
    fireEvent.click(screen.getByRole('button', { name: 'confirm clear tab' }))

    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(0)
  })

  it('cancelling clear tab dialog leaves tab content untouched', () => {
    const tabId = useWorkspaceStore.getState().tabs[0].id
    useWorkspaceStore.getState().addNote(tabId)

    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'clear tab' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(useWorkspaceStore.getState().tabs[0].notes).toHaveLength(1)
  })

  it('settings button opens the settings panel', () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'open settings' }))
    expect(screen.getByText('Settings')).toBeTruthy()
  })

  it('settings panel can toggle dark mode', () => {
    render(<WorkspacePanel />)
    fireEvent.click(screen.getByRole('button', { name: 'open settings' }))
    const darkModeCheckbox = screen.getByRole('checkbox', { name: /Dark mode/i })
    fireEvent.click(darkModeCheckbox)
    expect(useWorkspaceStore.getState().settings.theme).toBe('dark')
  })
})
