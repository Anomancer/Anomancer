---
title: "En rakentanut agentteja ajattelemaan puolestani"
date: "2026-08-27"
category: "language-learning"
audience: ["employee","developer","teacher"]
audienceDepth: "professional"
description: "Tekoälystä puhutaan automaationa, mutta tässä järjestelmässä yhdeksällä agentilla on nolla julkaisuvaltaa. Artikkeli kertoo, miksi rajat, sopimukset ja ihmisen portti ovat kiinnostavampia kuin täysautonomia."
slug: "en-rakentanut-agentteja-ajattelemaan-puolestani"
lang: "fi"
translationKey: "en-rakentanut-agentteja-ajattelemaan-puolestani"
aliases: []
coverImage: ""
coverAlt: ""
answer: ""
sources: [{"id":"src-l99v00","title":"Relying on the Unreliable: The Impact of Language Models' Reluctance to Express Uncertainty","url":"https://aclanthology.org/2024.acl-long.198/","publisher":"ACL (ACL 2024)","date":"2024-08","origin":"source-agent","verification":"candidate","retrievedAt":"2026-08-27T12:20:55.681Z","why":"Antaa empiirisen pohjan tekstin väitteelle siitä, että kielimallit esittävät väärät väitteet yhtä itsevarmasti kuin oikeat.","supports":"Tutkimuksessa mallit olivat ylivarmoja: virheellisten vastausten osuus luottavaisissa vastauksissa keskimäärin 47 %, ja käyttäjät luottivat mallien tuotoksiin riippumatta siitä, merkittiinkö ne varmoiksi. Tämä tukee kohtia \"kielimalli voi kirjoittaa väärän väitteen samalla itsevarmuudella\" ja tarkistuksen keskeisyydestä.","challenges":"Tarkastelee nimenomaan konfidenssipromptauksen ongelmaa, ei agenttijärjestelmiä; ei ota kantaa siihen, vähentääkö putkimaisten tarkistusvaiheiden määrä virheellisten väitteiden pääsyä lopputekstiin."},{"id":"src-14enovi","title":"Watching the detectors: Researchers probe efficacy – and danger – of AI detection tools","url":"https://news.ufl.edu/2026/05/traynor-ai-detector-study/","publisher":"University of Florida News","date":"2026-05-18","origin":"source-agent","verification":"candidate","retrievedAt":"2026-08-27T12:20:55.681Z","why":"Suora empiirinen tuki tekstin kritiikille jälkikäteistä AI-tekstin tunnistusta kohtaan.","supports":"IEEE S&P -paperi osoittaa, etteivät kaupalliset AI-tekstintunnistimet sovellu akateemisiin korkean panoksen konteksteihin: väärien positiivisten osuudet 0,05–68,6 % ja väärien negatiivisten 0,3–99,6 %; pienikin muokkaus (leksikaalinen hyökkäys) romahduttaa luotettavuuden. Tukee \"miksi arvata lopputuloksesta\" -argumenttia ja tuotantoprosessin tarkastamista ennalta.","challenges":"Käsittelee tieteellisten julkaisujen kontekstia, ei yleistä tekstintuotantoa; ei väitä, etteikö tunnistimilla olisi mitään käyttöä, vaan ettei niihin voi nojata korkean panoksen päätöksissä."},{"id":"src-a9ayce","title":"From Fluent to Verifiable: Claim-Level Auditability for Deep Research Agents","url":"https://arxiv.org/abs/2602.13855","publisher":"arXiv","date":"2026-02-14","origin":"source-agent","verification":"candidate","retrievedAt":"2026-08-27T12:20:55.681Z","why":"Konseptuaalinen tuki tekstin ydinarkkitehtuurille: väitekohtainen todennettavuus ja jatkuva validointi synteesin aikana.","supports":"Esittää auditabilityn pullonkaulana ja ehdottaa semanttista provenancea, jossa väite–evidenssi-suhteet (myös ristiriidat) säilytetään ja validointi tapahtuu synteesin aikana eikä vasta julkaisun jälkeen. Rinnastuu putken \"adapt, then recheck\" -periaatteeseen ja väite/lähde-ehdokas-erotteluun.","challenges":"Perspektiivipaperi, ei validoitu empiirinen tutkimus; keskittyy syvä-tutkimusagenteihin, ei toimitukselliseen kirjoitusputkeen tai suomenkieliseen käyttöliittymään."},{"id":"src-eqbbg3","title":"Automation bias: a systematic review of frequency, effect mediators, and mitigators","url":"https://academic.oup.com/jamia/article/19/1/121/722162","publisher":"Journal of the American Medical Informatics Association","date":"2012-01","origin":"source-agent","verification":"candidate","retrievedAt":"2026-08-27T12:20:55.681Z","why":"Keskeinen klassinen lähde tekstin human-in-the-loop-kritiikille: automaatiolla on taipumus tehdä ihmisen valvonnasta muodollista.","supports":"Systemaattinen katsaus osoittaa automation bias -ilmiön: ihmiset luottavat automaation tuotoksiin ja jättävät omat tarkistukset tekemättä, mikä tukee tekstin väitettä \"ihminen jää kumileimasimeksi\" ja inhimillisen hylkäysvallan tarpeesta.","challenges":"Julkaistu 2012, siis ennen LLM-aikakautta; vaatii soveltamista kielimalliympäristöön. Sivua ei onnistuttu avaamaan, joten tarkistus suositellaan."},{"id":"src-1vvraux","title":"Embedding AI in newsrooms brings speed, but risks credibility","url":"https://www.euractiv.com/news/embedding-ai-in-newsrooms-brings-speed-but-risks-credibility/","publisher":"Euractiv","date":"2026-02-25","origin":"source-agent","verification":"candidate","retrievedAt":"2026-08-27T12:20:55.681Z","why":"Konteksti siitä, että nopeus ja laajuus eivät takaa oikeellisuutta – tukee tekstin näkemystä tarkistuksen pullonkaulasta.","supports":"Viittaa Naturessa julkaistuun tutkimukseen, jossa LLM:eitä arvioitiin 47 kielellä ja 5 000 varmistetulla tosiasiaväitteellä; tuo myös esiin, että AI:n tuoma nopeus ei poista todentamiskuormaa vaan kasvattaa sitä.","challenges":"Toisen käden raportointi Naturen tutkimuksesta, ei primäärilähde; ei käsittele agenttiputkia tai läpinäkyvyysarkkitehtuuria."},{"id":"src-iubs6w","title":"AI is everywhere. Editors should be, too.","url":"https://www.poynter.org/commentary/2025/ai-editors-hallucinations-human-help/","publisher":"Poynter","date":"2025-09-29","origin":"source-agent","verification":"candidate","retrievedAt":"2026-08-27T12:20:55.681Z","why":"Ammattitoimituksen näkökulma ihmisen portista yhtenä ainoana suojana AI:n virheitä vastaan.","supports":"Väittää, että ihmisen valvonta on ainoa suoja AI:n virheitä, sokeita pisteitä ja sepitteitä vastaan ennen yleisöä – samansuuntainen tekstin teesin kanssa, jonka mukaan lopullinen hyväksyntä kuuluu ihmiselle.","challenges":"Kommentaari/mielipidekynä eikä empiirinen tutkimus; ei kuvaa mekanismeja, joilla ihmisen portti tehtäisiin tosiasiallisesti toimivaksi. Sivua ei pystytty avaamaan (403), tarkistus suositellaan."}]
claims: [{"status":"open","text":"Tutkimuksessa mallit olivat ylivarmoja: virheellisten vastausten osuus luottavaisissa vastauksissa keskimäärin 47 %, ja käyttäjät luottivat mallien tuotoksiin riippumatta siitä, merkittiinkö ne varmoiksi. Tämä tukee kohtia \"kielimalli voi kirjoittaa väärän väitteen samalla itsevarmuudella\" ja tarkistuksen keskeisyydestä.","evidence":["https://aclanthology.org/2024.acl-long.198/"],"note":"Tarkastelee nimenomaan konfidenssipromptauksen ongelmaa, ei agenttijärjestelmiä; ei ota kantaa siihen, vähentääkö putkimaisten tarkistusvaiheiden määrä virheellisten väitteiden pääsyä lopputekstiin."},{"status":"open","text":"IEEE S&P -paperi osoittaa, etteivät kaupalliset AI-tekstintunnistimet sovellu akateemisiin korkean panoksen konteksteihin: väärien positiivisten osuudet 0,05–68,6 % ja väärien negatiivisten 0,3–99,6 %; pienikin muokkaus (leksikaalinen hyökkäys) romahduttaa luotettavuuden. Tukee \"miksi arvata lopputuloksesta\" -argumenttia ja tuotantoprosessin tarkastamista ennalta.","evidence":["https://news.ufl.edu/2026/05/traynor-ai-detector-study/"],"note":"Käsittelee tieteellisten julkaisujen kontekstia, ei yleistä tekstintuotantoa; ei väitä, etteikö tunnistimilla olisi mitään käyttöä, vaan ettei niihin voi nojata korkean panoksen päätöksissä."},{"status":"open","text":"Esittää auditabilityn pullonkaulana ja ehdottaa semanttista provenancea, jossa väite–evidenssi-suhteet (myös ristiriidat) säilytetään ja validointi tapahtuu synteesin aikana eikä vasta julkaisun jälkeen. Rinnastuu putken \"adapt, then recheck\" -periaatteeseen ja väite/lähde-ehdokas-erotteluun.","evidence":["https://arxiv.org/abs/2602.13855"],"note":"Perspektiivipaperi, ei validoitu empiirinen tutkimus; keskittyy syvä-tutkimusagenteihin, ei toimitukselliseen kirjoitusputkeen tai suomenkieliseen käyttöliittymään."},{"status":"open","text":"Systemaattinen katsaus osoittaa automation bias -ilmiön: ihmiset luottavat automaation tuotoksiin ja jättävät omat tarkistukset tekemättä, mikä tukee tekstin väitettä \"ihminen jää kumileimasimeksi\" ja inhimillisen hylkäysvallan tarpeesta.","evidence":["https://academic.oup.com/jamia/article/19/1/121/722162"],"note":"Julkaistu 2012, siis ennen LLM-aikakautta; vaatii soveltamista kielimalliympäristöön. Sivua ei onnistuttu avaamaan, joten tarkistus suositellaan."},{"status":"open","text":"Viittaa Naturessa julkaistuun tutkimukseen, jossa LLM:eitä arvioitiin 47 kielellä ja 5 000 varmistetulla tosiasiaväitteellä; tuo myös esiin, että AI:n tuoma nopeus ei poista todentamiskuormaa vaan kasvattaa sitä.","evidence":["https://www.euractiv.com/news/embedding-ai-in-newsrooms-brings-speed-but-risks-credibility/"],"note":"Toisen käden raportointi Naturen tutkimuksesta, ei primäärilähde; ei käsittele agenttiputkia tai läpinäkyvyysarkkitehtuuria."},{"status":"open","text":"Väittää, että ihmisen valvonta on ainoa suoja AI:n virheitä, sokeita pisteitä ja sepitteitä vastaan ennen yleisöä – samansuuntainen tekstin teesin kanssa, jonka mukaan lopullinen hyväksyntä kuuluu ihmiselle.","evidence":["https://www.poynter.org/commentary/2025/ai-editors-hallucinations-human-help/"],"note":"Kommentaari/mielipidekynä eikä empiirinen tutkimus; ei kuvaa mekanismeja, joilla ihmisen portti tehtäisiin tosiasiallisesti toimivaksi. Sivua ei pystytty avaamaan (403), tarkistus suositellaan."}]
citationMode: "sources"
citationPlacements: []
visualizations: []
pinned: false
draft: false
---

