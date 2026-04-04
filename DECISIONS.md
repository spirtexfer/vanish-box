# DECISIONS.md

## Decision 1

Use Tauri instead of a backend-heavy architecture.

### Reason

The product is local-first and should remain lightweight, simple, and fast.

## Decision 2

Store real copied files in a managed temp directory.

### Reason

This provides predictable behavior and keeps temporary storage isolated from the user's permanent folders.

## Decision 3

Use tray + shortcut + floating panel as the primary shell.

### Reason

This matches the goal of quick access with minimal disruption.

## Decision 4

Keep v1 focused on manual input and output flows.

### Reason

Deep OS integrations would slow the project and risk scope creep before validating the core utility.
