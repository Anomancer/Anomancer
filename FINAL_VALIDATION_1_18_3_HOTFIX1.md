# Final Validation — Anomancer 1.18.3 Hotfix 1

Päivä: 2026-08-28

## Release gate

- `npm run build`: PASS
- `npm run check`: PASS
- Interaction + CSS hotfix static gate: 8/8 PASS
- Codemancer Workbench full-admin Chromium: 13/13 PASS
- P1 Codemancer Visual Surgery: 6/6 PASS
- Mancer UI Chromium: 2/2 PASS
- Visual System: 8/8 PASS
- App Split / PWA: 7/7 PASS
- Navigation Shell Visual Hardening: 10/10 PASS
- koko historiallinen regressioketju Domain migration + SEO smokeen asti: PASS

## Varmennetut regressiot

1. Uudet Workbench-kontrollit eivät enää putoa harmaaseen selaimen natiivityyliin.
2. Mobiilin Mancer-ohjaimet käyttävät vähintään 16 px fonttia.
3. 360 px Core-nav ei vuoda viewportista.
4. Shell-assetit eivät enää käytä cache-first-strategiaa.
5. Service worker -päivitys ei reloadaa dirty-työtä.
6. Keskeiset näkyvät Workbench- ja shell-napit on testattu oikeilla pointer-tapahtumilla ja hit-testillä.
