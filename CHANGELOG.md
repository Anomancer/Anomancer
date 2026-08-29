# Changelog

## 1.22.0-lighthouse-actuator.1 — Human-approved Actuator

- Added a separate mutation rail after read-only Hands: proposal → diff → signed approval → bounded execute → receipt.
- Mutation proposals may target only repository files successfully read in the same Lighthouse run.
- Bound approvals to the authenticated admin session, proposal hash, base branch SHA, source file SHAs, operation branch and short expiry window.
- Added explicit written confirmation and replay protection before any repository side effect.
- Added the first Lighthouse write adapter: create an isolated `anomancer/op-*` branch and commit while proving the default branch remained unchanged.
- Denied high-authority paths such as workflows, deploy/package manifests, auth/GitHub adapters, governance scripts and the mutation guard itself.
- Added D1 mutation approval UI with file diffs, D5 proposal telemetry and D6 mutation provenance.
- Kept tests, pull requests, deploys, merges, deletes and production operations outside the automatic Lighthouse path.


## 1.21.0-lighthouse-hands.1 — Lighthouse Hands

- Added a provider-neutral capability route between ProblemModel resolution and reasoning.
- Added bounded read-only hands for browser/workspace material, explicit public HTTPS fetches, optional Brave Search, explicit GitHub repository file reads and Mancer package activation.
- Added DNS-pinned HTTPS fetching with private-network denial, redirect revalidation, content-type and byte limits for public URL reads.
- Activated Codemancer as internal method context for software debug/audit/plan work without enabling its write, test or deployment capabilities.
- Injected runtime evidence into reasoning as explicitly untrusted read material while preserving trusted internal Mancer method metadata.
- Added D4 capability execution stage, D5 Hands audit trail and D6 capability provenance/boundaries.
- Kept all external side effects disabled on the Lighthouse route and human approval mandatory for write-class capabilities.
- Fixed pre-commit installer validation so explicitly allowed untracked release files can participate in export checks without requiring manual staging first.


## 1.20.0-lighthouse-shell.1 — Lighthouse UX Architecture v2

- Added local D0 ProblemModel, capability resolution, work recommendation and explicit human Start gate before external reasoning.
- Added provider-neutral capability and recommendation catalogs while keeping unavailable capabilities visible as unresolved.
- Reworked mobile inspection into the one-room `Miksi? · Aineisto · Lisää` model and kept the same D0–D6 ontology on desktop.
- Added plain-language authority and limitation presentation before the run starts.
- Added canonical UX architecture and release evidence for the Lighthouse shell.


## 1.19.0-lighthouse.2 — Adaptive Intelligence

- Added deterministic intent profiling for task type, complexity, planning need, review need and side-effect intent.
- Replaced the fixed single-pass Lighthouse route with adaptive direct, planned and reviewed reasoning strategies.
- Added a bounded planning pass for non-trivial work and a second-pass result review for high-complexity, debug, audit and comparison tasks.
- Made planning and review fail soft: a failed auxiliary pass is recorded in provenance while the usable work result can still continue.
- Aggregated token usage and per-pass runtime metadata across the reasoning path and exposed the path in D4 Orchestra and D5 Machine Room.
- Added the adaptive-intelligence contract to Core provenance without changing human-final-authority or external side-effect boundaries.
- Added Lighthouse intelligence regression coverage for 1-pass, 3-pass and degraded fallback behavior.

## 1.19.0-lighthouse.1 — Lighthouse Construction Mode

- Added the D0–D6 Lighthouse Lab flow: Door, Work, Trust, Workspace, Orchestra, Machine and Core.
- Kept the Lab local by default; preview and production require an explicit flag plus an authenticated admin session and CSRF token.
- Added same-origin, JSON content-type, 64 KiB body and rate-limit boundaries to the Lab API.
- Made initial workspaces ephemeral until the first successful result and exposed local-storage failures in the UI.
- Added prompt-injection boundaries for workspace material and previous work context.
- Fixed mobile depth navigation, heading hierarchy, control sizing, horizontal overflow and desktop inspector stability.
- Added real Playwright + axe coverage for D0 → D1 → D2/D3 on desktop and mobile.
- Added Lighthouse source/runtime files to the allowlisted export bundles and disabled automatic Vercel deployments from the construction branch.

## 1.18.7.2 — Visible Workspace Dialog Hotfix

- Portaled the workspace creation dialog out of the hidden editorial editor grid before `showModal()`.
- Fixed the Firefox/live symptom where the page became modal/inert but no dialog was visible.
- Strengthened the full-app E2E to verify actual rendered visibility, not only `dialog.open`.
- Rotated the Lähetyskone cache generation to `v1.18.7-p3`.


## 1.18.7.1 — Codemancer Workspace Creation Hotfix

- Restored the missing `workspaceDialogStatus()` helper that made workspace creation and management buttons fail with a browser `ReferenceError`.
- Added a full-app browser regression that clicks `+ Luo Codemancer-työtila` and verifies the creation dialog and Codemancer template selection.
- Hardened workspace deep-link handling so a valid anchor URL remains available when the shell navigation service is unavailable.
- Bumped the Lähetyskone service-worker cache generation to `v1.18.7-p2` so repaired admin runtime assets replace the previous cached generation.
- Core/package compatibility remains `1.18.7`; `1.18.7.1` is a surgical hotfix label rather than a four-part npm semantic version.

## 1.18.7 — Public UI/UX Polish

- Moved article claims and evidence into an accessible disclosure that is closed by default.
- Replaced yellow candidate-source highlighting with a neutral, status-labelled source surface.
- Reduced public Core display typography and updated the visible roadmap through 1.18.7.
- Added a clear Admin action to the Home and Core footers in both languages.
- Rebalanced the Dispatch index hierarchy, density, spacing and card typography.
- Made workspace open actions resilient deep links and added a click-through Codemancer browser gate.

Current release evidence: `docs/releases/1.18.7/`.

## 1.18.6 — Audit Closure

- Replaced status-only source verification with traceable verification receipts and semantic contradiction checks.
- Migrated all 57 published sources to honest candidate state and linked them to 57 structured open claims.
- Added reproducible static, content and browser release gates with pinned Playwright Chromium and axe coverage.
- Raised public target and metadata sizing, added a private boot state and fixed machine-room ARIA state ownership.
- Added URL-backed dispatch filters, sparse-language states, contextual language switching and progressive Core registries.
- Unified visible Romancer terminology, localized technical UI labels and clarified workspace type versus instance.
- Split current roadmap from archived history, added global public CSP and created allowlist-based source/deploy exports.
- Replaced production process-memory contact throttling with a shared atomic rate-limit contract that fails closed.

Release evidence: `docs/releases/1.18.6/`.

## Phase 7.3 · Core hero and transmission tuning

- Core hero now reuses the Home Anomancer wordmark with a compact CORE label below it.
- Core hero scale, paragraph width and section text rhythm were tightened.
- Lähetykset/Dispatches no longer use the large inline transmission pulse; pulse remains only as a small supporting accent.
- Updated visual and public-boundary regression coverage.


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
