# Anomancer 1.18.3 · Codemancer Workbench

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

1.18.3 ei vielä anna Codemancerille repository-write-, Git-, test runner- tai deploy-toimivaltaa. Workbench tekee työn ja päätösrajat näkyviksi ennen näiden capabilityjen turvallista liittämistä.

Katso `CODEMANCER_WORKBENCH_1_18_3.md`, `FULL_RELEASE_1_18_3.md` ja `FINAL_VALIDATION_1_18_3.md`.
