# Anomancer

Anomancer is a private, workspace-based orchestration platform with a separate public publishing surface. It separates agent contracts, orchestras, model routing, tools, artifacts, memory/archive and side-effectful operations behind explicit policy and human-approval boundaries.

Current release: **1.18.7 — Public UI/UX Polish**.

## Architecture at a glance

```text
Core
├── Workspaces
│   ├── Anomancer editorial
│   ├── Romancer narrative authoring
│   ├── blank private workspace
│   └── Mancer package workspaces
├── Agent + Orchestra contracts
├── Model Router + Tool Broker
├── Runtime / Run / Archive stores
├── Capability Registry
└── bounded Operations
    └── plan → written approval → execute → evidence
```

Codemancer is the current reference Mancer package. It proves that a domain workbench can declare its own Constitution, Artifact Boundary, UI schema, approval model, agent bindings and orchestras without the Core hardcoding the workspace name.

## Repository map

- `server/` — server-authoritative Core, stores, registries and domain services
- `api/` — thin Vercel HTTP entry adapters
- `mancers/` — package-defined domain workbenches
- `content/` — editorial Markdown source
- `media/` — source media
- `scripts/` — build and development utilities
- `tests/` — semantically grouped release-gate suites
- `docs/` — canonical current architecture and release documentation
- `public/` — generated Vercel static output; not source of truth

See [`docs/README.md`](docs/README.md) and [`docs/development/repository-layout.md`](docs/development/repository-layout.md).

## Build and validation

Requirement: Node.js 20+. The release gate installs the exact Playwright Chromium build on first use when it is missing.

```bash
npm ci
npm run build
npm run check
```

`npm run check` also bootstraps the build, so generated deployment output does not need to be committed.

## Safety model

The platform deliberately keeps consequential effects separate from model output. Repository writes, tests, pull requests, preview/production deployment and rollback use bounded server-side capabilities with explicit planning, exact written approval and external evidence refresh. Direct default-branch writes and automerge are outside the Codemancer operation contract.

The public Core is an explicit allowlist projection. Private prompts, outputs, workspace state, runtime profiles, provider configuration and operational history remain outside the public architecture snapshot.

## Current release evidence

See [`docs/releases/1.18.7/`](docs/releases/1.18.7/) for the UI/UX-polish release and validation contract. The senior audit closure remains under `docs/releases/1.18.6/`.
