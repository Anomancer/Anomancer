# Anomancer 16.2 · Evidence Presentation + Visualization

- hyväksytyn evidenssin inline / lähderivi / molemmat -esitystapa
- Julkaisupaketti ehdottaa vain varmennettuja citation placement -rakenteita
- valinnainen Visualisointivahti, evidenssisidottu chart spec, deterministic SVG, human approval
- Core 16.2.0

# 16.1.0 — Boundary + Provenance Hardening

- Public Core siirtyy eksplisiittiseen allowlist-snapshotiin (`anomancer-core-public/v2`): tarkat tokenrajat, provider-targetit, fallback-järjestys, runtime-profiilit ja write/deny-matriisit eivät enää kuulu julkiseen JSONiin.
- Build tuottaa turvallisen `release-provenance.json`-kuitin: release/core-versio, build-aika, source revision kun saatavilla, public-schema-hash sekä agentti-, orkesteri- ja työkalurekisterien hashit.
- Vercel API -entrypointit yhdistetty 12 → 4: `auth`, `content`, `core`, `contact`. Domain-handlerit säilyvät erillisinä `server/admin-routes/`-kerroksessa.
- Tuntemattomat gateway-resurssit fail-closed 404:ään.
- Lisätty pysyvät Public Disclosure Boundary- ja API Surface -regressioportit.
- Ei uusia agentteja, työkaluoikeuksia tai julkaisuvaltaa.

# 16.0.3 — Combo Filter & Mobile Core Surgery

- Lähetykset: aihe + yleisö ovat nyt oikea AND-yhdistelmä. Nimetty yleisö näyttää vain eksplisiittisesti kohdennetun sisällön; `all` pysyy yleisenä sisältönä.
- Etusivu: yhteysosion koristekuva pienennetty 420 px desktop / 320 px mobile enimmäisleveyteen.
- Public Core: mobiilin 8-vaiheinen flow vaihtuu kelluvista nuolipalloista vakaaseen pystytimelineen.
- Private Core: sama mobiilitimeline orkesterivaiheille.

# 16.0.2 — Flow & Public UX Surgery

- Lähetyskoneen 8-vaiheinen orkesteri taittuu nyt 4×2, 2×4 ja 1×8 -poluksi ilman nuolten törmäystä kortteihin.
- Julkisen Coren orkesteri käyttää samaa hengittävää käärmevirtaa.
- Lähetykset pitää `all`-sisällön näkyvänä myös kohdeyleisösuodattimissa ja näyttää Opettajalle-suodattimen aina ensisijaisten yleisöjen joukossa.
- Vanha 16.0-suursiivous-roadmap korvattiin ei-sitovilla mahdollisilla seuraavilla kerroksilla.
- Etusivun henkilökohtaiset kortit on linjattu muun sisällön vasempaan reunaan.
- Yhteysosio muutettiin ahtaasta kolmipalstasta leveämmäksi kaksipalstaiseksi työpinnaksi; lomake käyttää kahden sarakkeen perustietoja desktopilla.
- Yhteyslomakkeen virheviestit erottavat sähköposti-, viestipituus- ja vanhentuneen lomakeistunnon virheet.
- Domain migration ei enää vaadi toimituksellisesti tiettyä teacher-artikkelia, vaan validoi audience-skeeman.

# 16.0.1 — Surgical UX Pass

- Lähetyslista muuttuu desktopillakin oletuksena suljetuksi draweriksi, jotta editori saa koko työleveyden.
- Lisätty muistava Asettelu-valikko: editorin leveys, lähetysvalikon leveys ja esikatselun näkyvyys.
- Lisätty editorin ja esikatselun väliin hiirellä, kosketuksella ja näppäimistöllä säädettävä separator.
- Julkaisun toissijaiset asetukset, yksittäinen agenttiajo sekä orkesterin vaihelista/lisäohje ovat oletuksena suljettuja.
- Evidenssieditorin textarea-kentät yhtenäistetty muun editorin form-control-kieleen ja täysleveiksi.
- Lähetyskorttien päivämäärärivin katkeilu korjattu ja julkisen Coren sisäisen navigaation luettavuutta nostettu.
- Ei muutoksia agenttisopimuksiin, Tool Brokeriin, Model Routeriin, Runtime Snapshotiin, orkesterivalidointiin tai julkaisun turvallisuusportteihin.

# 16.0.0 — Interface System / UI-UX + Semantic Cleanup

