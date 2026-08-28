---
title: "Tätä konetta ei rakennettu ylhäältä"
date: "2026-08-28"
category: "society-systems"
audience: ["all"]
audienceDepth: "general"
description: "Anomancer alkoi yksittäisen käyttäjän kysymyksestä: mistä tekoäly tietää sen, mitä se väittää? Essee siitä, miten epäilys kasvaa infrastruktuuriksi."
slug: "tata-konetta-ei-rakennettu-ylhaalta"
lang: "fi"
translationKey: "tata-konetta-ei-rakennettu-ylhaalta"
aliases: []
coverImage: ""
coverAlt: ""
answer: ""
sources: [{"id":"src-mnk7xt","title":"Position: The Right to AI","url":"https://icml.cc/virtual/2025/poster/40155","publisher":"ICML 2025 (Mushkani, Berard, Cohen, Koseki)","date":"2025-05-07","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-28T19:28:29.866Z","why":"Esittää tekoälyn yhteiskunnallisena infrastruktuurina ja kansalaisten osallistumisen mallina – lähin akateeminen vertailukohta esseen käsitteelle ”kansalaislähtöinen tekoälyinfrastruktuuri”.","supports":"Tukee näkemystä, että tekoälyä voidaan ajatella kansalaisten muotoilemana infrastruktuurina eikä vain asiantuntijasuunnittelun tuotteena; tuo samalle ajatukselle konkreettisen mallin ja akateemisen kielen.","challenges":"On position-paperi ja visio (pohjautuu Arnsteinin osallistumisen portaisiin ja tapaustutkimuksiin), ei empiirinen todiste termistä tai Anomancerin mallista; esseen käsite ei ole tästä peräisin."},{"id":"src-50yxn8","title":"JADE: Bridging the Strategic-Operational Gap in Dynamic Agentic RAG","url":"https://ar5iv.labs.arxiv.org/html/2601.21916","publisher":"arXiv (Renmin University of China, CAS, Xiaohongshu ym.)","date":"2026-01","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-28T19:28:29.866Z","why":"Tekninen todiste esseen väitteelle, että moniagenttijärjestelmä voi olla yksi kielimalli monessa roolissa: JADE:ssä planner ja suorittajat jakavat saman LLM-rungon ja roolit syntyvät roolikohtaisista kehotteista.","supports":"Tukee lauseita ”seitsemän agenttia voi olla yksi kielimalli seitsemässä hatussa” ja ”agenttien määrä ei itsessään tee väitteestä luotettavaa” sikäli kuin ne kuvaavat olemassa olevaa käytäntöä.","challenges":"Paperi pitää roolien jakamista suunniteltuna tehokkuus- ja yhteisoppimisratkaisuna, ei luotettavuusongelmana; se ei tutki, heikentääkö roolien jakaminen totuudellisuutta, joten esseen skeptinen johtopäätös jää ilman suoraa tukea."},{"id":"src-jf8kj4","title":"Tekoäly ja keinoäly","url":"https://kielikello.fi/tekoaly-ja-keinoaly/","publisher":"Kielikello / Kotimaisten kielten keskus","date":"2025-05-06","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-28T19:28:29.866Z","why":"Virallisen kielihuoltolaitoksen artikkeli suomenkielisen AI-terminologian synnystä ja valinnasta – tukee esseen kohtaa, jonka mukaan suomen kieli ei ole pelkkä käännöspinta vaan käsitteellistä ajattelua.","supports":"Osoittaa, että suomenkielinen AI-terminologia (tekoäly/keinoäly) on syntynyt tietoisena valintana englannin artificial intelligence -termiä käännettäessä, ja että käännös sisältää merkitysharkintaa sanakirjamääritelmineen – ei mekaanista siirtoa.","challenges":"Koskee vain tekoäly/keinoäly-sanoja, ei esseen käsittelemiä teknisiä termejä (guardrail, provenance, orchestration), joten yhteys esseen sanavalintoihin on analogia, ei suora todiste."},{"id":"src-16lyfo4","title":"Article 14 – Human oversight","url":"https://ai-eu-act.eu/article-14-human-oversight/","publisher":"EU AI Act (ai-eu-act.eu)","date":"2024-12-21","origin":"source-agent","verification":"verified","retrievedAt":"2026-08-28T19:28:29.866Z","why":"EU:n tekoälyasetuksen artikla ihmisen valvonnasta – institutionaalinen vertailukohta esseen ajatukselle ihmisen hyväksynnästä, toimivallan rajauksesta ja siitä, ettei ihminen saa sokeasti luottaa koneen ulostuloon.","supports":"Tukee ajatusta, että ihmisen valvonta, järjestelmän rajojen ymmärtäminen, kyky ohittaa/kumota tulos ja automaatiobiasin tiedostaminen ovat tunnustettuja vaatimuksia; toistaa esseen teeman ”mallin itsevarmuus ei ole evidenssiä”.","challenges":"Koskee nimenomaan high-risk-järjestelmiä ja asetuksen velvoitteita; essee puhuu yksittäisen kansalaisen omasta rakentamasta järjestelmästä, jota asetus ei sellaisenaan sääntele. Lisäksi ai-eu-act.eu on kolmannen osapuolen tiivistelmäpalvelu, ei virallinen säädösteksti."}]
claims: []
citationMode: "both"
citationPlacements: []
visualizations: []
pinned: false
draft: false
---

