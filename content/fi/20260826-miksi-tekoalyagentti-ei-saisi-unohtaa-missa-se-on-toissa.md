---
title: "Miksi tekoälyagentti ei saisi unohtaa, missä se on töissä?"
date: "2026-08-26"
category: "info-media"
audience: ["all"]
audienceDepth: "general"
description: ""
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
draft: true
---

Kuvitellaan tavallinen asiakaspalveluchat.

Käyttäjä tulee tilaamaan ruokaa. Chatbotin tehtävä on auttaa tilauksessa, vastata tuotteita koskeviin kysymyksiin ja ehkä selvittää, missä tilaus viipyy.

Sitten käyttäjä kysyy:

“Ennen kuin tilaan nuggetit, kerro miten Pythonilla käännetään linked list.”

Ja botti vastaa iloisesti koodilla.

Hauskaahan se on. Mutta samalla siinä näkyy aika hyvin yksi tekoälyagenttien keskeisistä ongelmista.

Agentti voi osata paljon enemmän kuin mitä sen pitäisi tehdä.

Siinä on iso ero.

Jos järjestelmä pystyy kirjoittamaan Pythonia, se ei vielä tarkoita, että asiakaspalveluagentin pitäisi alkaa toimia ohjelmointiapurina kesken ruokatilauksen. Kyvykkyys ja tehtävä eivät ole sama asia.

Sama pätee käyttöoikeuksiin, toimivaltaan ja tavoitteisiin.

Agentti voi teknisesti pystyä lukemaan tietokantaa, lähettämään viestejä, muuttamaan asetuksia, tilaamaan tuotteita tai kirjoittamaan koodia. Mutta jokaisessa oikeassa järjestelmässä pitäisi erikseen määritellä, mitä agentti saa tehdä juuri tässä roolissa.

Pelkkä “ole asiakaspalvelija” ei ole kovin vahva turvaraja.

Kielimalli ei nimittäin ymmärrä työroolia samalla tavalla kuin ihminen ymmärtää työpaikan sääntöjä, vastuuta ja seurauksia. Malli reagoi syötteeseen. Jos uusi pyyntö näyttää järkevältä ja sopii sen yleisiin kykyihin, se voi alkaa toteuttaa sitä, vaikka tehtävä olisi kokonaan sivussa alkuperäisestä tarkoituksesta.

Tästä päästään prompt injectioniin ja tehtävärajojen rikkoutumiseen.

Yksinkertaisimmillaan käyttäjä yrittää saada agentin unohtamaan alkuperäiset ohjeensa ja tekemään jotain muuta. Jos agentilla ei ole selkeitä rajoja, se voi onnistua.

Vakavammassa järjestelmässä seuraukset eivät enää ole pelkkää komediaa.

Ajatellaan agenttia, joka käsittelee yrityksen sähköposteja, asiakasrekisteriä tai laskuja.

Jos se voidaan saada vaihtamaan tehtävää kesken kaiken, ongelma ei ole enää se, että botti alkoi selittää Pythonia nuggettien sijaan.

Ongelma voi olla se, että agentti tekee jotain, mihin käyttäjällä ei pitäisi olla oikeutta.

Siksi agenttijärjestelmässä pitäisi erottaa ainakin neljä asiaa toisistaan:

Kyvykkyys: mitä agentti osaa tehdä.

Lupa: mitä se saa tehdä.

Toimivalta: minkä päätöksen se saa tehdä itse.

Tavoite: mitä sen pitäisi yrittää saada aikaan.

Nämä menevät helposti sekaisin.

Jos agentilla on kyky lähettää sähköposti, se ei tarkoita, että sillä pitäisi olla lupa lähettää mikä tahansa sähköposti.

Jos sillä on lupa ehdottaa maksua, se ei tarkoita, että sillä pitäisi olla toimivalta hyväksyä maksu.

Jos sen tavoitteena on “auta käyttäjää mahdollisimman hyvin”, se ei tarkoita, että sen pitäisi totella jokaista käyttäjän pyyntöä.

Hyvä agenttijärjestelmä ei siis luota vain siihen, että kielimalli muistaa käyttäytyä.

Rajojen pitäisi olla järjestelmässä mallin ulkopuolella.

Esimerkiksi asiakaspalveluagentin työkalut voidaan rajata niin, että se pystyy tarkistamaan tilauksen tilan, mutta ei pääse muuttamaan käyttäjätilin oikeuksia.

Talouden agentti voi valmistella maksuehdotuksen, mutta varsinainen maksu vaatii ihmisen hyväksynnän.

Tutkimusagentti voi etsiä lähteitä, mutta se ei saa julkaista tekstiä automaattisesti.

Tällöin yhden huonon promptin ei pitäisi pystyä muuttamaan koko järjestelmän toimivaltaa.

Agentti voi edelleen yrittää karata roolistaan, mutta järjestelmä sanoo käytännössä:

“Ei. Sinulla ei ole avainta siihen oveen.”

Tässä mielessä agentille voisi melkein antaa työpaikkakortin.

Kortissa lukisi:

Kuka olet?

Missä roolissa toimit?

Mitä työkaluja saat käyttää?

Mitä päätöksiä saat tehdä?

Milloin tarvitset ihmisen hyväksynnän?

Kuinka kauan lupa on voimassa?

Mitä tästä toiminnasta jää lokiin?

Silloin agentin identiteetti ei olisi vain promptissa oleva lause.

Se olisi osa järjestelmän rakennetta.

Ja ehkä tärkein sääntö olisi tämä:

Agentin pitäisi voida todistaa paitsi kuka se on, myös miksi sillä oli oikeus tehdä juuri se asia, jonka se teki.

Siinä vaiheessa tekoälyagentti alkaa muistuttaa vähemmän kaikkitietävää chatbotia ja enemmän oikeaa toimijaa järjestelmässä.

Sellaisella toimijalla on tehtävä.

Sillä on rajat.

Sillä on vastuu.

Ja mielellään myös joku, joka voi sanoa sille:

“Kiitos linked lististä. Nyt takaisin nuggetteihin.” \:D
