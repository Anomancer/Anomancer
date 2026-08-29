# Validation — 1.20.0-lighthouse-shell.1

## Milestone gates

```bash
npm run test:lighthouse:routing
npm run test:lighthouse:ux
npm run check:lighthouse
npm run check
npm run export:source
ANOMANCER_LIGHTHOUSE_LAB=1 npm run export:deploy
```

## Evidence from the release build

- Lighthouse static contract suite: 16/16 passed.
- Extracted source-bundle verification: D0–D6, intelligence, routing, UX architecture, API surface, UI semantics, source boundary and export allowlist passed from a clean extraction.
- Legacy/non-browser regression sample after the API-surface migration: 38/38 passed.
- `scripts/build-blog.mjs --check`: passed with 20 published items and Content + media check OK in the populated build workspace.
- Source export preserves the canonical root symlinks (`index.html`, `en.html`, `core.html`, `core-en.html`) instead of dereferencing them.
- Source and deploy bundles both contain the Lighthouse routing/runtime modules; deploy verification contains `/lab` and `/lighthouse/lab.js` when `ANOMANCER_LIGHTHOUSE_LAB=1` is set.

## Environment-limited gates

The content-safe source bundle intentionally omits the repository's `media/` brand corpus. A full release-gate run from that isolated tarball therefore stops at the legacy brand-system fixture unless the repository media is present. This is an export-boundary condition, not a Lighthouse regression.

Browser E2E additionally requires the pinned Playwright/Chromium dependency. It must be run in the populated repository before merge/deploy.

## Architecture invariants

- D0 contains no provider, model, agent, orchestra, capability, runtime or Depth jargon.
- D0 preview is local and precedes the external reasoning call.
- The user explicitly starts the external reasoning run.
- Mobile exposes only three first-level inspection actions: `Miksi?`, `Aineisto`, `Lisää`.
- Desktop and mobile use the same D0–D6 ontology; only presentation changes.
- `research.search` remains visibly unavailable until a real search tool is wired.
- External side-effect intent never grants execution authority to the model.
- Capability resolution remains provider-neutral; the current semantic execution implementation may still resolve through the DeepSeek adapter.
- Problem Model, capability resolution, work recommendation and authority decision are recorded in Core provenance.
