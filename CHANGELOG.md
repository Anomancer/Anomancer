# 15.3.0 — Agent Pool Control

- Agent Contract ja Runtime Profile erotettu toisistaan.
- Agenttikortista avautuva hallintadialogi yksityiseen Coreen.
- ACTIVE / OFF vaikuttaa yksittäisiin agenttiajoihin ja seuraaviin orkesteriajoihin.
- Output-tokenkatto on säädettävä sopimuksen minimi- ja maksimialueella.
- Serveri clampaa Runtime Profilen eikä hyväksy sillä uusia oikeuksia tai työkaluja.
- Orkesteri jäädyttää Runtime Profilet ajon alussa ja checkpointtaa ne.
- OFF-stage näkyy `disabled`-tilana eikä tee mallikutsua.
- Run Receipt sisältää käytetyn runtime-tokenkaton ilman raakaa promptia/outputia.
- Uusi regressiosviitti `test-agent-pool-control.mjs`.

# 15.2.0 — Core Product Shell

- `/core` sai pysyvän tuoterakenteen: Overview, Agent Pool, Orchestras, Runs, Evidence, Models, Tools ja Usage.
- Models, Tools ja Usage johdetaan julkisesta Agent Registry -snapshotista ilman admin-API:a.
- Runs näyttää vain demo-kuitin; oikea run history pysyy yksityisenä.
- Evidence-politiikka on näkyvä osa tuotetta eikä piilossa orkestroijan sisällä.
- Foundation/read-only -tilat erottavat valmiin moottorin tulevista kirjoitusoikeuksista.
- CORE_VERSION ja pakettiversio 15.2.0.

# 15.1.0 — Public Core Showcase

- `/core` on nyt julkinen, indeksoitava arkkitehtuurinäkymä eikä admin-rewrite.
- `/admin` säilyy yksityisenä oikeana control planena.
- Julkinen Core näyttää turvallisen Agent Registry -snapshotin, Editorial-orkesterin, toimivaltarajat ja demomuotoisen Run Receiptin.
- Public Core ei kutsu admin-API:a eikä näytä oikeita ajolokeja, promptteja, sessioita tai salaisuuksia.
- Build tuottaa `core-public.json`-snapshotin suoraan Agent Registrystä, joten julkinen rakennekartta ei irtoa moottorin todellisuudesta.
- `/core` lisätään sitemap- ja llms-discoveryyn.

# Changelog

## 15.0.0 · 2026-08-26

- uusi Anomancer Core Foundation: Agent Registry, Agent Contract, Orchestra Registry ja Run Receipt
- nykyinen 8-agentin Lähetyskone rekisteröity `editorial/1.0.0` Core-orkesteriksi
- agentti-API hakee tokenbudjetit ja toimivaltamallin Agent Registrystä kovakoodattujen rajojen sijaan
- jokainen onnistunut agenttiajo palauttaa raakasisällöttömän ajokuitin input/output-hasheineen, tokenmetadatoineen ja sopimushashilla
- orkesterin kaikki stage-ajot sidotaan samaan `orchestraRunId`:hen
- uusi Core-välilehti näyttää Agent Poolin, sopimushashit, orkesterit, usage-mittarit ja hash-ketjutetun paikallisen Run Ledgerin
- julkisen Anomancerin Observatorio-portti vaihdettu Core-reitiksi (`/core`); `/admin` säilyy teknisenä taustareittinä
- lisätty `api/admin/core`, `api/_lib/core-registry.js`, `api/_lib/core-receipt.js`, `admin-core.js` ja `CORE_FOUNDATION.md`
- lisätty Core Foundation -regressiotestit

## 14.3.1 · 2026-08-26

- Nostettu agenttien output-tokenbudjetit pitkien artikkelien ja Audience Layer -ajojen katkeilun vähentämiseksi.
- Uudet budjetit: Source 16k (env 8k–32k), Structure 12k, Writer 24k, Critic 12k, Audience 24k, Voice 24k, Claims 16k, Package 12k.
- Lisätty chat-agenttien metadataan `maxOutputTokens`, jotta admin-loki näyttää käytön muodossa `käytetty/katto`.
- Säilytetty tokenrajat enimmäismäärinä: agentti saa lopettaa normaalisti ennen budjetin täyttymistä.
- Lisätty regressiotesti tokenbudjeteille ja Source-agentin uudelle clampille.

## 14.3.0 · 2026-08-26

