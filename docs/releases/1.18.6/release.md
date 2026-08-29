# Anomancer 1.18.6 — Audit Closure

1.18.6 closes the senior UI/UX, QA and semantic audit dated 2026-08-28. It is a hardening release: the existing authority, workspace, capability and source/build boundaries remain in place.

## Truth boundary

- A source starts as `candidate`; origin never promotes it to verified evidence.
- `verified` requires a method, verifier, UTC timestamp, evidence reference and concise notes.
- A direct-open receipt cannot coexist with a 403, inaccessible-source or verification-recommended challenge.
- Published source links are bound to structured claims. A candidate may support an explicitly open claim, but never a supported claim.
- The public projection distinguishes candidates, verified evidence, rejected sources and open claims.

## Release assurance

- `npm run check:static` runs deterministic source, service, contract and integrity gates.
- `npm run check:content` validates the entire published corpus and public projection.
- `npm run check:browser` provisions the pinned Playwright Chromium and runs browser, visual, full-flow and accessibility checks.
- `npm run check` builds and runs all groups as the release-blocking command.
- CI installs the pinned Chromium build and retains `test-results/` on failure.

## Interface and delivery

- Public header targets and inspected metadata meet the release thresholds of 44 CSS px and 12 CSS px.
- The private app renders an immediate boot state and has an explicit session error/retry path.
- Public Core uses an overview, search and progressive registry disclosures.
- Dispatch filters are URL-owned and recover through reload/back navigation; sparse translations and missing article translations are explicit.
- Source and deploy exports are separate, allowlisted and hash-manifested.

## Operations

Production contact throttling requires a shared REST-compatible rate-limit store. Vercel Marketplace Upstash variables (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) work directly; the explicit `CONTACT_RATE_LIMIT_REST_*` names and legacy `KV_REST_API_*` names remain supported. Production fails closed if that store is absent or unavailable; raw IP addresses are never used as stored keys.
