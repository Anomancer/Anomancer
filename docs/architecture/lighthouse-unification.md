# Lighthouse unification · 1.24

Lighthouse is the private application shell around Anomancer Core. It is not a Mancer and it does not own a domain workflow. It gives the same Core two levels of interaction: a light intent-first mode and a deep Workbench.

```text
Public Anomancer / Core
        │
        └── Sign in → Lighthouse
                        │
                 ┌──────┴──────┐
                 │             │
             Light mode     Workbench
                 │             │
                 │       Mancer workspace
                 │             │
                 └────── Core ─┘
                              │
                       Orchestra
                              │
                           Agent
                              │
                         Capability
                              │
                    Provider / Tool
```

## Canonical concepts

- **Lighthouse**: the private application shell, session, navigation, light mode and Workbench.
- **Mancer**: a bounded work world for one task domain. Anomancer is the editorial and publishing Mancer.
- **Orchestra**: a governed workflow that orders agents, capabilities, checks and human gates.
- **Agent**: a bounded role with a task, readable material, writable artifacts, tool permissions and denials.
- **Capability**: one declared ability. A capability is not authority by itself.
- **Publishing Target**: an explicit output adapter. Editorial work and the destination it publishes to are separate contracts.

The shortest user-facing chain is:

```text
Lighthouse → Mancer → Orchestra → Agent → Capability
```

Human authority remains outside that chain for persistent or external effects.

## Two modes, one Core

### Light mode

Canonical route: `/lighthouse`

The user states a goal. Core resolves intent, capabilities and a recommended method without requiring the user to understand Mancers, agents or providers first. The user can inspect the reasoning surface or continue the work in Workbench.

### Workbench

Canonical route: `/lighthouse/workbench`

Workbench exposes Mancers, workspace-local navigation, orchestras, agents, runs, evidence, Archive and machine/runtime inspection. It is for explicit control rather than mandatory complexity.

Both modes use the same authenticated session in remote Vercel environments.

## Anomancer migration

The old Lähetyskone/Toimituskone user-facing product is retired as a separate application identity. Its proven editorial runtime remains temporarily as a compatibility implementation behind the Anomancer workspace while the UI is decomposed into native Workbench modules.

Compatibility routes:

```text
/admin        → /lighthouse/workbench
/lahetyskone  → /lighthouse/workbench
/lab          → /lighthouse
```

The `mancers/toimituskone` package is `internal-compat` and must not appear as a second Mancer beside Anomancer.

## Publishing boundary

Anomancer must not permanently equate editorial work with `anomancer.com`. The current Vercel publication adapter is the first Publishing Target. Future targets can include a user's own site, API, RSS or export adapter without changing the editorial Mancer contract.

```text
Anomancer editorial artifact
        ↓ human approval
Publishing Target adapter
        ↓
current anomancer.com / future user target
```

A site builder is intentionally not part of 1.24. It can be introduced later as a separate site module or Mancer without bloating the editorial workspace.

## Vercel-direct development

Git hosting is not part of the application or release path. The release loop remains:

```text
local project → npm run check → vercel --prod
```

Production and preview builds include Lighthouse by default. Remote Lighthouse API calls remain authenticated and CSRF-protected. `ANOMANCER_LIGHTHOUSE_APP=0` can explicitly disable the application, while the legacy `ANOMANCER_LIGHTHOUSE_LAB` flag remains only as a temporary compatibility switch.

## Visual ownership

Lighthouse chrome owns the deep-purple system identity. A Mancer may retain a local domain accent inside its workspace. In particular, Anomancer can keep its editorial red accents without recoloring the entire Lighthouse shell.