- Lisätty ensimmäisen luokan **Audience Layer** ja uusi `audience`-agentti.
- Muutettu kohdeyleisö toiminnalliseksi `Audience Contract` -signaaliksi: rakenne, kirjoitus, kritiikki, yleisöadapteri ja äänieditori näkevät saman kohdeyleisön.
- Lisätty `audienceDepth`: `plain`, `general`, `professional`, `technical`. Valinta tallentuu Markdown-frontmatteriin ja kulkee API:n sekä checkpointin läpi.
- Uusi orkesterijärjestys: `source → structure → writer → critic → audience → voice → claims → package`. Väitevahti auditoi siis edelleen viimeisen proosaversion.
- Yleisöadapteri saa muuttaa kehystä, järjestystä, määritelmiä, esimerkkejä, terminologian tiheyttä ja painotuksia, mutta ei evidenssin tilaa tai väitteiden varmuutta.
- Lukittu `audience` ja `audienceDepth` pakettivaiheessa ihmisen toimitukselliseksi intentioksi. Package-agentin mahdolliset audience-ehdotukset ohitetaan palvelimella.
- Lisätty editoriin syvyystason UI, Audience Contract -selite ja Yleisöadapteri yksittäisten agenttien valikkoon.
- Laajennettu regressiotestejä Audience Layerin tulossopimukselle, orkesterijärjestykselle, syvyystason roundtripille ja pakettivaiheen audience-immuuttisuudelle.

## 14.2.1 · 2026-08-26

- Siirretty Väitevahti orkesterissa äänieditoinnin jälkeen, jotta claims kuvaa lopullista proosaa eikä lähtöluonnosta.
- Lukittu Evidence Layer pakettivaiheessa: Julkaisupaketti ei enää voi keksiä, pudottaa, refrasoida tai ylentää claims/sources-dataa.
- Lähdeagentin ehdokkaille luodaan deterministinen `src-*`-ID heti palvelinvalidoinnissa; selainmerge täyttää ID:n myös vanhalle tyhjälle riville.
- Sallittu candidate-URL:n säilyminen `open`/`interpretation`-väitteen provisionaalisena tutkimusjälkenä ilman supported-ylennystä.
- Tiukennettu Writer- ja Voice-prompteja: candidate ei ole varmistettu faktatuki, ja kriitikon korvaama vanha muotoilu pitää poistaa eikä jättää uuden rinnalle.
- Lisätty tallentamattomille uusille luonnoksille istuntokohtainen `instanceId`, jotta checkpointia ei voi soveltaa toiseen path/sha-arvoltaan tyhjään luonnokseen.
- `verified`-merkintä vaatii nyt nimenomaisen ihmisen vahvistuksen siitä, että lähde on avattu ja asiayhteys tarkistettu.
- Laajennettu regressiotestejä Evidence Layerin immuuttisuudelle, candidate-jäljille, source-ID:ille ja luonnosidentiteetille.

## 14.2.0 · 2026-08-26

- Korjattu monen yleisön suodatus siirtämällä selaimen logiikka ulkoiseen testattavaan moduuliin.
- Lisätty lähteiden provenance- ja verification-malli sekä ihmisen julkaisuportti.
- Säilytetty Source Agentin why/supports/challenges-tiedot koko putken läpi.
- Lisätty kaikkien agenttiroolien palvelinpuolen tulosnormalisointi.
- Estetty agenttia keksimästä pakettivaiheessa lähteitä, kategorioita tai yleisöjä.
- Sidottu checkpointit luonnoksen polkuun, SHA:han ja sormenjälkeen.
- Säilytetty valmis orkesteritulos session reloadin yli ja lisätty konfliktivaroitus.
- Lisätty DeepSeek-pyyntöjen peruutus, finish reason -käsittely, retry-luokitus, jitter ja Retry-After.
- Uudistettu adminin informaatioarkkitehtuuri, mobiilinavigaatio, lähdekortit ja julkaisu-dialogi.
- Lisätty dirty-state, busy-state ja slug-aliasit.
- Korjattu otsikkohierarkia, fokusindikaattorit, skip-linkit ja filterien aria-pressed.
- Optimoitu etusivun kuvat WebP-muotoon.
- Korvattu vaarallinen oletusasennus varmuuskopioivalla turvallisella asennuksella.
- Laajennettu regressio-, agenttisopimus-, evidenssi-, SEO- ja build-testit.

