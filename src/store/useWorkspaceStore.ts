import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const TAB_COLORS = ['slate', 'blue', 'purple', 'green', 'amber', 'rose'] as const
export type TabColor = (typeof TAB_COLORS)[number]
export const TAB_NAME_MAX_LEN = 20

export type TabTemplate = 'blank' | 'research' | 'coding' | 'planning'

export type SectionLayout = 'list' | 'grid'
export type SectionType = 'files' | 'notes' | 'sketches' | 'links'

export interface SectionConfig {
  type: SectionType
  layout: SectionLayout
}

export interface WorkspaceFile {
  id: string
  originalName: string
  storedPath: string
  sourcePath: string
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

export interface LinkItem {
  id: string
  title: string
  url: string
  createdAt: number
}

export interface Tab {
  id: string
  name: string
  color: TabColor
  sections: SectionConfig[]
  files: WorkspaceFile[]
  notes: NoteCard[]
  sketches: SketchCard[]
  links: LinkItem[]
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
    { type: 'links', layout: 'list' },
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
    links: [],
  }
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  keybind: 'ctrl+shift+j',
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
  deleteTab: (id: string) => void
  clearTab: (id: string) => void

  addFiles: (tabId: string, files: WorkspaceFile[]) => void
  removeFile: (tabId: string, fileId: string) => void

  reorderTabs: (fromIndex: number, toIndex: number) => void
  reorderFiles: (tabId: string, fromIndex: number, toIndex: number) => void
  reorderNotes: (tabId: string, fromIndex: number, toIndex: number) => void
  reorderSketches: (tabId: string, fromIndex: number, toIndex: number) => void
  reorderLinks: (tabId: string, fromIndex: number, toIndex: number) => void

  addNote: (tabId: string) => void
  updateNote: (tabId: string, noteId: string, patch: Partial<Pick<NoteCard, 'title' | 'body' | 'collapsed'>>) => void
  removeNote: (tabId: string, noteId: string) => void

  addSketch: (tabId: string) => void
  updateSketch: (tabId: string, sketchId: string, patch: Partial<Pick<SketchCard, 'title' | 'dataUrl' | 'collapsed'>>) => void
  removeSketch: (tabId: string, sketchId: string) => void

  addLink: (tabId: string, url: string, title: string) => void
  updateLink: (tabId: string, linkId: string, patch: Partial<Pick<LinkItem, 'title' | 'url'>>) => void
  removeLink: (tabId: string, linkId: string) => void

  moveFile: (fromTabId: string, toTabId: string, fileId: string) => void
  moveNote: (fromTabId: string, toTabId: string, noteId: string) => void
  moveSketch: (fromTabId: string, toTabId: string, sketchId: string) => void
  moveLink: (fromTabId: string, toTabId: string, linkId: string) => void

  restoreNote: (tabId: string, note: NoteCard) => void
  restoreSketch: (tabId: string, sketch: SketchCard) => void
  restoreLink: (tabId: string, link: LinkItem) => void
  restoreTabContent: (tabId: string, content: { files: WorkspaceFile[]; notes: NoteCard[]; sketches: SketchCard[]; links: LinkItem[] }) => void

  createTabFromTemplate: (template: TabTemplate, color: TabColor) => void

