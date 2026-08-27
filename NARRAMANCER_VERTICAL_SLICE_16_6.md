# Anomancer 16.6 · Narramancer Vertical Slice

16.6 on ensimmäinen konkreettinen todiste 16.5:n Workspace Template + Constitution + Artifact Boundary -arkkitehtuurista. Lähetyskone voi nyt vaihtaa Anomancerista erilliseen Narramancer-työtilaan ilman että Anomancerin julkaisut, Markdown tai julkaisukohde tulevat mukana.

## Työtilasopimus

Narramancer käyttää templatea `narramancer/story-studio/1.0.0` ja Constitution Contractia `narramancer/story-constitution/1.0.0`. Template sallii vain `narrative-*` agentit, sisäänrakennetun `narramancer`-orkesterin, private artifact read/write -kyvykkyydet ja paikallisen viennin. `publication.publish` ei kuulu sen kyvykkyyksiin.

Editorin osiot tulevat palvelimen template-metadatasta: Projekti, Maailma, Hahmot, Juoni, Luvut, Aikajana, Kaanon, Orkesteri ja Vienti. Selain rakentaa navigaation `editorDefinition.sections`-määrittelystä.

## Private Artifact Store

Narramancer-projekti tallennetaan `anomancer-private-artifact-state/v1` -tilana workspace-kohtaiseen storeen. GitHub-tilassa käytetään erillistä tag-refiä `refs/tags/anomancer-private-artifact-<workspace-id>` ja polkua `.anomancer/private-workspace-artifact.json`. Store ei kirjoita julkiseen sisältöhaaraan.

Tallennus käyttää revision conflict -suojausta. Kaksi Narramancer-workspacea eivät jaa projektia, hahmoja, lukuja, aikajanaa tai kaanonia.

## Narramancer-orkesteri

Built-in putki on:

1. Premissi
2. Maailmanrakentaja
3. Hahmoarkkitehti
4. Juonisuunnittelija
5. Kohtauskirjoittaja
6. Jatkuvuusvahti
7. Äänieditori
8. Kriitikko
9. Käsikirjoituspaketti

Agenttiraja tarkistetaan palvelimella myös suorissa agenttikutsuissa. Runtime Snapshot sitoo workspace-id:n, templaten, Constitutionin, Artifact Boundaryn, Runtime Profilet ja koko Orchestra Contractin yhteen allekirjoitettuun snapshotiin.

Orkesteri työskentelee projektin kopiolla. Valmis ajo ei muuta tallennettua projektia automaattisesti. Ihminen siirtää ehdotuksen editoriin erillisellä toiminnolla ja tallentaa sen vielä erikseen.

## Vienti

Ensimmäinen versio tukee vain nimenomaista paikallista vientiä:

- Markdown-projektikansio ZIPinä
- yksi koottu `*.md`-käsikirjoitus
- JSON-varmuuskopio

Projektikansiossa ovat `project.md`, `world.md`, `plot.md`, hahmot, luvut, `timeline.md`, `canon.md` ja `MANUSCRIPT.md`. Vientitoiminnot eivät julkaise mitään verkkoon.

## Hyväksymistesti

16.6:n testi rakentaa Narramancer-workspacen, tallentaa hahmon ja ensimmäisen luvun, lataa projektin uudelleen, varmistaa toisen Narramancer-workspacen tyhjyyden, tarkistaa Anomancer Posts API:n näkymättömyyden, estää Anomancer-agentin suoran kutsun, allekirjoittaa Narramancer Runtime Snapshotin ja tuottaa oikeasti avautuvan Markdown-projektikansion ZIPin.