> Rakensin Anomancer-nimisen kirjoitusjärjestelmän, jossa tekoäly joutuu kulkemaan usean tarkasti rajatun vaiheen läpi ennen kuin mitään voidaan edes ajatella julkaistavaksi. Järjestelmässä on yhdeksän agenttia. Niillä on nolla julkaisuvaltaa. Ihmisen portti – viimeinen hyväksyntävaihe – on päällä.

> Kyse ei ole vahingosta eikä keskeneräisyydestä. Tämä on koko järjestelmän idea.

## Kitka voi olla vastuuta

Teknologiassa kitkaa pidetään yleensä vihollisena. Käyttöliittymän pitää olla vaivaton, prosessin nopea, päätösten vähäisiä. Monessa asiassa se on järkevää.

Mutta kun tuotetaan julkista tekstiä, väitteitä ja tulkintoja, kaiken kitkan poistaminen on huono tavoite. Kun kielimalli kirjoittaa vakuuttavan näköisen artikkelin alle minuutissa, se ei poista tarkastamisen tarvetta. Kielimalli voi kirjoittaa väärän väitteen samalla itsevarmuudella kuin oikean. Se voi liittää hyvän lähteen huonoon päätelmään, muuttaa epävarman havainnon varmaksi väitteeksi tai tuottaa paikkansapitävää tekstiä, jota kukaan ei jaksa lukea. Tutkimuksissa on havaittu, että kielimallit ovat ylivarmoja: virheellisten vastausten osuus luottavaisissa vastauksissa oli keskimäärin 47 prosenttia. 

