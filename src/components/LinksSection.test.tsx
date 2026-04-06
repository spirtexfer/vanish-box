import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinksSection } from './LinksSection'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))

beforeEach(() => {
  useWorkspaceStore.getState().reset()
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('LinksSection', () => {
  it('shows "No links yet" when empty', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('No links yet')).toBeTruthy()
  })

  it('shows "+ Add link" button', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByRole('button', { name: /Add link/ })).toBeTruthy()
  })

  it('clicking "+ Add link" opens the editor', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    expect(screen.getByRole('textbox', { name: 'link url' })).toBeTruthy()
  })

  it('saving the editor creates a link in the store', () => {
    render(<LinksSection tabId={getTabId()} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: /Add link/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'link url' }), { target: { value: 'https://example.com' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'link title' }), { target: { value: 'Example' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(useWorkspaceStore.getState().tabs[0].links).toHaveLength(1)
    expect(screen.getByText('Example')).toBeTruthy()
  })

  it('clicking × removes the link', () => {
    const tabId = getTabId()
    useWorkspaceStore.getState().addLink(tabId, 'https://a.com', 'A')
    render(<LinksSection tabId={tabId} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'remove link' }))
    expect(useWorkspaceStore.getState().tabs[0].links).toHaveLength(0)
  })

  it('clicking edit button opens editor for that link', () => {
    const tabId = getTabId()
    useWorkspaceStore.getState().addLink(tabId, 'https://a.com', 'Alpha')
    render(<LinksSection tabId={tabId} colors={COLORS.light} />)
    fireEvent.click(screen.getByRole('button', { name: 'edit link' }))
    expect(screen.getByDisplayValue('Alpha')).toBeTruthy()
  })
})
