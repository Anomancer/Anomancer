# Anomancer 16.9.0 · Public Clarity Pass

16.9.0 viimeistelee 16.8-sarjan jälkeen julkisen Anomancer-pinnan informaatioarkkitehtuurin. Muutos ei lisää agenttien toimivaltaa eikä muuta Evidence Layerin tai julkaisun turvallisuusrajoja. Se tekee jo olemassa olevasta arkkitehtuurista ymmärrettävämmän ilman adminin tai yksityisen Coren avaamista julkiseksi.

## Julkinen Core

- Julkinen Core on jaettu kolmeen päälukuun: **Mikä tämä on**, **Miten työ kulkee** ja **Mikä pysyy rajattuna**.
- Kaikki yhdeksän teknistä rakenneankkuria säilyvät avattavassa **Tutki rakennetta** -hakemistossa.
- Toistuvat `KÄYTÖSSÄ`-statusmerkit on poistettu. Status näkyy vain silloin, kun se välittää oikeaa tilatietoa.
- Näkyvä termi on **julkinen rakennenäkymä**, ei ohjaustaso. Julkinen sivu ei ohjaa yksityistä Corea.
- Admin-linkki on rajattu julkinen/yksityinen-rajan yhteyteen yhden kerran.
- Narramancerin 9-vaiheinen orkesteri muuttuu kapealla puhelimella pystysuuntaiseksi aikajanaksi.

## Yksi snapshot, yksi fallback

`public-core-render.js` on yhteinen julkisen Core-snapshotin renderer.

Samaa rendereriä käyttävät:

1. build-vaihe, joka generoi no-JavaScript fallbackin `core.html`- ja `core-en.html`-tiedostoihin
2. selaimen `core-public.js`, joka päivittää saman näkymän `core-public.json`-snapshotista

Tämän vuoksi JavaScript päällä ja pois päältä eivät enää kuvaa eri Core-versiota. Fallback sisältää nykyisestä allowlist-snapshotista kaikki julkiset sisäänrakennetut agentit ja orkesterit, mutta ei yksityisiä runtime-, provider-, prompt-, työmuisti- tai salaisuustietoja.

## Lähetykset / Dispatches

- Mobiilissa aihe- ja yleisöfiltterit yhdistyvät samaan natiiviin bottom sheet -pintaan.
- Yleisöfiltterit näyttävät määrän.
- Yleisö, jolla ei ole yhtään julkaistua sisältöä, ei synnytä tyhjää aktiivista filtteriä.
- Aktiiviset suodattimet näkyvät yhteenvetona.
- `Tyhjennä` nollaa sekä aihe- että yleisövalinnan.
- Nykyinen AND-logiikka ja tarkka yleisötulkinta säilyvät.

## Etusivu

- Hero on tiivistetty kahteen ydinlauseeseen.
- Pidempi menetelmäselitys on siirretty alemmaksi sisältöön.
- Kovakoodattu ikä sekä ajan myötä vanheneva “viimeiset kolme vuotta” -copy on poistettu FI/EN-pinnoilta.
- Yhteysosion johdantoa on lyhennetty, jotta lomake tulee näkyviin nopeammin.
- Suomen- ja englanninkieliset pinnat käyttävät samaa sisältörakennetta.

## Release-portti

Uusi `scripts/test-public-clarity-169.mjs` lukitsee muun muassa:

- version 16.9.0
- kolmen luvun Core-rakenteen ja yhdeksän rakenneankkuria
- snapshotista generoitavan fallbackin
- public rendererin stageauksen Vercel `public/` -outputtiin
- julkisen/yksityisen terminologiarajan
- yleisöfiltterien määrät ja tyhjien filttereiden poiston
- mobiilin yhdistetyn filter bottom sheetin
- etusivun vanhenevien copyjen poiston

## Rajat

16.9.0 ei muuta:

- Agent Contracteja
- Constitutioneja
- Artifact Boundarya
- Evidence Layerin totuusmallia
- lähteen ihmisen varmennusta
- publish gatea
- human final authority -periaatetta
- Tool Brokerin toimivaltamallia
- Model Routerin yksityisiä targetteja tai provider-konfiguraatiota
- julkisen/yksityisen Core-snapshotin allowlist-rajaa
