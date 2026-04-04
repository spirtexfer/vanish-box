import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ShelfPanel } from './ShelfPanel'

// Capture the callback registered by useEffect so tests can trigger native events
type DragDropCallback = (event: { payload: { type: string; paths?: string[] } }) => Promise<void>
let capturedCallback: DragDropCallback | null = null

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({
    onDragDropEvent: (cb: DragDropCallback) => {
      capturedCallback = cb
      return Promise.resolve(() => undefined)
    },
  }),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// Import after mocks are set up
import { invoke } from '@tauri-apps/api/core'
const mockInvoke = invoke as ReturnType<typeof vi.fn>

describe('ShelfPanel', () => {
  beforeEach(() => {
    capturedCallback = null
    mockInvoke.mockReset()
  })

  it('renders the app name', () => {
    render(<ShelfPanel />)
    expect(screen.getByText('Vanish Box')).toBeTruthy()
  })

  it('renders a drop zone hint when no files are present', () => {
    render(<ShelfPanel />)
    expect(screen.getByText('Drop files here')).toBeTruthy()
  })

  it('renders file list after native drop event resolves', async () => {
    mockInvoke.mockResolvedValue([
      { name: 'photo.png', size: 204800 },
      { name: 'report.pdf', size: 1048576 },
    ])

    render(<ShelfPanel />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['C:\\Users\\test\\photo.png', 'C:\\Users\\test\\report.pdf'] } })
    })

    expect(screen.getByText('photo.png')).toBeTruthy()
    expect(screen.getByText('report.pdf')).toBeTruthy()
    expect(screen.getByText('200.0 KB')).toBeTruthy()
    expect(screen.getByText('1.0 MB')).toBeTruthy()
  })

  it('hides the drop hint once files are present', async () => {
    mockInvoke.mockResolvedValue([{ name: 'image.jpg', size: 512 }])

    render(<ShelfPanel />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['C:\\image.jpg'] } })
    })

    expect(screen.queryByText('Drop files here')).toBeNull()
    expect(screen.getByText('image.jpg')).toBeTruthy()
  })

  it('does not add files twice if effect remounts (Strict Mode simulation)', async () => {
    mockInvoke.mockResolvedValue([{ name: 'test.png', size: 100 }])

    const { unmount } = render(<ShelfPanel />)
    // Simulate Strict Mode: unmount before Promise resolves, then re-render
    unmount()
    render(<ShelfPanel />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['C:\\test.png'] } })
    })

    expect(screen.queryAllByText('test.png')).toHaveLength(1)
  })
})
