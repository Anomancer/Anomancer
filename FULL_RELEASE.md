# Anomancer · Full Release 1.18.4

Nykyinen koottu full release on **1.18.4 P3 Capability Wiring & Operational Safety**.

Se säilyttää koko 1.18.2 hardening-ketjun ja lisää Mancer Runtimeen geneerisen renderer-capability -rekisterin. Codemancerin Koodi-, Tehtävät-, Testit-, Tarkistus-, Julkaisu- ja Dokumentaatio-osiot ovat nyt tehtäväkohtaisia työpintoja geneerisen CRUD-lomakkeen sijaan.

Core ei tunne Codemanceria nimeltä renderer-valinnassa. Package Spec ilmoittaa capabilityn, registry validoi sen ja runtime renderöi pinnan. P3 lisää tämän päälle server-authoritative operation-kerroksen, jossa repository-, Git-, test-, deploy- ja rollback-sivuvaikutukset kulkevat plan → kirjallinen hyväksyntä → execute → evidenssi -porttien läpi.

Hotfix 2 lisää julkisen Coren 9-vaiheiseen orkesteriin 3×3/2/1-responsiivisen käärmevirran ja tekee P2 full-app admin storysta aidon login → työtila → muokkaus → tallennus → konflikti → työtilavaihto -polun.

P3 ei kirjoita default-haaraa, automergaa PR:ää tai tarjoa komentomerkkijonoa selaimelle. Production on sidottu yhdistetyn PR:n merge-SHA:han ja Vercelin tuotantopolku GitHubin `production`-environmentiin. Rollback on aina erillinen hyväksytty operaatio.

Tämän paketin paikallinen ei-selaimellinen release-portti: **57/57 PASS**. P3:n kohdennetut backend- ja UI/CI-portit: **14/14 PASS**. Yhdeksän Chromium-porttia säilyvät pakollisessa `npm run check` -ketjussa ja ajetaan ympäristössä, jossa `CHROMIUM_BIN` on saatavilla.

Katso `P3_CAPABILITY_WIRING_1_18_4.md`, `FULL_RELEASE_1_18_4.md` ja `FINAL_VALIDATION_1_18_4.md`.
