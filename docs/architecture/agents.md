# Agents

An Anomancer agent is a contract-bound process, not merely a prompt label.

## Agent Contract

Each registered agent declares at minimum identity/version, role, model route, tools, capabilities, read/write/deny authority, budget constraints and human-approval semantics. A deterministic contract hash identifies the effective contract.

Agent output does not acquire authority merely because a model produced it. Server-side validation, workspace policy, Artifact Boundary and the Tool Broker remain authoritative.

## Editorial pool

The editorial pool covers source/research, structure, writing, critique, audience, voice, claims/evidence, visualization and packaging roles. The default editorial orchestra uses a constrained subset/order rather than executing every registered agent automatically.

## Narrative pool

Narrative workspaces use domain-specific premise, world, character, plot, scene, continuity, voice, critic and package roles under the narrative Constitution.

## Source/research authority

The source agent may use the brokered research path only when its contract and model route allow it. Retrieved material is evidence input, not automatic truth and not publishing authority.

## Invariants

- prompts cannot widen contract authority
- tool access is brokered and policy-checked
- model selection stays within the logical route
- workspaces constrain which agents may run
- consequential publishing/apply/release authority remains human-gated

Historical lineage incorporated from `AGENT_POOL_CONTROL.md`, `LAHETYSKONE_AGENTS.md` and `SOURCE_AGENT_COMPLETION.md`.
