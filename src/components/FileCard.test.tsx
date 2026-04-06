import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileCard } from './FileCard'
import { COLORS } from '../theme'
import type { WorkspaceFile, Settings } from '../store/useWorkspaceStore'

const baseFile: WorkspaceFile = {
  id: 'f1',
  originalName: 'photo.png',
  storedPath: '/app/files/123_photo.png',
  sourcePath: '/original/photo.png',
  size: 204800,
  addedAt: new Date('2026-04-05T10:00:00').getTime(),
}

const baseSettings: Settings = {
  theme: 'light',
  keybind: 'ctrl+shift+v',
  showFileSize: true,
  showFileTimestamp: true,
}

describe('FileCard', () => {
  it('renders the original file name', () => {
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByText('photo.png')).toBeTruthy()
  })

  it('shows size when showFileSize is true', () => {
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByText('200.0 KB')).toBeTruthy()
  })

  it('hides size when showFileSize is false', () => {
    render(
      <FileCard
        file={baseFile}
        settings={{ ...baseSettings, showFileSize: false }}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.queryByText('200.0 KB')).toBeNull()
  })

  it('shows timestamp when showFileTimestamp is true', () => {
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.getByTestId('file-timestamp')).toBeTruthy()
  })

  it('hides timestamp when showFileTimestamp is false', () => {
    render(
      <FileCard
        file={baseFile}
        settings={{ ...baseSettings, showFileTimestamp: false }}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    expect(screen.queryByTestId('file-timestamp')).toBeNull()
  })

  it('clicking name calls onOpen with storedPath', () => {
    const onOpen = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={onOpen}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('photo.png'))
    expect(onOpen).toHaveBeenCalledWith('/app/files/123_photo.png')
  })

  it('clicking × calls onRemove with file id and does not call onOpen', () => {
    const onRemove = vi.fn()
    const onOpen = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={onOpen}
        onRemove={onRemove}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(onRemove).toHaveBeenCalledWith('f1')
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('clicking 🗑 calls onDelete with file id and storedPath and does not call onOpen', () => {
    const onDelete = vi.fn()
    const onOpen = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={onOpen}
        onRemove={vi.fn()}
        onDelete={onDelete}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    expect(onDelete).toHaveBeenCalledWith('f1', '/original/photo.png', '/app/files/123_photo.png')
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('clicking ↑ calls onMoveUp with file id', () => {
    const onMoveUp = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={onMoveUp}
        onMoveDown={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'move up' }))
    expect(onMoveUp).toHaveBeenCalledWith('f1')
  })

  it('clicking ↓ calls onMoveDown with file id', () => {
    const onMoveDown = vi.fn()
    render(
      <FileCard
        file={baseFile}
        settings={baseSettings}
        colors={COLORS.light}
        onOpen={vi.fn()}
        onRemove={vi.fn()}
        onDelete={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={onMoveDown}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'move down' }))
    expect(onMoveDown).toHaveBeenCalledWith('f1')
  })
})
