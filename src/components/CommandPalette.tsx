import { useState, useEffect, useRef, useCallback } from 'react'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { ColorTokens } from '../theme'
import { searchStore, SearchResult } from '../utils/searchStore'

interface Action {
  id: string
  label: string
  icon: string
  run: () => void
}

interface CommandPaletteProps {
  colors: ColorTokens
  onClose: () => void
  onOpenSettings: () => void
  onNewTab: () => void
}

export function CommandPalette({ colors, onClose, onOpenSettings, onNewTab }: CommandPaletteProps) {
  const { tabs, activeTabId, setActiveTab, addNote, addSketch, addLink } = useWorkspaceStore()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'actions' | 'search'>('actions')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const actions: Action[] = [
    { id: 'new-tab', label: 'New Tab', icon: '+', run: () => { onNewTab(); onClose() } },
    { id: 'add-note', label: 'Add Note', icon: '✎', run: () => { addNote(activeTabId); onClose() } },
    { id: 'add-sketch', label: 'Add Sketch', icon: '✏', run: () => { addSketch(activeTabId); onClose() } },
    { id: 'add-link', label: 'Add Link', icon: '🔗', run: () => { addLink(activeTabId, '', ''); onClose() } },
    { id: 'open-settings', label: 'Open Settings', icon: '⚙', run: () => { onOpenSettings(); onClose() } },
    { id: 'focus-search', label: 'Search…', icon: '🔍', run: () => { setMode('search'); setQuery(''); setActiveIndex(0) } },
  ]

  const filteredActions = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions

  const searchResults: SearchResult[] = mode === 'search' ? searchStore(tabs, query) : []
  const items = mode === 'actions' ? filteredActions : searchResults
  const itemCount = items.length

  useEffect(() => { setActiveIndex(0) }, [query, mode])
  useEffect(() => { inputRef.current?.focus() }, [])

  const runItem = useCallback((index: number) => {
    if (mode === 'actions') {
      filteredActions[index]?.run()
    } else {
      const result = searchResults[index]
      if (!result) return
      setActiveTab(result.tabId)
      onClose()
    }
  }, [mode, filteredActions, searchResults, setActiveTab, onClose])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, itemCount - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); runItem(activeIndex) }
  }

  const typeLabel: Record<string, string> = { tab: 'Tab', file: 'File', note: 'Note', link: 'Link' }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '80px', zIndex: 400,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.bgCard, borderRadius: '16px', width: '360px',
          boxShadow: colors.shadowModal, overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '4px', padding: '10px 12px 0' }}>
          {(['actions', 'search'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setQuery(''); setActiveIndex(0) }}
              style={{
                padding: '3px 10px', fontSize: '11px', fontWeight: 600,
                borderRadius: '6px', border: 'none', cursor: 'pointer',
                background: mode === m ? colors.accent : colors.bgSecondary,
                color: mode === m ? '#fff' : colors.textMuted,
                textTransform: 'capitalize',
              }}
            >
              {m === 'actions' ? 'Actions' : 'Search'}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '8px 12px' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'actions' ? 'Type a command…' : 'Search tabs, notes, files, links…'}
            aria-label="command palette input"
            style={{
              width: '100%', boxSizing: 'border-box', fontSize: '14px',
              padding: '10px 12px', border: `1px solid ${colors.border}`,
              borderRadius: '10px', background: colors.bgSecondary,
              color: colors.text, outline: 'none',
            }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '0 8px 8px' }} role="listbox">
          {mode === 'actions' && filteredActions.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: colors.textMuted }}>
              No commands match
            </div>
          )}
          {mode === 'search' && query && searchResults.length === 0 && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: colors.textMuted }}>
              No results
            </div>
          )}
          {mode === 'search' && !query && (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: colors.textMuted }}>
              Start typing to search
            </div>
          )}

          {mode === 'actions' && filteredActions.map((action, i) => (
            <div
              key={action.id}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => runItem(i)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '8px', cursor: 'pointer',
                background: i === activeIndex ? colors.bgHover : 'transparent',
                fontSize: '13px', color: colors.text,
              }}
            >
              <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>
                {action.icon}
              </span>
              <span style={{ fontWeight: 500 }}>{action.label}</span>
            </div>
          ))}

          {mode === 'search' && searchResults.map((result, i) => (
            <div
              key={`${result.tabId}-${result.itemId ?? 'tab'}`}
              role="option"
              aria-selected={i === activeIndex}
              onClick={() => runItem(i)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '8px', cursor: 'pointer',
                background: i === activeIndex ? colors.bgHover : 'transparent',
              }}
            >
              <span style={{
                fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: colors.accent, width: '34px', flexShrink: 0,
              }}>
                {typeLabel[result.type]}
              </span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.label}
                </div>
                {result.sublabel && (
                  <div style={{ fontSize: '11px', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.sublabel}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
