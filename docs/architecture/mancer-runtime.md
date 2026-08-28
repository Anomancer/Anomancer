# Mancer Runtime

Mancer Runtime is the package-driven domain extension layer. It lets the Core host a new type of workbench without hardcoding that domain into global shell navigation.

## Package contract

A Mancer package can declare:

- `manifest.json`
- `constitution.json`
- `artifact-boundary.json`
- `ui-schema.json`
- `approval-model.json`
- `agent-bindings.json`
- `orchestra-registry.json`
- `archive-policy.json`
- optional bounded adapters

The registry validates packages fail-closed and derives a package contract hash. Missing or invalid packages do not silently rebind a workspace to another domain.

## Renderer model

Packages request known renderer capabilities. They do not inject arbitrary browser JavaScript into the Core. Codemancer currently exercises file-tree, code-editor, diff-view, task-board, test-run-list, approval-review, release-gate and document-preview surfaces.

## Artifact store

Package workspaces use isolated, revision-protected artifacts. Artifact data is workspace-scoped and sanitized. Package artifact access does not itself grant repository-write, shell or deployment power.

## Approval model

Package-defined approval stages express domain workflow, but side effects are still executed only through server-authoritative bounded operation capabilities.

## Codemancer

Codemancer is the current reference Mancer package and development workbench. Its sections cover Project, Architecture, Code, Tasks, Tests, Runs, Review, Release and Documentation.

Historical lineage incorporated from `MANCER_RUNTIME_1_18_0.md`, `SEMANTIC_WORKBENCH_HARDENING_1_18_1.md` and `CODEMANCER_WORKBENCH_1_18_3.md`.
