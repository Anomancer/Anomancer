# Frontend Runtime Boundary

Phase 4 introduces a single frontend integration seam between independently loaded admin modules.

## Contract

- `admin-runtime.js` owns the service registry and the named `anomancer:*` event bus.
- Modules publish APIs with `runtime.provide(name, api)`.
- Modules consume cross-module capabilities with `runtime.service(name)`.
- Lifecycle/domain events use `runtime.events.emit/on` instead of raw `window.dispatchEvent(CustomEvent(...))` calls.
- Legacy `window.anomancer*` names remain compatibility aliases at the runtime boundary while leaf modules are migrated incrementally. They are no longer the integration contract for migrated modules.

## Phase 4 migrated owners

- Overlay + system dialogs
- Editorial admin bridge + dirty registry
- Workspace registry
- Core shell/navigation
- Core runtime control plane
- Editorial orchestrator

## Build and offline boundary

- The runtime module is staged into `public/`.
- The PWA service worker caches `admin-runtime.js` and uses the Phase 4 cache generation.
- The content-safe installer includes the runtime module in its explicit public runtime allowlist.

## Invariant

The migrated modules must not directly read or assign `window.anomancer*` globals and must not directly emit/listen to `anomancer:*` CustomEvents. `tests/integrity-security/frontend-runtime-boundary.mjs` enforces the boundary.

## Compatibility horizon

Leaf modules can still use legacy aliases during the migration window. Later Phase 4.x slices can migrate Archive, Mancer, Narramancer, Nanomancer, Operations, Agents, Orchestras, Feedback and Machine Room one domain at a time without changing the runtime contract.
