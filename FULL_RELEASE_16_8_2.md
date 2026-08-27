# Anomancer 16.8.2 · Responsive Workspace + Narramancer Maturity

16.8.2 sisältää 16.8.0 Core Shell Semanticsin, 16.8.1 Responsive Workspace Navigationin ja Narramancer Authoring Maturity -kerroksen.

## Toimitettu

- metadataohjattu desktop- ja mobiilinavigaatio Anomancerille ja Narramancerille
- enintään neljä ensisijaista mobiilityökalua + Lisävalikko
- yhteinen overlay-controller drawerille, previewlle ja bottom sheetille
- Narramancerin projektikieli ja lokalisoidut tilalabelit
- 10 sekunnin Kumoa-poistot
- lukujen ylös/alas-järjestely
- projektin / luvun selainotsikko + tallentamaton indikaattori
- orkesteriehdotuksen rakenteinen diff ennen ihmisen soveltamista
- tekninen agentti-JSON erillisessä edistyneessä näkymässä
- kieli ja ihmislabelit Markdown-vientiin
- uudet 16.8.1- ja 16.8.2-regressioportit

## Rajat säilyvät

Workspace Template, Constitution, Artifact Boundary, runtime snapshotit, agenttirajaukset, human apply / publish -auktoriteetti ja content-safe installer säilyvät. Narramancer ei saa automaattista julkaisupolkua.

## Tarkistus

```bash
npm run check
```

Kohdistetut portit:

```bash
npm run test:responsive-workspace-navigation
npm run test:narramancer-authoring
```
