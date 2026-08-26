# Anomancer 15.9 · Workspace Foundation

15.9 lisää Coren agenttimoottoriin ensimmäisen varsinaisen workspace-rajan. Tavoite ei ole vielä monen käyttäjän SaaS, vaan erottaa pysyvä runtime-tila toisistaan ennen käyttäjätilejä, jäsenyyksiä ja laskutusta.

## Mitä workspace rajaa

Workspace-kohtaista tilaa ovat:

- Runtime Profiles: ACTIVE/OFF, tokenkatto ja modelTarget
- Custom Orchestras ja niiden revision historia
- Run Store, Run Explorer ja Usage Metering
- workspaceen sidotut Runtime Snapshotit ja Run Receiptit

Yhteistä platform-kerrosta ovat edelleen:

- Agent Registry ja hashatut Agent Contractit
- Tool Registry + Tool Broker
- Model Routerin route- ja target-rekisterit
- built-in Editorial Orchestra

Artikkelieditori, Markdown-sisältö ja julkaistu sivusto ovat 15.9:ssa vielä yhteisiä. Workspace-valinta ei vaihda content-repoa tai julkaisukohdetta.

## Default-workspace ilman migraatiota

Nykyinen Anomancer muuttuu automaattisesti sisäänrakennetuksi `default`-workspaceksi. Ennen 15.9:ää syntyneitä tageja ei siirretä eikä kopioida:

- `anomancer-runtime-state`
- `anomancer-orchestra-state`
- `anomancer-run-state`

Siksi nykyinen runtime, custom-orkesterit ja run-historia jatkuvat samasta paikasta.

Uudet custom-workspacet saavat deterministiset erilliset tag-refit, esimerkiksi:

- `anomancer-runtime-state-ws-tutkimus-abc123`
- `anomancer-orchestra-state-ws-tutkimus-abc123`
- `anomancer-run-state-ws-tutkimus-abc123`

Workspace Registry itse tallentuu refiin `refs/tags/anomancer-workspace-state`, tiedostoon `.anomancer/workspaces.json`.

## Server-authoritative workspace

Admin lähettää workspace-identiteetin `X-Anomancer-Workspace`-headerissa, mutta header ei yksin myönnä pääsyä. Jokainen workspace-scopattu API kutsuu serverillä `requireWorkspace()`-tarkistuksen. Tuntematon tai arkistoitu workspace failaa ennen runtime-, orchestra- tai run-operaatiota.

Workspace-vaihto on estetty kesken käynnissä olevan orkesteriajon.

## Runtime Snapshot v3

Orkesteriajon alussa serveri jäädyttää yhteen HMAC-allekirjoitettuun snapshotiin:

- `workspaceId` + `workspaceHash`
- `orchestraRunId`
- Orchestra Contract + `orchestraHash`
- Runtime Profiles
- tokenbudjetit ja modelTargetit
- revision ja expiry

Agentti-API tarkistaa sekä `orchestraRunId`:n että `workspaceId`:n. Toisen workspacen snapshot ei kelpaa, vaikka käyttäjä vaihtaisi headerin DevToolsista.

## Run- ja policy-jälki

Run Receipt saa `workspaceId`:n ja redaktoidun workspace-identiteetin. Tool Brokerin policy-konteksti sisältää myös workspace-scopen. Run Store ja Usage Metering laskevat historiaa vain valitusta workspacesta.

Raakaa promptia, raakaa mallivastausta tai API-avaimia ei lisätä workspace-storeen tai run-historiaan.

## Concurrency

Workspace Registryllä, Runtime Storella ja Custom Orchestra Storella on revision-suoja. Vanha admin-välilehti ei voi hiljaa yliajaa toisessa istunnossa tehtyä uudempaa muutosta.

## Mitä 15.9 ei vielä tee

15.9 ei vielä sisällä:

- käyttäjätilejä tai organisaatiojäseniä
- workspace-kohtaisia ACL-rooleja
- workspace-kohtaista artikkelirepoa tai julkaisudomainia
- quota- tai laskutusmoottoria
- workspace-kohtaisia provider-avaimia
- custom-agenttien luontia

Näille on nyt kuitenkin selkeä scope: `user → workspace → orchestra → agents → runs → usage` voidaan lisätä seuraavassa pääkerroksessa rikkomatta nykyistä agenttimoottoria.


## 15.9.2 · Hobby-deployment

Työtilojen CRUD-pinta kulkee `api/admin/core.js`-reitin kautta parametrilla `?resource=workspaces`. Näin Hobby-planille ei synny kolmattatoista Vercel Serverless Functionia, mutta sama autentikoitu ja CSRF-suojattu palvelinpuolen Workspace Store säilyy.

## Hobby deployment layout (15.9.2)

Workspace Foundation käyttää shared server -moduuleja projektin `server/`-hakemistosta. `api/` on varattu vain HTTP-entrypointeille. Tämä pitää Vercel Hobby -deploymentin enintään 12 Serverless Functionissa myös silloin, kun shared helper -moduulien määrä kasvaa.