- Ei uusia agenttimoottorin ominaisuuksia: release keskittyy käyttöliittymän rakenteeseen, kieleen ja ylläpidettävyyteen.
- Lisätty yhteinen `ui-tokens.css` design-token-kerros ja erotettu julkinen Core sekä yksityinen control plane omiin CSS-vastuisiin.
- Editorin vanha `workspace-tabs`-semantiikka korvattu `editor-tabs` / `editor-panel` -rakenteella, jotta `workspace` tarkoittaa vain oikeaa agenttityötilaa.
- Lisätty oikea ARIA `tablist → tab → tabpanel` -malli, nuolinäppäinnavigointi, `focus-visible`, reduced-motion, contrast-tuki ja 44 px vähimmäiskosketuskohde.
- `/core` on nyt johdonmukaisesti suomeksi ja uusi `/en/core` johdonmukaisesti englanniksi; reiteillä on omat canonicalit ja vastavuoroiset hreflangit.
- Dynaaminen Core-sanasto valitaan dokumentin `lang`-attribuutista ilman että teknisiä protokolla-arvoja muutetaan.
- `/admin` siivottu näkyvältä sanastoltaan suomeksi; kone-enumit esitetään tarvittaessa eksplisiittisinä teknisinä arvoina.
- Poistettu CSS:n release-arkeologiakommentit ja nimetty osiot nykyisen vastuun perusteella.
- Korjattu piilotettujen audience-checkboxien aiheuttama näkymätön vaakasuuntainen overflow sekä mobiiliyläpalkin työtilavalitsimen murtuminen.
- Lisätty `test-ui-semantics.mjs` ja `test-language-boundaries.mjs` pysyviksi regressioporteiksi. Piilotetut tiedostovalitsimet saavat saavutettavat nimet, ja adminin näkyvästä semantiikasta torjutaan myös vanhat 15.x-releasefossiilit.
- Vercel Hobby -raja säilyy: `/api/**/*.js` sisältää edelleen tasan 12 deployattavaa JavaScript-entrypointtia.
- Koko release läpäisee 235 numeroitua regressiotestiä sekä build-, domain migration- ja SEO-smoket.

## 15.9.2 · Hobby Function Layout

- siirretty kaikki shared server helperit `api/_lib/` → `server/`, jotta Vercel ei käsittele niitä deployattavina API-funktioina
- päivitetty API- ja testimportit käyttämään `server/`-hakemistoa
- Hobby-regressiotesti laskee nyt rekursiivisesti kaikki `api/**/*.js`-tiedostot eikä vain `api/admin`-entrypointteja
- `/api`-puussa on nyt tasan 12 JavaScript-entrypointtia: 11 admin/API-reittiä + contact

# 15.9.1 — Hobby-funktioiden yhdistäminen

- Työtilojen admin-API yhdistettiin reittiin `/api/admin/core?resource=workspaces`.
- Erillinen `/api/admin/workspaces` Serverless Function poistettiin.
- Vercel Hobby -deployment pysyy 12 deployattavassa funktiossa ilman Workspace Foundation -ominaisuuksien poistamista.
- Hobby-funktiorajalle lisättiin regressiovartija.

# 15.9.0 — Workspace Foundation

- Lisätty server-side Workspace Registry ja yksityisen Coren workspace-valitsin.
- Nykyinen Anomancer toimii automaattisesti `default`-workspacena ilman runtime/orchestra/run-historian migraatiota.
- Runtime Profiles, Custom Orchestras, Runs ja Usage eristyvät workspace-kohtaisiin store-refeihin.
- Runtime Snapshot v3 sitoo `workspaceId` + `workspaceHash` osaksi allekirjoitettua orkesteriajoa.
- Agent API, Tool Broker, Run Receipt ja checkpointit tarkistavat workspace-scopen.
- Workspace Registryllä ja workspace-kohtaisilla storeilla on revision/concurrency-suoja.
- Agent Registry, Tool Registry ja Model Router pysyvät yhteisenä platform-kerroksena.
- Julkinen `/core` näyttää vain workspace-arkkitehtuurin, ei yksityisiä workspaceja tai usage-dataa.
- Artikkelisisältö on 15.9:ssa edelleen yhteinen; multi-user ACL, jäsenyydet ja billing eivät kuulu tähän julkaisuun.

# 15.8.0 — Run Explorer + Usage Metering

- Lisätty server-authoritative `Run Store` ja `/api/admin/runs`.
- Agenttien Run Receiptit kootaan `orchestraRunId`:n alle yhdeksi Run Recordiksi.
- Run Store käyttää oletuksena erillistä `refs/tags/anomancer-run-state`-refiä eikä kirjoita masteriin.
- Lisätty Run Explorer: status-, agentti-, provider- ja orkesterisuodattimet sekä stage-kohtainen detail timeline.
- Lisätty lifetime/recent Usage Metering: tokenit, providerit, agentit, orkesterit, fallbackit ja Tool Broker -päätökset.
- Lisätty runHash / previousRunHash -ketju lopullisille ajoille.
- Recoverable checkpoint ja stop eivät lukitse ajoa lopulliseksi; niitä voi jatkaa samalla orchestraRunId:llä.
- `editor_applied` kirjataan erikseen eikä sitä tulkita julkaisuksi.
- Kustannusarvio on fail-honest: euroja näytetään vain eksplisiittisillä server-side EUR/token-kertoimilla.
- Julkinen `/core` kertoo Run Explorerin ja Usage Meteringin olevan käytössä, mutta ei saa oikeaa run- tai account-dataa.

# 15.7.0 — Custom Orchestras

