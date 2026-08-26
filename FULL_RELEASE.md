# Anomancer 15.8.0 · Run Explorer + Usage Metering

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

Julkaisuversio: 15.8.0.

15.7 tekee orkesterista serverillä validoidun ja hashatun Orchestra Contractin. Yksityinen Core voi tallentaa omia orkestereita sekä rakentaa turvallisia parallel-vaiheita. Valittu Orchestra Contract sidotaan HMAC-allekirjoitettuun Runtime Snapshotiin, ja agentti-API valvoo vaihejäsenyyttä ennen mallikutsua.



## Audience Layer 14.3.0

Adminissa kohdeyleisö on nyt toiminnallinen toimitusvalinta eikä pelkkä metadata. Syvyystaso voidaan asettaa selkokieleksi, yleistajuiseksi, ammattilaiseksi tai syväksi tekniseksi. Orkesterin Audience Adapter sovittaa tekstin valittuun havaintopositioon ja Claims-vaihe tarkistaa lopullisen version tämän jälkeen. Audience Contract ja Evidence Layer pysyvät ihmisen hallinnassa.

## Token Headroom 14.3.1

Pitkien ajoketjujen output-katot ovat nyt: Source 16 000 (ympäristömuuttujalla 8 000–32 000), Structure 12 000, Writer 24 000, Critic 12 000, Audience 24 000, Voice 24 000, Claims 16 000 ja Package 12 000 tokenia. Rajat ovat kattoja, eivät tavoitepituuksia. Adminin agenttiloki näyttää myös käytetyt output-tokenit suhteessa agentin kattoon.


15.8 lisää server-side Run Storen, Run Explorerin, Usage Meteringin ja run-hash-ketjun. Katso `RUN_EXPLORER.md`.
