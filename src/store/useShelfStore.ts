import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ShelfFile {
  id: string
  name: string
  size: number
  path: string
  addedAt: number // Date.now() ms
}

export type Theme = 'light' | 'dark'

export type ResetConfig =
  | { type: 'daily'; time: string }   // "HH:MM" e.g. "00:00"
  | { type: 'interval'; minutes: number }

export interface Settings {
  showSize: boolean
  showTimestamp: boolean
  showCountdown: boolean
  theme: Theme
  keybind: string
  resetConfig: ResetConfig
}

interface ShelfStore {
  files: ShelfFile[]
  notepad: string
  settings: Settings
  addFiles: (files: ShelfFile[]) => void
  removeFile: (id: string) => void
  setNotepad: (text: string) => void
  updateSettings: (s: Partial<Settings>) => void
  reset: () => void
}

const defaultSettings: Settings = {
  showSize: true,
  showTimestamp: true,
  showCountdown: true,
  theme: 'light',
  keybind: 'ctrl+shift+v',
  resetConfig: { type: 'daily', time: '00:00' },
}

export const useShelfStore = create<ShelfStore>()(
  persist(
    (set) => ({
      files: [],
      notepad: '',
      settings: defaultSettings,
      addFiles: (files) => set((state) => ({ files: [...state.files, ...files] })),
      removeFile: (id) =>
        set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
      setNotepad: (text) => set({ notepad: text }),
      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),
      reset: () => set({ files: [], notepad: '' }),
    }),
    { name: 'vanish-box-shelf' }
  )
)
