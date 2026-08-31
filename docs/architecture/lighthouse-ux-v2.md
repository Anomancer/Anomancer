# Lighthouse UX Architecture v2 · unified shell

Lighthouse exposes usefulness before machinery. It now has two peer interaction modes over the same Core rather than a separate experimental Lab product.

```text
Lighthouse
├─ Light mode
│  D0 Door → D1 Work → optional D2–D6 inspection
└─ Workbench
   Mancer → local work surface → Orchestra / Agent / Runs / Machine Room
```

The depth stack remains useful inside Light mode:

```text
D0 Door
  ↓ explicit human Start
D1 Work
  ↓ optional inspection
D2 Trust
D3 Workspace
D4 Method / Orchestra
D5 Machine Room
D6 Core
```

Three rails cross the stack instead of becoming separate depth levels: Human Authority, Trust/Evidence and Archive/Memory.

## Canonical surfaces

1. `/lighthouse` — light intent-first mode.
2. `/lighthouse/workbench` — deep Mancer Workbench.
3. `/lighthouse/login` — Lighthouse authentication surface.
4. `/core` and `/en/core` — public architecture explanation, never a private control surface.

Legacy `/lab`, `/admin` and `/lahetyskone` routes are compatibility aliases only.

## D0 contract

D0 sends an intent contract to Core. It does not force the user to name providers, models, Mancers, agents or tools.

```text
Intent
→ ProblemModel
→ CapabilityResolution
→ WorkRecommendation
→ AuthorityDecision
```

The UI asks the human to start before external reasoning begins.

## Workbench contract

Workbench makes machinery explicit only when useful. A Mancer is a bounded work world, an Orchestra is a workflow, an Agent is a bounded role and a Capability is one declared ability.

```text
Lighthouse → Mancer → Orchestra → Agent → Capability
```

The shell stays stable while the selected Mancer owns its local navigation and artifacts.

## Mobile rule

Mobile presents one primary room at a time. Light mode keeps the intent/result path compact. Workbench uses its own responsive Mancer navigation rather than shrinking desktop panels into a narrow column.

## Authority rule

A model may analyze and suggest. Persistent or external effects remain behind explicit human approval gates. Publication targets are separate output adapters, not implicit powers of a Mancer.
