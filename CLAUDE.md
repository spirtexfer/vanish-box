# CLAUDE.md

## Project overview

Build a lightweight desktop utility for temporary local file holding and temporary file transfer. The product helps users move screenshots, documents, images, videos, and other common files between apps and websites without cluttering permanent storage.

## Product name

Working name: Vanish Box

## Core promise

A fast, local, no-account desktop app that acts as a temporary shelf for files.
Users can quickly add files, hold them briefly, drag them into another app or website, and let them auto-expire later.

## Product goals

* Make temporary file handling feel invisible and low-friction
* Reduce clutter in Downloads, Desktop, and random folders
* Support common file types with minimal setup
* Require no backend, no login, and no cloud sync
* Stay lightweight in startup time and memory usage

## Target users

* Students moving screenshots and files between websites and documents
* Office workers juggling uploads and temporary downloads
* Designers moving images and assets between tools
* General users who repeatedly save files they only need once

## v1 platform and stack

* Desktop app
* Tauri
* React
* TypeScript
* Local-only storage
* No backend
* No account system

## v1 product shape

* Tray-based app with global shortcut
* Opens a small floating panel
* Minimal, modern, distraction-free UI
* Primary metaphor: temporary shelf

## v1 core loop

1. User opens the app instantly from tray or keyboard shortcut
2. User adds files by drag-and-drop, paste, or file picker
3. Files are copied into an app-managed temporary local directory
4. User can preview, search, drag out, open, or reveal files
5. Files auto-delete after a configurable expiry period

## v1 supported input methods

* Drag and drop
* Paste from clipboard
* File picker

## v1 supported output methods

* Drag file out into another app or upload target
* Copy path or basic metadata if needed
* Open with default app
* Reveal in temp folder

## v1 storage rules

* Files are stored as real copied files in a dedicated app-managed temp directory
* Default expiry is 24 hours
* Expiry is user-configurable
* Deletion is silent by default
* Optional short recovery buffer may exist later, but not required for initial prototype

## Non-goals for v1

* Cloud sync
* Accounts or authentication
* Multi-device transfer
* Team sharing
* Browser extension
* OS context menu integration
* Screenshot interception at OS level
* AI categorization
* Advanced automation rules
* Direct website upload automation

## UX principles

* Instant access
* Minimal UI chrome
* Very few decisions required from the user
* Temporary by default
* Clear expiry visibility
* Fast drag in / drag out behavior
* No heavy file management features

## Engineering principles

* Prefer simple, reliable local behavior over clever automation
* Avoid overengineering
* Optimize for working prototype speed first
* Keep code modular enough to support later OS integrations
* Use clear file boundaries and readable TypeScript
* Write maintainable code, not throwaway code

## Claude behavior instructions

* Prioritize shipping a working prototype over speculative architecture
* Keep implementation lightweight and practical
* Do not introduce backend services unless explicitly approved
* Do not add features beyond documented scope without listing them as optional
* When making tradeoffs, favor low friction and local reliability
* Explain major technical decisions briefly in docs
* Keep docs updated as architecture changes

## Definition of done for prototype

* App launches and is accessible from tray and shortcut
* User can add common file types through drag/drop, paste, and file picker
* Files appear in a clean shelf UI with expiry info
* Files can be dragged back out or opened
* Files are stored locally in managed temp storage
* Files auto-expire correctly
* No sign-in, no network dependency
