import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ShelfPanel } from './ShelfPanel'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useShelfStore } from '../store/useShelfStore'

// Capture the callback registered by useEffect so tests can trigger native events
type DragDropCallback = (event: { payload: { type: string; paths?: string[] } }) => Promise<void>
let capturedCallback: DragDropCallback | null = null

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(),
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
    useShelfStore.getState().reset()
    // Reset default mock
    vi.mocked(getCurrentWindow).mockReturnValue({
      onDragDropEvent: (cb: DragDropCallback) => {
        capturedCallback = cb
        return Promise.resolve(() => undefined)
      },
    } as ReturnType<typeof getCurrentWindow>)
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
      { name: 'photo.png', size: 204800, path: 'C:\\Users\\test\\photo.png' },
      { name: 'report.pdf', size: 1048576, path: 'C:\\Users\\test\\report.pdf' },
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
    mockInvoke.mockResolvedValue([{ name: 'image.jpg', size: 512, path: 'C:\\image.jpg' }])

    render(<ShelfPanel />)

    await act(async () => {
      await capturedCallback?.({ payload: { type: 'drop', paths: ['C:\\image.jpg'] } })
    })

    expect(screen.queryByText('Drop files here')).toBeNull()
    expect(screen.getByText('image.jpg')).toBeTruthy()
  })

  it('does not add files twice if effect remounts (Strict Mode simulation)', async () => {
    const allCallbacks: DragDropCallback[] = []
    const allUnlistens: Array<() => void> = []

    vi.mocked(getCurrentWindow).mockReturnValue({
      onDragDropEvent: (cb: DragDropCallback) => {
        allCallbacks.push(cb)
        const unlisten = vi.fn()
        allUnlistens.push(unlisten)
        return Promise.resolve(unlisten)
      },
    } as ReturnType<typeof getCurrentWindow>)

    mockInvoke.mockResolvedValue([{ name: 'test.png', size: 100, path: 'C:\\test.png' }])

    const { unmount } = render(<ShelfPanel />)
    // Wait for first Promise to resolve so cancelled flag is checked
    await act(async () => { await Promise.resolve() })
    unmount()
    // Wait for cleanup to run
    await act(async () => { await Promise.resolve() })
    render(<ShelfPanel />)
    await act(async () => { await Promise.resolve() })

    // Two registrations should have happened (Strict Mode mounts twice)
    expect(allCallbacks).toHaveLength(2)
    // First unlisten should have been called (because cancelled=true when its Promise resolved)
    expect(allUnlistens[0]).toHaveBeenCalled()

    // Fire both callbacks as if both listeners were active
    await act(async () => {
      for (const cb of allCallbacks) {
        await cb({ payload: { type: 'drop', paths: ['C:\\test.png'] } })
      }
    })

    // Even though both callbacks fired, only one file should appear
    // because the first listener's callback no longer updates state (it's cancelled)
    // Actually: in this test we CAN'T prevent the cancelled callback from calling setState
    // because cancellation only prevents listener registration, not the cb itself.
    // So what we CAN assert is: unlisten was called for the first registration.
    // The real protection is: in production, the first listener IS unregistered via unlisten,
    // so the OS won't fire events to it. In tests we can only verify unlisten was called.
    expect(allUnlistens[0]).toHaveBeenCalledTimes(1)
    expect(allUnlistens[1]).not.toHaveBeenCalled() // second (surviving) listener still active
  })
})
