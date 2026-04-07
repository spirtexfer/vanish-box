import type { Theme } from './store/useWorkspaceStore'

export interface ColorTokens {
  bg: string
  bgSecondary: string
  bgCard: string
  bgHover: string
  border: string
  text: string
  textMuted: string
  accent: string
  accentGrad: string
  shadow: string
  shadowModal: string
}

export const COLORS: Record<Theme, ColorTokens> = {
  light: {
    bg: '#f8f9fa',
    bgSecondary: '#f0f2f5',
    bgCard: '#ffffff',
    bgHover: '#e8ecf0',
    border: 'rgba(0, 0, 0, 0.07)',
    text: '#1a1c1e',
    textMuted: '#6b7480',
    accent: '#0055d7',
    accentGrad: 'linear-gradient(135deg, #0040a5 0%, #0066ff 100%)',
    shadow: '0 1px 3px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)',
    shadowModal: '0 8px 24px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
  },
  dark: {
    bg: '#14161a',
    bgSecondary: '#1c1f26',
    bgCard: '#22262d',
    bgHover: '#2a2f38',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#e8eaee',
    textMuted: '#7a8190',
    accent: '#4d8eff',
    accentGrad: 'linear-gradient(135deg, #2a5fc4 0%, #4d8eff 100%)',
    shadow: '0 1px 4px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
    shadowModal: '0 8px 32px rgba(0,0,0,0.5), 0 2px 12px rgba(0,0,0,0.3)',
  },
}

export const TAB_COLOR_VALUES: Record<string, string> = {
  slate: '#64748b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  green: '#22c55e',
  amber: '#f59e0b',
  rose: '#f43f5e',
}
