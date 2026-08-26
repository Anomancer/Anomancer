# Anomancer 16.0 · Interface System

Tämä kansio on kokonainen julkaisu, ei irrallinen patch. Se sisältää julkisen FI/EN-sivuston, Markdown-sisällöt, Vercel API -funktiot, yksityisen adminin, DeepSeek-agentit, orkesterin, buildin, testit ja dokumentaation.

## Valmis kokonaisuus

- kirjoituspainotteinen admin, erilliset Evidenssi- ja Agentit-työtilat
- mobiili sivupaneeli, dirty-state-varoitukset ja tuplalähetyksen esto
- ihmisen evidenssitarkistus ja julkaisuportti
- identiteettiin sidotut orkestericheckpointit
- palvelinvalidoidut agenttisopimukset
- DeepSeek-peruutus, finish reason -tarkistus ja hallitut retryt
- saavutettavuuskorjaukset, ulkoinen suodatusskripti ja optimoidut WebP-kuvat
- slug-aliasit vanhojen artikkeliosoitteiden säilyttämiseen
- turvallinen, varmuuskopioiva asennusskripti

Julkaisuversio: 16.0.0.

15.7 tekee orkesterista serverillä validoidun ja hashatun Orchestra Contractin. Yksityinen Core voi tallentaa omia orkestereita sekä rakentaa turvallisia parallel-vaiheita. Valittu Orchestra Contract sidotaan HMAC-allekirjoitettuun Runtime Snapshotiin, ja agentti-API valvoo vaihejäsenyyttä ennen mallikutsua.



## Interface System 16.0

Julkinen `/core`, englanninkielinen `/en/core` ja yksityinen `/admin` ovat nyt saman design-järjestelmän eri pintoja. FI/EN-kieliraja on eksplisiittinen, editorin HTML-semanttiikka käyttää oikeaa tab-mallia ja CSS on jaettu vastuukerroksiin. 16.0 ei muuta agenttien toimivaltaa tai ajomoottorin sopimuksia. Katso `INTERFACE_SYSTEM.md`.

## Audience Layer 14.3.0

Adminissa kohdeyleisö on nyt toiminnallinen toimitusvalinta eikä pelkkä metadata. Syvyystaso voidaan asettaa selkokieleksi, yleistajuiseksi, ammattilaiseksi tai syväksi tekniseksi. Orkesterin Audience Adapter sovittaa tekstin valittuun havaintopositioon ja Claims-vaihe tarkistaa lopullisen version tämän jälkeen. Audience Contract ja Evidence Layer pysyvät ihmisen hallinnassa.

## Token Headroom 14.3.1

Pitkien ajoketjujen output-katot ovat nyt: Source 16 000 (ympäristömuuttujalla 8 000–32 000), Structure 12 000, Writer 24 000, Critic 12 000, Audience 24 000, Voice 24 000, Claims 16 000 ja Package 12 000 tokenia. Rajat ovat kattoja, eivät tavoitepituuksia. Adminin agenttiloki näyttää myös käytetyt output-tokenit suhteessa agentin kattoon.


15.8 lisää server-side Run Storen, Run Explorerin, Usage Meteringin ja run-hash-ketjun. Katso `RUN_EXPLORER.md`.


15.9 lisää Workspace Foundationin. `default` säilyttää nykyisen runtime-, orchestra- ja run-historian legacy-refeissä; uudet workspacet eristävät Runtime Profiles-, Custom Orchestras-, Runs- ja Usage-tilan omiin tag-refeihinsä. Runtime Snapshot v3 sitoo workspace-identiteetin orkesteriajoon. Katso `WORKSPACE_FOUNDATION.md`.
