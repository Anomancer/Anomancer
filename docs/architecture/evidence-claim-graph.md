# Evidence / Claim Graph

The Evidence / Claim Graph makes claims, their evidence and verification state explicit runtime objects.

## Objects

- `claim` keeps the reader-facing proposition plus status, linked evidence and optional contradiction notes.
- `source` keeps provenance and the traceable human verification record.
- `supported-by` relations connect a claim to the source URLs that ground it.

## Verification

A claim is `verified` only when it is marked `supported` and at least one linked source has a complete traceable verification record. A claim with linked but unverified sources is `partial`; a claim without linked evidence is `unverified`.

The graph is descriptive, not an autonomous authority system. It does not promote sources, publish content or cross the human approval boundary. `publicationReady` is a fail-closed diagnostic, not a publish command.

The public `evidence-manifest.json` contains the graph only for published articles. Drafts and private runtime state remain outside the public graph.
