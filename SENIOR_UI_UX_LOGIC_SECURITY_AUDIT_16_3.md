# Anomancer 16.3 — Senior lead UI/UX + logiikka/tietoturva-audit

Auditointi tehtiin koko nykyisestä lähdepaketista, johon 16.3 Living Machine Room -overlay oli sovitettu. Tarkastus kattoi yksityisen admin-käyttöliittymän, julkisen buildin, sisältövalidoinnin, autentikoinnin, orkestroinnin, runtime-snapshotit, agentti- ja työkalusopimukset sekä julkaisuportit.

## Lopputulos

Paketti on korjausten ja regressiotestien jälkeen julkaisuvalmis nykyiseen yhden ylläpitäjän käyttötapaan. Agentit eivät edelleenkään saa julkaisu-, GitHub-write- tai evidenssin varmennusvaltaa. Ihmisen hyväksyntäportit säilyvät.

## Korjatut havainnot

| Taso | Havainto | Korjaus |
| --- | --- | --- |
| Korkea | Build hyväksyi käsin kirjoitetun slugin sellaisenaan, jolloin polkusegmentit saattoivat vaikuttaa kirjoituskohteeseen. | Tiukka slug-skeema ja projektijuureen lukittu `projectPath` kaikille dynaamisille build-poluille. |
| Korkea | JSON-LD-scriptiin sijoitettu sisältö ei estänyt `</script>`-katkaisua. | JSON-LD:n HTML-turvallinen Unicode-karkaisu merkeille `<`, `>`, `&`, U+2028 ja U+2029. |
| Korkea | Konehuoneen historia ja orkesterin suunnitelma rakentuivat `innerHTML`:llä telemetria- tai rekisteridatasta. | DOM rakennetaan `createElement`-, `textContent`- ja `replaceChildren`-operaatioilla. |
| Keskitaso | Adminin tiukka CSP esti työtiladialogin inline-`onclick`-sulkemisen. | Inline-eventit poistettu ja käsittelijät sidottu ulkoisessa moduulissa. |
| Keskitaso | Stop-pyyntö vaiheiden välissä saattoi tallentaa edellisen vaiheen uudelleenajettavaksi. Retry-viive ei ollut keskeytettävä. | Aktiivivaiheen kursori nollataan onnistumisen jälkeen, checkpoint saa tarkan resume-indeksin ja retry-viive käyttää abortoitavaa, 30 sekuntiin rajattua ohjainta. |
| Keskitaso | Disabled-vaiheet eivät tehneet ajosta rajoitettua, ja kaikki agentit saattoivat olla pois käytöstä. | Disabled-vaihe tekee tuloksesta `degraded/rajoitettu`; täysin tyhjä ajo estetään ennen käynnistystä. |
| Keskitaso | Agenttitulokset upotettiin seuraavan agentin ohjeeseen ilman selvää data-/ohjerajaa. | Jokainen upstream-tulos rajataan ja merkitään epäluotettavaksi dataksi; sisäisiä ohjeita ei saa noudattaa. |
| Keskitaso | Core Registryt olivat vain pinnallisesti jäädytettyjä. | Agenttien toimivalta-, budjetti-, mallireitti-, työkalu- ja orkesterirakenteet syväjäädytetään. |
| Matala | Malformed percent-encoded cookie saattoi heittää poikkeuksen. | Virheellinen cookie ohitetaan, muu cookie-header käsitellään normaalisti. |
| Matala | Kansikuvan `/media/`-polku salli `..`-segmentin; adminin manuaalinen lähde-esikatselu hyväksyi muitakin protokollia. | Media-segmentit validoidaan, ja lähteille sallitaan vain HTTP/HTTPS sekä clientissä että serverissä. |
| Matala | Orkesterin vaihemäärä ja agenttimäärä olivat osin kovakoodattuja; live-alueita oli päällekkäin. | Yhteenveto päivittyy valitusta orkesterista, agenttimäärä on 9 ja yksi selkeä atominen status-live-alue hoitaa ilmoitukset. |

## Varmennus

- Koko `npm run check` -ketju ajetaan release-paketille.
- Uusi senior-audit-regressiosviitti testaa mm. inline-eventtien puuttumisen, DOM-rakennuksen, telemetriarajat, cookie-virheen, media-polun, syväjäädytyksen, built-in/custom-rajan sekä buildin polkuyrityksen.
- Build tuottaa `public/`-outputin ja tarkistaa julkaistun sisällön sekä mediareferenssit.

## Tiedostetut jäännösriskit

- Admin käyttää edelleen yhden ylläpitäjän salasanaistuntoa; monikäyttäjä-ACL, MFA ja roolikohtainen hyväksyntäketju eivät kuulu nykyiseen arkkitehtuuriin.
- Rate limitit ovat serverless-instanssin muistissa. Hajautettu, pysyvä rate limit on suositeltava, jos admin tai contact joutuu laajemman hyökkäyspinnan kohteeksi.
- Ulkoisten mallien ja verkkolähteiden sisältö on aina epäluotettavaa. Prompttirajaus pienentää injektioriskiä, mutta ihmisen lähde-, evidenssi- ja julkaisuhyväksyntää ei saa poistaa.
- Selaimen checkpoint on saatavuusapu, ei luottamuksen juuri. Turvarajat perustuvat palvelimen allekirjoittamaan runtime-snapshotiin, sopimushasheihin, CSRF-suojaan ja palvelinvalidointiin.