- Lisätty serverillä validoitu `Orchestra Contract v2` sekä Custom Orchestra Builder yksityiseen Coreen.
- Sisäänrakennettu Editorial säilyy immuuttina oletusorkesterina; customit tallentuvat omaan server-side Orchestra Storeen.
- Custom Orchestra Store käyttää erillistä `refs/tags/anomancer-orchestra-state`-refiä eikä kirjoita sisältöhaaraan.
- Sequential- ja turvalliset parallel-vaiheet; rinnakkaisagentit saavat saman jäädytetyn inputin ja tulokset yhdistetään deterministisesti vasta koko ryhmän onnistuttua.
- Palvelin torjuu päällekkäiset rinnakkaiset kirjoituspinnat, pakottaa Package-agentin viimeiseksi ja Claims-agentin body-muokkausten jälkeen.
- Runtime Snapshot sitoo valitun Orchestra Contractin ja `orchestraHash`in koko ajoon.
- Agentti-API valvoo allekirjoitetun orkesterin `stageIndex`iä ja torjuu väärän agentin `ORCHESTRA_STAGE_MISMATCH`-virheellä ennen mallikutsua.
- Stop abortoi kaikki käynnissä olevat rinnakkaiset agenttikutsut.
- Custom Orchestra Store käyttää revision-conflict-suojaa eikä julkinen `/core` näytä yksityisiä custom-orkestereita.
- Lisätty `CUSTOM_ORCHESTRAS.md` ja Custom Orchestras -regressiosviitti.

# 15.6.0 — Server-side Runtime Profiles

- Runtime Profilet siirretty admin-selaimen localStoragesta server-authoritative Runtime Storeen.
- Pysyvä GitHub tag-ref `refs/tags/anomancer-runtime-state` pitää runtime-tilan erossa sisältöhaarasta ja deploy-historiasta.
- Uusi `/api/admin/runtime` GET/PUT/DELETE/POST(snapshot) -rajapinta, admin-auth + CSRF mutaatioille.
- Agentti-API ei enää luota clientin `runtimeProfile`-payloadiin.
- Orkesteri käyttää `orchestraRunId`:hen sidottua HMAC-allekirjoitettua Runtime Snapshotia.
- Runtime Store käyttää revisionumeroa rinnakkaisten admin-istuntojen yliajon estämiseksi.
- Agent Contract -hashin muutos palauttaa vanhan Runtime Profilen turvallisesti sopimuksen oletuksiin.
- Uusi `SERVER_RUNTIME_PROFILES.md` ja 12 regressiotestiä runtime-storelle/snapshotille.

# 15.5.0 — Model Router

- Lisätty palvelinpuolen Model Router, joka erottaa Agent Contractin loogisen mallireitin provider-targetista.
- Kolme reittiä: `research`, `writer` ja `critic`; agentti voi vaihtaa vain oman reittinsä sallittuun targettiin.
- DeepSeek säilyy oletuksena, mutta Writer/Critic tukevat myös OpenAI-, Anthropic- ja Gemini-targetteja; Research tukee DeepSeek-, OpenAI- ja Gemini-web-searchia.
- Runtime Profileen lisätty `modelTarget`; palvelin normalisoi ja clampaa sen Agent Contractin route-rajaan.
- Fallback käyttää vain saman loogisen reitin sallittuja, konfiguroituja targetteja ja vain tilapäisissä provider-/verkko-/rate-limit-virheissä.
- Run Receipt kirjaa route-, provider-, target- ja fallback-metadatan ilman API-avaimia.
- Yksityinen Core näyttää providerien konfiguraatiotilan; julkinen Core näyttää vain tuetun topologian eikä paljasta, mitkä providerit on kytketty.
- Lisätty `test-model-router.mjs` regressiosviitti ja nykyiset orkesteri-/Tool Broker -rajat säilytetty.

# 15.4.0 — Tool Broker + Policy Gate

- Lisätty kanoninen Tool Registry ja palvelinpuolen fail-closed Tool Broker.
- Source Agentin oikea `web.search` valtuutetaan Agent Contractin ja capabilityn perusteella ennen mallikutsua.
- Tuntematon tai sopimukseen kuulumaton työkalu estyy `TOOL403`-päätöksellä.
- `source.verify`, `publication.publish` ja `github.write` ovat eksplisiittisiä human-only-rajoja.
- Client ei voi kasvattaa Tool Surfacea omalla request-kentällä; palvelin käyttää vain Agent Contractin työkaluja.
- Run Receipt sisältää redaktoidun Tool Policy -lokin ilman raakaa promptia/outputia.
- Yksityinen Core näyttää Tool Registryn, ALLOW/DENY/HUMAN ONLY -tilat ja paikallisen Policy Login.
- Julkisen Coren Tools-alue nousi FOUNDATION-tilasta LIVE POLICY -tilaan.
- Lisätty `test-tool-broker.mjs` regressiosviitti.

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
- lisätty `api/admin/core`, `server/core-registry.js`, `server/core-receipt.js`, `admin-core.js` ja `CORE_FOUNDATION.md`
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

