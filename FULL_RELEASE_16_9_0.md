# Anomancer 16.9.0 · Full Release

Sisältää 16.8.0 Core Shell Semanticsin, 16.8.1 Responsive Workspace Navigationin, 16.8.2 Narramancer Authoring Maturityn, 16.8.3 Evidence Interactionin, 16.8.4 Visual System Consolidationin ja uuden 16.9.0 Public Clarity Pass -kerroksen.

## Toimitettu 16.9.0

- julkinen Core jaettu kolmeen ymmärrettävään päälukuun ilman yhdeksän teknisen ankkurin poistamista
- julkisen Coren build-fallback ja client-renderi yhdistetty samaan `public-core-render.js`-rendereriin
- fallback generoidaan suoraan `createPublicCoreView()`-snapshotista eikä kovakoodatuista vanhoista agentti-/orkesterimääristä
- kaikki julkiset sisäänrakennetut orkesterit renderöidään, mukaan lukien Narramancer
- julkinen “ohjaustaso/control plane” -terminologia vaihdettu rakennenäkymäksi
- toistuvat LIVE/KÄYTÖSSÄ-statusmerkit ja ylimääräinen Admin-CTA poistettu
- Lähetysten mobiilifiltterit yhdistetty samaan aihe + yleisö bottom sheetiin
- yleisöfilttereihin lisätty määrät ja nollasisältöiset yleisöt poistettu aktiivisista valinnoista
- aktiivisten filttereiden yhteenveto ja Tyhjennä-toiminto lisätty
- etusivun hero ja yhteysjohdanto tiivistetty sekä kovakoodattu ikä/aikajakso poistettu FI/EN-pinnoilta
- Narramancerin 9-vaiheinen public-orchestra reflowaa 360 px puhelimessa pystyaikajanaksi
- lisätty `scripts/test-public-clarity-169.mjs` osaksi `npm run check` -release-porttia

## Rajat

16.9.0 muuttaa julkista esitystä ja build-renderöintiä. Se ei muuta Agent Contracteja, Constitutioneja, Artifact Boundarya, Evidence Layerin totuusmallia, publish gatea, Tool Brokeria, Model Routerin yksityisiä reittejä, human approval -valtaa tai public disclosure allowlistia.

## Hyväksyntä

Release hyväksytään vain, kun koko `npm run check` menee läpi ja build stageaa myös yhteisen `public-core-render.js`-moduulin `public/`-outputtiin. JavaScript-fallbackin ja client-renderin tulee perustua samaan public Core -snapshotiin.