  updateSettings: (s: Partial<Settings>) => void
  reset: () => void
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

export function hostnameOrUrl(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

export function migrateStore(state: any, fromVersion: number): any {
  if (fromVersion < 1) {
    state = {
      ...state,
      tabs: (state.tabs ?? []).map((tab: any) => ({
        ...tab,
        links: tab.links ?? [],
        files: (tab.files ?? []).map((f: any) => ({
          ...f,
          sourcePath: f.sourcePath ?? '',
        })),
        sections: (tab.sections ?? []).some((s: any) => s.type === 'links')
          ? tab.sections
          : [...(tab.sections ?? []), { type: 'links', layout: 'list' }],
      })),
    }
  }
  return state
}

export const TEMPLATE_NAMES: Record<TabTemplate, string> = {
  blank: 'Workspace',
  research: 'Research',
  coding: 'Coding',
  planning: 'Planning',
}

const TEMPLATE_NOTES: Record<TabTemplate, string[]> = {
  blank: [],
  research: ['Sources', 'Summary'],
  coding: ['TODO', 'Notes'],
  planning: ['Goals', 'Next steps'],
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
            links: [],
          }
          set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }))
        },

        createTabFromTemplate: (template, color) => {
          const now = Date.now()
          const notes: NoteCard[] = TEMPLATE_NOTES[template].map((title) => ({
            id: crypto.randomUUID(),
            title,
            body: '',
            collapsed: false,
            createdAt: now,
            updatedAt: now,
          }))
          const tab: Tab = {
            id: crypto.randomUUID(),
            name: TEMPLATE_NAMES[template],
            color,
            sections: makeDefaultSections(),
            files: [],
            notes,
            sketches: [],
            links: [],
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

        deleteTab: (id) =>
          set((state) => {
            if (state.tabs.length <= 1) return state
            const newTabs = state.tabs.filter((t) => t.id !== id)
            const newActiveId =
              state.activeTabId === id
                ? newTabs[newTabs.length - 1].id
                : state.activeTabId
            return { tabs: newTabs, activeTabId: newActiveId }
          }),

        clearTab: (id) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === id ? { ...t, files: [], notes: [], sketches: [], links: [] } : t
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

        reorderTabs: (fromIndex, toIndex) =>
          set((state) => ({ tabs: arrayMove(state.tabs, fromIndex, toIndex) })),

        reorderFiles: (tabId, fromIndex, toIndex) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, files: arrayMove(t.files, fromIndex, toIndex) } : t
            ),
          })),

        reorderNotes: (tabId, fromIndex, toIndex) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, notes: arrayMove(t.notes, fromIndex, toIndex) } : t
            ),
          })),

        reorderSketches: (tabId, fromIndex, toIndex) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, sketches: arrayMove(t.sketches, fromIndex, toIndex) } : t
            ),
          })),

        reorderLinks: (tabId, fromIndex, toIndex) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, links: arrayMove(t.links, fromIndex, toIndex) } : t
            ),
          })),

        moveFile: (fromTabId, toTabId, fileId) =>
          set((state) => {
            const file = state.tabs.find((t) => t.id === fromTabId)?.files.find((f) => f.id === fileId)
            if (!file) return state
            return {
              tabs: state.tabs.map((t) => {
                if (t.id === fromTabId) return { ...t, files: t.files.filter((f) => f.id !== fileId) }
                if (t.id === toTabId) return { ...t, files: [...t.files, file] }
                return t
              }),
            }
          }),

        moveNote: (fromTabId, toTabId, noteId) =>
          set((state) => {
            const note = state.tabs.find((t) => t.id === fromTabId)?.notes.find((n) => n.id === noteId)
            if (!note) return state
            return {
              tabs: state.tabs.map((t) => {
                if (t.id === fromTabId) return { ...t, notes: t.notes.filter((n) => n.id !== noteId) }
                if (t.id === toTabId) return { ...t, notes: [...t.notes, note] }
                return t
              }),
            }
          }),

        moveSketch: (fromTabId, toTabId, sketchId) =>
          set((state) => {
            const sketch = state.tabs.find((t) => t.id === fromTabId)?.sketches.find((s) => s.id === sketchId)
            if (!sketch) return state
            return {
              tabs: state.tabs.map((t) => {
                if (t.id === fromTabId) return { ...t, sketches: t.sketches.filter((s) => s.id !== sketchId) }
                if (t.id === toTabId) return { ...t, sketches: [...t.sketches, sketch] }
                return t
              }),
            }
          }),

        moveLink: (fromTabId, toTabId, linkId) =>
          set((state) => {
            const link = state.tabs.find((t) => t.id === fromTabId)?.links.find((l) => l.id === linkId)
            if (!link) return state
            return {
              tabs: state.tabs.map((t) => {
                if (t.id === fromTabId) return { ...t, links: t.links.filter((l) => l.id !== linkId) }
                if (t.id === toTabId) return { ...t, links: [...t.links, link] }
                return t
              }),
            }
          }),

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

        addLink: (tabId, url, title) => {
          const trimmedUrl = url.trim()
          const link: LinkItem = {
            id: crypto.randomUUID(),
            title: title.trim() || hostnameOrUrl(trimmedUrl),
            url: trimmedUrl,
            createdAt: Date.now(),
          }
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, links: [...t.links, link] } : t
            ),
          }))
        },

        updateLink: (tabId, linkId, patch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, links: t.links.map((l) => l.id === linkId ? { ...l, ...patch } : l) }
                : t
            ),
          })),

        removeLink: (tabId, linkId) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? { ...t, links: t.links.filter((l) => l.id !== linkId) }
                : t
            ),
          })),

        restoreNote: (tabId, note) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, notes: [note, ...t.notes] } : t
            ),
          })),

        restoreSketch: (tabId, sketch) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, sketches: [sketch, ...t.sketches] } : t
            ),
          })),

        restoreLink: (tabId, link) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId ? { ...t, links: [link, ...t.links] } : t
            ),
          })),

        restoreTabContent: (tabId, content) =>
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === tabId
                ? {
                    ...t,
                    files: [...content.files, ...t.files],
                    notes: [...content.notes, ...t.notes],
                    sketches: [...content.sketches, ...t.sketches],
                    links: [...content.links, ...t.links],
                  }
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
    { name: 'vanish-box-workspace', version: 2, migrate: migrateStore }
  )
)
