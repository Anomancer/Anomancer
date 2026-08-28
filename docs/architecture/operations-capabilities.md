# Bounded operations and capabilities

Codemancer side effects use a separate server-authoritative operation layer. The browser cannot submit arbitrary shell commands or directly update the default branch.

## Capability set

Current bounded capabilities cover repository write, tests, pull request, preview deployment, production deployment, repository rollback and deployment rollback.

## Operation lifecycle

```text
stored workspace artifact
→ side-effect-free plan
→ immutable plan hash
→ exact written human approval
→ execute
→ external evidence refresh
```

Plans expire and are revision-bound. Execution derives files/targets from server-side state, applies path/size/duplicate/secret guards and records audit evidence.

## Git boundary

Repository writes create an isolated `anomancer/op-*` branch from an exact base SHA. The default branch is not written directly and PRs are not automerged.

Tests and preview are bound to the exact operation commit SHA. Production is bound to the merged PR's exact merge SHA and a separate release decision. Rollback is separately planned and approved.

## Drift

If the expected base/default state changes, continuation fails closed rather than silently rebasing the approved plan onto new reality.

Historical lineage incorporated from `P3_CAPABILITY_WIRING_1_18_4.md` and the 1.18.5 live-path hardening.
