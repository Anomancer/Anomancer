# Anomancer 1.18.2 · Full Release

**Release:** P2 Interaction & Navigation Hardening

Tämä full release sisältää koko nykyisen Anomancer-koodipohjan sekä 1.18.2-kovennusketjun: Native Dialog Consolidation, Senior Hardening, P0 Data Integrity, P1 Codemancer Visual Surgery ja P2 Interaction & Navigation Hardening.

Uutta tässä julkaisussa:

- yhteinen async confirm/prompt/form/notice-dialogijärjestelmä,
- fokusrajaus, inert ja fokuksen palautus,
- natiivien alert/confirm/prompt-kutsujen poisto admin-työpoluista,
- turvallisuuskriittisten ihmisen päätösporttien säilytys,
- yhtenäinen kuvan alt/caption-lomake,
- desktop + 360 px Chromium-regressioportti,
- julkisen COREn 1.18.x-rakennenäkymä ja eksplisiittinen public allowlist,
- FI/EN-eroteltu 1.18.2 → 2.0 roadmap, oletuksena suljettuna natiivina disclosure-pintana,
- JSON-body-, Origin-, scrypt-, CSP-, COOP/CORP- ja opener-kovennukset,
- uudet senior-hardening- ja CORE-roadmap Chromium -regressioportit,
- P0:n yhteinen dirty/conflict/workspace-epoch -eheyskerros,
- P1:n Codemancer-tokenointi, kontrollikieli ja mobiilin authority-hierarkia,
- P2:n URL/history-state, yhteinen feedback center ja Arkiston mobiili master/detail,
- konsolidoitu admin-responsive-kaskadi sekä oikean admin-DOMin full-story E2E-portti.

Edeltävät Mancer Runtime-, Codemancer-, Archive Core-, Nanomancer-, Arkistonhoitaja-, Evidence- ja Visual System -kerrokset säilyvät mukana.


## 1.18.2 hardening -todennus

- `npm run check`: PASS
- `scripts/test-senior-hardening-1182.mjs`: 7/7 PASS
- `scripts/test-core-roadmap-ui-1182.mjs`: desktop 1440×900, phone 390×844 ja narrow 360×800 PASS
- `scripts/test-p0-integrity-1182.mjs`: PASS
- `scripts/test-p1-codemancer-visual-1182.mjs`: PASS
- `scripts/test-p2-interaction-navigation-1182.mjs`: PASS
- `scripts/test-admin-story-1182.mjs`: 6/6 full-app story PASS
- `scripts/test-visual-system-1684.mjs`: 8/8 PASS; komponentti-CSS:ssä 0 media querya, responsive-omistajalla 15 kanonista ehtoa
- `scripts/test-native-dialog-consolidation-1182.mjs`: 7/7 PASS
- `scripts/test-living-machine-room-163.mjs`: 21/21 PASS
- roadmap on oletuksena suljettu ja avautuu natiivilla `summary`-ohjaimella
- julkinen CORE ei käytä admin-API:a eikä paljasta yksityisiä capability-, Archive- tai provider-sopimuksia

Versiota ei nostettu 1.18.3:een, koska roadmapissa 1.18.3 tarkoittaa seuraavaa varsinaista Codemancer Workbench -julkaisua.
