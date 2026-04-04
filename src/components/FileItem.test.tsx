import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileItem } from './FileItem'

const baseFile = {
  id: 'test-id',
  name: 'photo.png',
  size: 204800,
  path: 'C:\\Users\\test\\photo.png',
  addedAt: new Date('2026-04-04T10:00:00').getTime(),
}

const baseSettings = {
  showSize: true,
  showTimestamp: true,
  showCountdown: true,
  theme: 'light' as const,
  keybind: 'ctrl+shift+v',
  resetConfig: { type: 'daily' as const, time: '00:00' },
}

describe('FileItem', () => {
  it('renders file name', () => {
    render(
      <FileItem
        file={baseFile}
        settings={baseSettings}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText('photo.png')).toBeTruthy()
  })

  it('shows size when showSize is true', () => {
    render(
      <FileItem
        file={baseFile}
        settings={{ ...baseSettings, showSize: true }}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByText('200.0 KB')).toBeTruthy()
  })

  it('hides size when showSize is false', () => {
    render(
      <FileItem
        file={baseFile}
        settings={{ ...baseSettings, showSize: false }}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
      />
    )
    expect(screen.queryByText('200.0 KB')).toBeNull()
  })

  it('calls onRemove with file id when × button is clicked', () => {
    const onRemove = vi.fn()
    render(
      <FileItem
        file={baseFile}
        settings={baseSettings}
        onRemove={onRemove}
        onOpen={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(onRemove).toHaveBeenCalledWith('test-id')
  })

  it('calls onOpen with file path when name span is clicked', () => {
    const onOpen = vi.fn()
    render(
      <FileItem
        file={baseFile}
        settings={baseSettings}
        onRemove={vi.fn()}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByText('photo.png'))
    expect(onOpen).toHaveBeenCalledWith('C:\\Users\\test\\photo.png')
  })

  it('shows timestamp element when showTimestamp is true', () => {
    render(
      <FileItem
        file={baseFile}
        settings={{ ...baseSettings, showTimestamp: true }}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
      />
    )
    expect(screen.getByTestId('file-timestamp')).toBeTruthy()
  })

  it('hides timestamp element when showTimestamp is false', () => {
    render(
      <FileItem
        file={baseFile}
        settings={{ ...baseSettings, showTimestamp: false }}
        onRemove={vi.fn()}
        onOpen={vi.fn()}
      />
    )
    expect(screen.queryByTestId('file-timestamp')).toBeNull()
  })

  it('clicking remove does not call onOpen', () => {
    const onOpen = vi.fn()
    const onRemove = vi.fn()
    render(
      <FileItem
        file={baseFile}
        settings={baseSettings}
        onRemove={onRemove}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(onOpen).not.toHaveBeenCalled()
    expect(onRemove).toHaveBeenCalledWith('test-id')
  })
})
