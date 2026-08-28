# Publication, discovery, build and deployment

## Content source

Markdown under `content/` is editorial source data. Published public HTML, feeds and machine-readable manifests are build products derived from that source.

## Build

`scripts/build-blog.mjs` validates content and produces article/index HTML, RSS, sitemap, robots, public manifests, public Core snapshot and release provenance. It then stages the complete static deployment into `public/`.

`public/` is therefore deployment output, not a second source-of-truth tree.

## Discovery

Public discovery metadata is generated from published content only. Draft metadata stays outside public output. FI/EN routes, canonical URLs and machine endpoints are generated/validated as part of the publication pipeline.

## Deployment

Vercel serves `public/` as the static output directory while `/api` remains the serverless entry surface. CI builds before the release gate and production operations are separately approval-gated.

## Domain migration

Domain/URL checks are release invariants. Historical migration notes are not kept as active root documentation once their rules are encoded by current tests/build configuration.

Historical lineage incorporated from `DISCOVERY_LAYER.md`, `DOMAIN_MIGRATION.md` and `LAHETYSKONE_APP_SPLIT.md`.
