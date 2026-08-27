# Anomancer 1.18.1 · Semantic Workbench Hardening

## Ydinlausunto

1.18.0 todisti Mancer Runtime -arkkitehtuurin: Codemancer voidaan löytää ja ladata sopimuspakettina ilman Codemancer-kohtaista Core Shell -navigaatiota. 1.18.1 tarkastaa sen jälkeen koko yksityisen työpöydän semanttisen käyttöliittymäkerroksen ja korjaa tilanteet, joissa tekninen arkkitehtuuri oli käyttäjälle näkyvää käsitteistöä selkeämpi.

Tämän julkaisun tavoite ei ole uusi kyvykkyys. Tavoite on, että käyttäjä näkee yhden johdonmukaisen tuotteen: Core → työtila → paikallinen työ → toimivaltaraja → ihmisen hyväksyntä.

## Auditissa löydetty P0

### `admin-mancer.css` ei kuulunut todelliseen tuotannon CSS-ketjuun

1.18.0 sisälsi `admin-mancer.css`-tiedoston, build kopioi sen `public/`-hakemistoon ja service worker tunsi sen, mutta `admin.css` ei importannut tiedostoa. Myös browser-portin CSS-kooste jätti sen ulkopuolelle.

Seurauksena Mancer-komponenttityyli pystyi näyttämään testipaketissa olemassa olevalta, vaikka varsinainen admin ei ladannut sitä.

Korjaus:

- `admin.css` importtaa `admin-mancer.css`:n.
- `scripts/read-admin-css.mjs` lukee saman tiedoston browser-porttiin.
- 1.18.1 semanttinen release-portti varmistaa molemmat reitit.

Tämä on release-estävä regressiosääntö jatkossa.

## Semanttiset korjaukset

### Romancer näkyväksi nimeksi

Legacy-tunnisteet kuten `narramancer/story-studio/1.0.0`, moduulinimet ja tallennusprotokollat säilyvät yhteensopivuuden vuoksi. Käyttäjälle näkyvä tuotenimi on nyt **Romancer**.

Näin kone-identiteettiä ei rikota pelkän nimeämisen vuoksi, mutta käyttäjän ei tarvitse nähdä historiallista nimeä työpinnassa.

### Codemancer suomeksi, kone-id:t ennallaan

Codemancerin yhdeksän osiota säilyttävät kone-id:t:

`project · architecture · code · tasks · tests · runs · review · release · documentation`

Näkyvä käyttöliittymä käyttää:

`Projekti · Arkkitehtuuri · Koodi · Tehtävät · Testit · Ajot · Tarkistus · Julkaisu · Dokumentaatio`

Sama periaate koskee hyväksymisvaiheita, orkesterien näkyviä nimiä ja työtilan ohjetekstejä.

### Tekninen metadata pois pääsisällöstä

Workspace-id:t, template-id:t, sopimushashit ja Mancer-paketin versiot säilyvät diagnostiikkaa varten, mutta ne eivät ole enää korttien ensisijaista sisältöä.

Ne löytyvät avattavista `Tekniset tiedot` / `Pakettitiedot` / `Sopimuksen tekniset tiedot` -osioista.

### Toimivaltaraja näkyviin ennen sivuvaikutusta

Codemancerin Tarkistus- ja Julkaisu-osioissa käyttäjälle kerrotaan ennen toimintaa, että:

- tarkistus ei sovella koodia,
- koodivarasto ei muutu automaattisesti,
- julkaisu vaatii ihmisen nimenomaisen päätöksen,
- hyväksytty tila ei itsessään käynnistä julkaisua tai Git-pushia.

### Mancer-kokoelman turvallinen poisto

Geneerisen Mancer Workbenchin kokoelmaobjektin poisto ei enää ole välittömästi lopullinen editoritoiminto. Poistettu kohde voidaan palauttaa `Kumoa poisto` -toiminnolla ennen tallennusta.

### Yksi tallennustotuus