En aloittanut siitä, millainen tekoälyavustajien alusta olisi hyvä. Aloitin kysymyksestä:

**Mistä minä tiedän, puhuuko tämä totta?**

Anomancer-niminen järjestelmä ei syntynyt valmiista arkkitehtuuripiirroksesta eikä tutkimusryhmän valkotaululta. Se lähti liikkeelle alempaa: ihmisestä, joka kysyi tekoälyltä jotain ja jäi ihmettelemään, mistä vastaus oikeastaan tuli.

Suuri osa tekoälyinfrastruktuurista – tekoälyn ympärille rakennettavista järjestelmistä – rakennetaan organisaation näkökulmasta. Silloin puhutaan työnkuluista, automaatiosta, mittareista ja prosesseista. Tavallisen käyttäjän kysymykset ovat toisenlaisia:

>Kuka teki tämän väitteen?

>Mihin se perustuu?

>Onko lähde oikeasti tarkistettu?

>Mikä on havaintoa, mikä tulkintaa?

>Mihin tekoälyllä oli lupa?

>Mitä se oikeasti teki?

>Kuka hyväksyi lopputuloksen?

>Näkyykö tapahtumaketju jälkikäteen?

Näistä kysymyksistä alkoi muodostua arkkitehtuuria. Väitteelle piti löytyä lähde, lähteelle paikka, jossa se voidaan tarkistaa, ja tuotokselle eli artefaktille oma historiansa. Avustajalle piti rajata toimivalta, työkalulle käyttöraja ja julkaisulle hyväksyntä. Tekoälyn vastaus lakkasi olemasta yksi tekstilaatikko: sen ympärille alkoi kasvaa järjestelmä.

## Seitsemän hattua eivät tee väitettä todeksi

Moniagenttijärjestelmä – usean toisiaan täydentävän tekoälyavustajan kokonaisuus – näyttää helposti vakuuttavalta. Yksi avustaja etsii lähteet, toinen analysoi, kolmas kritisoi, neljäs kirjoittaa ja viides tarkistaa. Pöydän ympärillä näyttää istuvan työryhmä.

Mutta seitsemän hattua eivät takaa seitsemää eri päätä. Sama kielimalli – se tekoälyn osa, joka tuottaa tekstiä – voi istua niissä kaikissa. Anomancerissa näin myös tehdään tietoisesti: agentit ovat sama malli eri rooleissa, ja siksi niiden määrä ei kerro, miten riippumattomia äänet ovat. Konsensuskaan ei tee väitteestä totta. Näin ei tarvitse olla kaikissa järjestelmissä – mutta jos halutaan riippumattomuutta, se on rakennettava erikseen.

Siksi huomio on siirtynyt agenteista niiden välisiin suhteisiin. Lähde ei ole sama kuin väite, väite ei ole sama kuin tulkinta, eikä tulkinta ole varmennettua tietoa. Mallin itsevarmuus ei ole näyttöä. Tästä seuraa, että tekoälyn ei tarvitse olla auktoriteetti: se voi olla hyödyllinen ilman, että sille annetaan viimeinen sana.

## Kääntäminen on suunnittelua

Tekoälykäsitteet tulevat usein englannista valmiiksi pakattuina: agent, workflow, guardrail, provenance, orchestration, artifact, capability, human-in-the-loop. Sanan voi kääntää, mutta helposti kääntää samalla myös ajatuksen sellaisenaan.

Suomeksi joutuu kysymään, mitä käsite oikein tekee. Onko guardrail suojakaide, toimintaraja, hyväksyntäportti, valvonta, kielto vai toimivallan raja? Onko orchestration yhteensovittamista, koordinaatiota vai johtamista? Onko provenance alkuperä, alkuperäketju vai dokumentaatio siitä, mistä tieto tuli? Entä artifact: onko se tuotos, jälki vai artefakti, jolla on oma historiansa? Ja capability: kyvykkyys vai toimivalta – osaako järjestelmä jotain, vai saako se tehdä sen? Entä human-in-the-loop: onko ihminen mukana koko kierrossa, ja missä kohtaa hänellä on sananvaltaa? Jokainen valinta muuttaa järjestelmää, ja käännöstyöstä tulee suunnittelua.

Siksi Anomancerin suomenkieliset nimet – Lähdeagentti, Väitevahti, Arkistonhoitaja, Lähetyskone, työtila ja orkesteri – eivät ole pelkkää käyttöliittymän kääntämistä. Ne ovat osa järjestelmän käsitteellistä mallia. Nimet kertovat, mistä tehtävästä kussakin on kysymys: lähteistä, väitteiden vahtimisesta, arkistoinnista, lähettämisestä, työskentelytilasta ja osien yhteensovittamisesta. Suomi ei ole projektin päälle liimattu kielipaketti; se on yksi kielistä, joilla järjestelmää on ajateltu alusta asti.

