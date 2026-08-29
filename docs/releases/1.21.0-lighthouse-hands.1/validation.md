# Validation — 1.21.0-lighthouse-hands.1

Validated in the content-safe release workspace:

- 17/17 Lighthouse non-browser suites passed, including Hands, routing, trust, Orchestra, Machine Room, Core, responsive and API-boundary coverage.
- 11/11 legacy Core-runtime suites passed.
- 4/4 export-allowlist checks passed.
- 5/5 API-surface checks passed.
- The installer pre-commit export probe passed: default export excludes untracked files, while the explicitly enabled installer-validation mode sees allowlisted untracked release files before staging.
- The wider static release gate passed through step 26/84 and stopped at the expected `brand-system` boundary because this content-safe source workspace intentionally excludes `media/brand/anomancer-wordmark.png` and the rest of the local media corpus.

Browser E2E is not claimed from this export workspace because the Playwright package/browser and source media corpus are not bundled here. The canonical final gate remains `npm run check` in the live repository, where the media corpus and installed browser dependencies exist.

Hands-specific validation covers URL/research routing, runtime availability overrides, software-domain repository routing, read-only Codemancer activation, private-network URL denial, runtime-evidence prompt boundaries, D0 data-egress notice, D2 source grounding, D4 hand stage, D5 capability audit trail, D6 provenance and preservation of human-final-authority with external side effects disabled.
