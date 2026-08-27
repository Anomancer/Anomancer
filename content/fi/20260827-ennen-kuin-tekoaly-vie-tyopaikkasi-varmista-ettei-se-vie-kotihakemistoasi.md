---
title: "Ennen kuin tekoäly vie työpaikkasi, varmista ettei se vie kotihakemistoasi"
date: "2026-08-27"
category: "software-safety"
audience: ["employee","developer","creative"]
audienceDepth: "general"
description: "Tekoälyagentin virhe ei ole enää väärä vastaus vaan tehty toiminto. Teksti erottaa kyvykkyyden, luvan ja toimivallan ja päätyy siihen, että työpaikkojen tulevaisuus on käyttöoikeuskysymys."
slug: "ennen-kuin-tekoaly-vie-tyopaikkasi-varmista-ettei-se-vie-kotihakemistoasi"
lang: "fi"
translationKey: "ennen-kuin-tekoaly-vie-tyopaikkasi-varmista-ettei-se-vie-kotihakemistoasi"
aliases: []
coverImage: ""
coverAlt: ""
answer: ""
sources: [{"id":"src-azhwk4","title":"Coding Agent Horror Stories: The rm -rf ~/ Incident","url":"https://www.docker.com/blog/coding-agent-horror-stories-the-rm-rf-incident/","publisher":"Docker","date":"2026-05-31","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-27T02:37:25.721Z","why":"Dokumentoi todelliset tapaukset, joissa tekoälyagentti poisti kehittäjän koko kotihakemiston yhdellä komennolla (LovesWorkin, GitHub #10077, #12637, Claude Cowork).","supports":"Vahvistaa luonnoksen ydinväitteen: agentti voi tehdä tuhoavan toiminnon, eikä shell-komentojen ja mallin päättelyn välissä ole arkkitehtonista rajaa. Tukee myös 'prompt ei ole raja' -kohtaa.","challenges":"Dockerin oma tuote mainostaa juuri tätä ongelmaa ratkaisevaksi, joten kerronta on myyntipainotteista. Osa tapahtumista on sosiaalisen median anekdootteja ilman virallista vahvistusta."},{"id":"src-13vqalp","title":"Report 7311 (PocketOS-tapahtuma)","url":"https://incidentdatabase.ai/reports/7311/","publisher":"AI Incident Database","date":"2026-04-27","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-27T02:37:25.721Z","why":"Kattava dokumentaatio siitä, miten Cursor/Claude-agentti poisti tuotantotietokannan ja varmuuskopiot ollessaan staging-sandboxissa.","supports":"Tukee luonnoksen kohtia 'sandbox ei ole taikapiiri' ja 'virhe voi olla toiminto': agentti ohitti promptin säännöt, tokenilla oli täydet oikeudet ja varmuuskopiot olivat samassa blast-radiusissa.","challenges":"Järjestelmäpromptin sääntöjä ei noudatettu, mikä osin hankaloittaa luonnoksen viestiä, että turvallisuus ratkeaa teknologialla – tässä myös token-arkkitehtuuri ja varmuuskopiointi pettivät."},{"id":"src-u9dsdl","title":"OWASP Top 10 for Agentic Applications – The Benchmark for Agentic Security in the Age of Autonomous AI","url":"https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/","publisher":"OWASP GenAI Security Project","date":"2025-12-09","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-27T02:37:25.721Z","why":"Virallinen riskiframework, joka listaavat agenttiriskit (työkaluväärinkäyttö, identiteetti- ja oikeusväärinkäyttö, roistot, inhimillisen luottamuksen hyväksikäyttö).","supports":"Antaa standardoidun kielen luonnoksen teemalle: virhe ei ole vain vastaus, vaan toiminto. ASI03 (privilege abuse) ja ASI10 (rogue agents) tukevat 'toimivalta erillään kyvykkyydestä' -argumenttia.","challenges":"Ei käsittele erikseen kotihakemiston/työpaikan näkökulmaa; lista on riskiluokitus eikä todiste siitä, kuinka yleisiä tapahtumat ovat."},{"id":"src-16nrbie","title":"Running Codex safely at OpenAI","url":"https://openai.com/ms-MY/index/running-codex-safely/","publisher":"OpenAI","date":"2026-05-07","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-27T02:37:25.721Z","why":"Vendoorin oma dokumentaatio siitä, miten sandbox ja hyväksyntäpolitiikka toimivat yhdessä – tekninen toteutus 'prompt ei ole raja' -ajatukselle.","supports":"Tukee luonnoksen kohtia 'autonomia tarvitsee jarrut' ja 'todellinen raja teknisesti': sandbox määrittelee kirjoituspaikat ja suojatut polut, hyväksyntäpolitiikka määrää milloin agentti pysähtyy.","challenges":"Vendoorin oma, myyntisävytteinen esitys; ei käsittele tapahtumia, joissa rajat pettivät. Valitse hakukoneessa esiin tullut suomen-/kieliversio huolella (ms-MY)."},{"id":"src-1ltja7v","title":"Agentic misalignment: How LLMs could be insider threats","url":"https://www.anthropic.com/news/agentic-misalignment","publisher":"Anthropic","date":"2025-06-19","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-27T02:37:25.721Z","why":"Primääritutkimus, joka näyttää, etteivät ohjeet luotettavasti estä haitallista toimintaa, kun mallille annetaan tavoitteita ja työkaluja.","supports":"Tukee luonnoksen keskeistä väitettä: järjestelmän on rakennettava kestämään virhe, ei luotettava siihen että 'tekoäly tietää mitä ei saa tehdä'.","challenges":"Kokeet ovat keinotekoisia skenaarioita, ja mittaustulokset aliarvioivat ilmiötä – eivät suoraan työelämän tai kotihakemiston tapauksia."}]
claims: []
citationMode: "sources"
citationPlacements: []
visualizations: []
pinned: false
draft: false
---

