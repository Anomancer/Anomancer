# Anomancer 1.18.7.2 — Visible Workspace Dialog Hotfix

## Fixed

The workspace creation dialog lived inside `.editor-grid`. The Workspaces shell hides that editor grid, so `showModal()` could set the dialog's `open` state while the dialog remained visually suppressed by a hidden ancestor. The page then behaved like a modal was open even though the user could not see it.

The workspace dialog is now portaled to `document.body` before `showModal()`. The full-app regression verifies a non-zero rendered box, visible display state, no hidden ancestor, and body-level portal ownership.

The PWA cache generation is rotated to `v1.18.7-p3`.
