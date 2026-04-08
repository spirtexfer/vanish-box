import { create } from 'zustand'
import type { NoteCard, SketchCard, LinkItem } from './useWorkspaceStore'

export type UndoEntry =
  | { type: 'note'; tabId: string; item: NoteCard }
  | { type: 'sketch'; tabId: string; item: SketchCard }
  | { type: 'link'; tabId: string; item: LinkItem }

interface UndoStore {
  stack: UndoEntry[]
  push: (entry: UndoEntry) => void
  pop: () => UndoEntry | undefined
  clear: () => void
}

export const useUndoStore = create<UndoStore>()((set, get) => ({
  stack: [],
  push: (entry) => set((s) => ({ stack: [...s.stack, entry] })),
  pop: () => {
    const stack = get().stack
    if (stack.length === 0) return undefined
    const entry = stack[stack.length - 1]
    set({ stack: stack.slice(0, -1) })
    return entry
  },
  clear: () => set({ stack: [] }),
}))
