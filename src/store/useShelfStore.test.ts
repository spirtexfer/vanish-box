import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useShelfStore } from './useShelfStore'
import type { ShelfFile } from './useShelfStore'

const makeFile = (id: string, overrides: Partial<ShelfFile> = {}): ShelfFile => ({
  id,
  name: `file-${id}.txt`,
  size: 1024,
  path: `/tmp/file-${id}.txt`,
  addedAt: Date.now(),
  ...overrides,
})

beforeEach(() => {
  useShelfStore.setState({
    files: [],
    notepad: '',
    settings: {
      showSize: true,
      showTimestamp: true,
      showCountdown: true,
      theme: 'light',
      keybind: 'ctrl+shift+v',
      resetConfig: { type: 'daily', time: '00:00' },
    },
  })
})

describe('useShelfStore — initial state', () => {
  it('files starts as an empty array', () => {
    const { result } = renderHook(() => useShelfStore())
    expect(result.current.files).toEqual([])
  })

  it('notepad starts as an empty string', () => {
    const { result } = renderHook(() => useShelfStore())
    expect(result.current.notepad).toBe('')
  })
})

describe('useShelfStore — addFiles', () => {
  it('appends files to the list', () => {
    const { result } = renderHook(() => useShelfStore())
    const file1 = makeFile('1')
    const file2 = makeFile('2')

    act(() => {
      result.current.addFiles([file1])
    })
    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].id).toBe('1')

    act(() => {
      result.current.addFiles([file2])
    })
    expect(result.current.files).toHaveLength(2)
    expect(result.current.files[1].id).toBe('2')
  })

  it('can add multiple files at once', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.addFiles([makeFile('a'), makeFile('b'), makeFile('c')])
    })
    expect(result.current.files).toHaveLength(3)
  })
})

describe('useShelfStore — removeFile', () => {
  it('removes the file with the given id', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.addFiles([makeFile('1'), makeFile('2'), makeFile('3')])
    })

    act(() => {
      result.current.removeFile('2')
    })

    expect(result.current.files).toHaveLength(2)
    expect(result.current.files.find((f) => f.id === '2')).toBeUndefined()
  })

  it('leaves other files untouched after removal', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.addFiles([makeFile('1'), makeFile('2')])
    })

    act(() => {
      result.current.removeFile('1')
    })

    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].id).toBe('2')
  })
})

describe('useShelfStore — reset', () => {
  it('clears files and notepad together', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.addFiles([makeFile('1'), makeFile('2')])
      result.current.setNotepad('some notes')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.files).toEqual([])
    expect(result.current.notepad).toBe('')
  })

  it('does not reset settings', () => {
    const { result } = renderHook(() => useShelfStore())
    act(() => {
      result.current.updateSettings({ theme: 'dark' })
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.settings.theme).toBe('dark')
  })
})

describe('useShelfStore — updateSettings', () => {
  it('merges partial settings without clobbering unrelated fields', () => {
    const { result } = renderHook(() => useShelfStore())

    act(() => {
      result.current.updateSettings({ theme: 'dark' })
    })

    expect(result.current.settings.theme).toBe('dark')
    expect(result.current.settings.showSize).toBe(true)
    expect(result.current.settings.showTimestamp).toBe(true)
    expect(result.current.settings.keybind).toBe('ctrl+shift+v')
  })

  it('can update multiple settings fields at once', () => {
    const { result } = renderHook(() => useShelfStore())

    act(() => {
      result.current.updateSettings({ showSize: false, showCountdown: false })
    })

    expect(result.current.settings.showSize).toBe(false)
    expect(result.current.settings.showCountdown).toBe(false)
    expect(result.current.settings.showTimestamp).toBe(true)
  })

  it('can update resetConfig', () => {
    const { result } = renderHook(() => useShelfStore())

    act(() => {
      result.current.updateSettings({ resetConfig: { type: 'interval', minutes: 60 } })
    })

    expect(result.current.settings.resetConfig).toEqual({ type: 'interval', minutes: 60 })
  })
})
