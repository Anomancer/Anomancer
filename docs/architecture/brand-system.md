# Brand System · Phase 7

Phase 7 adds one canonical public brand asset boundary without reintroducing generated/source duplication.

## Canonical assets

All public brand artwork lives under `media/brand/`:

- `anomancer-wordmark.png` — Anomancer header/footer and public navigation wordmark
- `anomancer-core-wordmark.png` — Core header/footer wordmark
- `anomancer-mark.png` — Anomancer favicon/application mark
- `core-mark.png` — public Core identity mark
- `transmission-pulse.png` — transmission/editorial signal ornament

`media/` is source-controlled input. The build copies it into `public/media/`; `public/` remains generated output.

## PWA icons

The existing stable PWA paths under `icons/lahetyskone-*.png` are retained, but their artwork is regenerated from the new Anomancer mark. This avoids changing the app manifest contract while updating the installed icon.

## Usage contract

- Anomancer home FI/EN: Anomancer wordmark in header, hero and footer.
- Public Core FI/EN: Anomancer Core wordmark in header/footer and Core mark in the hero.
- Lähetykset / Dispatches / articles: generated header/footer inherit the Anomancer wordmark; transmission index uses the pulse ornament.
- Private Core/PWA: favicon and install icon use the Anomancer mark.
- Visible logo images are decorative when an accessible textual heading/aria-label already names the product.

## Regression boundary

`tests/ui-browser/brand-system.mjs` verifies source assets, PWA icon dimensions, FI/EN wiring, generated build output and the source/output boundary.

## Phase 7.1 visual consolidation

The pulse artwork is reserved for Lähetykset / Dispatches transmission identity. Public Home and Core hero surfaces use wordmarks without the pulse. Home, Core and generated publication headers share one size and spacing contract. Core keeps the standalone Core mark as favicon/PWA-adjacent artwork, not as the public hero identity.

## Phase 7.2 header identity

Public Home and Core use the same Anomancer wordmark in the shared site header. The Anomancer Core wordmark is reserved for the Core hero identity. Header navigation typography is governed by one explicit shared contract in `styles.css`.