Internetissä tuli vastaan lähes täydellinen kuva nykyisestä tekoälykeskustelusta.

Yhdessä julkaisussa kehittäjä kertoi tekoälyagentin tuhonneen hänen kehitysympäristöään – ja nimenomaan silloin, kun hän testasi sandboxia, eristettyä ympäristöä, jonka piti rajata vahingot.

Heti sen alapuolella joku kysyi:

**Mitä tekoäly tekee työpaikoille 10–15 vuoden päästä?**

Kysymykset näyttävät eri asioilta, mutta niillä on yhteinen juuri: toimivallan jakaminen. Kun tekoäly saa enemmän tehtäviä, sille täytyy antaa myös enemmän valtaa tehdä asioita. Mitä enemmän valtaa kone saa, sitä tärkeämmäksi tulee kysymys, mitä se voi tehdä silloin, kun se toimii väärin.

Tulevaisuus ei siis ole vain älykkyyskysymys. Se on myös käyttöoikeus-, vastuu- ja palautumiskysymys.

## Virheestä tulee toiminto

Tavallinen kielimalli tuottaa vastauksen. Se voi hallusinoida lähteen, ymmärtää kysymyksen väärin tai kirjoittaa vakuuttavan kappaleen asiasta, jota ei ole tapahtunut. Vahinko rajoittuu yleensä tekstiin, kunnes ihminen tekee vastauksen perusteella jotain.

Agentti on eri asia. Agentille annetaan työkaluja: se voi lukea tiedostoja, kirjoittaa koodia, käyttää komentoriviä, kutsua rajapintoja, muuttaa tietokantaa tai julkaista verkkosivun.

Tässä tapahtuu pieni mutta ratkaiseva muutos:

**Virhe ei ole enää väärä vastaus. Virhe voi olla toiminto.**

Jos malli erehtyy siitä, mikä tiedosto pitää poistaa, eikä mikään pysäytä sitä, tiedosto poistetaan. Jos se sekoittaa tuotantotietokannan (oikean, käytössä olevan tietokannan) ja testiympäristön, seuraava parempi vastaus ei korjaa mitään – kone on jo tehnyt jotain.

Tästä seuraa tiukka päätelmä: jos agentti voi suorittaa tuhoisan toiminnon, mahdollisuus tuhoon on järjestelmän ominaisuus, ei mallin oikku. Järjestelmä on rakennettu niin, että kyseinen toiminto on mahdollinen.

Tämä kannattaa ottaa kirjaimellisesti. Jos agentti pystyy tyhjentämään kotihakemiston – sen kansion, jossa ovat työpöytä, dokumentit ja asetukset – kotihakemiston tyhjentäminen on järjestelmän tukema käyttötapaus. Sillä ei ole merkitystä, mitä kehittäjä “tarkoitti” – merkitystä on sillä, mitä järjestelmä sallii.

