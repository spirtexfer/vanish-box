// src/theme.ts
import type { Theme } from './store/useWorkspaceStore'

export interface ColorTokens {
  bg: string
  bgSecondary: string
  bgHover: string
  border: string
  text: string
  textMuted: string
  accent: string
}

export const COLORS: Record<Theme, ColorTokens> = {
  light: {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    bgHover: '#f3f4f6',
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#9ca3af',
    accent: '#6366f1',
  },
  dark: {
    bg: '#1f2937',
    bgSecondary: '#111827',
    bgHover: '#374151',
    border: '#374151',
    text: '#f9fafb',
    textMuted: '#6b7280',
    accent: '#818cf8',
  },
}

export const TAB_COLOR_VALUES: Record<string, string> = {
  slate: '#64748b',
  blue:  '#3b82f6',
  purple: '#8b5cf6',
  green: '#22c55e',
  amber: '#f59e0b',
  rose:  '#f43f5e',
}
