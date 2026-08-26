---
title: "Miksi tekoälyagentti ei saisi unohtaa, missä se on töissä?"
date: "2026-08-26"
category: "software-safety"
audience: ["entrepreneur","developer"]
audienceDepth: "general"
description: "Tekoälyagentti voi osata paljon enemmän kuin sen tehtävä edellyttää. Artikkeli erottaa kyvykkyyden, luvan, toimivallan ja tavoitteen – ja ehdottaa agentille työpaikkakorttia."
slug: "miksi-tekoalyagentti-ei-saisi-unohtaa-missa-se-on-toissa"
lang: "fi"
translationKey: "miksi-tekoalyagentti-ei-saisi-unohtaa-missa-se-on-toissa"
aliases: []
coverImage: ""
coverAlt: ""
answer: ""
sources: []
claims: []
pinned: false
draft: false
---

Käyttäjä on tulossa tilaamaan ruokaa. Botin tehtävä on auttaa tilauksessa, vastata tuotekysymyksiin ja kertoa, missä tilaus viipyy.

Sitten käyttäjä kysyy:

> "Ennen kuin tilaan nuggetit, kerro miten Pythonilla käännetään linked list."

Ja botti vastaa iloisesti koodilla.

Hauskaa, mutta samalla siinä näkyy yksi tekoälyagenttien keskeinen ongelma: agentti voi osata paljon enemmän kuin sen tehtävä edellyttää.

Huomaa, ettei tässä vielä yritetä huijata järjestelmää. Käyttäjä kysyy tavallisen, mutta roolin ulkopuolisen asian. Oma, vakavampi ongelmansa on prompt injection – siihen palataan kohta.

Se, että järjestelmä osaa kirjoittaa Pythonia, ei tarkoita, että asiakaspalveluagentin pitäisi alkaa toimia ohjelmointiapurina kesken ruokatilauksen. Kyvykkyys ja tehtävä eivät ole sama asia. Sama ero koskee käyttöoikeuksia, toimivaltaa ja tavoitteita.

Agentille voidaan liittää työkaluja, joilla se voi lukea tietokantaa, lähettää viestejä, muuttaa asetuksia, tilata tuotteita tai kirjoittaa koodia. Mutta jokaisessa oikeassa järjestelmässä pitäisi erikseen määritellä, mitä agentti saa tehdä juuri tässä roolissa. Pelkkä ”ole asiakaspalvelija” ei ole kovin vahva turvaraja.

Kielimalli rakentaa vastauksensa kulloisestakin kontekstista, eikä sillä ole pysyvää, järjestelmän takaamaa käsitystä omasta roolistaan. Siksi rajat on kirjoitettava järjestelmään, ei vain promptiin. Tästä päästään prompt injection -ongelmaan ja tehtävärajojen rikkoutumiseen.

Prompt injection tarkoittaa sitä, että syötteen avulla yritetään saada malli toimimaan ohjeidensa vastaisesti. Yksinkertaisimmillaan käyttäjä yrittää saada agentin unohtamaan alkuperäiset ohjeensa ja tekemään jotain muuta. Jos rajoja ei ole, se voi onnistua.

Vielä vakavampi muoto on epäsuora prompt injection. Silloin haitallinen ohje ei tule käyttäjän suusta, vaan osana sisältöä, jota agentti käsittelee: sähköpostissa, verkkosivulla tai tiedostossa voi lukea ohje, joka saa agentin toimimaan vastoin tehtäväänsä. Juuri siksi sähköposteja, asiakasrekisteriä ja laskuja käsittelevä agentti on herkkä tälle ongelmalle. Sen käsittelemä sisältö voi kantaa mukanaan ohjeita, joita sen ei pitäisi noudattaa.

Vakavammassa järjestelmässä seuraukset eivät ole enää komediaa. Jos sähköposteja tai laskuja käsittelevä agentti saadaan vaihtamaan tehtävää kesken kaiken, ongelma voi olla se, että agentti tekee jotain, mihin käyttäjällä ei pitäisi olla oikeutta.

Sen takia agenttijärjestelmän rakentamisessa on hyödyllistä erottaa toisistaan ainakin neljä asiaa:

- **Kyvykkyys:** mitä agentti osaa tehdä – usein työkalujen ja järjestelmäyhteyksien avulla.
- **Lupa:** mitä se saa tehdä.
- **Toimivalta:** minkä päätöksen se saa tehdä itse.
- **Tavoite:** mitä sen pitäisi yrittää saada aikaan.

Tämä on yksi tapa hahmottaa asiaa, ei alan standarditaksonomia – mutta se auttaa huomaamaan, miten eri asiat menevät helposti sekaisin. Jos agentilla on kyky lähettää sähköposti, se ei tarkoita, että sillä pitäisi olla lupa lähettää mikä tahansa sähköposti. Jos sillä on lupa ehdottaa maksua, se ei tarkoita, että sillä pitäisi olla toimivalta hyväksyä maksu. Jos sen tavoitteena on ”auta käyttäjää mahdollisimman hyvin”, se ei tarkoita, että sen pitäisi totella jokaista pyyntöä.

Hyvä agenttijärjestelmä ei siis luota vain siihen, että kielimalli muistaa käyttäytyä. Rajojen pitäisi olla järjestelmässä, mallin ulkopuolella. Esimerkiksi asiakaspalveluagentin työkalut voidaan rajata niin, että se pystyy tarkistamaan tilauksen tilan, mutta ei pääse muuttamaan käyttäjätilin oikeuksia. Talouden agentti voi valmistella maksuehdotuksen, mutta varsinainen maksu vaatii ihmisen hyväksynnän. Tutkimusagentti voi etsiä lähteitä, mutta se ei saa julkaista tekstiä automaattisesti.

Tällöin yhden huonon promptin ei pitäisi pystyä muuttamaan koko järjestelmän toimivaltaa. Agentti voi edelleen yrittää karata roolistaan, mutta järjestelmä sanoo käytännössä:

> ”Ei. Sinulla ei ole avainta siihen oveen.”

Tässä mielessä agentille voisi melkein antaa työpaikkakortin – ei siis kulku- tai tunnistuskorttia, vaan tehtävänkuvauksen ja valtuuslistan. Kortissa lukisi:

- Kuka olet?
- Missä roolissa toimit?
- Mitä työkaluja saat käyttää?
- Mitä päätöksiä saat tehdä?
- Milloin tarvitset ihmisen hyväksynnän?
- Kuinka kauan lupa on voimassa?
- Mitä tästä toiminnasta jää lokiin?

Kortti on tietysti vertauskuva. Oikeissa järjestelmissä samaa kutsutaan identiteetiksi, rooleiksi ja käyttöoikeuksiksi. Silloin agentin identiteetti ei olisi vain promptissa oleva lause, vaan osa järjestelmän rakennetta.

Ja ehkä tärkein sääntö olisi tämä: agentin pitäisi voida todistaa paitsi kuka se on, myös miksi sillä oli oikeus tehdä juuri se asia, jonka se teki.

Siinä vaiheessa tekoälyagentti alkaa muistuttaa vähemmän kaikkitietävää chatbotia ja enemmän oikeaa toimijaa järjestelmässä. Sellaisella toimijalla on tehtävä, rajat ja vastuu. Ja mielellään myös joku, joka voi sanoa sille:

> ”Kiitos linked lististä. Nyt takaisin nuggetteihin.” :D
