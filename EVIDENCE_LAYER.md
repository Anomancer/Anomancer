# Anomancer 13.18 · EVIDENCE LAYER

13.18 lisää Lähetyskoneeseen vapaaehtoisen evidenssikerroksen. Tarkoitus ei ole tehdä jokaisesta tekstistä tutkimuspaperia, vaan erottaa suora vastaus, lähteet, tuetut väitteet, tulkinnat ja avoimet kysymykset toisistaan silloin kun siitä on hyötyä.

## Frontmatter

```yaml
answer: "1–3 virkkeen ydinvastaus"
sources: [{"title":"Lähteen nimi","url":"https://...","publisher":"Julkaisija","date":"2026-08-26"}]
claims: [{"status":"supported","text":"Väite","evidence":["https://..."],"note":"Valinnainen huomio"}]
```

`status` voi olla:

- `supported` = väite on sidottu vähintään yhteen `sources`-listassa olevaan URL:iin
- `interpretation` = kirjoittajan tulkinta; lähteitä voi olla, mutta status ei teeskele lähteen sanovan täsmälleen samaa
- `open` = avoin kysymys tai epävarma kohta

Kentät ovat vapaaehtoisia, jotta vanhat Lähetykset säilyvät yhteensopivina.

## Julkinen artikkeli

Jos `answer` on täytetty, artikkeli näyttää **Ydinvastaus / Direct answer** -osion. Jos `sources` tai `claims` on täytetty, tekstin loppuun muodostuu **Väitteet ja evidenssi / Claims & evidence** -osio lähdeankkureineen.

## Koneluettava ulostulo

`BlogPosting` JSON-LD saa:

- `abstract` ← ydinvastaus
- `citation` ← lähteiden URL:t

Lisäksi build tuottaa:

`/evidence-manifest.json`

Sen formaatti on `anomancer.evidence/v1`. Tämä on tarkoitettu myöhemmän agenttikerroksen, auditoinnin ja muiden työkalujen vakaaksi koneelliseksi rajapinnaksi. Se ei korvaa julkista HTML:ää eikä lähteitä.

## Lähetyskone Admin

Adminissa on uusi **Evidence Layer**:

- Ydinvastaus
- Lähteet
- Väitteet / evidenssi

Lähderivi:

```text
Otsikko | https://example.com | Julkaisija | 2026-08-26
```

Väiterivi:

```text
supported | Väite | https://example.com | Huomio
interpretation | Tulkinta | https://example.com | Miksi tämä on tulkinta
open | Avoin kysymys | | Mitä emme vielä tiedä
```

## Authority-raja

13.18 ei lisää yhtään kirjoittavaa agenttia eikä automaattista julkaisua. Evidenssikerros on tietomalli, jonka 14.0-agentit voivat myöhemmin lukea ja ehdottaa täytettäväksi. Ihminen hyväksyy julkaistavan tekstin ja evidenssin.
