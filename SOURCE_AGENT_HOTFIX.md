# Anomancer 14.0.1 · Source Agent Hotfix

Korjaa 14.0:n Lähdeagentin tilanteen, jossa DeepSeekin Responses API:n web-haun näkyvä vastaus ei ollut parsittavissa suoraan JSONiksi.

## Mitä muuttui

- Responses-vastauksen näkyvä teksti kerätään useammasta yhteensopivasta muodosta.
- JSON voidaan pelastaa ympäröivästä tekstistä ja ```json-koodiaidasta.
- JSON-objekti etsitään tasapainotetulla parserilla, joka ei katkea merkkijonojen aaltosulkuihin.
- Jos formaatti silti pettää, Lähdeagentti ei enää kaada työvaihetta HTTP 502 -virheeseen.
- Raakavastaus säilytetään UI:ssa ihmisen tarkistettavaksi ja automaattinen "Lisää lähde-ehdokkaat" -nappi poistetaan fallback-tilassa.
- Epätäydellinen Responses API -vastaus merkitään varoitukseksi eikä sitä kohdella valmiina rakenteisena evidenssinä.
- Lähde-ehdokkaat normalisoidaan ja vain http/https-URL:t hyväksytään rakenteiseen tulokseen.
- Lähdeagentin schemaan lisättiin `supports` ja `challenges`, jotta haku ei etsi vain myötäilevää näyttöä.
- Human approval gate säilyy ennallaan. Agentti ei tallenna eikä julkaise.

## Fail-soft-periaate

`WEB SEARCH -> STRUCTURED JSON if possible -> RAW VISIBLE RESPONSE if not -> HUMAN REVIEW`

Formaattivirhe ei saa tuhota tutkimustulosta, mutta raakavastausta ei myöskään saa automaattisesti nostaa Evidence Layeriin.
