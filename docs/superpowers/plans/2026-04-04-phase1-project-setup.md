# Phase 1: Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Vanish Box Tauri app with a working tray icon, floating panel window, and global shortcut toggle — no file handling, no storage, no real UI yet.

**Architecture:** Tauri (Rust) handles all OS-level concerns: tray icon, window lifecycle, and global shortcut registration. React renders a placeholder shelf panel inside the Tauri WebviewWindow. At this stage, no custom `invoke` commands are needed — the frontend is purely presentational and the Rust backend controls visibility directly.

**Tech Stack:** Tauri 2.x, React 18, TypeScript, Vite, Zustand, Vitest, @testing-library/react, Rust

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Tauri App (Rust)                               │
│                                                 │
│  main.rs ──► tray.rs ──► toggle_panel()        │
│          └──► shortcut.rs ──► toggle_panel()   │
│          └──► window.rs  (toggle_panel impl)   │
│                                                 │
│  WebviewWindow ("main")                         │
│  └── React App                                  │
│       └── App.tsx → ShelfPanel.tsx (placeholder)│
└─────────────────────────────────────────────────┘
```

- **tray.rs**: Creates the system tray icon. Listens for click events. Calls `toggle_panel`.
- **window.rs**: Exposes `toggle_panel(app)` — checks visibility, shows or hides the window.
- **shortcut.rs**: Registers `Ctrl+Shift+V`. On press, calls `toggle_panel`.
- **main.rs**: Entry point. Registers the plugin, calls all three `setup_*` functions.
- **ShelfPanel.tsx**: Placeholder UI — a header and a drop hint. No behavior.
- **appStore.ts**: Zustand store. Holds minimal frontend state for future use.

## Window + Tray Behavior

- The window starts hidden (`visible: false` in config).
- Clicking the tray icon or pressing `Ctrl+Shift+V` calls `toggle_panel`.
- `toggle_panel` checks `window.is_visible()` — shows if hidden, hides if shown.
- When showing: calls `window.show()` then `window.set_focus()`.
- The window has no title bar (`decorations: false`), is non-resizable, always on top, and excluded from the taskbar.
- The app does **not** quit when the panel is hidden — it stays alive in the tray.

---

## File Map

Files created or modified in this phase:

### Rust (`src-tauri/`)
| File | Role |
|------|------|
| `src-tauri/src/main.rs` | Entry point; wires tray, window, shortcut together |
| `src-tauri/src/tray.rs` | Tray icon creation and click-to-toggle handler |
| `src-tauri/src/window.rs` | Floating panel window toggle logic |
| `src-tauri/src/shortcut.rs` | Global shortcut registration |
| `src-tauri/Cargo.toml` | Rust dependencies |
| `src-tauri/tauri.conf.json` | Window dimensions, decorations, visibility |

### React (`src/`)
| File | Role |
|------|------|
| `src/App.tsx` | Root component; renders ShelfPanel |
| `src/store/appStore.ts` | Zustand store; minimal app state |
| `src/store/appStore.test.ts` | Vitest unit tests for the store |
| `src/components/ShelfPanel.tsx` | Placeholder shelf panel UI |
| `src/components/ShelfPanel.test.tsx` | Vitest render test |

---

## Tasks

---

### Task 1: Scaffold the Tauri + React + TypeScript project

**Files:**
- Create: entire project scaffold inside `vanishBox/`

- [x] **Step 1: Run the scaffold command** — DONE
- [x] **Step 2: Install dependencies** — DONE
- [x] **Step 3: Verify the dev build works** — DONE (npm run build ✓)
- [x] **Step 4: Initialize git and commit** — DONE

---

### Task 2: Add Zustand

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Confirm install**

```bash
npm ls zustand
```

Expected: `zustand@x.x.x` listed with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zustand"
```

---

### Task 3: Add React Testing Library

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install testing dependencies**

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Configure Vitest for jsdom**

Open `vite.config.ts`. Add a `test` block so it looks like:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Create the test setup file**

Create `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Verify Vitest runs**

```bash
npm run test -- --run
```

Expected: No test files found yet, exits cleanly with no errors.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts src/test-setup.ts package.json package-lock.json
git commit -m "chore: configure Vitest with jsdom and React Testing Library"
```

---

### Task 4: Create the Zustand app store

