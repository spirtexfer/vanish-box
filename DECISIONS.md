# DECISIONS.md

## Decision 1 — Use Tauri instead of Electron

**Choice:** Tauri 2 as the desktop shell.

**Reason:** The app is local-first, lightweight, and should avoid Electron-level memory overhead. Tauri provides filesystem access, tray integration, global shortcuts, and window management without a bundled Chromium.

---

## Decision 2 — Copy files into app-managed storage

**Choice:** On drag-drop, copy the file into `<appData>/files/` with a unique timestamped name. Store only the internal `storedPath` in the workspace state.

**Reason:** Provides predictable behavior — files stay available even if the original is moved or deleted. Keeps the workspace self-contained. The unique name (`<timestamp_ms>_<originalName>`) avoids collisions for files dropped in rapid succession.

**Tradeoff:** Duplicates storage. Acceptable for a personal utility where the user controls what they add.

---

## Decision 3 — Two distinct file removal actions

**Choice:** Separate × (remove from box) and 🗑 (delete from computer) actions on each file card.

**Reason:** Removing a file from the workspace and deleting it from disk are two different user intentions. Conflating them would cause accidental data loss. The 🗑 action requires a confirmation dialog.

**Behavior of 🗑 (delete):** Calls `trash_file(sourcePath, storedPath)` — moves the original source file to the system trash AND permanently deletes the stored copy from `<appData>/files/`. If trashing the original fails (it may have already been moved or deleted), an error is shown and the card is not removed.

---

## Decision 4 — Tray + shortcut + floating panel as the primary shell

**Choice:** System tray icon + global shortcut (Ctrl+Shift+V) to toggle the panel.

**Reason:** Matches the goal of instant access with minimal disruption to the user's other windows. No persistent taskbar presence required.

---

## Decision 5 — Tabs with names and colors

**Choice:** Each tab has a user-chosen name (max 20 characters) and a color from a fixed set of six.

**Reason:** Names let users label tabs by task. Colors provide fast visual identification when tabs are small in the tab bar. A fixed color set avoids UI complexity while still giving meaningful variety. Max 20 characters prevents overflow without needing complex dynamic sizing.

---

## Decision 6 — Section config in tab state

**Choice:** Each tab carries `sections: SectionConfig[]` with `type` and `layout` fields, even though layout customization is not exposed in the UI yet.

**Reason:** The workspace direction may eventually support section reordering and list/grid toggling. Baking the section order into hardcoded component tree would require a store migration later. This costs nothing now and preserves the option.

---

## Decision 7 — Sketches stored as base64 PNG in localStorage

**Choice:** Sketch canvas data is saved as `canvas.toDataURL('image/png')` and stored in the workspace state (localStorage).

**Reason:** Keeps the architecture simple — no separate file I/O for sketches. Consistent with the "single persisted store" model.

**Tradeoff:** Large or numerous sketches bloat localStorage. Acceptable for v1 (a personal utility with a small number of sketches). A future version could store sketch files on disk alongside the file storage system.

---

## Decision 8 — No automatic deletion or expiry

**Choice:** Files, notes, and sketches persist until the user explicitly removes them or clears a tab.

**Reason:** The product shifted from a temporary shelf to a persistent workspace. Auto-expiry would undermine the core value proposition of keeping task materials organized and accessible. Users are in full control of what stays and what goes.

---

## Decision 9 — Inline styles with COLORS token object

**Choice:** All UI styling uses inline styles. Colors reference `COLORS[settings.theme]` from `src/theme.ts`.

**Reason:** Avoids CSS file management complexity in a small single-window app. The COLORS token object makes light/dark switching a single lookup. No class system, no Tailwind, no CSS-in-JS runtime.

**Tradeoff:** Inline styles are verbose. Acceptable given the component count and the benefit of keeping everything in one place.

---

## Decision 10 — Persist to localStorage, not a database

**Choice:** Zustand `persist` middleware writing to localStorage under key `vanish-box-workspace`.

**Reason:** Zero setup, no migration tooling required for v1, works across restarts. The data volume (files are paths + metadata, notes/sketches are text + base64) is small enough that localStorage capacity is not a concern.

**Tradeoff:** localStorage has a ~5–10MB limit per origin. Sketch-heavy workspaces could approach this. If needed, future versions can migrate to IndexedDB or file-based state.
