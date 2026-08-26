# Anomancer 13.17 · ENTITY CORE

Tämä versio tekee Anomancerin henkilön, sivuston ja Lähetysten välisestä suhteesta eksplisiittisen sekä ihmisille että hakukoneille.

## Ydin

- yksi pysyvä `Person`-entiteetti: `https://anomancer.com/#person`
- yksi pysyvä `WebSite`-entiteetti: `https://anomancer.com/#website`
- etusivut sisältävät `WebPage + WebSite + Person` -graafin
- Lähetykset sisältävät `CollectionPage + Blog + WebSite + Person` -graafin
- jokainen julkaistu teksti sisältää `WebPage + BlogPosting + WebSite + Person` -graafin
- `BlogPosting.author`, `publisher` ja näkyvä kirjoittajalinkki osoittavat samaan henkilöön
- `meta name="author"`, `rel="author"`, canonical, Open Graph ja artikkelin julkaisu-/muokkausajat ovat synkronoituja
- `content-manifest.json` sisältää yhteisen entity-ytimen ja artikkelien pysyvät `articleId`-tunnisteet

## Rajaus

13.17 ei tee Anomancerista `Organization`- tai `ConsultingService`-entiteettiä. Sivusto kuvaa tässä vaiheessa ensisijaisesti Aatu Isopahkalan julkista käyttöliittymää, kirjoituksia ja työtä. Tämän vuoksi väärää yritysrakennetta ei lisätä vain SEO:n vuoksi.

## Author URL

Kirjoittajan julkinen author URL on tällä hetkellä:

`https://anomancer.com/#about`

Sama URL näkyy HTML:n `rel="author"`-linkissä ja `Person.url`-kentässä. Jos myöhemmin rakennetaan oma `/kuka`-profiilisivu, author URL voidaan vaihtaa yhdestä paikasta `entity-core.json`-tiedostossa.

## Testi

```bash
npm run build
npm run test:entity
```

Koko tarkistus:

```bash
npm run check
```
