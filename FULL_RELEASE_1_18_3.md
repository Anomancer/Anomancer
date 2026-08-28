# Anomancer 1.18.3 · Full Release

**Release:** Codemancer Workbench

1.18.3 on ensimmäinen release, jossa Codemancer ei ole enää vain geneerinen schema-renderer. Se käyttää Mancer Package Specin kautta tehtäväkohtaisia renderer-capabilityja ja muodostaa oikeita kehitystyöpintoja ilman Codemancer-nimikohtaista Core-haaraa.

## Uutta 1.18.3:ssa

- geneerinen Mancer renderer registry;
- kahdeksan validoitua renderer-capabilitya: `file-tree`, `code-editor`, `diff-view`, `task-board`, `test-run-list`, `approval-review`, `release-gate`, `document-preview`;
- Koodi: tiedostoindeksi + editori + inspector;
- Tehtävät: statuspohjainen task board;
- Testit: tulos- ja evidenssipinta;
- Tarkistus: diff + testit + ihmisen päätös samassa hyväksyntäpinnassa;
- Julkaisu: eksplisiittinen release-gate ilman deploy-sivuvaikutusta;
- Dokumentaatio: editori + turvallinen live-preview;
- desktopin rinnakkainen workbench ja mobiilin yhden tehtävän reflow;
- kylmän URL-syvälinkin lifecycle-racen korjaus;
- package registry hylkää tuntemattomat rendererit fail-closed;
- repository/Git/deploy-oikeuksia ei lisätty implisiittisesti.

1.18.3 sisältää edelleen koko 1.18.2 hardening-ketjun: Native Dialog Consolidation, Senior Hardening, P0 Integrity, P1 Visual Surgery ja P2 Interaction & Navigation Hardening.

## Release gate

- `npm run build`: **PASS**
- `npm run check`: **PASS**
- Codemancer Workbench static: **8/8 PASS**
- Codemancer Workbench browser: **9/9 PASS**
- P0: **6/6 PASS**
- P1: **6/6 PASS**
- P2: **7/7 PASS**
- full-app admin story: **6/6 PASS**
- Visual System: **8/8 PASS**
- root/public mirror: **PASS**
- Domain migration + SEO smoke: **PASS**

Katso `CODEMANCER_WORKBENCH_1_18_3.md` ja `FINAL_VALIDATION_1_18_3.md`.
