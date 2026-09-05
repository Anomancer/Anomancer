# Anomancer 1.26.0 · Frontend Consolidation

This milestone is a structural frontend cleanup on top of 1.25.7. It intentionally preserves the existing Lighthouse cascade order while replacing the single `app/lighthouse/lab.css` monolith with explicit ownership modules.

## Completed

- Lighthouse CSS source graph modularized.
- `lab.css` reduced to an ownership manifest.
- Lighthouse build copies the style graph to `public/lighthouse/styles/`.
- Lighthouse tests compose the same ordered graph through `scripts/read-lighthouse-css.mjs`.
- Direct Lighthouse text below 12 px removed.
- Workbench Constitution direct text below 12 px removed.
- Shared focus-visible and coarse-pointer touch-target policy added.
- Repeated Lighthouse palette literals partially promoted to semantic tokens with no color changes.

## Deliberately deferred

- Full breakpoint extraction into one responsive owner. Existing media-query order is preserved because moving it wholesale would change cascade precedence.
- `lighthouse-ui-constitution.css` specificity / `!important` reduction. This needs selector-by-selector visual verification, not automated deletion.
- `app/lighthouse/lab.js` controller split. This is a separate behavioral refactor and should follow after the CSS baseline is stable.
