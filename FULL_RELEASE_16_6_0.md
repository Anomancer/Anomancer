# Anomancer 16.6.0 · Full Release

**Release:** Narramancer Vertical Slice

16.6 tekee 16.5:n monityötila-arkkitehtuurista ensimmäisen uuden oikean koneen. Narramancer on eristetty tarina- ja käsikirjoitustyötila omalla Workspace Templatella, Constitution Contractilla, private Artifact Storella, metadataohjatulla editorilla, yhdeksän agentin orkesterilla ja paikallisella vientirajalla.

Keskeiset uudet tiedostot ovat `server/narramancer-project.js`, `server/private-artifact-store.js`, `server/narrative-agents.js`, `server/admin-routes/workspace-artifact.js`, `admin-narramancer.js`, `narramancer-export.js` ja `scripts/test-narramancer-166.mjs`.

Turvaraja: Narramancer ei saa `content.read`, `content.write` tai `publication.publish` -kyvykkyyksiä. Anomancer-agentit eivät ole sallittuja Narramancer-templatessa. Orkesteritulokset vaativat ihmisen soveltamisen ja erillisen tallennuksen. Vienti on paikallinen eikä automaattista julkaisua ole.

Asenna nykyiseen projektiin content-safe-asentimella:

```bash
chmod +x INSTALL_TO_CURRENT.sh
./INSTALL_TO_CURRENT.sh /polku/Anomancer
```

Asennin jättää `content/`, `media/`, `public/`, rakennetut lähetykset ja ympäristösalaisuudet koskematta, ajaa koko `npm run check` -testipatterin ja tarkistaa sisältösormenjäljen ennen ja jälkeen.
