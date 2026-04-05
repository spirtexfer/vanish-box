# PRD.md

## Product

Vanish Box

## Problem

Knowledge workers constantly switch between tasks and accumulate active materials — downloaded files, quick notes, rough sketches — that have no natural home. These end up scattered across Downloads, the desktop, sticky note apps, and random documents. Context-switching is slow because these materials are hard to find and never organized by task.

## Solution

A lightweight desktop workspace utility that opens instantly and lets users organize active task materials in tabs. Each tab is a mini workspace: you drag files in, jot notes, and sketch ideas — all in one place, all local, all persisted until you decide to clear it.

## User value

- Task materials stay together and in context
- Fast to open, fast to use — no login, no loading, no cloud
- Files are real copies in app-managed storage; no accidental originals deleted
- Notes and sketches are always one click away
- Tabs let users switch between tasks without losing context

## Audience

- Knowledge workers managing multiple active tasks or projects
- Designers keeping reference files, notes, and rough ideas together per task
- Students organizing materials per assignment or subject
- Anyone who wants a lightweight scratchpad that stays open and organized

## Primary use cases

- Drag screenshots and reference files into a tab while working on a project
- Write quick notes alongside the files they relate to
- Sketch a rough wireframe or diagram without opening a heavy tool
- Switch tabs to jump between two active tasks
- Remove or clear a tab when the task is done

## v1 success criteria

- Users can create and name tabs
- Users can drag files into the active tab; files persist across restarts
- Users can write and edit notes per tab
- Users can sketch and save sketches per tab
- Users can remove a file from the app, or permanently delete it from disk
- Users can clear all content from a tab with a confirmation step
- App opens instantly via tray or global shortcut
- No network access, no account, no external dependencies

## Requirements

### Functional

- Tray-based launch
- Global shortcut to toggle panel
- Tabbed workspace: default tab + user-created tabs
- Tab naming (max 20 characters) with color selection
- Files section per tab: drag-and-drop import, open with default app, remove from box, delete from computer
- Notes section per tab: multiple note cards, create/edit/collapse/delete
- Sketches section per tab: multiple sketch cards, canvas editor with pen/eraser/clear/brush size, collapse/delete
- Clear-tab action with confirmation
- Settings: light/dark theme, file display preferences (show size, show timestamp), keybind display
- State persists across restarts (localStorage)

### Non-functional

- Lightweight runtime (Tauri, not Electron)
- No backend
- Local-only storage
- Fast startup
- Minimal memory footprint

## Out of scope (current version)

- Cloud storage or sync
- Accounts or authentication
- Clipboard paste import
- File picker import (drag-drop only for now)
- Drag-file-out to other apps (architecture preserves stored paths; can be added later)
- OS context menu integration
- Screenshot capture
- Automatic deletion or expiry of any kind
- Section layout customization (state structure supports it; UI not yet built)
- Cross-device or team features
