# Anomancer 1.17.1 · Archive Core

## Tarkoitus

1.17.1 rakentaa Anomancer Coreen ensimmäisen pitkäikäisen, käyttäjän hallitseman muistikerroksen. Archive ei ole mallin automaattinen muisti, vaan server-authoritative tietovarasto, jonka sisältöön agentti tai orkesteri saa pääsyn vain työtilarajan tai ihmisen erikseen myöntämän grantin kautta.

Perusraja:

```text
ARCHIVE ≠ AUTOMATIC MODEL MEMORY
```

## Archive Store

Uusi `server/archive-store.js` tarjoaa kaksi backendia:

- `memory` kehitystä ja testejä varten
- `github-tag` pysyvään henkilökohtaiseen käyttöön

GitHub-tila käyttää oletuksena:

```text
ref:  refs/tags/anomancer-archive-state
path: .anomancer/archive.json
```

Asetukset voidaan yliajaa ympäristömuuttujilla:

```text
ANOMANCER_ARCHIVE_STORE=memory|github-tag
ANOMANCER_ARCHIVE_TAG=anomancer-archive-state
ANOMANCER_ARCHIVE_PATH=.anomancer/archive.json
```

Jos `GITHUB_CONTENT_TOKEN` ja `GITHUB_REPO` ovat käytettävissä, Archive Store valitsee automaattisesti `github-tag`-tilan samalla periaatteella kuin muut Coren server-authoritative storet.

## Archive Object v1

Jokainen objekti sisältää vähintään:

- pysyvän ID:n ja tyypin
- omistavan `workspaceId`:n
- projektitunnisteen
- provenance-metadatan
- tagit ja relaatiot
- retention-politiikan
- visibility/grant-listan
- sisällön
- SHA-256 content- ja object-hashit

Tuetut ensimmäisen version objektityypit:

`project` · `artifact` · `run` · `source` · `dataset` · `decision` · `note` · `snapshot` · `report`

Arkistoon kirjoitus vaatii eksplisiittisen ihmisen hyväksynnän. Hyväksyttyä objektia ei voi siirtää hiljaisesti toisen työtilan omistukseen.

## Workspace-eristys ja Context Gate

Oletuksena Archive Object näkyy kontekstihakuna vain sen omistavalle työtilalle.

```text
Agent / orchestra
       ↓
workspaceId
       ↓
Archive visibility
       ↓
granted context only
```

Toinen työtila saa lukuoikeuden vasta `grantArchiveAccess()`-toiminnolla, joka vaatii ihmisen hyväksynnän. Grant laajentaa lukuoikeutta mutta ei muuta objektin omistavaa työtilaa.

## Context Receipt v1

`createContextReceipt()` tallentaa kuitin siitä, mitä arkistokontekstia ajo käytti ja mitä pyydettyä kontekstia ei avattu.

Kuitti sisältää:

- workspace-id
- run-id
- tarkoituksen ja haun
- käytetyt Archive Objectit sekä niiden integrity-hashit
- `notAccessed`-rivit syyllä `not-granted` tai `not-found`
- oman SHA-256 receipt-hashin

Näin myöhempi orkesterikerros voi todentaa, mihin hallittuun muistijoukkoon tulos perustui ilman että koko Arkisto annetaan mallille.

## Poisto ja tombstone

Objektin poisto vaatii eksplisiittisen ihmisen hyväksynnän. Poiston jälkeen Store säilyttää tombstonen:

- poistetun objektin ID
- workspace-id
- otsikko
- alkuperäinen object hash
- poistoaika
- poistaja

Tavoite on, ettei muistihistoriaan synny hiljaista aukkoa.

## Arkisto-UI

Core Shellissä on uusi globaali `Arkisto`-reitti.

Näkymä sisältää:

- haun
- tyyppi- ja työtilasuodattimet
- Archive Store -tilan
- objektikortit
- Archive Inspectorin
- provenance-tiedot
- relaatiot
- visibility/grant-näkymän
- integrity-hashin
- Context Receipt -listan
- ihmisen käynnistämän uuden objektin tallennuksen
- eksplisiittisen cross-workspace read grantin
- ihmisen vahvistaman poiston

Arkisto on globaali ihmisen näkymä. Tämä ei muuta agenttien kontekstirajaa.

## API

Arkisto käyttää olemassa olevaa `/api/admin/core`-gatewayta:

```text
GET    /api/admin/core?resource=archive
POST   /api/admin/core?resource=archive
DELETE /api/admin/core?resource=archive
```

Mutaatioissa säilyvät nykyiset admin-session, same-origin- ja CSRF-rajat. Uutta serverless entrypointtia ei lisätä.

## Release-portit

1.17.1 lisää:

```text
scripts/test-archive-core-1171.mjs
scripts/test-archive-ui-1171.mjs
```

Archive Core -testi varmistaa muun muassa:

- ei automaattista mallimuistia
- human approval kirjoituksessa
- provenance + integrity
- owner-workspace access
- cross-workspace deny by default
- human-approved grant
- Context Receipt
- admin + CSRF API -rajan
- deletion tombstonen

Archive UI -browser-portti renderöi Arkiston oikeassa Chromiumissa 1440×900 ja 360×800 -koissa ja tarkistaa vaakavuodon, 44 px kontrollit, yhden palstan mobiilireflow'n ja accessibility-puun painikkeiden nimet.

## Rajaus

1.17.1 EI vielä sisällä:

- Nanomancer Capability Pluginia
- Arkistonhoitajaa
- automaattista arkistointia jokaisesta ajosta
- autonomista retention-päätöstä
- kolmannen osapuolen plugin-oikeuksia
- monikäyttäjä-ACL:ää

Seuraavat suunnitellut kerrokset ovat 1.17.2 Nanomancer ja 1.17.3 Arkistonhoitaja.