**Files:**
- Create: `src/store/appStore.ts`
- Create: `src/store/appStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/store/appStore.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- --run
```

Expected: FAIL — `Cannot find module './appStore'`

- [ ] **Step 3: Implement the store**

Create `src/store/appStore.ts`:
```typescript
import { create } from 'zustand'

interface AppState {
  isPanelReady: boolean
  setIsPanelReady: (ready: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  isPanelReady: false,
  setIsPanelReady: (ready) => set({ isPanelReady: ready }),
}))
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- --run
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/appStore.ts src/store/appStore.test.ts
git commit -m "feat: add minimal Zustand app store"
```

---

### Task 5: Build the ShelfPanel placeholder component

**Files:**
- Create: `src/components/ShelfPanel.tsx`
- Create: `src/components/ShelfPanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/ShelfPanel.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ShelfPanel } from './ShelfPanel'

describe('ShelfPanel', () => {
  it('renders the app name', () => {
    render(<ShelfPanel />)
    expect(screen.getByText('Vanish Box')).toBeTruthy()
  })

  it('renders a drop zone hint', () => {
    render(<ShelfPanel />)
    expect(screen.getByText('Drop files here')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- --run
```

Expected: FAIL — `Cannot find module './ShelfPanel'`

- [ ] **Step 3: Implement the component**

Create `src/components/ShelfPanel.tsx`:
```tsx
export function ShelfPanel() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: '#ffffff',
      }}
    >
      <header
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        Vanish Box
      </header>
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '13px',
        }}
      >
        Drop files here
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- --run
```

Expected: PASS — 5 tests pass (3 store + 2 ShelfPanel).

- [ ] **Step 5: Commit**

```bash
git add src/components/ShelfPanel.tsx src/components/ShelfPanel.test.tsx
git commit -m "feat: add ShelfPanel placeholder component"
```

---

### Task 6: Wire the React shell

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace App.tsx**

Open `src/App.tsx` and replace all contents with:
```tsx
import { ShelfPanel } from './components/ShelfPanel'

function App() {
  return <ShelfPanel />
}

export default App
```

- [ ] **Step 2: Verify TypeScript build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire App.tsx to ShelfPanel"
```

---

### Task 7: Configure the floating panel window

**Files:**
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Update the window configuration**

Open `src-tauri/tauri.conf.json`. Find the `windows` array inside the `app` object. Replace the existing window entry with:
```json
{
  "title": "Vanish Box",
  "width": 360,
  "height": 520,
  "decorations": false,
  "resizable": false,
  "alwaysOnTop": true,
  "visible": false,
  "center": true,
  "skipTaskbar": true
}
```

- [ ] **Step 2: Verify the config is accepted**

```bash
npm run tauri dev
```

Expected: App starts with no window visible (hidden by default). The terminal shows no config errors. Quit with `Ctrl+C`.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/tauri.conf.json
git commit -m "feat: configure floating panel window (360x520, no decorations, hidden)"
```

---

### Task 8: Add Rust dependencies for tray and shortcut

**Files:**
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Update Cargo.toml**

Open `src-tauri/Cargo.toml`. Update the `[dependencies]` section to:
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 2: Verify Rust compiles**

```bash
cd src-tauri && cargo check && cd ..
```

Expected: `Finished` — no errors. (First run may take a few minutes while Cargo fetches crates.)

- [ ] **Step 3: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "chore: add Rust deps for tray-icon and global-shortcut"
```

---

### Task 9: Implement window toggle logic

**Files:**
- Create: `src-tauri/src/window.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create window.rs**

Create `src-tauri/src/window.rs`:
```rust
use tauri::{AppHandle, Manager};

pub fn toggle_panel(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}
```

- [ ] **Step 2: Declare the module in main.rs**

Open `src-tauri/src/main.rs`. Add `mod window;` before `fn main()`.

- [ ] **Step 3: Verify it compiles**

```bash
cd src-tauri && cargo check && cd ..
```

Expected: `Finished` — no errors.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/window.rs src-tauri/src/main.rs
git commit -m "feat: implement window toggle logic"
```

---

### Task 10: Implement tray icon with click-to-toggle

**Files:**
- Create: `src-tauri/src/tray.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create tray.rs**

