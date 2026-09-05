# ANOMANCER 1.25 · Validation Evidence

Build: `1.25.0-ui-architecture-hardening.2`
Status: **release candidate**. Ei vielä ulkoisen releasen lopullinen hyväksyntä.

## Todennettu tässä työympäristössä

- `content/`: 20 tiedostoa, identtinen alkuperäisen 1.24.6-paketin kanssa.
  - SHA-256 ketjuhash: `81807c8e84fab600868fa3aa9705b66e4650e05944e7df649f8f7ba1c231469a`
- `media/`: 9 tiedostoa, identtinen alkuperäisen 1.24.6-paketin kanssa.
  - SHA-256 ketjuhash: `aa4623353928488c6a3b2b717adba39ab4059a03c97534cb68d890d357d2ca0b`
- Static release gate: vaiheet 1–63 vihreät yhdessä ajossa ja 64–85 vihreät välittömästi perään ilman koodimuutoksia, yhteensä 85/85.
- `scripts/check-source.mjs`: 210 JavaScript-tiedostoa ja 153 JSON-tiedostoa läpi.
- `tests/ui-browser/ui-semantics.mjs`: 18/18.
- `tests/ui-browser/mobile-control-plane-reflow.mjs`: 9/9.
- `tests/ui-browser/responsive-workspace-navigation.mjs`: 7/7.
- `tests/lighthouse/stable-house.mjs`: 9/9.
- `tests/lighthouse/focus-layers.mjs`: 12/12.
- `tests/ui-browser/visual-system.mjs`: 8/8 oikealla Linux Chromiumilla, mukaan lukien 1440×900, 1024×768, 768×1024, 390×844, 360×800, reduced motion ja more contrast.
- `tests/lighthouse/ui-ux-audit-hardening.mjs`: computed mobile/Desktop-sopimus läpi oikealla Linux Chromiumilla.
- Browser release gate: 9 ensimmäistä 12:sta portista vihreiksi ennen sandboxin dependency/policy-rajaa: Codemancer Workbench, full-app admin story, Archive UI, Nanomancer UI, Arkistonhoitaja UI, Mancer UI, native dialogs, Core roadmap ja visual-system.
- Authentikoitu Workbench-baseline: 13 kandidaattinäkymää, PNG + layout/computed-style contract. Baseline-manifesti on `candidate-generated-not-human-approved`.

## Ympäristörajat, joita ei merkitä PASS-tilaan

Tämän sandboxin lähdepaketissa `node_modules/axe-core` ei ollut käyttökelpoisesti asennettuna eikä npm-verkkoyhteyttä ole. Siksi oikeaa lukittua `axe-core@4.10.3` -ajoa ei voitu suorittaa loppuun tässä ympäristössä.

Sandboxin järjestelmä-Chromiumissa on hallittu `URLBlocklist: ["*"]`. Se estää Playwrightin localhost-navigaation `ERR_BLOCKED_BY_ADMINISTRATOR`-virheellä. Hallintapolitiikkaa ei poistettu tai ohitettu. Release-gaten Chromium-preflight on kovennettu käyttämään eksplisiittistä olemassa olevaa `CHROMIUM_BIN`-selainta ennen verkkolatausta. Localhostia käyttävät tunnetut browser-fixturet jätettiin ennalleen, koska niiden uudelleenkirjoitusta ei hyväksytä ilman oikeaa axe-verifiointia.

## Lopulliseen hyväksyntään vaaditaan vielä

1. `npm ci --include=dev` ympäristössä, jossa lukitut npm-riippuvuudet ovat saatavilla.
2. `npm run check` kokonaisena 97/97-ajona.
3. Oikea axe 4.10.3 -accessibility-matrix autentikoidulle Workbenchille.
4. Ihmisen hyväksyntä 13 Workbench-baseline-kuvalle.
5. Firefox Linux desktop -ristiintestaus.
6. Chrome Android / OnePlus -oikean laitteen testi.
7. Safari iPhone/iPad ja Safari macOS -oikean laitteen testi. WebKit-emulaatio ei korvaa näitä.
8. Tuotannon smoke-testi vasta edellisten jälkeen.

## Asennuksen turvaraja

`INSTALL_TO_CURRENT.sh` tekee turvakopion, jättää `content/`, `media/`, `.env*`, `.vercel/` ja paikallisen `.anomancer/state/`-tilan koskematta, asentaa lukitut dev-riippuvuudet `npm ci --include=dev` -komennolla ja ajaa koko release gaten ennen mahdollista deployta. 1.25:n autentikoidut visual-baselinet kopioidaan asennuksessa mukaan.
