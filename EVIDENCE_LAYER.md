# Anomancer 14.2 · Evidence Layer

Jokaisella lähteellä on URL:n ja bibliografisten tietojen lisäksi pysyvä tunniste, alkuperä, tarkistustila, hakuaika sekä agentin tutkimusmuistiinpanot.

## Tarkistustilat

- `candidate`: agentin tai tuonnin tuottama ehdokas, joka ei saa mennä julkiseksi.
- `verified`: ihminen on avannut ja arvioinut lähteen.
- `rejected`: hylätty lähde, joka säilyy luonnoksessa vain tarkistushistoriaa varten.

Vanha tai ihmisen käsin lisäämä lähde normalisoidaan yhteensopivuussyistä tarkistetuksi. Source Agentin lähde normalisoidaan aina ehdokkaaksi riippumatta mallin palauttamasta arvosta.

## Väitteet

Väitteen tila on `supported`, `interpretation` tai `open`. Julkaisussa `supported` vaatii vähintään yhden evidence-URL:n, joka löytyy lähderekisteristä ja jonka lähde on `verified`. Luonnos saa sisältää keskeneräisiä lähteitä ja väitteitä.

Sama sääntö toteutetaan kolmessa kerroksessa:

1. agenttituloksen palvelinvalidointi,
2. adminin julkaisuportti,
3. sisältö- ja build-validointi.

Näin käyttöliittymän ohittaminen ei ohita evidenssisääntöä.