Create `src-tauri/src/tray.rs`:
```rust
use tauri::{
    tray::{TrayIconBuilder, TrayIconEvent},
    App, Manager,
};

pub fn setup_tray(app: &mut App) -> tauri::Result<()> {
    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Vanish Box")
        .build(app)?;

    tray.on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click { .. } = event {
            crate::window::toggle_panel(tray.app_handle());
        }
    });

    Ok(())
}
```

- [ ] **Step 2: Register tray in main.rs**

Open `src-tauri/src/main.rs`. Update to:
```rust
mod tray;
mod window;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            tray::setup_tray(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd src-tauri && cargo check && cd ..
```

Expected: `Finished` — no errors.

- [ ] **Step 4: Run and test tray click**

```bash
npm run tauri dev
```

Expected:
- No window appears on launch
- Tray icon appears in the system tray
- Hovering shows "Vanish Box" tooltip
- Clicking the tray icon shows the floating panel (360×520, no title bar)
- Clicking again hides the panel

Quit with `Ctrl+C` after confirming.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/tray.rs src-tauri/src/main.rs
git commit -m "feat: add tray icon with click-to-toggle panel"
```

---

### Task 11: Implement global shortcut

**Files:**
- Create: `src-tauri/src/shortcut.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create shortcut.rs**

Create `src-tauri/src/shortcut.rs`:
```rust
use tauri::App;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn setup_shortcut(app: &mut App) -> tauri::Result<()> {
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyV);

    app.handle()
        .global_shortcut()
        .on_shortcut(shortcut, |app_handle, _shortcut, event| {
            if event.state() == ShortcutState::Pressed {
                crate::window::toggle_panel(app_handle);
            }
        })?;

    Ok(())
}
```

- [ ] **Step 2: Register shortcut in main.rs**

Open `src-tauri/src/main.rs`. Update to:
```rust
mod shortcut;
mod tray;
mod window;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            tray::setup_tray(app)?;
            shortcut::setup_shortcut(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: Verify it compiles**

```bash
cd src-tauri && cargo check && cd ..
```

Expected: `Finished` — no errors.

- [ ] **Step 4: Run and test the shortcut**

```bash
npm run tauri dev
```

Expected:
- App starts with no visible window
- Pressing `Ctrl+Shift+V` shows the floating panel
- Pressing `Ctrl+Shift+V` again hides the panel
- Tray click still works independently

Quit with `Ctrl+C` after confirming.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/shortcut.rs src-tauri/src/main.rs
git commit -m "feat: register Ctrl+Shift+V global shortcut to toggle panel"
```

---

### Task 12: Phase 1 final verification

- [ ] **Step 1: Run all frontend tests**

```bash
npm run test -- --run
```

Expected: All 5 tests pass (appStore: 3, ShelfPanel: 2).

- [ ] **Step 2: Run Rust check**

```bash
cd src-tauri && cargo check && cd ..
```

Expected: `Finished` — no errors.

- [ ] **Step 3: Full manual verification checklist**

```bash
npm run tauri dev
```

Verify each item:
- [ ] App starts without terminal errors
- [ ] No window appears on launch
- [ ] Tray icon visible in system tray
- [ ] Hovering tray icon shows "Vanish Box" tooltip
- [ ] Clicking tray icon shows the floating panel
- [ ] Panel is 360×520 with no title bar or window decorations
- [ ] Panel displays "Vanish Box" in the header
- [ ] Panel displays "Drop files here" in the body
- [ ] Panel floats on top of other windows
- [ ] App is not visible in the taskbar
- [ ] Clicking tray icon again hides the panel
- [ ] Pressing `Ctrl+Shift+V` shows the panel
- [ ] Pressing `Ctrl+Shift+V` again hides the panel
- [ ] Tray and shortcut both control the same window

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: Phase 1 complete — tray, floating panel, global shortcut"
```

---

## Phase 1 Constraints

The following are explicitly **out of scope** and must NOT be implemented in this phase:

- File drag-and-drop import
- Clipboard paste import
- File picker import
- Temp storage directory or managed file copying
- Metadata persistence (JSON, SQLite, or any format)
- File expiry logic or cleanup scheduler
- File list UI (item cards, metadata display, previews)
- Search or filter functionality
- Open file / reveal in folder actions
- Drag-out export behavior
- Any settings or preferences UI
- Start on login behavior
- Custom `invoke` commands between React and Tauri backend
- Any network or sync behavior
