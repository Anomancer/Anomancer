# Core and shell

## Current contract

Anomancer Core is the shared platform layer. It owns registries, contracts, policy boundaries and workspace-independent capabilities. The shell exposes those capabilities through a private authenticated workbench and a redacted public architecture view.

The Core is not a workspace. A workspace selects a template, Constitution, Artifact Boundary, allowed agents/orchestras, editor definition and capabilities. Domain behavior therefore belongs below the Core boundary.

## Canonical responsibilities

The shared Core owns:

- Agent Registry and immutable Agent Contracts
- built-in Orchestra Registry and validation
- Tool Registry, Tool Broker and Policy Gate
- Model Router and provider-target policy
- Workspace Registry and workspace resolution
- Mancer Package Registry
- Capability Registry
- Run, Archive and operation infrastructure
- explicit public/private disclosure projection

The Core Shell owns global navigation, workspace context, local section navigation, dialogs/feedback and access to control-plane surfaces. It must not infer domain behavior from a workspace display name.

## Private and public surfaces

The authenticated surface may show runtime profiles, run history, workspace state, policies and control actions. The public `/core` surface is built from an explicit allowlist and must never call the private admin API.

## Machine room

The machine-room UI is a diagnostic/control surface over registries, runtime profiles, agents, tools, orchestras, runs and capabilities. It is intentionally information-dense, but authority remains in server-side contracts rather than UI labels.

## Invariants

1. Core contracts are server-authoritative.
2. Domain packages cannot silently widen Core authority.
3. Workspace identity is explicit and validated server-side.
4. Public Core is private-by-default and allowlist-projected.
5. Human-final-authority remains explicit on consequential flows.

Historical lineage incorporated from `CORE_FOUNDATION.md`, `CORE_PRODUCT_SHELL.md`, `CORE_SHELL_SEMANTICS_16_8.md` and `LIVING_MACHINE_ROOM.md`.
