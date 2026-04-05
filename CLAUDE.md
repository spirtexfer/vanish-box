# CLAUDE.md

## Project overview

Vanish Box is a fast local desktop workspace utility. Users organize active task materials into tabs. Each tab contains files, notes, and sketches.

## Product name

Vanish Box

## Core promise

A fast, local, no-account desktop app that acts as a personal workspace. Users open it instantly, organize files/notes/sketches into task-based tabs, and keep everything local.

## Product goals

* Instant access to active task materials
* Multiple tabs for different tasks or projects
* Drag-and-drop files directly into app-managed storage
* Lightweight note cards and sketch pads per tab
* No cloud, no accounts, no backend

## Target users

* Knowledge workers juggling multiple active tasks
* Designers keeping assets, notes, and rough sketches together
* Students organizing research materials per project

## Platform and stack

* Desktop app: Tauri 2 + React 19 + TypeScript
* Local-only storage: Zustand (persisted to localStorage key `vanish-box-workspace`)
* File storage: app data dir (`<appData>/files/`)
* No backend, no account system

## App structure

* Tabbed workspace shell (`WorkspacePanel`)
* Each tab has three sections: Files, Notes, Sketches
* Section layout is configurable in state (list/grid) — UI customization is a future feature
* Settings panel (gear icon): theme, file display preferences
* Clear-tab confirmation before wiping tab content

## Rust commands

* `copy_file(source) → CopiedFileInfo` — copies file into `<appData>/files/`, returns metadata
* `open_file(path)` — opens with default OS app
* `delete_file(path)` — permanently removes from `<appData>/files/`

## Engineering principles

* Prefer simple, reliable local behavior
* Avoid overengineering
* Keep code modular
* TDD: write tests before implementation
* Inline styles with COLORS token object (light/dark)

## Non-goals for current version

* Cloud sync, accounts, or multi-device
* Drag files out of the app (architecture preserves path for future addition)
* Auto-expiry or timed deletion
* OS tray integration changes (tray + shortcut already work)
* Browser extension
* AI features
