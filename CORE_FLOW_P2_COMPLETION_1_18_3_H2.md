# Anomancer 1.18.3 Hotfix 2 — Core Flow & P2 Completion

Päivä: 2026-08-28

## Korjattu julkinen Core-flow

- Desktop: 9 vaihetta muodostavat 3×3-käärmeen `1 → 2 → 3 ↓ 4 ← 5 ← 6 ↓ 7 → 8 → 9`.
- Tablet: 9 vaihetta muodostavat kahden sarakkeen käärmeen `1 → 2 ↓ 3 ← 4 ↓ 5 → 6 ↓ 7 ← 8 ↓ 9`.
- Puhelin: vaiheet pysyvät DOM-järjestyksessä pystysuorana aikajanana.
- Stage-kortit saavat `min-width: 0`; nimi ja tekninen tunniste saavat `overflow-wrap: anywhere`.
- Root- ja `public/core.css` ovat identtiset.

## P2-kokonaisuus

- `workspace`, `view` ja `section` omistetaan URLissa ja palautetaan History APIlla.
- Pitkillä työpinnoilla on yhteinen saavutettava save/error/toast-feedback center.
- Arkiston mobiilivirta on lista → inspector → takaisin listaan, fokus palautuen valittuun objektiin.
- `admin-responsive.css` sisältää yhden kanonisen blokin per mediaehto; `max-width:760px` esiintyy kerran.
- Full-app admin story alkaa kirjautumisesta ja kattaa syvälinkin, back/forwardin, muokkauksen, tallennuksen, revision conflictin, dirty guardin ja työtilavaihdon.

## Varmennus

- P2 source contract: 9/9 PASS
- kaikki ei-selaimelliset testit sekä build/domain/SEO-portit: 55/55 PASS
- root/public Core CSS mirror: PASS
- JavaScript syntax: PASS
- 9 Chromium-porttia: kuuluvat `npm run check` -ketjuun ja vaativat `CHROMIUM_BIN`-binäärin; niitä ei ajettu ympäristössä, jossa binääriä ei ollut

## Toimivaltaraja

Hotfix ei lisää repository-write-, Git-, test runner- tai deploy-oikeuksia Codemancerille. Ihminen hyväksyy edelleen julkaisu- ja konfliktiratkaisut.
