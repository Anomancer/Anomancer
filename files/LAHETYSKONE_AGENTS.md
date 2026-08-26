# Anomancer 15.1.0 · Lähetyskone Agents

14.0 lisää yksityiseen `/admin`-Lähetyskoneeseen DeepSeek-pohjaisen toimituspöydän.

## Authority-malli

`AGENTTI EHDOTTAA → IHMINEN TARKISTAA → IHMINEN SIIRTÄÄ EDITORIIN → IHMINEN TALLENTAA / JULKAISEE`

Agentti-API ei kutsu GitHub-write-endpointteja eikä sillä ole julkaisutoimintoa. DeepSeek API-avain on vain Vercelin server-side environmentissa.

## Agentit

- **Lähdeagentti** käyttää DeepSeek Responses API:n server-side `web_search`-työkalua. Se tuottaa vain lähde-ehdokkaita, jotka ihmisen pitää tarkistaa.
- **Väitevahti** erottaa `supported / interpretation / open`, ajaa orkesterissa vasta lopullisen äänieditoinnin jälkeen ja saa käyttää vain Evidence Layerissa jo olevia lähteitä. Candidate-linkki voidaan säilyttää avoimen/tulkinnallisen väitteen provisionaalisena tutkimusjälkenä.
- **Rakenneagentti** ehdottaa rakennetta ilman että tekee tekstistä geneeristä listiclea.
- **Kirjoitusagentti** tuottaa Markdown-luonnoksen nykyisen materiaalin pohjalta.
- **Kriitikko** etsii heikot väitteet, epäselvyydet ja koneellisen tekstirytmin.
- **Yleisöadapteri** muuttaa saman epistemisen ytimen valitulle kohdeyleisölle ja syvyystasolle. Se saa vaihtaa kehystä, järjestystä, esimerkkejä ja terminologian tiheyttä, mutta ei väitteiden varmuutta tai lähdestatuksia.
- **Äänieditori** poistaa geneeristä LLM-kadenssia mutta säilyttää ihmisen omituisuuden ja Yleisöadapterin kohdennuksen.
- **Julkaisupaketti** ehdottaa title/description/slug/answer/category-metadataa. Audience Contract pysyy ihmisen valitsemana eikä paketoija saa vaihtaa sitä. Claims + sources ovat tässä vaiheessa lukittua Evidence Layeria.

## DeepSeek-asetus Vercelissä

Pakollinen:

```text
DEEPSEEK_API_KEY=...
```

Valinnaiset:

```text
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_WRITER_MODEL=deepseek-v4-flash
DEEPSEEK_CRITIC_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=75000
```

`Lähdeagentti` käyttää aina `deepseek-v4-flash`-mallia, koska 14.0 käyttää sen Responses API + web_search -yhdistelmää.

## Turvarajat

- admin-session vaaditaan
- POST vaatii CSRF + same-origin
- API-avain ei mene selaimeen
- enintään 60 000 merkkiä artikkelitekstiä yhteen agenttikutsuun
- yksittäisen agentin UI-ohje enintään 2 000 merkkiä; orkesterin UI-ohje enintään 2 400 merkkiä (sisäinen vaihekohtainen konteksti clampataan 12 000 merkkiin)
- best-effort 24 agenttikutsua / 10 min / sessio + IP
- DeepSeekin reasoning-sisältöä ei palauteta käyttöliittymään
- agentin tulos ei tallenna eikä julkaise mitään automaattisesti

## 14.0.3 · Source Agent Completion Control

Pitkät web-haut käyttävät kompaktia lähdebudjettia, näyttävät Responses API:n incomplete-syyn, pelastavat ehjät lähdeobjektit katkenneesta JSONista ja tukevat progressiivista Hae lisää -hakua. Human approval gate säilyy.


## 14.1 Orchestrator

Kahdeksan agenttia voidaan nyt ajaa yhtenä selaimessa orkestroituna putkena. Live terminal näyttää etenemisen. Orkesteri ei tallenna eikä julkaise. Lopputulos siirretään editoriin vain erillisellä ihmisen hyväksynnällä. Katso `ORCHESTRATOR.md`.

## 14.2 · Orchestrator resilience and evidence authority

Orkesteri säilyttää valmistuneet vaiheet selaimen session-checkpointissa, tekee yhden automaattisen retryn tilapäisiin agenttivirheisiin ja mahdollistaa epäonnistuneen vaiheen uudelleenajon tai jatkamisen checkpointista. Lähdeagentin fallback/nolla lähdettä näkyy DEGRADED-tilana eikä sitä esitetä varmistettuna evidenssinä.

## 14.3.0 · Evidence coherence patch

Orkesterin järjestys on nyt `source → structure → writer → critic → voice → claims → package`. Väitevahti tarkastaa siis nykyisen lopputekstin. Lähde-ehdokkaat saavat deterministisen `src-*`-ID:n heti palvelimella. Paketoija ei voi pudottaa, refrasoida tai ylentää Evidence Layeria. Tallentamattomat uudet luonnokset saavat istuntokohtaisen identiteetin, ja lähteen manuaalinen `verified`-merkintä vaatii erillisen vahvistuksen.

## 14.3.0 · Audience Layer

Kohdeyleisö ei ole enää vain julkinen filtteri. `audience` + `audienceDepth` muodostavat Audience Contractin, joka ohjaa rakenne-, kirjoitus-, kritiikki-, yleisö- ja äänivaiheita. Erillinen Yleisöadapteri palauttaa Markdown-bodyyn kohdennetun version sekä yhteenvedon siitä, mitä kehystystä muutettiin. Claims ja sources eivät kuulu sen tulossopimukseen. Väitevahti ajaa vasta yleisö- ja äänieditoinnin jälkeen.

## 14.3.1 · Token Headroom

Pitkien ajoketjujen output-katot ovat nyt: Source 16 000 (ympäristömuuttujalla 8 000–32 000), Structure 12 000, Writer 24 000, Critic 12 000, Audience 24 000, Voice 24 000, Claims 16 000 ja Package 12 000 tokenia. Rajat ovat kattoja, eivät tavoitepituuksia. Adminin agenttiloki näyttää myös käytetyt output-tokenit suhteessa agentin kattoon.
