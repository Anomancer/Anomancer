# Anomancer · Full Release 1.18.3

Nykyinen koottu full release on **1.18.3 Codemancer Workbench**.

Se säilyttää koko 1.18.2 hardening-ketjun ja lisää Mancer Runtimeen geneerisen renderer-capability -rekisterin. Codemancerin Koodi-, Tehtävät-, Testit-, Tarkistus-, Julkaisu- ja Dokumentaatio-osiot ovat nyt tehtäväkohtaisia työpintoja geneerisen CRUD-lomakkeen sijaan.

Core ei tunne Codemanceria nimeltä renderer-valinnassa. Package Spec ilmoittaa capabilityn, registry validoi sen ja runtime renderöi pinnan. Repository/Git/deploy-sivuvaikutuksia ei ole annettu tälle kerrokselle.

Release-portti: `npm run build` **PASS**, `npm run check` **PASS**, Workbench static **8/8**, Workbench browser **9/9**, Visual System **8/8**.

Katso `CODEMANCER_WORKBENCH_1_18_3.md`, `FULL_RELEASE_1_18_3.md` ja `FINAL_VALIDATION_1_18_3.md`.
