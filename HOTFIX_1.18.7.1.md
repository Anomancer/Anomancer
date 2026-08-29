# Anomancer 1.18.7.1 — Codemancer Workspace Creation Hotfix

## Fixed

The Codemancer registry button could render correctly but fail silently when clicked because `admin-workspaces.js` called `workspaceDialogStatus()` without defining it. The resulting browser `ReferenceError` aborted `openDialog()` before `HTMLDialogElement.showModal()` ran.

This hotfix restores the missing helper, keeps the workspace deep link as a runtime fallback, adds a browser regression that physically clicks the Codemancer creation button, and rotates the PWA cache generation from `v1.18.7-p1` to `v1.18.7-p2`.

## Compatibility

The Core/API/package compatibility version stays at `1.18.7`. The human-facing hotfix label is `1.18.7.1` so the existing release contracts do not require an unrelated system-wide version migration.
