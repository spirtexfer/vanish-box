import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { FilesSection } from './FilesSection'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { COLORS } from '../theme'

type DragDropCallback = (event: { payload: { type: string; paths?: string[] } }) => Promise<void>
let capturedCallback: DragDropCallback | null = null

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { invoke } from '@tauri-apps/api/core'
const mockInvoke = invoke as ReturnType<typeof vi.fn>

beforeEach(() => {
  capturedCallback = null
  mockInvoke.mockReset()
  useWorkspaceStore.getState().reset()
  vi.mocked(getCurrentWindow).mockReturnValue({
    onDragDropEvent: (cb: DragDropCallback) => {
      capturedCallback = cb
      return Promise.resolve(() => undefined)
    },
  } as ReturnType<typeof getCurrentWindow>)
})

function getTabId() {
  return useWorkspaceStore.getState().tabs[0].id
}

describe('FilesSection', () => {
  it('shows drop zone hint when no files are present', () => {
    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)
    expect(screen.getByText('Drop files here')).toBeTruthy()
  })

  it('renders file list after native drop event', async () => {
    mockInvoke.mockResolvedValue({
      id: '123_photo.png',
      original_name: 'photo.png',
      stored_path: '/app/files/123_photo.png',
      source_path: '/source/photo.png',
      size: 204800,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/source/photo.png'] } })
    })

    expect(screen.getByText('photo.png')).toBeTruthy()
    expect(screen.queryByText('Drop files here')).toBeNull()
  })

  it('calls copy_file invoke for each dropped path', async () => {
    mockInvoke.mockResolvedValue({
      id: 'ts_a.txt',
      original_name: 'a.txt',
      stored_path: '/app/files/ts_a.txt',
      source_path: '/src/a.txt',
      size: 100,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({
        payload: { type: 'drop', paths: ['/src/a.txt', '/src/b.txt'] },
      })
    })

    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(mockInvoke).toHaveBeenCalledWith('copy_file', { source: '/src/a.txt' })
    expect(mockInvoke).toHaveBeenCalledWith('copy_file', { source: '/src/b.txt' })
  })

  it('does not crash if copy_file fails for some files', async () => {
    mockInvoke
      .mockResolvedValueOnce({ id: 'ts_ok.txt', original_name: 'ok.txt', stored_path: '/app/ok.txt', source_path: '/src/ok.txt', size: 10 })
      .mockRejectedValueOnce(new Error('permission denied'))

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({
        payload: { type: 'drop', paths: ['/src/ok.txt', '/src/locked.txt'] },
      })
    })

    expect(screen.getByText('ok.txt')).toBeTruthy()
  })

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    mockInvoke.mockResolvedValue({
      id: 'ts_img.png',
      original_name: 'img.png',
      stored_path: '/app/img.png',
      source_path: '/src/img.png',
      size: 512,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/src/img.png'] } })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    })

    expect(screen.getByText(/Delete this file from your computer/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Delete$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeTruthy()
  })

  it('confirming delete calls trash_file with sourcePath and storedPath and removes file from store', async () => {
    mockInvoke
      .mockResolvedValueOnce({ id: 'ts_doc.pdf', original_name: 'doc.pdf', stored_path: '/app/doc.pdf', source_path: '/src/doc.pdf', size: 1024 })
      .mockResolvedValueOnce(undefined) // trash_file

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/src/doc.pdf'] } })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Delete$/ }))
    })

    expect(mockInvoke).toHaveBeenCalledWith('trash_file', { sourcePath: '/src/doc.pdf', storedPath: '/app/doc.pdf' })
    expect(screen.queryByText('doc.pdf')).toBeNull()
  })

  it('cancelling the delete dialog leaves the file in place', async () => {
    mockInvoke.mockResolvedValue({
      id: 'ts_keep.txt',
      original_name: 'keep.txt',
      stored_path: '/app/keep.txt',
      source_path: '/src/keep.txt',
      size: 100,
    })

    render(<FilesSection tabId={getTabId()} colors={COLORS.light} />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['/src/keep.txt'] } })
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    })
    fireEvent.click(screen.getByRole('button', { name: /Cancel/ }))

    expect(screen.getByText('keep.txt')).toBeTruthy()
  })
})
