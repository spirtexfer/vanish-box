import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinkEditor } from './LinkEditor'
import { COLORS } from '../theme'
import type { LinkItem } from '../store/useWorkspaceStore'

const baseLink: LinkItem = { id: 'l1', title: 'Example', url: 'https://example.com', createdAt: 0 }

describe('LinkEditor', () => {
  it('renders title and url inputs pre-filled', () => {
    render(<LinkEditor link={baseLink} colors={COLORS.light} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('Example')).toBeTruthy()
    expect(screen.getByDisplayValue('https://example.com')).toBeTruthy()
  })

  it('Save calls onSave with updated values then onClose', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<LinkEditor link={baseLink} colors={COLORS.light} onSave={onSave} onClose={onClose} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'link title' }), { target: { value: 'Updated' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(onSave).toHaveBeenCalledWith({ title: 'Updated', url: 'https://example.com' })
    expect(onClose).toHaveBeenCalled()
  })

  it('Cancel calls onClose without saving', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<LinkEditor link={baseLink} colors={COLORS.light} onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))
    expect(onSave).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('saves with hostname fallback when title is blank', () => {
    const onSave = vi.fn()
    render(<LinkEditor link={{ ...baseLink, title: '' }} colors={COLORS.light} onSave={onSave} onClose={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'link title' }), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(onSave).toHaveBeenCalledWith({ title: 'example.com', url: 'https://example.com' })
  })
})
