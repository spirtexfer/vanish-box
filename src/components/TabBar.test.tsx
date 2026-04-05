import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from './TabBar'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

describe('TabBar', () => {
  it('renders the default tab name', () => {
    render(<TabBar colors={COLORS.light} />)
    expect(screen.getByText('Workspace')).toBeTruthy()
  })

  it('shows the + button', () => {
    render(<TabBar colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: 'new tab' })).toBeTruthy()
  })

  it('clicking + reveals create form with name input', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    expect(screen.getByPlaceholderText('Tab name')).toBeTruthy()
  })

  it('pressing Enter in create form adds a tab and hides the form', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    const input = screen.getByPlaceholderText('Tab name')
    fireEvent.change(input, { target: { value: 'Research' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useWorkspaceStore.getState().tabs).toHaveLength(2)
    expect(useWorkspaceStore.getState().tabs[1].name).toBe('Research')
    expect(screen.queryByPlaceholderText('Tab name')).toBeNull()
  })

  it('pressing Escape in create form cancels without adding a tab', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    fireEvent.keyDown(screen.getByPlaceholderText('Tab name'), { key: 'Escape' })
    expect(useWorkspaceStore.getState().tabs).toHaveLength(1)
  })

  it('clicking Add button submits the create form', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    const input = screen.getByPlaceholderText('Tab name')
    fireEvent.change(input, { target: { value: 'Tasks' } })
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }))
    expect(useWorkspaceStore.getState().tabs[1].name).toBe('Tasks')
  })

  it('empty name defaults to "Workspace"', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    fireEvent.keyDown(screen.getByPlaceholderText('Tab name'), { key: 'Enter' })
    expect(useWorkspaceStore.getState().tabs[1].name).toBe('Workspace')
  })

  it('clicking a tab makes it active', () => {
    const store = useWorkspaceStore.getState()
    store.createTab('Dev', 'green')
    const tabs = useWorkspaceStore.getState().tabs
    store.setActiveTab(tabs[0].id)
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByText('Dev'))
    expect(useWorkspaceStore.getState().activeTabId).toBe(tabs[1].id)
  })

  it('double-clicking a tab shows rename input', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.dblClick(screen.getByText('Workspace'))
    const input = screen.getByDisplayValue('Workspace')
    expect(input.tagName).toBe('INPUT')
  })

  it('renaming a tab on Enter updates the store', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.dblClick(screen.getByText('Workspace'))
    const input = screen.getByDisplayValue('Workspace')
    fireEvent.change(input, { target: { value: 'Main' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(useWorkspaceStore.getState().tabs[0].name).toBe('Main')
  })

  it('color picker buttons are shown when creating a tab', () => {
    render(<TabBar colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'new tab' }))
    expect(screen.getAllByRole('button', { name: /^color-/ })).toHaveLength(6)
  })
})
