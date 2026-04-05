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

  it('theme toggle button is present', () => {
    render(<WorkspacePanel />)
    expect(screen.getByRole('button', { name: 'toggle theme' })).toBeTruthy()
  })

  it('clicking theme toggle switches theme in store', () => {
    render(<WorkspacePanel />)
    expect(useWorkspaceStore.getState().settings.theme).toBe('light')
    fireEvent.click(screen.getByRole('button', { name: 'toggle theme' }))
    expect(useWorkspaceStore.getState().settings.theme).toBe('dark')
  })
})