Mancer-editorin paikallinen `TALLENTAMATON/TALLENNETTU` ja Core Shellin globaali tallennusindikaattori käyttävät nyt samaa tilaa. Työpöytä ei saa näyttää `VALMIS`, jos aktiivisessa Mancer-artefaktissa on tallentamattomia muutoksia.

### Arkiston ja Nanomancerin käyttäjäkieli

Näkyviä teknisiä ilmauksia selkeytettiin:

- Archive Store → Arkisto
- Capability Registry → Kyvykkyysrekisteri
- Provenance → Alkuperäketju käyttäjäpinnassa
- Human approval → Ihmisen hyväksyntä
- Archive Health → Arkiston kunto
- retention review → säilytystarkistus

Protokollien konearvoja ei muutettu.

## UI/UX-korjaukset

### Kapea mobiili

Alle 420 px leveydellä Core-brändiblokki väistyy, jotta päänavigaatio ei joudu kilpailemaan pysyvästä vaakasuunnasta tuotemerkin kanssa. Työtilan identiteetti säilyy workspace-contextissa.

### Mancer Workbench

- authority-notice on oma selkeä semanttinen korttinsa,
- tekninen sopimusdata on suljetussa details-osiossa,
- empty state kertoo mitä seuraavaksi tehdään,
- poistossa on Kumoa,
- statusalue käyttää `aria-live`-polkua,
- tekninen data ei dominoi mobiilia.

### Työtilakortit ja Mancer-rekisteri

Kortti kertoo ensin työn maailman, nimen, tarkoituksen ja ulostulorajan. ID/hash ovat toissijaisia teknisiä tietoja.

Workspace-valitsin käyttää näkyvää työtilatyyppiä raakakindin (`development`, `narrative-authoring`) sijaan.

## Testit

Uusi `scripts/test-semantic-workbench-1181.mjs` varmistaa muun muassa:

1. 1.18.1 release-metadatan yhtenäisyyden.
2. Romancer-visible / Narramancer-legacy -rajan.
3. Codemancerin kone-id:n ja näkyvän labelin eron.
4. Tarkistus- ja Julkaisu-toimivaltarajat.
5. Teknisen sopimusmetadatan details-rajan.
6. Mancer-poiston Kumoa-polun.
7. Workspace-id/hash -metadatan toissijaisuuden.
8. `admin-mancer.css`:n todellisen tuotanto- ja browser-portti-integraation.
9. 360 px Core-navin tilankäytön.

Lisäksi Mancer Workbench ajetaan Chromiumissa 1440×900 ja 360×800 -koossa, ja koko Visual System -matriisi säilyy käytössä.

## Jäljelle jäävä käyttöliittymävelka

Auditissa löytyi 21 legacy-adminin natiivia `alert()`, `confirm()` tai `prompt()` -kutsukohtaa. Ne sijaitsevat muun muassa editorial-, workspace-, orchestra-, Archive- ja agenttitoiminnoissa.

1.18.1 ei muuta niitä kiireessä rinnakkaiseksi dialogijärjestelmäksi. Turvallisuuskriittisiä `confirm()`-portteja ei poisteta ennen kuin yhteinen async overlay-controller korvaa ne hallitusti.

Seuraava erillinen UI-kovetus voi tehdä **Native Dialog Consolidation** -vaiheen:

- yksi yhteinen confirm/prompt/dialog API,
- fokusrajaus ja inert,
- inline-validation alertien tilalle,
- kuvien alt/caption omaan dialogiin,
- kaikki sivuvaikutukset säilyttävät nykyiset human authority -rajat.

## Hyväksyntäkriteeri

1.18.1 hyväksytään, kun semanttinen release-portti, Mancer Chromium -portti, Visual System -matriisi ja koko olemassa oleva `npm run check` menevät läpi ilman Constitution-, Artifact Boundary-, Archive-, Evidence-, Model Router-, Tool Broker-, Workspace Isolation- tai Public/Private Boundary -heikennyksiä.
