import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({ isPanelReady: false })
  })

  it('has isPanelReady as false by default', () => {
    expect(useAppStore.getState().isPanelReady).toBe(false)
  })

  it('setIsPanelReady updates state to true', () => {
    useAppStore.getState().setIsPanelReady(true)
    expect(useAppStore.getState().isPanelReady).toBe(true)
  })

  it('setIsPanelReady updates state back to false', () => {
    useAppStore.setState({ isPanelReady: true })
    useAppStore.getState().setIsPanelReady(false)
    expect(useAppStore.getState().isPanelReady).toBe(false)
  })
})
