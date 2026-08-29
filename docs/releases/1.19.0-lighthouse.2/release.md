# Anomancer 1.19.0-lighthouse.2 — Adaptive Intelligence

This prerelease changes Lighthouse from a fixed one-call reasoning path into a bounded adaptive reasoning system.

## What changed

```text
Intent
  → deterministic intelligence profile
      ├─ direct   → work
      ├─ planned  → plan → work
      └─ reviewed → plan → work → review
  → Trust
  → Machine runtime
  → Core provenance
```

The router uses task type, complexity, workspace materials and conversation structure to decide how much reasoning work is justified. Planning and review remain the same bounded `llm.reasoning` capability, not new side-effect capabilities.

High-complexity, debug, audit and comparison work can receive a review pass. Auxiliary planning and review failures fail soft and are recorded instead of discarding an otherwise usable result.

Human final authority, automatic-publication denial and external-side-effect denial are unchanged.