Kirjoittamisen nopeus on siis toissijaista. Tärkein kysymys on, millaisen rakenteen läpi teksti pakotetaan kulkemaan.

## Agentti on rajattu sopimus

Agenttijärjestelmistä puhutaan helposti kuin pienestä digitaalisesta toimistosta. Tutkija tutkii. Kirjoittaja kirjoittaa. Kriitikko kritisoi. Joku päättää, että työ on valmis.

Kuulostaa mukavalta, mutta siinä on ongelma: jos agentti saa itse tulkita tehtäväänsä, laajentaa sitä ja päättää, milloin työ on onnistunut, olemme rakentaneet uuden mustan laatikon vanhan mustan laatikon ympärille.

Siksi Anomancerissa agentin toiminta on sidottu sopimukseen. Sopimus määrittelee roolin, tehtävän, syötteet, ulostulot ja toimivallan rajat. Agentti tekee sen, mitä sille on annettu – ei sitä, mitä se seuraavaksi keksii tehdä. Vaiheiden järjestys on ennalta määrätty, eikä yksittäinen agentti voi hypätä kolmen vaiheen yli tai vaihtaa koko työn tavoitetta.

Järjestelmän laidalla on myös metavalvoja – metaforinen pesukarhu – jonka tehtävä on vahtia, että sopimuksia noudatetaan.

