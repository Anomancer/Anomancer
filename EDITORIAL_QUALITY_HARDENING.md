# Anomancer 16.3.1 · Editorial Quality Hardening

16.3.1 korjaa tilanteen, jossa hyväkin ihmisohje saattoi muuttua julkaisutekstin näkyväksi metakieleksi. Esimerkiksi pyyntö täsmällisestä tai epätavallisen tiukasta argumentista kuuluu vaikuttaa päättelyyn, ei tuottaa artikkeliin toistuvia lauseita argumentin “tiukkuudesta”.

## Uusi raja

- Ihmisohje on toimituksellinen tarkoitus, ei kopioitava fraasi.
- Lähdeagentin ehdokas pysyy toimituksen sisäisenä tutkimusjohtolankana, kunnes ihminen on tarkistanut sen.
- Julkinen artikkeli ei saa kertoa lukijalle orkesterin työvaiheista, agenttirooleista tai sisäisestä evidenssivelasta.
- Kritiikki ja äänieditointi poistavat toistuvan mallirytmin ennen väiteauditointia.
- Julkaisupaketti nimeää artikkelin pääaiheen; sivuteemaa ei käytetä otsikon irrallisena klikkikoukkuna.

## Deterministinen julkaisuportti

`server/editorial-quality.js` tarkistaa jokaisen julkaistavan tekstin myös ilman mallia. Portti pysäyttää tunnetun prosessimetakielen, näkyvän lähdevelan, erittäin pitkän otsikon sekä voimakkaasti toistuvan vastakkainasettelun tai johtopäätöskaavan. Keskeneräinen luonnos voidaan tallentaa, jotta kirjoittaminen ei lukkiudu, mutta julkaisu vaatii puhtaan tuloksen.

Sama tarkistus liittää agenttituloksiin varoitukset jo kirjoitus-, yleisö-, äänieditointi- ja paketointivaiheessa. Ihminen näkee ongelman ennen varsinaista julkaisuporttia.

## Sisältömuutokset

- `Mitkä työt tekoäly vie?` käyttää jälleen kategoriaa `ai-work`, on lyhyempi ja nojaa vain mukaan jätettyihin varmennettuihin lähteisiin.
- Agenttiturvallisuusteksti on nyt `Kun tekoälyagentin virhe muuttuu toiminnoksi`. Vanha pitkä URL säilyy alias-uudelleenohjauksena.
- Taide- ja opettajatekstien toistuvaa “ei X vaan Y” -rakennetta on vaihdeltu säilyttäen niiden väitteet, esimerkit ja henkilökohtainen ääni.

## Rajat ennallaan

Korjaus ei lisää agentteja, työkaluja, mallitoimittajia, julkaisuvaltaa tai ulkoisia kirjoitusoikeuksia. Core pysyy versiossa 16.3.0 ja ihminen tekee lopullisen julkaisu- ja lähdevarmennuspäätöksen.
