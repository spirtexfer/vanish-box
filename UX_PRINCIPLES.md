# UX_PRINCIPLES.md

## Design direction

Vanish Box is a focused local utility, not a general-purpose productivity suite. It lives beside the user's main workflow and appears on demand. The interface should feel calm, fast, and organized — a scratchpad that stays out of the way until needed.

## Principles

### Fast to open, fast to use
The panel opens instantly. Every interaction should require at most one or two clicks. No loading states, no network spinners, no modals that demand decisions before showing content.

### Organized by task, not by type
Tabs are the primary organizing unit. Users think in tasks, not in "all my files" or "all my notes." Grouping files, notes, and sketches under a shared tab label makes it natural to switch context.

### Local-first, no surprises
Nothing leaves the machine. Files are copied into a known location (`<appData>/files/`). Notes and sketches live in localStorage. The user is always in control of what exists and what gets deleted.

### Explicit removal, no accidental loss
Two separate removal actions exist for files:
- Remove from box (×) — clears the card; file stays on disk
- Delete from computer (🗑) — permanently removes the file; requires confirmation

No content is ever removed without a deliberate user action. The clear-tab action requires confirmation. There is no auto-expiry or timed cleanup.

### Minimal chrome, maximum clarity
The UI has a fixed structure: header → tab bar → sections. No deep navigation, no sidebars, no overlapping panels. Modals are used only for the note editor, sketch editor, and confirmation dialogs — contexts where focused interaction is genuinely needed.

### Visible state, no hidden gotchas
Empty states are friendly and informative ("Drop files here", "No notes yet"). Error states are silent in the UI but logged to the console — the app should never crash or freeze due to a missing file or failed command.

## Interface structure

```
Header (drag region)
  App name | ⊘ Clear tab | ⚙ Settings | 🌙/☀️ Theme toggle

TabBar
  [Tab 1] [Tab 2] [+]

TabContent (active tab)
  FILES
    ┌───────────────────────────────┐
    │ Drop files here               │  (empty state)
    └───────────────────────────────┘
    or
    [filename  10:32  200 KB  ×  🗑]
    [filename  10:33   1.0 MB  ×  🗑]

  NOTES
    [▼ Note title                  ×]
      Body preview…
    [+ Add note]

  SKETCHES
    [▼ Sketch title                ×]
      [thumbnail]
    [+ Add sketch]
```

## Tab design guidance

- Tab names are truncated with ellipsis after 20 characters — never wrap or push other tabs off-screen
- Tab color appears as a left border accent — visible at a glance without taking up space
- Active tab has a subtle background fill and border; inactive tabs are minimal
- Creating a tab: name input + 6 color swatches in a compact inline form; Enter or Add to confirm, Escape to cancel
- Renaming: double-click on the tab label — replaces the label with an input in-place

## Card design guidance

Each file card shows:
- Filename (clickable → opens file)
- Optional: size
- Optional: time added
- × button (remove from box)
- 🗑 button (delete from computer)

Each note card shows:
- ▼/▶ collapse toggle
- Title (truncated if needed)
- × button (delete note)
- Body preview (first 120 chars) when not collapsed
- Click anywhere on the card (except buttons) → opens editor

Each sketch card shows:
- ▼/▶ collapse toggle
- Title (truncated if needed)
- × button (delete sketch)
- Thumbnail image when not collapsed
- Click anywhere on the card (except buttons) → opens editor

## Confirmation dialogs

Used for:
- Delete file from computer (irreversible, disk operation)
- Clear tab (irreversible, removes all content)

Not used for:
- Remove file from box (reversible in the session by re-dragging; low risk)
- Delete note (no disk impact)
- Delete sketch (no disk impact)

## Settings panel

Bottom-sheet overlay. Opens on ⚙. Closes on backdrop click. Contains:
- Dark mode toggle
- Show file size toggle
- Show file timestamp toggle
- Keybind display (read-only)

Settings are immediate — no "Apply" or "Save" button needed.