Tämä kuulostaa vähemmän futuristiselta kuin täysin autonominen agenttiparvi. Juuri siksi se on kiinnostavampaa.

## Lähde ei ole todiste

Järjestelmän yksinkertaisin sääntö: löydetty lähde on ehdokas, ei vahvistettu tieto. Hakutulos ei ole evidenssiä. URL ei ole evidenssiä. Tieteellisen näköinen PDF ei ole evidenssiä. Kolme lähdettä, jotka toistavat samaa alkuperäistä virhettä, eivät muutu kolmeksi riippumattomaksi vahvistukseksi.

Järjestelmän pitää siksi pystyä pitämään erillään havainto, lähde, tarkastettu lähde, väite, tulkinta ja johtopäätös. Ilman tätä kaikki muuttuu nopeasti yhdeksi suureksi semanttiseksi perunamuusiksi. Kielimallit ovat siinä vaarallisen hyviä: ne osaavat tehdä perunamuusista erittäin vakuuttavan näköistä.

## Putki ei tee totuutta, mutta se tekee ongelmat näkyviksi

Teksti ei synny yhden jättipromptin tuloksena, vaan se kulkee putken läpi. Vaiheet etsivät lähteitä, tarkastelevat rakennetta, muodostavat luonnoksen, etsivät ongelmia, testaavat suhdetta lukijaan, hiovat kieltä ja tarkistavat väitteitä.

