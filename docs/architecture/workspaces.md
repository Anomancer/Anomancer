# Workspaces

Anomancerin työtilat ovat server-authoritative ja workspace-scope säilyy kaikissa runtime-, orkesteri-, run-, archive- ja artifact-storeissa.

## Tallennusmalli

Paikallisessa kehityksessä pysyvä tila tallennetaan `.anomancer/state/`-hakemistoon. Vercel-tuotannossa sama state-backend käyttää projektiin liitettyä private Vercel Blob -säilöä. Testit voivat pakottaa memory-backendin.

Storet käyttävät revisionumeroita ja backend-versioita, jotta vanha istunto ei voi hiljaisesti ylikirjoittaa uudempaa tilaa. Julkinen editorial-sisältö käyttää erillistä content-storea: paikalliset Markdown- ja media-tiedostot ovat kehityksen lähde, ja tuotannossa julkaistut muutokset säilyvät Blobissa deployien yli.

Yksityinen workspace ei saa automaattisesti Anomancerin julkisen sisältöadapterin oikeuksia. Capability- ja Artifact Boundary -rajat ratkaistaan työtilan templaten ja Constitutionin perusteella.
