# Anomancer 15.6 · Server-side Runtime Profiles

15.6 siirtää Agent Poolin Runtime Profilet selaimen localStoragesta palvelimen hallitsemaan pysyvään tilaan.

## Mitä tallennetaan

Jokaiselle Agent Contractille säilytetään vain runtime-ohjaus:

- `active`
- `maxOutputTokens`
- `modelTarget`
- `contractHash`

Työkalut, capabilityt, authority-rajat ja human approval -säännöt eivät ole Runtime Profilen muokattavia kenttiä.

## Pysyvä tallennus

Tuotannossa Runtime Store käyttää olemassa olevaa yksityistä GitHub-yhteyttä, mutta ei kirjoita `master`/`main`-haaraan. Tila elää erillisessä Git-refissä:

`refs/tags/anomancer-runtime-state`

ja tiedostopolussa:

`.anomancer/runtime-profiles.json`

Runtime-muutos luo uuden commit-objektin ja siirtää vain runtime-tagia. Sisältöhaara ei muutu, joten runtime-säätö ei ole sisältöcommit eikä tuotantodeploy.

Oletuksia voi vaihtaa palvelimella:

- `ANOMANCER_RUNTIME_STORE=github-tag`
- `ANOMANCER_RUNTIME_TAG=anomancer-runtime-state`
- `ANOMANCER_RUNTIME_PATH=.anomancer/runtime-profiles.json`

Nykyinen `GITHUB_CONTENT_TOKEN`, `GITHUB_REPO` ja `GITHUB_BRANCH` riittävät, jos tokenilla on jo Contents-write-oikeus.

## Server authority

Selain ei enää määrää agentin runtimea agenttikutsun payloadissa. Yksittäinen agenttiajo lukee profiilin serveriltä. Clientin lähettämä vanha `runtimeProfile`-kenttä jätetään huomiotta.

Jos Runtime Store ei ole saatavilla, agenttiajo ei arvaa viimeistä asetusta vaan epäonnistuu suljetusti.

## Orkesterin jäädytys

Kun uusi orkesteriajo alkaa, `/api/admin/runtime` muodostaa koko Agent Poolista Runtime Snapshotin.

Snapshot:

- sisältää kaikkien kahdeksan agentin aktiivisuuden, tokenkaton ja modelTargetin
- on sidottu `orchestraRunId`:hen
- sisältää Runtime Store -revision
- allekirjoitetaan `ADMIN_SESSION_SECRET`-avaimella HMAC-SHA256:lla
- vanhenee 12 tunnissa

Agentti-API hyväksyy orkesteriajossa vain tämän allekirjoitetun snapshotin. Kesken ajon tehty uusi Runtime Profile -muutos vaikuttaa vasta seuraavaan orkesteriajoon.

## Contract rotation

Runtime Store säilyttää `contractHash`-sidoksen. Jos Agent Contract muuttuu, vanhan hashin runtime-asetuksia ei siirretä automaattisesti uuteen sopimukseen, vaan agentti palautuu uuden sopimuksen oletuksiin.

## Concurrency

Runtime Store käyttää monotonista `revision`-numeroa. Tallennus lähettää odotetun revision. Jos toinen admin-istunto on jo muuttanut tilaa, vanha kirjoitus pysähtyy `RUNTIME_REVISION_CONFLICT`-virheeseen eikä yliaja uudempaa tilaa.

## Mitä ei vielä ole

15.6:ssa Runtime Store on yksi admin/workspace ennen varsinaista käyttäjä- ja workspace-kerrosta. Seuraava kehitysaskel voi siirtää saman API-sopimuksen workspace-kohtaiseen tietokantaan ilman, että Agent Poolin tai orkesterin käyttöliittymää tarvitsee rakentaa uudelleen.


## 15.7 · Orchestra binding

Runtime Snapshot v2 sisältää myös serveriltä ratkaistun Orchestra Contractin ja `orchestraHash`in. Näin Runtime Profileiden lisäksi agenttilista, vaiheiden järjestys ja rinnakkaisryhmät pysyvät jäädytettyinä koko ajon ajan. Agentti-API hyväksyy stage-kutsun vain, jos agentti kuuluu snapshotiin sidotun orkesterin kyseiseen vaiheeseen.
