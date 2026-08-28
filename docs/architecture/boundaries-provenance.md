# Boundaries and provenance

Anomancer uses explicit data and authority boundaries rather than assuming that every internal object is safe to expose.

## Public disclosure boundary

The public Core snapshot is built by explicit allowlist. Private-by-default material includes raw prompts/outputs, workspace data, runtime profiles, provider configuration/secrets, internal authority/policy implementation and private run history.

Public metadata may expose safe structural facts such as agent labels/roles, hashes, orchestra structure, logical model routes, installed package summaries and architecture boundary descriptions.

## Artifact boundaries

Workspace and Mancer contracts declare permitted read/write surfaces and explicit denies. A package cannot widen its boundary simply by emitting a request from the browser.

## Provenance

Release provenance records safe hashes and disclosure booleans. Run, archive and operation records carry their own bounded provenance/integrity metadata. Provenance is evidence about the system path, not a substitute for independent truth verification of content.

## Private lineage

Private IP/audit lineage files are excluded from the repository by policy and must not be required for the public build.

Historical lineage incorporated from `BOUNDARY_PROVENANCE_HARDENING.md` and `PUBLIC_DISCLOSURE_BOUNDARY.md`.
