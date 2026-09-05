# Orchestration

An orchestra is a versioned execution contract over agents. It defines stages/steps, ordering or safe parallelism, expected authority and human-final semantics.

## Built-in and custom orchestras

Built-in orchestras are registered by Core. Custom orchestras are server-validated and revision-protected. Custom input cannot impersonate a built-in contract.

Before execution, the server freezes workspace identity, orchestra contract and runtime profiles into a signed runtime snapshot. Agent stages must match that snapshot.

## Parallel stages

Parallel agents receive the same frozen input. Parallel execution is rejected when declared write surfaces conflict. Agents do not consume each other's intermediate responses unless a later stage explicitly receives the accumulated result.

## Resilience

The UI orchestrator maintains explicit stage state, checkpoints and resumable/degraded outcomes. Interrupted or limited runs are not silently labeled complete.

## Human authority

Orchestration organizes work. It does not grant publication, repository-write or production authority. Those remain separate approval-gated capabilities.

Historical lineage incorporated from `CUSTOM_ORCHESTRAS.md` and `ORCHESTRATOR.md`.

## Signal → Intent

Lighthouse may receive a normalized `anomancer-signal/v1` object alongside or instead of free-form intent text. The signal layer only normalizes and contextualizes the incoming signal. It does not grant external authority, write access or publication rights.

The resulting flow is:

`signal → intent → problem model → capability route → task graph → bounded executor → evidence → approval → publish`

Signal metadata is retained in runtime output so a later run explorer can show what triggered a task without exposing internal model reasoning.
