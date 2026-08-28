# Build / source boundary

Phase 5 makes the deployment boundary explicit.

## Canonical source

- `site/pages/index.html` — Finnish home template
- `site/pages/en.html` — English home template
- `site/pages/core.html` — Finnish public Core template
- `site/pages/core-en.html` — English public Core template
- `content/` — publication source Markdown
- root JS/CSS/assets — application and static source

The four historical root HTML paths are compatibility symlinks into `site/pages/`. They are not separate sources of truth.

## Build contract

`scripts/build-blog.mjs` may read source from the repository, but all generated publication/deployment files are written under `public/` only. Home metadata/JSON-LD and public Core fallback rendering are pure string transforms from source templates into public output.

Generated article HTML, RSS, sitemap, manifests, discovery files and release provenance no longer use the repository root as an intermediate staging area.

## Regression invariant

`tests/integrity-security/build-source-boundary.mjs` fingerprints every tracked path, runs the build, and requires the tracked fingerprint set to remain byte-for-byte identical. It also rejects legacy root generated-output paths and verifies the expected public output.
