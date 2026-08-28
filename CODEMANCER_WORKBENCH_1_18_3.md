# Anomancer 1.18.3 · Codemancer Workbench

## Tavoite

1.18.3 muuttaa Codemancerin Mancer Package Spec -todisteesta ensimmäiseksi oikeaksi tehtäväkohtaiseksi kehitystyöpöydäksi. Core ei edelleenkään tunne Codemanceria nimeltä. Paketti ilmoittaa tarvitsemansa renderer-capabilityt ja geneerinen Mancer Runtime valitsee rekisteröidyn rendererin osion sopimuksen perusteella.

Tämä julkaisu toteuttaa auditin Workbench-vaiheen ensimmäisen täyden vertical slicen. Repositoryn suora luku/kirjoitus, Git-operaatiot, testiprosessien käynnistys ja deploy pysyvät tarkoituksella tämän julkaisun toimivallan ulkopuolella.

## Renderer capability -sopimus

Codemancer Package Spec ilmoittaa kahdeksan capabilitya:

- `file-tree`
- `code-editor`
- `diff-view`
- `task-board`
- `test-run-list`
- `approval-review`
- `release-gate`
- `document-preview`

`server/mancer-registry.js` validoi capabilityt fail-closed. Tuntematon section renderer hylätään. `admin-mancer.js` sisältää geneerisen renderer-rekisterin eikä työtilanimen `codemancer` perusteella tehtävää UI-haaraa.

## Työpinnat

### Koodi

Desktopilla kolmipaneelinen rakenne:

```text
Tiedostoindeksi | Fokusoitu editori | Konteksti-inspector
```

Tiedoston valinta vaihtaa aktiivista itemiä. Editorointi käyttää samaa dirty/save/conflict-sopimusta kuin muu Mancer Runtime. Pinta ei tee repository-writea.

### Tehtävät

Tehtävät ryhmitellään neljään tilaan tehtävätauluksi. Data pysyy Mancer-artefaktissa, eikä tila ole erillinen Codemancer-spesiaali Coren sisällä.

### Testit

Testit näyttävät tuloksen, statuksen ja evidenssin erikoispintana. 1.18.3 ei vielä käynnistä testiprosessia itse, vaan renderöi Mancer-artefaktin testituloksen.

### Tarkistus

Diff, testitila, riski/konteksti ja ihmisen päätös yhdistyvät samaan review-pintaan. Ihmisen hyväksyntä säilyy eksplisiittisenä porttina.

### Julkaisu

Release-pinta näyttää neljä eksplisiittistä gatea. Gatejen näkyminen tai hyväksyntä ei käynnistä Git-, push-, deploy- tai publication-toimintoa.

### Dokumentaatio

Dokumentaatio käyttää item-listaa, editoria ja turvallisesti escapettua live-previewta.

## Responsiivisuus

Desktopin työpöytä käyttää rinnakkaista kontekstia yhden ylileveän textarean sijaan. `max-width:760px`-omistajuus säilyy P2:ssa konsolidoidussa `admin-responsive.css`:ssä. Komponentti-CSS:ssä ei ole media queryja.

360×800-näkymässä workbench putoaa yhteen työpalstaan, tiedostoindeksi muuttuu vaakasuuntaiseksi valitsimeksi ja editorin tekstikoko pysyy 16 px:ssa mobiiliselaimen automaattizoomin estämiseksi.

## Navigation lifecycle -korjaus

1.18.3:n browser-portti paljasti P2-jälkiregression: kylmä syvälinkki `section=code` saattoi palautua Projekti-osioon, jos Workspace Shell ehti käsitellä URL:n ennen myöhään rekisteröityvää Mancer-rendereria.

Korjaus:

- shell ei ylikirjoita section-statea, jos kyseisen työtilan renderer on vielä rekisteröitymässä;
- myöhään latautuva Mancer lukee nykyisen URL-sectionin ja synkronoi paikallisnavigaation;
- back/forward ja suora syvälinkki käyttävät samaa section-totuutta.

## Authority boundary

1.18.3 ei lisää Codemancerille:

- suoraa repository-read/write -oikeutta;
- Git stage/commit/push -toimintoa;
- automaattista patchin soveltamista;
- testiprosessin käynnistystä;
- deploy- tai release-sivuvaikutusta.

Workbench tekee muutoksen, testitiedon ja päätösportin näkyväksi. Sivuvaikutusten toimivalta voidaan lisätä myöhemmässä kerroksessa erillisillä capability- ja approval-sopimuksilla.

## Todennus

- `scripts/test-codemancer-workbench-1183.mjs`: **8/8 PASS**
- `scripts/test-codemancer-workbench-ui-1183.mjs`: **9/9 PASS**
- `scripts/test-admin-story-1182.mjs`: **6/6 PASS**
- `scripts/test-p0-integrity-1182.mjs`: **6/6 PASS**
- `scripts/test-p1-codemancer-visual-1182.mjs`: **6/6 PASS**
- `scripts/test-p2-interaction-navigation-1182.mjs`: **7/7 PASS**
- `scripts/test-visual-system-1684.mjs`: **8/8 PASS**
- koko `npm run check`: **PASS**

## Seuraava raja

1.18.3 todistaa specialized renderer -sopimuksen. Seuraava turvallinen kerros on Mancer Package Specin kovennus ja vasta sen jälkeen repository-/tool-capabilityjen liittäminen niin, että read, propose, apply, test ja release ovat erillisiä toimivaltatasoja.
