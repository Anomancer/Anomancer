# Anomancer 14.1.1 · Orchestrator Resilience

14.1.1 tekee Lähetyskoneen orkesterista vikasietoisen. Seitsemän agentin toimitusputki pysyy samana:

`Lähdeagentti → Väitevahti → Rakenneagentti → Kirjoitusagentti → Kriitikko → Äänieditori → Julkaisupaketti`

## Retry

Tilapäiset DeepSeek-virheet kuten tyhjä vastaus, JSON-virhe, verkkovirhe, timeout sekä HTTP 502/504 saavat yhden automaattisen retry-yrityksen. Jos sama vaihe epäonnistuu uudelleen, orkesteri ei aloita kaikkea alusta.

## Checkpoint + resume

Jokaisen valmistuneen vaiheen jälkeen nykyinen orkesterin työmuisti tallennetaan selaimen `sessionStorage`-checkpointiksi. Checkpoint sisältää luonnoksen sisäisen työtilan, valmistuneet agenttitulokset, metatiedot ja ajolokin. Se ei tee palvelin- tai GitHub-kirjoitusta.

Virheen jälkeen käyttöliittymä tarjoaa:

- `Yritä vaihetta uudelleen` ajaa vain epäonnistuneen vaiheen.
- `Jatka tästä` jatkaa checkpointista putken loppuun.

Myös käyttäjän pysäyttämä ajo voidaan jatkaa checkpointista. Saman välilehden uudelleenlataus säilyttää checkpointin session ajan.

## DEGRADED

Lähdeagentin fallback tai nolla löytynyttä lähdettä ei kaada koko orkesteria. Lähdevaihe merkitään `DEGRADED`-tilaan ja terminaali kertoo näkyvästi, ettei uutta evidenssiä saatu. Väitevahdille annetaan tällöin erillinen ohje olla nostamatta väitteitä tuetuiksi lähdevaiheen perusteella.

DEGRADED ei tarkoita onnistunutta evidenssivarmennusta. Se tarkoittaa, että orkesteri jatkaa hallitusti puutteellisella lähdetilalla ja jättää puutteen ihmisen nähtäväksi.

## Authority

Orkesteri käyttää vain olemassa olevaa `/api/admin/agents`-rajapintaa. Se ei kutsu luonnoksen tallennusta, GitHub-writeä eikä julkaisua. Lopputuloksen siirto editoriin vaatii erillisen ihmisen painalluksen ja tallennus/julkaisu ovat edelleen erillisiä ihmispäätöksiä.

Reasoning-sisältöä ei näytetä terminaalissa. Näkyviin voidaan tuoda vain token-lukumäärä ja muut turvalliset metatiedot.
