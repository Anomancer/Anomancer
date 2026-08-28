# Anomancer · Full Release 1.18.3

Nykyinen koottu full release on **1.18.3 Codemancer Workbench · Hotfix 2**.

Se säilyttää koko 1.18.2 hardening-ketjun ja lisää Mancer Runtimeen geneerisen renderer-capability -rekisterin. Codemancerin Koodi-, Tehtävät-, Testit-, Tarkistus-, Julkaisu- ja Dokumentaatio-osiot ovat nyt tehtäväkohtaisia työpintoja geneerisen CRUD-lomakkeen sijaan.

Core ei tunne Codemanceria nimeltä renderer-valinnassa. Package Spec ilmoittaa capabilityn, registry validoi sen ja runtime renderöi pinnan. Repository/Git/deploy-sivuvaikutuksia ei ole annettu tälle kerrokselle.

Hotfix 2 lisää julkisen Coren 9-vaiheiseen orkesteriin 3×3/2/1-responsiivisen käärmevirran ja tekee P2 full-app admin storysta aidon login → työtila → muokkaus → tallennus → konflikti → työtilavaihto -polun.

Tämän julkaisun ei-selaimellinen release-portti: **55/55 PASS**, mukaan lukien build check, Domain migration ja SEO. Yhdeksän Chromium-porttia säilyvät pakollisessa `npm run check` -ketjussa; niiden ajaminen vaatii `CHROMIUM_BIN`-binäärin.

Katso `CORE_FLOW_P2_COMPLETION_1_18_3_H2.md`, `CODEMANCER_WORKBENCH_1_18_3.md`, `FULL_RELEASE_1_18_3.md` ja `FINAL_VALIDATION_1_18_3.md`.
