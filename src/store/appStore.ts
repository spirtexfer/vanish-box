import { create } from 'zustand'

interface AppState {
  isPanelReady: boolean
  setIsPanelReady: (ready: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  isPanelReady: false,
  setIsPanelReady: (ready) => set({ isPanelReady: ready }),
}))