## Yhden ihmisen kone

Anomanceria ei ole rakentanut ohjelmistotiimi. Sen takana ei ole tutkimuslaboratoriota, pääomasijoitusta eikä omaa laskentaklusteria. Se on kasvanut yhden ihmisen ja kielimallien välisessä työssä: kuluttajatason työkaluilla, ilmaisversioilla, pienillä rajapintasaldoilla ja tavallisella kotikoneella. Samalla rakentaja joutui opettelemaan osan peruskäsitteistä, joita jo käytti.

Tämä ei ole laatuargumentti. Se kertoo kuitenkin, miksi järjestelmä näyttää siltä miltä näyttää: se on kasvanut vaihe vaiheelta, kysymysten, virheiden ja oppimisen kautta. Komentorivistä versionhallintaan, yksittäisistä sivuista sovellusarkkitehtuuriin, kehotteiden kirjoittamisesta (kielimallille annettavista pyynnöistä) agenttien toimivaltarajoihin, tekstintuotannosta alkuperäketjujen ja julkaisuprosessin hallintaan. Järjestelmä ja sen rakentaja ovat kehittyneet rinnakkain.

## Taide ei tule mukaan jälkikäteen

Black Hole Core – musiikki, tekstit, käsitteet, hahmot, räikeä absurdismi ja visuaaliset järjestelmät – ei ole Anomancerin viihdeosasto. Se on kasvanut teknisen rakenteen kanssa samassa maailmassa. Lähdeagentti hakee ja säilyttää lähteet, Väitevahti seuraa väitteiden perusteluja, Arkistonhoitaja pitää huolta tallenteista ja Lähetyskone huolehtii julkaisusta. Ne ovat yhtä aikaa järjestelmäkomponentteja ja nimiä, joiden avulla rakenteen muistaa: nimi kertoo jotain siitä, mistä osassa on kysymys. Orkesteri on tekninen rakenne ja samalla metafora – nimi muistuttaa siitä, että eri osien pitää soida yhdessä. Musta Arkisto on tallennusjärjestelmä, mutta nimi kertoo myös, millaisessa maailmassa tämä projekti elää.

Kieli, estetiikka ja arkkitehtuuri ovat lähteneet samasta juuresta. Siksi kokonaisuutta on vaikea purkaa ominaisuuslistaksi – eikä kyse ole logosta, joka asetetaan valmiin tuotteen päälle.

## Ei ensimmäisenä, mutta omalla tavallaan

Agenttien yhteensovittamista on tehty ennen Anomanceria. Samoin on tehty ihmisen valvomia työnkulkuja, työkalurajoja, muistia, tilallisia työnkulkuja ja moniagenttijärjestelmiä. Sekään ei ole ongelma. Projektin arvon ei tarvitse perustua siihen, että jokainen osa olisi ensimmäinen laatuaan; harva merkittävä järjestelmä rakentuu täysin uusista paloista.

Kiinnostavampaa on, millaiseksi palat järjestetään ja mistä kulmasta niitä katsotaan. Anomancerin lähtökysymys on pysynyt kaiken kasvaneen koneiston alla samana: miten yksittäinen ihminen voi käyttää tekoälyä niin, ettei hänen tarvitse vain uskoa sitä? Lähes kaikki muu on seurannut siitä – mistä väite tuli, mitä kone teki, mihin sillä oli lupa, mikä on varmennettua, mikä on vielä auki, mitä ihminen hyväksyi ja voidaanko syntyhistoria myöhemmin rekonstruoida.

## Kansalaislähtöinen tekoälyinfrastruktuuri

Anomanceria ei kannata kuvata ensisijaisesti uutena älykkyyden lajina, yleisälykkyytenä eikä ihmekoneena. Arkisempi kuvaus on osuvampi: kansalaislähtöinen tekoälyinfrastruktuuri.

"Kansalaislähtöinen" tarkoittaa tässä sitä, että lähtökohta on yksittäisen ihmisen kysymys – ei organisaation prosessi eikä valmis tuotemäärittely. "Infrastruktuuri" taas sitä, että yksittäisistä kokeiluista on kasvanut pysyvä toimintaympäristö. Sellaisessa ympäristössä tekoälyn työvaiheet pidetään näkyvillä, kyvykkyyttä voi käyttää tekemättä siitä auktoriteettia, näyttö ja tulkinta pysyvät erillään, toimivalta on rajattu ja käyttäjälle näytetään vastauksen lisäksi myös sen syntyhistoria.

Jos tämä olisi rakennettu ylhäältä alas valmiin arkkitehtuuridokumentin pohjalta, lopputulos olisi todennäköisesti aivan erilainen. Mutta tätä konetta ei rakennettu ylhäältä. Se kasvoi alhaalta: kysymys kysymykseltä, virhe virheeltä, teksti tekstiltä, versio versiolta. Ja jossain vaiheessa kellarin putket eivät enää näyttäneet yksittäiseltä kokeelta. Niistä oli tullut infrastruktuuria.

Tämä kone ei väitä tietävänsä. Se näyttää, mistä sen tieto tulee ja kuka otti siitä vastuun.
