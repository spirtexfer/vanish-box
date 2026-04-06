import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LinkCard } from './LinkCard'
import { COLORS } from '../theme'
import type { LinkItem } from '../store/useWorkspaceStore'

const baseLink: LinkItem = {
  id: 'l1',
  title: 'Example',
  url: 'https://example.com',
  createdAt: 0,
}

describe('LinkCard', () => {
  it('renders the link title', () => {
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('Example')).toBeTruthy()
  })

  it('renders the url as secondary text', () => {
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />)
    expect(screen.getByText('https://example.com')).toBeTruthy()
  })

  it('clicking the title calls onOpen with url', () => {
    const onOpen = vi.fn()
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={onOpen} onEdit={vi.fn()} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByText('Example'))
    expect(onOpen).toHaveBeenCalledWith('https://example.com')
  })

  it('clicking edit button calls onEdit with link', () => {
    const onEdit = vi.fn()
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={onEdit} onRemove={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'edit link' }))
    expect(onEdit).toHaveBeenCalledWith(baseLink)
  })

  it('clicking × calls onRemove with link id', () => {
    const onRemove = vi.fn()
    render(<LinkCard link={baseLink} colors={COLORS.light} onOpen={vi.fn()} onEdit={vi.fn()} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'remove link' }))
    expect(onRemove).toHaveBeenCalledWith('l1')
  })
})
