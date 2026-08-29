# Lighthouse UX Architecture v2

Anomancer exposes usefulness before machinery.

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

Three rails cross the depth stack instead of becoming separate depth levels:

- Human Authority: the user starts work and retains authority over external effects.
- Trust / Evidence: the result, evidence view and provenance are projections of the same run.
- Archive / Memory: workspace material and run history are shared state, not a single UI room.

## Canonical surfaces

1. Home / Door: text, optional browser speech input and local text-material attachments.
2. Work / Result: the useful result and continuation.
3. Inspect / Trust: evidence, material and method projections.
4. Deep Work / Core: runtime, provider, permission and provenance inspection.

## D0 contract

D0 sends only an intent contract to Core. It does not name providers, models, Mancers, agents or tools.

Before the external reasoning request, Core builds locally:

```text
Intent
→ ProblemModel
→ CapabilityResolution
→ WorkRecommendation
→ AuthorityDecision
```

The UI then asks the human to start. Only the Start action proceeds to the external provider.

## Capability boundary

The implementation remains single-provider while the architecture remains provider-neutral. Semantic capabilities resolve to the current bounded `llm.reasoning` execution capability. Capabilities that are not wired, such as `research.search`, stay explicitly unresolved and must not be implied as available.

## Mobile rule

Mobile presents one room at a time. D1 exposes at most three inspection actions:

```text
Miksi? · Aineisto · Lisää
```

`Lisää` opens the deeper method, Machine Room and Core routes. Desktop exposes the same ontology in a parallel inspector.

## Authority rule

A model may suggest. The Lighthouse Lab may analyze. It may not independently publish, push, deploy, delete or perform other external side effects. Requests for those actions are represented as human-gated intent and remain non-executable in this slice.
