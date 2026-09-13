# Lighthouse Phase 8 — QA Gates v1

Phase 8 is the final conformance gate for the Lighthouse Constitution v1 workstream.
It does not introduce product architecture. It verifies the result of Phases 0–7.

## Gate model

- Semantic QA: canonical terminology, Mancer naming, identifier/display separation, progressive disclosure.
- UX QA: Surface → Workshop → Machine Room layering and deep navigation/return path.
- Visual-static QA: shared Lighthouse token layer and frozen known CSS debt boundary.
- Technical QA: build, source checks, routing, phase regression checks.
- Mancer conformance: installed packages load successfully and remain schema-closed.

## Authoritative Phase 8 gate

`node tests/lighthouse/phase8-qa-gates.mjs`

Result:

- 3/3 installed Mancer packages healthy.
- Semantic / UX / visual-static / technical / Mancer conformance gate: PASS.
- Existing hard-coded Lighthouse colors: 56 known values. No new hard-coded colors allowed by the gate.

## Regression checks executed

- UI semantics: 18/18 PASS.
- Phase 5 Workbench layering: PASS.
- Phase 6 Machine Room navigation: PASS.
- Phase 7 Mancer schema conformance: 3/3 PASS; fail-closed fixtures rejected.
- Lighthouse intent routing: PASS.
- Source syntax/structure check: PASS.
- Public build: PASS.
- Lighthouse build: PASS.

## QA maintenance performed in Phase 8

The build/source boundary test was updated to accept either the historical symlink form or an exact-content source mirror for root public pages. The current repository uses content-identical generated root files, so the test now verifies the actual invariant: source pages exist, root pages match them, and builds do not mutate source files.

The Mancer visual-contract test was updated to include the Phase 3 Lighthouse token source (`app/lighthouse/styles/00-tokens.css`) when resolving CSS variables. This preserves the new single token-layer architecture instead of testing only legacy root CSS files.

## Known non-blocking legacy suite drift

The repository's historical 87-step `release-gate --group=static` still contains older assumptions outside the Phase 8 authority gate. One known example is `tests/ui-browser/interaction-navigation.mjs`, which expects no duplicated `(max-width:719px)` media-query block even though the Phase 5/6 baseline already contains such a pair. The same failure reproduces against the untouched Phase 7 package, so it is not introduced by Phase 8.

Browser QA was not claimed as executed in this environment because `node_modules` was not present and `npm ci --ignore-scripts` timed out. No browser-pass claim is made from source-only tests.

## Final status

Phase 8 Constitution gate: **PASS**.

The remaining items are explicitly classified as legacy-test drift or environment-limited browser evidence, not silently treated as green.
