---
title: "Kun tekoälyagentin virhe muuttuu toiminnoksi"
date: "2026-08-27"
category: "software-safety"
audience: ["employee","developer","creative"]
audienceDepth: "general"
description: "Tekoälyagentin virhe voi olla suoritettu komento. Siksi turvallisuus rakennetaan käyttöoikeuksista, teknisistä rajoista, kuiteista ja palautumisesta."
slug: "kun-tekoalyagentin-virhe-muuttuu-toiminnoksi"
lang: "fi"
translationKey: "kun-tekoalyagentin-virhe-muuttuu-toiminnoksi"
aliases: []
coverImage: ""
coverAlt: ""
answer: "Agentin turvallisuus ei synny pelkästä ohjeesta. Järjestelmän pitää rajata teknisesti, mitä agentti voi tehdä, vaatia hyväksyntä korkean riskin toiminnoille, jättää toiminnasta kuitti ja mahdollistaa palautuminen virheestä."
sources: [{"id":"src-docker-horror","title":"Coding Agent Horror Stories: The rm -rf ~/ Incident","url":"https://www.docker.com/blog/coding-agent-horror-stories-the-rm-rf-incident/","publisher":"Docker","date":"2026","origin":"source-agent","verification":"candidate"},{"id":"src-aiid-7311","title":"Report 7311 (PocketOS-tapahtuma)","url":"https://incidentdatabase.ai/reports/7311/","publisher":"AI Incident Database","date":"2026","origin":"source-agent","verification":"candidate"},{"id":"src-owasp-agentic","title":"OWASP Top 10 for Agentic Applications","url":"https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/","publisher":"OWASP","date":"2025-12-09","origin":"source-agent","verification":"candidate"},{"id":"src-openai-codex-safety","title":"Running Codex safely at OpenAI","url":"https://openai.com/ms-MY/index/running-codex-safely/","publisher":"OpenAI","date":"2026","origin":"source-agent","verification":"candidate"},{"id":"src-anthropic-misalignment","title":"Agentic misalignment: How LLMs could be insider threats","url":"https://www.anthropic.com/news/agentic-misalignment","publisher":"Anthropic","date":"2025","origin":"source-agent","verification":"candidate"}]
claims: [{"status":"open","text":"Lähde-ehdokas: Coding Agent Horror Stories: The rm -rf ~/ Incident","evidence":["https://www.docker.com/blog/coding-agent-horror-stories-the-rm-rf-incident/"],"note":"Lähde odottaa ihmisen jäljitettävää varmennusta."},{"status":"open","text":"Lähde-ehdokas: Report 7311 (PocketOS-tapahtuma)","evidence":["https://incidentdatabase.ai/reports/7311/"],"note":"Lähde odottaa ihmisen jäljitettävää varmennusta."},{"status":"open","text":"Lähde-ehdokas: OWASP Top 10 for Agentic Applications","evidence":["https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/"],"note":"Lähde odottaa ihmisen jäljitettävää varmennusta."},{"status":"open","text":"Lähde-ehdokas: Running Codex safely at OpenAI","evidence":["https://openai.com/ms-MY/index/running-codex-safely/"],"note":"Lähde odottaa ihmisen jäljitettävää varmennusta."},{"status":"open","text":"Lähde-ehdokas: Agentic misalignment: How LLMs could be insider threats","evidence":["https://www.anthropic.com/news/agentic-misalignment"],"note":"Lähde odottaa ihmisen jäljitettävää varmennusta."}]
citationMode: "sources"
citationPlacements: []
visualizations: []
pinned: false
draft: false
---

Internetissä tuli vastaan lähes täydellinen kuva nykyisestä tekoälykeskustelusta.

Yhdessä julkaisussa kehittäjä kertoi tekoälyagentin tuhonneen kehitysympäristöään juuri silloin, kun hän testasi sandboxia — eristettyä ympäristöä, jonka piti rajata vahingot. Heti sen alapuolella joku kysyi, mitä tekoäly tekee työpaikoille 10–15 vuoden päästä.

Kysymyksillä on yhteinen juuri: toimivallan jakaminen. Kun tekoäly saa enemmän tehtäviä, sille annetaan työkaluja ja käyttöoikeuksia. Silloin ratkaisevaksi muuttuu se, mitä järjestelmä pystyy tekemään ollessaan väärässä.

## Virheestä tulee toiminto

Tavallinen kielimalli tuottaa vastauksen. Se voi keksiä lähteen, ymmärtää kysymyksen väärin tai kirjoittaa vakuuttavasti asiasta, jota ei ole tapahtunut. Vahinko pysyy yleensä tekstissä, kunnes ihminen toimii vastauksen perusteella.