Oleellista ei ole agenttien määrä. Seitsemän tai yhdeksän tekoälyä ei tee totuutta. Jos kaikki saavat saman virheellisen oletuksen ja vahvistavat sitä toisilleen, lopputulos on erittäin hyvin organisoitua hölynpölyä. Tavoitteena on erottaa erilaiset tarkastustehtävät toisistaan, jotta niiden toimintaa voidaan arvioida. Se ei takaa virheettömyyttä, mutta se tekee virheistä jäljitettäviä.

Matkan varrella unohtuu myös se, että teksti muuttuu. Alkuperäinen väite on tarkastettu, sitten tekstiä muokataan luettavammaksi ja yksi sana vaihtuu. Tukeeko lähde enää uutta väitettä? Ei välttämättä. Siksi periaate on: muokkaa ensin, tarkasta väitteet sitten uudelleen. Muuten järjestelmä voi tarkistaa yhden tekstin ja julkaista toisen.

## Ihmisen portti ei saa olla kumileimasin

Tekoälyjärjestelmissä puhutaan mielellään human-in-the-loopista, eli siitä, että ihminen on mukana prosessissa. Käytännössä ihminen jää helposti prosessin loppuun kumileimasimeksi: malli tekee työn, järjestelmä suosittelee hyväksyntää, ihminen painaa vihreää nappia.

Anomancerissa agentilla ei ole julkaisuvaltaa. Lopullinen hyväksyntä kuuluu ihmiselle, ja se tarkoittaa myös mahdollisuutta hylätä koko koneen tekemä työ – ei vain korjata pilkkua tai valita kolmesta tekoälyn tarjoamasta versiosta, vaan sanoa ei: *Tämä lähtöoletus oli väärä. Tämä lähde ei riitä. Tämä teksti ei kuulosta minulta. Tätä ei julkaista.*

Jos järjestelmä ei aidosti mahdollista tätä, ihminen ei ole päätöksentekijä vaan käyttöliittymäelementti.

## Jälki ilman, että kaikki pitää näyttää

Halusin järjestelmään myös jäljen siitä, mitä tapahtui. En siksi, että kaikki pitäisi tallentaa ikuisesti. Päinvastoin: tietoturvan kannalta olisi järjetöntä säilyttää ja julkaista automaattisesti kaikki raakasyöte, mallivastaukset ja keskeneräiset ajatukset.

Ajosta voidaan muodostaa metatietokuitti ja hajautusjälki – tiiviste, jonka avulla ajon kuvauksen voi varmistaa muuttumattomaksi – ilman, että prosessin koko sisältö paljastetaan. Ajatus on yksinkertainen: jotakin voidaan todentaa ilman, että kaikki täytyy näyttää.

Läpinäkyvyys ei tarkoita 40 000 tokenin raakapöhinän kaatamista käyttäjän silmille. Se tarkoittaa, että olennaiset päätökset, rajat, lähteet ja muutokset voidaan nähdä ja tarkastaa.

## Miksi en halua tunnistaa tekoälytekstiä jälkikäteen

Jotkut rakentavat järjestelmiä, jotka tunnistavat valmiista tekstistä, onko se tekoälyn kirjoittama. Pidän koko asetelmaa nurinkurisena.

