# PRD.md

## Product

Temp Shelf

## Problem

Users constantly create temporary files during normal work: screenshots, downloaded documents, copied images, and other files that are needed once and then forgotten. These files accumulate in permanent storage locations and slowly create clutter, confusion, and organizational overhead.

## Solution

A lightweight desktop app that acts as temporary local storage for files. Users can quickly place files into the shelf, use them in another app or website, and let them auto-delete after a short period.

## User value

* Faster file movement between apps
* Less desktop and downloads clutter
* No need to manually clean up temporary files
* No friction from signup or cloud setup

## Audience

General productivity users, especially students, office workers, and designers.

## Primary use cases

* Hold a screenshot before uploading it into a website
* Keep a downloaded PDF temporarily before attaching it elsewhere
* Move an image between apps without creating permanent mess
* Keep short-lived assets available during a work session

## v1 success criteria

* Users can launch the app quickly
* Users can add and remove common files easily
* Users understand when files will expire
* Users can reuse files by dragging them back out
* Files auto-delete reliably after expiry

## Requirements

### Functional

* Tray-based launch
* Global shortcut
* Import by drag/drop
* Import by paste
* Import by file picker
* Local file copy into managed temp directory
* List of active temp items
* File metadata display
* Expiry timer display
* Auto-expiry cleanup
* Open file
* Reveal file location
* Drag-out export
* Basic search

### Non-functional

* Lightweight runtime
* No backend
* Local-only storage
* Fast startup
* Minimal memory usage
* Stable file lifecycle behavior

## Out of scope

* Cloud storage
* File syncing
* Team collaboration
* Shared links
* Accounts
* In-browser extension workflows
* Full OS integration
