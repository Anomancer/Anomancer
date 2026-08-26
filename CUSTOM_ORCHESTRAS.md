# Anomancer 15.7 · Custom Orchestras

15.7 erottaa orkesterin selaimen koreografiasta serverillä validoiduksi `Orchestra Contract` -sopimukseksi. Sisäänrakennettu `editorial/1.0.0` säilyy muuttumattomana oletuksena, mutta yksityisessä Coressa voi rakentaa omia orkestereita Agent Poolin rekisteröidyistä agenteista.

## Orchestra Contract v2

Orkesterilla on vähintään:

- `id`, `name`, `version`, `description`
- `steps`, joissa vaihe on `sequential` tai `parallel`
- litistetty `stages` yhteensopivuutta varten
- `humanFinalAuthority: true`
- deterministinen SHA-256 `orchestraHash`

Selaimen lähettämää agenttilistaa ei ajeta sellaisenaan. Palvelin normalisoi ja validoi sopimuksen ennen tallennusta ja ennen ajon snapshotia.

## Turvallisuusrajat

Builder ei voi ylittää Agent Registryä tai Agent Contracteja.

- tuntemattomia agentteja ei hyväksytä
- sama agentti saa esiintyä 15.7:ssa vain kerran orkesterissa
- `Package` saa olla vain viimeinen yksittäinen vaihe
- bodya muuttavien agenttien jälkeen täytyy olla `Claims`
- `humanFinalAuthority` on pakollinen eikä sitä voi poistaa
- rinnakkaisvaihe torjutaan, jos agenttien `authority.write` -pinnat törmäävät

Näin esimerkiksi Writer + Audience ei voi kirjoittaa samaan body-pintaan rinnakkain. Source + Critic voidaan sen sijaan eristää samaan parallel-vaiheeseen, koska niiden kirjoituspinnat eivät törmää.

## Parallel isolation

Rinnakkaisvaiheen agentit saavat saman jäädytetyn näkymän:

- sama `post`
- samat aikaisemmat `outputs`
- samat aikaisemmat `metas`
- sama Runtime Snapshot

Agentit eivät näe rinnakkaisen sisaragentin vastausta kesken vaiheen. Core odottaa koko ryhmän valmistumista ja soveltaa tulokset vasta sen jälkeen deklaroidussa agenttijärjestyksessä.

Jos yksikin rinnakkaisen ryhmän agentti epäonnistuu, ryhmän onnistuneita sisältömutaatioita ei sovelleta puolikkaana. Ajokuitit voivat silti kertoa rehellisesti jo valmistuneista mallikutsuista.

## Server-side Orchestra Store

Custom-orkesterit tallennetaan tuotannossa erilliseen GitHub tag-refiin, ei sisältöhaaraan:

`refs/tags/anomancer-orchestra-state`

Tiedostopolku:

`.anomancer/custom-orchestras.json`

Oletuksia voi vaihtaa enveillä:

- `ANOMANCER_ORCHESTRA_STORE=github-tag`
- `ANOMANCER_ORCHESTRA_TAG=anomancer-orchestra-state`
- `ANOMANCER_ORCHESTRA_PATH=.anomancer/custom-orchestras.json`

Store käyttää monotonista revisionumeroa. Vanha admin-istunto ei voi hiljaa yliajaa uudempaa Orchestra Storea, vaan saa `ORCHESTRA_REVISION_CONFLICT`-virheen.

## Runtime Snapshot + stage lock

Orkesteriajon alussa `/api/admin/runtime` ratkaisee valitun Orchestra Contractin serveriltä ja liittää sen HMAC-allekirjoitettuun Runtime Snapshotiin.

Snapshot lukitsee ajon ajaksi:

- Orchestra Contractin ja `orchestraHash`in
- vaiheiden järjestyksen
- rinnakkaisryhmät
- agenttien Runtime Profilet
- `orchestraRunId`:n

`/api/admin/agents` tarkistaa lisäksi `stageIndex`in. Agentti voidaan kutsua orkesteriajossa vain siinä vaiheessa, johon allekirjoitettu sopimus sen sijoittaa. Väärä agentti pysähtyy `ORCHESTRA_STAGE_MISMATCH`-virheeseen ennen mallikutsua.

## Builder

Yksityinen `/admin → Core` sisältää Custom Orchestra Builderin:

- uusi sequential-vaihe
- uusi parallel-vaihe
- Agent Poolista valinta
- vaiheiden järjestyksen muutos
- serverivalidoinnin virheet
- tallennus ja poisto revision-suojalla

Julkinen `/core` ei lataa Custom Orchestra Storea eikä näytä käyttäjän yksityisiä orkestereita. Se näyttää vain Coren julkisen built-in-topologian ja kertoo, että yksityinen builder on olemassa.

## Scope 15.7

15.7 ei vielä sisällä custom-agenttien luontia, silmukoita, ehdollisia haaroja, vapaata koodia tai mielivaltaista DAG-editoria. Tarkoitus on saada turvallinen orkesterisopimus ja deterministic parallel -malli kuntoon ennen monimutkaisempaa workflow-kieltä.
