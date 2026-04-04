import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShelfPanel } from './ShelfPanel'

describe('ShelfPanel', () => {
  it('renders the app name', () => {
    render(<ShelfPanel />)
    expect(screen.getByText('Vanish Box')).toBeTruthy()
  })

  it('renders a drop zone hint', () => {
    render(<ShelfPanel />)
    expect(screen.getByText('Drop files here')).toBeTruthy()
  })
})
