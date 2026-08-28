# Anomancer 1.18.3 · Final Validation

**Päivä:** 2026-08-28  
**Release:** Codemancer Workbench  
**Pakettiversio:** 1.18.3

## Release-portti

| Portti | Tulos |
|---|---|
| `npm run build` | PASS |
| `npm run check` | PASS |
| P0 Integrity | 6/6 PASS |
| P1 Codemancer Visual Surgery | 6/6 PASS |
| P2 Interaction & Navigation | 7/7 PASS |
| Codemancer Workbench static | 8/8 PASS |
| Codemancer Workbench Chromium | 9/9 PASS |
| Full-app Admin Story | 6/6 PASS |
| Mancer UI Chromium | 2/2 PASS |
| Visual System Chromium | 8/8 PASS |
| Navigation Shell | 12/12 PASS |
| Responsive Workspace Navigation | 7/7 PASS |
| Domain migration | PASS |
| SEO/content/admin smoke | PASS |

## Varmennetut invariantit

1. Core ei hardkoodaa Codemancer-työtilan nimeä renderer-valinnassa.
2. Tuntematon renderer-capability hylätään registryssä.
3. Koodi-, tehtävä-, testi-, review-, release- ja dokumentaatiopinnat käyttävät tehtäväkohtaisia renderereitä.
4. Koodieditori käyttää nykyistä Mancer dirty/save/conflict -sopimusta.
5. Workbench ei saa repository-write-, Git-, push-, deploy- tai automaattista apply-toimivaltaa.
6. Review näyttää diff-, testi- ja ihmispäätöskontekstin samassa pinnassa.
7. Release näyttää portit ilman deploy-sivuvaikutusta.
8. Suora `section`-syvälinkki säilyy myös kylmässä käynnistyksessä.
9. 360×800 workbench reflowaa ilman vaakavuotoa ja editorikontrollit säilyvät mobiiliturvallisina.
10. Komponentti-CSS:ssä on 0 media querya; responsiivinen omistajuus pysyy yhteisessä kerroksessa.
11. Root- ja public-adminlähteet ovat buildin jälkeen identtisiä.
12. Koko historiallinen regressioketju päättyy vihreänä Domain migration- ja SEO-smoke-portteihin.

## Löydetty ja korjattu release-regressio

Workbenchin browser-E2E paljasti P2:n URL-lifecycle-racen. Shell saattoi käsitellä `section=code`-syvälinkin ennen Mancer-rendererin rekisteröitymistä ja palauttaa sectionin Projektiin. Korjaus estää sectionin ylikirjoituksen rendererin ollessa vielä latautumassa ja antaa myöhäiselle Mancerille nykyisen URL-kontekstin.

Visual System löysi lisäksi yhden tarpeettoman `!important`-ylikirjoituksen dokumentaation placeholderista. Se poistettiin eikä laatubudjettia löysätty.

## Päätös

**RELEASE GATE: PASS**

1.18.3 voidaan paketoida Codemancer Workbench -full releaseksi. Repository- ja deploy-capabilityt eivät kuulu tämän version toimivaltaan.
