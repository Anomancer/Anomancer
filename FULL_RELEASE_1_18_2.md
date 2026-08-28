# Anomancer 1.18.2 · Full Release

**Release:** Native Dialog Consolidation

Tämä full release sisältää koko nykyisen Anomancer-koodipohjan, alkuperäisen 1.18.2 Native Dialog Consolidation -kerroksen sekä 2026-08-28 tehdyn senior-tason Core/UI/semantiikka/käännös/tietoturva-kovetuksen.

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
- uudet senior-hardening- ja CORE-roadmap Chromium -regressioportit.

Edeltävät Mancer Runtime-, Codemancer-, Archive Core-, Nanomancer-, Arkistonhoitaja-, Evidence- ja Visual System -kerrokset säilyvät mukana.


## Senior hardening -todennus

- `npm run check`: PASS
- `scripts/test-senior-hardening-1182.mjs`: 7/7 PASS
- `scripts/test-core-roadmap-ui-1182.mjs`: desktop 1440×900, phone 390×844 ja narrow 360×800 PASS
- roadmap on oletuksena suljettu ja avautuu natiivilla `summary`-ohjaimella
- julkinen CORE ei käytä admin-API:a eikä paljasta yksityisiä capability-, Archive- tai provider-sopimuksia

Versiota ei nostettu 1.18.3:een, koska roadmapissa 1.18.3 tarkoittaa seuraavaa varsinaista Codemancer Workbench -julkaisua.
