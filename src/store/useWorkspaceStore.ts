import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const TAB_COLORS = ['slate', 'blue', 'purple', 'green', 'amber', 'rose'] as const
export type TabColor = (typeof TAB_COLORS)[number]
export const TAB_NAME_MAX_LEN = 20

export type SectionLayout = 'list' | 'grid'
export type SectionType = 'files' | 'notes' | 'sketches'

export interface SectionConfig {
  type: SectionType
  layout: SectionLayout
}

export interface WorkspaceFile {
  id: string
  originalName: string
  storedPath: string
  size: number
  addedAt: number
}

export interface NoteCard {
  id: string
  title: string
  body: string
  collapsed: boolean
  createdAt: number
  updatedAt: number
}

export interface SketchCard {
  id: string
  title: string
  dataUrl: string | null
  collapsed: boolean
  createdAt: number
  updatedAt: number
}

export interface Tab {
  id: string
  name: string
  color: TabColor
  sections: SectionConfig[]
  files: WorkspaceFile[]
  notes: NoteCard[]
  sketches: SketchCard[]
}

export type Theme = 'light' | 'dark'

export interface Settings {
  theme: Theme
  keybind: string
  showFileSize: boolean
  showFileTimestamp: boolean
}

function makeDefaultSections(): SectionConfig[] {
  return [
    { type: 'files', layout: 'list' },
    { type: 'notes', layout: 'list' },
    { type: 'sketches', layout: 'list' },
  ]
}

function makeDefaultTab(): Tab {
  return {
    id: crypto.randomUUID(),
    name: 'Workspace',
    color: 'blue',
    sections: makeDefaultSections(),
    files: [],
    notes: [],
    sketches: [],
  }
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  keybind: 'ctrl+shift+v',
  showFileSize: true,
  showFileTimestamp: true,
}

interface WorkspaceStore {
  tabs: Tab[]
  activeTabId: string
  settings: Settings

  createTab: (name: string, color: TabColor) => void
  updateTab: (id: string, patch: Partial<Pick<Tab, 'name' | 'color'>>) => void
  setActiveTab: (id: string) => void
  clearTab: (id: string) => void

  addFiles: (tabId: string, files: WorkspaceFile[]) => void
  removeFile: (tabId: string, fileId: string) => void

  addNote: (tabId: string) => void
  updateNote: (tabId: string, noteId: string, patch: Partial<Pick<NoteCard, 'title' | 'body' | 'collapsed'>>) => void
  removeNote: (tabId: string, noteId: string) => void

  addSketch: (tabId: string) => void
  updateSketch: (tabId: string, sketchId: string, patch: Partial<Pick<SketchCard, 'title' | 'dataUrl' | 'collapsed'>>) => void
  removeSketch: (tabId: string, sketchId: string) => void

  updateSettings: (s: Partial<Settings>) => void
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => {
      const initialTab = makeDefaultTab()
      return {
        tabs: [initialTab],
        activeTabId: initialTab.id,
        settings: DEFAULT_SETTINGS,

        createTab: (name, color) => {
          const tab: Tab = {
            id: crypto.randomUUID(),
            name: name.slice(0, TAB_NAME_MAX_LEN),
            color,
            sections: makeDefaultSections(),
            files: [],
            notes: [],
            sketches: [],
          }
          set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }))
        },

        updateTab: (id, patch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...patch,
                    name:
                      patch.name !== undefined
                        ? patch.name.slice(0, TAB_NAME_MAX_LEN)
                        : t.name,
                  }
                : t
            ),
          })),

        setActiveTab: (id) => set({ activeTabId: id }),

        clearTab: (id) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === id ? { ...t, files: [], notes: [], sketches: [] } : t
            ),
          })),

        addFiles: (tabId, files) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, files: [...t.files, ...files] } : t
            ),
          })),

        removeFile: (tabId, fileId) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, files: t.files.filter((f) => f.id !== fileId) }
                : t
            ),
          })),

        addNote: (tabId) => {
          const now = Date.now()
          const note: NoteCard = {
            id: crypto.randomUUID(),
            title: 'New note',
            body: '',
            collapsed: false,
            createdAt: now,
            updatedAt: now,
          }
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, notes: [...t.notes, note] } : t
            ),
          }))
        },

        updateNote: (tabId, noteId, patch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    notes: t.notes.map((n) =>
                      n.id === noteId
                        ? { ...n, ...patch, updatedAt: Date.now() }
                        : n
                    ),
                  }
                : t
            ),
          })),

        removeNote: (tabId, noteId) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, notes: t.notes.filter((n) => n.id !== noteId) }
                : t
            ),
          })),

        addSketch: (tabId) => {
          const now = Date.now()
          const sketch: SketchCard = {
            id: crypto.randomUUID(),
            title: 'New sketch',
            dataUrl: null,
            collapsed: false,
            createdAt: now,
            updatedAt: now,
          }
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, sketches: [...t.sketches, sketch] } : t
            ),
          }))
        },

        updateSketch: (tabId, sketchId, patch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    sketches: t.sketches.map((s) =>
                      s.id === sketchId
                        ? { ...s, ...patch, updatedAt: Date.now() }
                        : s
                    ),
                  }
                : t
            ),
          })),

        removeSketch: (tabId, sketchId) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, sketches: t.sketches.filter((s) => s.id !== sketchId) }
                : t
            ),
          })),

        updateSettings: (s) =>
          set((state) => ({ settings: { ...state.settings, ...s } })),

        reset: () => {
          const tab = makeDefaultTab()
          set({ tabs: [tab], activeTabId: tab.id, settings: DEFAULT_SETTINGS })
        },
      }
    },
    { name: 'vanish-box-workspace' }
  )
)
