# Anomancer 14.3.0 · Full Release

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

Julkaisuversio: 14.3.0.



## Audience Layer 14.3.0

Adminissa kohdeyleisö on nyt toiminnallinen toimitusvalinta eikä pelkkä metadata. Syvyystaso voidaan asettaa selkokieleksi, yleistajuiseksi, ammattilaiseksi tai syväksi tekniseksi. Orkesterin Audience Adapter sovittaa tekstin valittuun havaintopositioon ja Claims-vaihe tarkistaa lopullisen version tämän jälkeen. Audience Contract ja Evidence Layer pysyvät ihmisen hallinnassa.