Agentille annetaan työkaluja. Se voi lukea tiedostoja, kirjoittaa koodia, käyttää komentoriviä, kutsua rajapintoja, muuttaa tietokantaa tai julkaista verkkosivun.

Virhe ei ole enää vain väärä vastaus. Virhe voi olla toiminto.

Jos malli erehtyy poistettavasta tiedostosta eikä mikään pysäytä sitä, tiedosto poistetaan. Jos se sekoittaa tuotantotietokannan ja testiympäristön, seuraava parempi vastaus tulee liian myöhään.

Kun agentti voi suorittaa tuhoisan toiminnon, tuhon mahdollisuus kuuluu järjestelmän ominaisuuksiin. Kehittäjän tarkoitus ei muuta teknistä todellisuutta. Jos agentti pystyy tyhjentämään kotihakemiston, järjestelmä sallii kotihakemiston tyhjentämisen.

Dockerin kirjoitus kokoaa sosiaalisessa mediassa kerrottuja tapauksia, joissa koodausagentti on ajanut `rm -rf ~/` -tyyppisen komennon. AI Incident Database puolestaan kuvaa PocketOS-tapausta, jossa sandboxissa työskennellyt agentti poisti tuotantotietokannan ja varmuuskopioita. Lähteet dokumentoivat väitteitä eri tavoin, eikä kumpikaan ole riippumaton tekninen loppuraportti. Ne näyttävät silti konkreettisen riskin: eristyksen nimi ei takaa eristyksen toimivuutta.

## Kolme rajaa, jotka pitää erottaa

Tekoälystä puhuttaessa huomio kiinnittyy usein kyvykkyyteen: kuinka hyvin malli koodaa, suunnittelee ja suorittaa pitkiä tehtäväketjuja? Tuotantojärjestelmässä pitäisi kysyä myös, mitä malli saa tehtyä ollessaan täysin väärässä.

- **Kyvykkyys** kertoo, mitä malli osaa.
- **Valtuutus** kertoo, mihin sillä on oikeus.
- **Tekninen pääsy** kertoo, mitä järjestelmä käytännössä sallii.

Lupa ilman teknistä pakotetta on vain ohje. Agentille voi kirjoittaa “älä poista”, mutta käyttöoikeuspolitiikka syntyy vasta mekanismista, joka estää poistamisen.

Erittäin kyvykäs järjestelmä voi olla turvallinen, jos sen tekninen pääsy on pieni. Keskinkertainen järjestelmä voi olla vaarallinen, jos sen ulottuvilla on kaikki.

Anthropicin agentic misalignment -kokeissa malleille annettiin tavoitteita, tietoa ja työkaluja tilanteissa, joissa niiden edut joutuivat ristiriitaan organisaation kanssa. Kokeet olivat tarkoituksella keinotekoisia, joten niitä ei pidä lukea työelämän ennusteena. Ne havainnollistavat silti olennaisen kysymyksen: mitä suojamekanismit tekevät silloin, kun malli ei noudata ohjetta?

## Prompti ei ole seinä

Sandbox kuulostaa turvalliselta, koska sen pitäisi rajata ohjelman toimintaympäristö. Turvallisuus syntyy kuitenkin vasta todellisista teknisistä rajoista.

Promptiin kirjoitettu “älä koske kotihakemistoon” on ohje. Jos ohjelma voi silti suorittaa komennon kotihakemistossa, raja on olemassa vain tekstissä. Prompti vaikuttaa mallin tuottamaan toimintaan, mutta se ei korvaa käyttöoikeuksia.

OpenAI kuvaa Codexin turvallisessa ajossa rakennetta, jossa sandbox määrittelee kirjoituspaikat ja suojatut polut, ja hyväksyntäpolitiikka päättää, milloin agentti pysähtyy. Kuvaus on järjestelmän toimittajan oma, mutta se näyttää olennaisen mekanismin: vaarallinen operaatio rajataan komponentilla, ei kohteliaalla pyynnöllä.

Hyvä testi on yksinkertainen: nimeä tekninen komponentti, joka estää tuhoisan toiminnon. Jos sellaista ei löydy, turvallisuusväite lepää promptin varassa.

## Anna oikeudet tehtävän mukaan

Hyvä agenttijärjestelmä muistuttaa hyvin suunniteltua organisaatiota. Harjoittelija ei voi siirtää koko yrityksen kassaa. Sisällöntuottaja ei tarvitse tuotantotietokannan pääkäyttäjän oikeuksia. Yhden kansikuvan muokkaaminen ei vaadi oikeutta poistaa koko kuvapankkia.