Jos tekstin alkuperällä, lähteillä ja käsittelyllä on merkitystä, miksi arvata niitä lopputuloksesta? Lopputuloksesta voi tehdä arvauksia, mutta arvaus ei ole tarkastus. Kiinnostavampaa on rakentaa tuotantoprosessi niin, että olennaiset vaiheet voi tarkastaa silloin, kun ne tapahtuvat. Kaupalliset AI-tekstintunnistimet eivät sovellu korkean panoksen konteksteihin: niiden väärien positiivisten osuudet vaihtelevat 0,05 prosentista 68,6 prosenttiin ja väärien negatiivisten 0,3 prosentista 99,6 prosenttiin. Pienikin muokkaus romahduttaa luotettavuuden.

Tekoälyn käytön ei tarvitse olla salaisuus. Tärkeintä on, että tiedetään, mitä tekoäly teki, mihin se perustui ja kuka lopulta vastasi tuloksesta.

## Mitä järjestelmä tekee ajattelulle

En rakentanut Anomanceria siksi, että minun ei enää tarvitsisi ajatella tai kirjoittaa. Päinvastoin: haluan järjestelmän, joka tekee ajattelun ongelmakohdista näkyvämpiä.

Voin kirjoittaa tekstin itse ja lähettää sen putken läpi. Silloin järjestelmä etsii virheitä, liian vahvoja väitteitä, huonoja lähteitä, rakenteellisia ongelmia ja kohtia, joissa teksti muuttuu epämääräiseksi pöhinäksi. Tai voin antaa kielimallin tehdä ensimmäisen luonnoksen ja lähettää sen saman koneiston läpi. Silloin se etsii mallin tuottamasta tekstistä ongelmat. Molemmissa tapauksissa ihminen pysyy kirjoittajana ja julkaisijana – kone toimii välikerroksena.

Kieli on tässä yllättävän tärkeää; suomenkielinen käyttöliittymä täyttyy helposti sanoista kuten orkestrointi, provenienssi ja evidenssin tila. Ne ovat hyödyllisiä käsitteitä, mutta jos koko käyttöliittymä koostuu niistä, käyttäjä ei välttämättä enää ymmärrä omaa järjestelmäänsä. Silloin tapahtuu jotain ironista: rakennamme läpinäkyvyyttä, mutta kerromme siitä kielellä, jota kukaan ei jaksa lukea.

Siksi näytöllä voi lukea esimerkiksi: **Ihmisen portti: PÄÄLLÄ.** Se kertoo enemmän kuin kaksitoista riviä hallintadokumentaatiota.

## Ehkä tulevaisuus ei tarvitse autonomisempaa tekoälyä

Teknologian kiinnostavin tulevaisuus ei mielestäni ole sellainen, jossa kaikki tapahtuu taustalla. Kirjoita lause, paina nappia, valmista. Sellainen maailma voi olla tehokas, mutta se on myös tylsä ja nopeasti vaikeasti hallittava.

Kiinnostavia ovat järjestelmät, joiden sisään voi katsoa, joita voi purkaa, joiden toimintaa voi muuttaa ja joiden avulla voi oppia. Mitä enemmän olen nähnyt, miten helposti vakuuttavaa hölynpölyä voi tuottaa, sitä kiinnostuneempi olen rakenteista, rajoista, tietoturvasta, lähteistä ja siitä, kuka saa päättää.

Kun koneelle rakentaa tarpeeksi tiukat seinät, niiden sisällä voi tehdä paljon oudompia asioita turvallisesti.

Ehkä tulevaisuus ei tarvitse autonomisempaa tekoälyä, vaan vähemmän autonomiaa, parempia rajoja, selkeämpiä sopimuksia ja näkyvämpiä prosesseja. Mahdollisuuden kysyä jokaisessa kohdassa:

- Mistä tämä väite tuli?
- Kuka muutti sitä ja miksi?
- Mitä lähde oikeasti tukee?
- Mitä kone päätti ja mitä ihminen päätti?

Ja ennen kaikkea: kuka saa julkaista?

Anomancerin vastaus on tällä hetkellä hyvin yksinkertainen. Ei yksikään agentti. Ihminen päättää lopullisesti.

Ja jossakin putken sivussa istuu se sama metaforinen pesukarhuvalvoja. Tarvittaessa se huutaa: PERKELE.
