# Test suites

The release-gate tests are grouped by the invariant they protect, not by the release that introduced them.

- `core-runtime/` — registries, routing, tools, orchestration, workspace/run runtime
- `archive-capabilities/` — Archive, Nanomancer and Archive Curator
- `mancer-codemancer/` — Mancer package/runtime and Codemancer workbench
- `narramancer/` — narrative-authoring domain
- `content-editorial/` — content, evidence, discovery, language and public editorial UI
- `public-api-boundary/` — public Core/API/disclosure boundaries
- `ui-browser/` — shell, responsive, PWA, visual and browser interaction invariants
- `integrity-security/` — integrity and security hardening invariants
- `operations-release/` — repository/test/PR/deploy capability gates
- `full-app-e2e/` — whole-admin user stories

`release-gate.mjs` preserves the validated execution order. `npm run check` builds generated output first and then invokes the runner.
