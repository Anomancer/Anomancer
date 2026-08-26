# Changelog

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