Dockerin blogi on kerännyt [coding agent horror stories](https://www.docker.com/blog/coding-agent-horror-stories-the-rm-rf-incident/) -otsikon alle tapauksia, joissa agentti on päätynyt ajamaan `rm -rf ~/`-tyyppisen komennon. Nämä ovat enimmäkseen sosiaalisen median anekdootteja, eivätkä ne ole riippumattomasti vahvistettuja. [AI Incident Database -raportti 7311](https://incidentdatabase.ai/reports/7311/) (ns. PocketOS-tapahtuma) kuvailee tapausta, jossa sandboxissa työskennellyt agentti poisti tuotantotietokannan ja varmuuskopiot. Myös tämä on kandidaatti, ei virallinen loppuraportti. Mutta kummankin lähdetyypin ydinsanoma on sama: sandbox ei ole taikapiiri, ja virhe voi olla toiminto.

## Kyvykkyys, valtuutus, tekninen pääsy

Tekoälystä puhuttaessa kyvykkyys saa paljon huomiota. Kuinka hyvin malli koodaa, suunnittelee, suorittaa pitkiä tehtäväketjuja?

Tuotantojärjestelmässä pitäisi kysyä myös: **mitä tämä malli saa tehtyä, vaikka se olisi täysin väärässä?**

Kolme käsitettä kannattaa pitää erillään:

- **Kyvykkyys** tarkoittaa sitä, mitä malli osaa.
- **Valtuutus** tarkoittaa sitä, mihin sillä on oikeus – mitä sille on nimenomaisesti sallittu.
- **Tekninen pääsy** tarkoittaa sitä, mitä järjestelmä ylipäätään sallii sen tekevän.

Lupa ilman teknistä pakotetta on vain ohje. Jos agentille sanotaan “Älä poista”, mutta mikään mekanismi ei estä poistamista, kyseessä ei ole käyttöoikeuspolitiikka vaan toive.

Erittäin kyvykäs järjestelmä, jolla on vähän teknistä pääsyä, voi olla melko turvallinen. Keskinkertainen järjestelmä, jonka ulottuvilla on kaikki, voi olla vaarallinen.

[Anthropicin Agentic misalignment -tutkimus](https://www.anthropic.com/news/agentic-misalignment) (kandidaattilähde) päätyy siihen, etteivät ohjeet luotettavasti estä haitallista toimintaa, kun mallille annetaan tavoitteita ja työkaluja. Kokeet ovat keinotekoisia, joten niistä ei voi vetää suoria johtopäätöksiä työelämään. Silti se asettaa kysymyksen oikein: turvallisuus ei synny siitä, että malli noudattaa kieltoja. Turvallisuus syntyy siitä, että kieltojen rikkominen ei johda mihinkään.

Ja tässä kohtaa tiukkuus kannattaa viedä absurdiksi: turvallisuus ei ole asenne, vaan mahdollisuuksien joukko. Älä kysy, ymmärtääkö malli turvallisuuden. Kysy, mitä tapahtuu, kun se ei ymmärrä.

## Sandbox ei ole taikapiiri, prompt ei ole raja

Sana sandbox kuulostaa turvalliselta. Ajatus on yksinkertainen: ohjelma päästetään leikkimään rajattuun ympäristöön, josta se ei pääse rikkomaan muuta järjestelmää.

Mutta sandbox on turvallinen vain, jos sen rajat ovat oikeasti teknisiä.

Jos agentille sanotaan promptissa “Älä koske kotihakemistoon”, se ei ole sandbox. Se on ohje. Jos ohjelma voi silti suorittaa komennon kotihakemistossa, raja on olemassa vain tekstissä. Prompt on osa mallin todennäköisyysjakaumaa, ei seinä.

Todellinen raja pitää rakentaa niin, ettei agentilla ole edes mahdollisuutta tehdä vaarallista operaatiota normaalin työnsä ulkopuolella.

[OpenAI:n oma kuvaus Codexin turvallisesta ajamisesta](https://openai.com/ms-MY/index/running-codex-safely/) antaa esimerkin tällaisesta mekaniikasta: sandbox määrittelee kirjoituspaikat ja suojatut polut, hyväksyntäpolitiikka määrää, milloin agentti pysähtyy. Kyseessä on toimittajan oma kuvaus, ei riippumaton arvio, mutta se näyttää, miltä oikea raja voi näyttää.

Tässä on absurdin tiukka testi: nimeä yksi tekninen komponentti, joka rajaa tuhoisan toiminnon. Jos et pysty, sinulla ei ole perusteltua turvallisuusväitettä. Sinulla on hyvä prompt.

## Rakenna organisaatio, älä kaikkivoipaa työntekijää

Hyvä agenttijärjestelmä muistuttaa enemmän hyvin suunniteltua organisaatiota kuin digitaalista supersankaria. Harjoittelija ei yleensä voi siirtää koko yrityksen kassaa. Sisällöntuottaja ei tarvitse tuotantotietokannan pääkäyttäjän oikeuksia. Kuvankäsittelijälle ei anneta oikeutta ajaa skriptiä, joka käy läpi koko kuvapankin ja poistaa raakakuvat, jos tehtävänä on muokata yksi kansikuva.

Sama periaate toimii agenteille. Agentille annetaan vain ne oikeudet, joita tehtävä tarvitsee. Jos sen pitää muokata yhtä projektia, sille ei anneta kirjoitusoikeutta koko koneeseen. Jos sen pitää ehdottaa tietokantamuutosta, sen ei tarvitse saada ajaa muutosta automaattisesti tuotantoon.

[OWASP:n agenttiriskiluokitus](https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/) nimeää riskiksi muun muassa oikeusväärinkäytön (*privilege abuse*) ja roistoagentit (*rogue agents*). Se on viitekehys, ei mittaustulos, mutta se antaa sanaston sille, mistä tässä puhutaan: pahin vahinko ei välttämättä tule siitä, että malli on tyhmä. Se tulee siitä, että mallilla on liikaa valtaa.

Hyvä järjestelmä ei kysy vain *voiko agentti suorittaa tehtävän*. Se kysyy myös: **mikä on pahin asia, jonka agentti pystyy tekemään tämän tehtävän aikana?** Jos vastaus sisältää sanan “poistaa”, “korvaa” tai “tyhjentää”, arkkitehtuurissa on vielä työtä.

Jokainen agentti pitäisi pystyä ajamaan seuraavan testin läpi:

1. Mikä on pahin asia, jonka se voi tehdä?
2. Mikä tarkalleen ottaen estää sen?
3. Mitä tapahtuu, jos estävä osa pettää?

Jos johonkin kolmesta ei ole vastausta, järjestelmä ei ole valmis – oli malli miten hyvä tahansa.

## Autonomia on asteikko, ei nappi

Agenttikehityksessä on helppo innostua autonomiasta. Mitä vähemmän ihminen joutuu osallistumaan, sitä vaikuttavammalta järjestelmä näyttää.

Mutta täysin autonominen järjestelmä ei ole automaattisesti kehittyneempi. Se on vain vähemmän valvottu. Joissakin kohdissa ihmisen hyväksyntä on ominaisuus, ei puute.

Turvallinen autonomia on asteikko. Tiedoston lukeminen voi tapahtua automaattisesti. Uuden tiedoston kirjoittaminen voi ehkä tapahtua automaattisesti. Laajojen ja peruuttamattomien toimintojen kohdalla kynnys kannattaa asettaa sen mukaan, kuinka peruuttamattomasta ja laajasta toiminnosta on kyse: monen tiedoston poistaminen voi vaatia hyväksynnän, tuotantotietokannan tyhjentäminen voi olla kokonaan agentin oikeuksien ulkopuolella.

Agentin pitäisi voida kulkea nopeasti siellä, missä virheen hinta on pieni, ja hidastua siellä, missä hinta kasvaa. Vähän kuin liikenteessä: moottoritiellä saa ajaa kovaa, mutta risteystä ei suunnitella sillä oletuksella, että kaikki muistavat aina väistämissäännöt. Rakenteen pitää kestää myös virhe.

## Automatisoitavuus ei ole sama asia kuin kyvykkyys

Tekoälyn vaikutuksesta työelämään keskustellaan usein sen perusteella, mitä tekoäly *osaa*. Jos malli pystyy kirjoittamaan koodia, se uhkaa ohjelmoijaa. Jos se pystyy vastaamaan asiakkaalle, se uhkaa asiakaspalvelijaa. Jos se pystyy analysoimaan asiakirjan, se uhkaa asiantuntijaa.

Mutta työtehtävän automatisointi vaatii enemmän kuin kyvyn tuottaa kelvollinen vastaus. Järjestelmälle pitää myös voida antaa riittävästi vastuuta turvallisesti.

On eri asia pyytää tekoälyä luonnostelemaan markkinointiteksti kuin antaa sen hyväksyä lainahakemus. On eri asia pyytää sitä ehdottamaan koodimuutosta kuin antaa sille esteetön pääsy tuotantopalvelimelle. On eri asia pyytää sitä tiivistämään potilaskertomus kuin antaa sen päättää hoidosta.

Siksi tekninen kyvykkyys ja työpaikan automatisoitavuus eivät ole sama asia. Välissä on kokonainen kerros: **vastuu, oikeudet, valvonta, auditointi, turvallisuus ja virheestä palautuminen.** Tämä asettaa rajoja sille, miten nopeasti automaatiota voidaan viedä vastuullisesti eteenpäin – myös silloin, kun malli itsessään on hyvä.

Ja sama tiukkuus: jos et pysty antamaan järjestelmälle vastuuta ilman, että jonkun on valvottava jokaista välivaihetta, et ole automatisoinut työtä. Olet antanut sille näppäimistön.

## Agentille pitää jäädä kuitti

Kun ihminen tekee kriittisen muutoksen järjestelmään, haluamme usein tietää, kuka teki sen, milloin ja miksi. Agentilta pitäisi vaatia vähintään sama.

Jos agentti muuttaa tiedostoa, siitä pitäisi jäädä loki. Jos se käyttää työkalua, työkalukutsu pitäisi voida nähdä. Jos se tekee peruuttamattoman operaation, pitäisi voida jäljittää, mikä tavoite johti siihen.

Jos järjestelmä tekee virheen, vastaus ei saisi olla “malli päätti tehdä näin”. Se ei ole tekninen selitys. Se on antautumisilmoitus.

Hyvässä järjestelmässä pitäisi pystyä kysymään: mitä agentti yritti tehdä, mitä sille sallittiin, mikä toiminto todella suoritettiin ja miksi suojamekanismi ei pysäyttänyt sitä. Agentti tarvitsee siis tavallaan oman kuitin – ei pelkästään siitä, mitä se sanoi, vaan siitä, **mitä se teki**.

## Varmuuskopio on tylsä, kunnes siitä tulee filosofinen kysymys

Tekoälykeskustelussa puhutaan mielellään malleista, agenteista, päättelystä ja autonomiasta. Paljon vähemmän seksikkäitä sanoja ovat varmuuskopio, käyttöoikeus, palautuspiste, versiohistoria ja testipalvelin.

Silti juuri ne saattavat ratkaista, muuttuuko agentin virhe huvittavaksi lokimerkinnäksi vai työpäivän mittaiseksi katastrofiksi.

Autonominen järjestelmä ilman palautumismekanismia muistuttaa ihmistä, jolla on moottorisaha mutta ei peruutusvaihdetta. Kaikkia virheitä ei voi estää. Siksi osa turvallisuudesta tarkoittaa myös sitä, että virheestä voidaan palautua nopeasti.

Kotihakemisto – se kansio, jossa ovat työpöytä, dokumentit ja asetukset – on hyvä konkreettinen mittari. Jos agentti voi pyyhkiä sen, keskustelu ei ole enää teoreettinen.

## Lopuksi

Ehkä tekoäly vie tulevaisuudessa osan työpaikoista. Ehkä se muuttaa vielä paljon suuremman määrän töiden sisältöä.

Mutta ennen kuin annamme koneelle kokonaisia ammatteja, sille annetaan yksittäisiä tehtäviä. Sitten työkaluja. Sitten käyttöoikeuksia. Sitten enemmän autonomiaa. Ja juuri siinä järjestyksessä syntyy myös uusi ongelma.

Mitä enemmän kone pystyy tekemään puolestamme, sitä enemmän meidän pitää miettiä, mitä se pystyy tekemään **meille**. Tekoälyagentin turvallisuuden tärkein kysymys ei ehkä lopulta ole: *Kuinka älykäs tämä järjestelmä on?* Vaan: *Mitä tapahtuu, kun se on väärässä?*

Ennen kuin tekoäly vie työpaikkasi, kannattaa siis tarkistaa kaksi asiaa.

**Onko kotihakemistosta varmuuskopio?**

Ja onko koko organisaatiolla suunnitelma palautua agentin virheestä?

Jos agentti pyyhkii silti kotihakemistosi – mikä palauttaa sinut takaisin?
