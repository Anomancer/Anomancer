# Anomancer 16.5 · Workspace Types + Artifact Boundary

16.5 tekee työtilasta ensimmäisen luokan konekontekstin. Anomancer on työtilatyyppi ja työtilainstanssi; sen sisällä voi olla useita orkestereita. `Työtila` ja `Orkesteri` ovat siksi erilliset valinnat.

## Sopimusketju

1. Workspace Registry v2 säilyttää instanssin nimen, tilan, revision ja palvelimen laskemat sidokset.
2. Workspace Template määrittää tarkoituksen, Constitutionin, sallitut agentit, sisäänrakennetut orkesterit, artefaktisäilön, sisältöadapterin, ulostuloadapterin ja UI-profiilin.
3. Constitution Contract lukitsee suojattavat ominaisuudet, kielletyt muunnokset, totuuspolitiikan, pakolliset portit ja ihmisen lopullisen toimivallan.
4. Artifact Boundary ratkaisee työtilan sisältö- ja julkaisuoikeudet palvelimella. Selainheader ei voi lisätä oikeuksia.
5. Runtime Snapshot v4 allekirjoittaa työtilan, Templaten, Constitutionin, artefaktirajan, orkesterin ja ajoprofiilit yhdeksi ajokontekstiksi.

## Sisäänrakennetut templatet

### Anomancer

- template: `anomancer/editorial-platform/1.0.0`
- workspace-id: `default`
- orkesteri: `editorial`
- sisältö: nykyinen `content/fi` + `content/en`
- ulostulo: nykyinen GitHub-commit + Vercel-julkaisu
- migraatio: näkyvä nimi on Anomancer; id:tä, tag-refejä, ajoja tai historiaa ei siirretä

### Tyhjä eristetty työtila

- template: `core/blank-private/1.0.0`
- ei Anomancerin Markdown-lukuoikeutta
- ei Anomancer Editorial -orkesteria
- ei media- tai sisältökirjoitusta yhteiseen repositoryyn
- ei implisiittistä julkaisukohdetta
- omat runtime-, custom orchestra-, run- ja usage-tagit workspace-id:n alla

Tyhjä template on turvallinen rakennuspohja tuleville Narramancer- ja muille työtilatyypeille. 16.5 ei vielä toteuta niiden omia artefaktisäilöjä tai ulostuloadaptereita.

## Asennusraja

`INSTALL_TO_CURRENT.sh` kopioi sovellus- ja palvelinkoodin nykyiseen Anomancer-repoon, mutta jättää `content/`, `media/`, `public/`, `lahetykset/`, `dispatches/` sekä generoidut manifestit ja syötteet kopioimatta. Kohderepon oma build generoi julkisen outputin sen omasta, ajantasaisesta sisällöstä. Asennin vertaa `content/`-hakemiston sormenjälkeä ja Markdown-tiedostojen määrää ennen testejä ja niiden jälkeen.

## Turvarajat

- Template- ja Constitution-id:t tulevat vain serverin rekisteristä.
- Anomancer-template on singleton eikä sitä voi luoda toisena custom-instanssina.
- Työtilatyyppiä ei voi vaihtaa luonnin jälkeen.
- Custom-workspace ei saa Anomancerin built-in-orkesteria.
- Posts-listaus palauttaa eristetyssä työtilassa tyhjän listan.
- Posts POST/DELETE ja Media POST pysähtyvät `WORKSPACE_ARTIFACT_CAPABILITY_DENIED`-virheeseen.
- Ihminen säilyttää lähdevarmennuksen ja lopullisen julkaisupäätöksen.