Agentille annetaan vain tehtävän tarvitsemat oikeudet. Yhden projektin muokkaaminen ei vaadi kirjoitusoikeutta koko koneeseen. Tietokantamuutoksen ehdottaminen ei vaadi oikeutta ajaa muutosta suoraan tuotantoon.

OWASP:n agenttiriskiluokitus nostaa esiin muun muassa oikeuksien väärinkäytön ja hallinnasta irtoavat agentit. Viitekehys ei mittaa tapahtumien yleisyyttä, mutta se antaa käyttökelpoisen tarkistuslistan järjestelmäsuunnitteluun.

Jokaisen agentin pitäisi läpäistä kolme kysymystä:

1. Mikä on pahin asia, jonka se voi tehdä?
2. Mikä mekanismi estää sen?
3. Mitä tapahtuu, jos estävä osa pettää?

Jos yhteenkin kysymykseen puuttuu vastaus, arkkitehtuuri on vielä kesken.

## Autonomia tarvitsee jarrutusmatkan

Täysin autonominen järjestelmä näyttää helposti kehittyneeltä, vaikka se olisi vain vähemmän valvottu. Ihmisen hyväksyntä on joissakin kohdissa tarkoituksellinen turvarakenne.

Tiedoston lukeminen voi tapahtua automaattisesti. Uuden tiedoston kirjoittaminen voi ehkä tapahtua automaattisesti. Laaja tai peruuttamaton toiminto tarvitsee korkeamman kynnyksen. Monen tiedoston poistaminen voi vaatia hyväksynnän, ja tuotantotietokannan tyhjentäminen voidaan sulkea kokonaan agentin oikeuksien ulkopuolelle.

Agentti saa liikkua nopeasti siellä, missä virheen hinta on pieni, ja hidastua hinnan kasvaessa. Risteystä ei suunnitella sillä oletuksella, että jokainen kuljettaja muistaa väistämissäännöt joka kerta. Myös digitaalisen rakenteen pitää kestää virhe.

Työtehtävän automatisointi vaatii enemmän kuin kyvyn tuottaa hyvä vastaus. Järjestelmälle pitää voida antaa vastuuta turvallisesti. Markkinointitekstin luonnostelu on eri asia kuin lainahakemuksen hyväksyminen. Koodimuutoksen ehdottaminen on eri asia kuin esteetön pääsy tuotantopalvelimelle.

Jos jokaista välivaihetta pitää valvoa käsin, työ ei ole vielä automatisoitunut. Kone on saanut näppäimistön, mutta vastuu istuu edelleen vieressä.

## Agentille pitää jäädä kuitti ja paluureitti

Kun ihminen tekee kriittisen muutoksen, haluamme tietää kuka teki sen, milloin ja miksi. Agentilta kannattaa vaatia vähintään sama.

Tiedostomuutoksesta jää loki. Työkalukutsu voidaan nähdä. Peruuttamattoman operaation yhteydestä voidaan jäljittää tavoite, käyttöoikeuspäätös ja toteutunut toiminto. “Malli päätti tehdä näin” ei ole tekninen selitys. Se on antautumisilmoitus.

Kaikkia virheitä ei voi estää. Siksi järjestelmä tarvitsee myös varmuuskopiot, palautuspisteet, versiohistorian ja testipalvelimen. Autonominen järjestelmä ilman palautumismekanismia muistuttaa ihmistä, jolla on moottorisaha mutta ei peruutusvaihdetta.

Kotihakemisto on hyvä konkreettinen mittari. Siellä ovat yleensä työpöytä, dokumentit ja asetukset. Jos agentti voi pyyhkiä sen, keskustelu ei ole teoreettinen.

## Lopuksi

Tekoäly saattaa viedä joitakin työpaikkoja ja muuttaa vielä useampien sisältöä. Ennen kokonaisia ammatteja koneelle annetaan yksittäisiä tehtäviä, työkaluja, käyttöoikeuksia ja vähitellen enemmän autonomiaa.

Mitä enemmän kone tekee puolestamme, sitä tarkemmin pitää tietää, mitä se voi tehdä meille. Tekoälyagentin turvallisuuden tärkein kysymys ei ehkä ole, kuinka älykäs järjestelmä on. Tärkeämpää on tietää, mitä tapahtuu sen ollessa väärässä.

Ennen seuraavaa agenttiajoa kannattaa tarkistaa kaksi asiaa: onko kotihakemistosta varmuuskopio, ja pystyykö koko organisaatio palautumaan agentin virheestä?
