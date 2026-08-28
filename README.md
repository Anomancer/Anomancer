# Anomancer 1.18.5 · Live Path Verification & Canary Gate

> **P3 · Repository, Git, tests, Vercel and rollback · 2026-08-28**
> Codemancerin tallennettu artefakti voidaan nyt viedä turvallisen operation-ketjun läpi: sivuvaikutukseton plan → plan hashiin sidottu kirjallinen hyväksyntä → erillinen execute → operation-haara → testit → PR → yhdistetyn PR:n tarkka merge-SHA → production. PR:ää ei automergata, default-haaraa ei kirjoiteta suoraan eikä selain voi toimittaa komentomerkkijonoa.

Keskeiset P3-muutokset:

- seitsemän rajattua capabilitya: repository-write, testit, PR, preview, production sekä repository- ja deployment-rollback
- työtilakohtainen, revision conflict -suojattu ja hash-ketjutettu operation-audit
- 24 tunnissa vanheneva plan sekä erilliset plan-, approve-, execute- ja refresh-tapahtumat
- palvelimen tallennetusta artefaktista johtamat tiedostot; polku-, koko-, duplikaatti- ja secret-guardit
- vain uusi `anomancer/op-*`-haara; ei default-haaran ref-päivitystä eikä automergea
- GitHub Actions -portti ajaa `npm run check` ennen Vercel prebuilt -previewta tai -productionia
- production sidotaan yhdistetyn PR:n täsmälliseen merge-SHA:han ja GitHubin `production`-environmentiin
- rollback vaatii oman kirjallisen hyväksynnän ja täsmällisen muuttumattoman haaran tai Vercel deployment -kohteen

Live-canary, repository-lukko ja evidenssivirta: `LIVE_PATH_VERIFICATION_1_18_5.md`. Koottu julkaisu: `FULL_RELEASE_1_18_5.md`. P3:n alkuperäinen capability-sopimus säilyy dokumentissa `P3_CAPABILITY_WIRING_1_18_4.md`. Lopullinen paikallinen validointi: `FINAL_VALIDATION_1_18_5.md`.

## Edellinen julkaisu: 1.18.3 Codemancer Workbench

> **Hotfix 2 · Core Flow & P2 Completion · 2026-08-28**
> Korjaa julkisen Coren 9-vaiheisen orkesterin desktopilla 3×3-käärmeeksi, tabletilla kahden sarakkeen käärmeeksi ja puhelimella pystyaikajanaksi. Pitkät nimet rivittyvät turvallisesti ja nuolet seuraavat suoritusjärjestystä. Full-app admin story alkaa nyt oikeasta kirjautumisesta. Katso `CORE_FLOW_P2_COMPLETION_1_18_3_H2.md`.

> **Hotfix 1 · Interaction & CSS Bug Sweep · 2026-08-28**
> Korjaa Workbench-kontrollien selector-sopimuksen, kapean Core-navin sekä PWA:n stale shell -split-brainin. Täysi regressioketju PASS. Katso `INTERACTION_CSS_HOTFIX_1_18_3_H1.md`.


1.18.3 muuttaa Codemancerin geneerisestä schema-workbenchista tehtäväkohtaiseksi kehitystyöpöydäksi säilyttäen Mancer Runtime -periaatteen: Core ei hardkoodaa työtilan nimeä, vaan paketti ilmoittaa tarvitsemansa renderer-capabilityt.

Keskeiset muutokset:

- kahdeksan validoitua workbench-renderer-capabilitya
- Koodi: tiedostoindeksi → editori → inspector
- Tehtävät: task board
- Testit: tulos- ja evidenssipinta
- Tarkistus: diff + testit + ihmisen päätös
- Julkaisu: eksplisiittiset gate-tilat ilman deploy-sivuvaikutusta
- Dokumentaatio: editori + turvallinen live-preview
- desktopin rinnakkainen workbench ja mobiilin yhden työpalstan reflow
- kylmien URL-syvälinkkien lifecycle-korjaus
- koko 1.18.2 P0/P1/P2-hardening säilyy alla

1.18.3 ei vielä antanut Codemancerille repository-write-, Git-, test runner- tai deploy-toimivaltaa. P3 1.18.4 liitti nämä rajattuina, erikseen hyväksyttävinä operaatioina. 1.18.5 kovettaa niiden oikean live-canary-polun.

Katso `CODEMANCER_WORKBENCH_1_18_3.md`, `FULL_RELEASE_1_18_3.md` ja `FINAL_VALIDATION_1_18_3.md`.
