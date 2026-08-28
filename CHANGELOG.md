# Changelog

## Phase 7.2 · Header and hero copy consolidation

- Core public header now uses the same Anomancer wordmark as Home.
- Public navigation typography is explicitly unified across Home/Core.
- Removed the Core hero status/version pill and architecture eyebrow.
- Replaced the Finnish Home intro line with: "Minimalistinen viisaus hiottu kiveksi".
- Updated brand regression coverage while keeping the release gate at 73 steps.


## Phase 7.1 · Visual consolidation

- Removed the pulse artwork from Anomancer and Core hero surfaces; the pulse remains a transmission/Dispatches motif.
- Replaced the Core hero network mark with the Anomancer Core wordmark.
- Unified public header height, logo scale, navigation typography and spacing across Home, Core and generated publication surfaces.
- Reworked Home/Core footers into a compact shared layout without oversized brand artwork.
- Updated the Phase 7 brand regression contract without increasing release-gate step count.


## Phase 7 · Brand Integration

- Added one canonical public brand asset boundary under `media/brand/` and preserved `public/` as generated output.
- Wired Anomancer FI/EN, Core FI/EN, generated Dispatches/articles and private Core favicon surfaces to the new visual identity.
- Regenerated the stable PWA icon paths from the new Anomancer application mark without changing the manifest route contract.
- Added accessible wordmark/mark presentation rules and responsive brand sizing.
- Added a brand-system regression gate; full release gate is now 73 steps.

## Phase 6 · Governance / PR CI

- Added a read-only pull-request CI workflow with the stable required check context `Release Gate`.
- PR CI runs the same locked `npm ci → npm run check` contract used locally, including Chromium-backed gates.
- Kept deploy/rollback capability workflows separate from PR validation and denied deployment secrets to PR CI.
- Added explicit master-protection enable/verify tooling with PR-only flow, strict required checks, admin enforcement and force/delete guards.
- Added a governance regression gate; full release gate is now 72 steps.


## Phase 5 · Build / Source Boundary

- Moved canonical static page sources under `site/pages/` with root compatibility symlinks.
- Reworked home/Core transforms into pure render functions.
- Build now writes publication and deployment artifacts only under `public/`.
- Removed legacy root generated-output ignores so boundary regressions become visible.
- Added a tracked-source immutability regression gate; full release gate is now 71 steps.

## Phase 4 · Frontend Runtime Boundaries

- Added a single frontend service registry and named event bus.
- Migrated Shell, Workspaces, Admin, Core, Orchestrator and Overlay/Dialog integration away from direct cross-module globals.
- Preserved legacy aliases as compatibility adapters for unmigrated leaf modules.
- Added the runtime module to build, installer and offline app-shell boundaries.
- Added a runtime-boundary regression gate; full release gate is now 70 steps.


Git history is the detailed historical archive. This file keeps the current release line and major architectural milestones rather than every patch report as a separate root document.

## 1.18.5 — Live Path Verification & Canary Gate

- repository allowlist and fail-closed live-canary preflight
- tests/preview bound to exact operation commit SHA
- default-branch before/after evidence and drift detection
- exact GitHub Actions operation/mode evidence binding
- preview hardened with explicit preview target and no production alias
- Operation Console live-path/evidence hardening

Current release evidence: `docs/releases/1.18.5/`.

## 1.18.4 — P3 Capability Wiring

Introduced bounded repository/test/PR/preview/production/rollback operations using plan → written approval → execute → evidence, isolated operation branches, no direct default-branch writes and no automerge.

## 1.18.3 — Codemancer Workbench

Introduced task-specific package renderer capabilities for Code, Tasks, Tests, Review, Release and Documentation, plus interaction/CSS and full-app flow hardening.

## 1.18.2 — Senior integrity, navigation and UI hardening

Established dirty-state protection, revision-conflict handling, workspace-bound async request cancellation, URL-owned navigation state, responsive consolidation, native-dialog replacement and broader security/UI regression gates.

## 1.18.0–1.18.1 — Mancer Runtime

Established Mancer Package Spec, package discovery/validation, generic package workbench rendering, isolated package artifacts and package-local Constitutions/Artifact Boundaries/approval models.

## 1.17.x — Archive and capabilities

Established Archive Core, Nanomancer deterministic analysis and Archive Curator governance while preserving explicit human grants and the rule that Archive is not automatic model memory.

## 16.x / 15.x — Core foundation and interface evolution

Established Agent/Orchestra contracts, Tool Broker, Model Router, server-side runtime/run/workspace state, public disclosure projection, narrative workspace, navigation shell, responsive/visual ownership and public clarity. Detailed patch-era documents remain recoverable from Git history.
