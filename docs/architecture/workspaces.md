# Workspaces

A workspace is the runtime context boundary between the shared Core and a domain-specific workbench.

## Workspace contract

A resolved workspace binds together:

- workspace identity and type
- Workspace Template
- Constitution
- Artifact Boundary
- allowed agents and orchestras
- capability set
- editor/navigation definition
- persistence scope

The template describes purpose and platform bindings. The Constitution fixes protected properties, forbidden transformations, truth policy, mandatory gates and human-final-authority. The Artifact Boundary resolves read/write/publication capabilities server-side. These bindings are frozen with the workspace and orchestra into the signed runtime snapshot used during execution.

The server validates workspace identity. The `X-Anomancer-Workspace` header selects a context but does not itself grant authority.

## Built-in workspace families

The current platform includes the editorial Anomancer workspace, the narrative-authoring Romancer workspace, a blank private workspace and package-driven development workspaces such as Codemancer.

## Isolation

Runtime profiles, custom orchestras, runs, archives and package artifacts are workspace-scoped. Cross-workspace Archive reads require explicit human grants. A workspace change cannot reuse a runtime snapshot frozen for another workspace.

## Persistence

The current single-user architecture uses separate GitHub tag-ref backed stores, with memory fallbacks for tests/development. Stores use revision checks to prevent stale sessions from silently overwriting newer state.

## Scope boundary

Workspace isolation is not a multi-user ACL system. Current public Core metadata explicitly distinguishes the existing workspace boundary from future organization/member authorization.

Historical lineage incorporated from `WORKSPACE_FOUNDATION.md`, `WORKSPACE_TYPES_ARTIFACT_BOUNDARY_16_5.md` and later workspace/package contracts.
