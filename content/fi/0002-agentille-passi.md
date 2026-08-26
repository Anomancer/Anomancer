---
title: "Miksi tekoälyagentille pitäisi antaa passi?"
date: "2026-08-26"
category: "software-safety"
audience: ["all"]
audienceDepth: "general"
description: "Tekoälyagentti voi jo hakea tietoa, lukea tiedostoja ja lähettää viestejä. Millä luvalla se toimii, ja miten sen voi osoittaa? Agenttipassi olisi koneellisesti luettava sopimus siitä, mitä agentti saa tehdä."
slug: "miksi-tekoalyagentille-pitaisi-antaa-passi"
lang: "fi"
translationKey: "why-an-ai-agent-needs-a-passport"
aliases: []
coverImage: ""
coverAlt: ""
answer: ""
sources: []
claims: []
pinned: false
draft: false
---

Tekoälyagentti ei ole enää pelkkä keskustelukumppani. Kun mallille annetaan työkaluja, käyttöoikeuksia ja mahdollisuus toimia itsenäisesti, se voi hakea tietoa, lukea tiedostoja, kirjoittaa järjestelmiin tai lähettää viestejä. Silloin herää käytännöllinen kysymys: millä luvalla agentti toimii?

Yksi ehdotettu vastaus on agenttipassi. Se ei olisi ihmisen henkilöllisyysasiakirjan kopio. Ajatus on, että agentille annettaisiin koneellisesti luettava sopimus – asiakirja, johon on kirjattu, mitä agentin on tarkoitus tehdä ja mitä se saa tehdä matkalla. Mukaan voisi kuulua tehtävä, käytettävissä olevat työkalut, sallitut resurssit, budjetti, voimassaoloaika ja rajat, joiden yli ei saa mennä.

Tärkeä tarkennus: agenttipassi on vasta ehdotettu tapa hahmottaa ratkaisua, ei vakiintunut järjestelmä. Samasta ongelmasta on liikkeellä myös muita teknisiä malleja, kuten delegaatiotokeneita ja valtuutusprofiileja. ”Passi” on silti hyödyllinen ajatuskoe, koska se tuo esiin jotain, mikä nykyisistä järjestelmistä puuttuu: yhden paikan, josta näkee, mihin agentilla on lupa.

## Kun tekoäly saa työkalut

Niin kauan kuin tekoäly tuottaa pelkkää tekstiä ruudulle, sen suora toimivalta ympäröivään maailmaan on pieni. Mutta kun sama järjestelmä voi tallentaa tiedoston, lähettää viestin tai tehdä tilauksen, hyvä vastaus ei enää riitä. Silloin pitää tietää, millä valtuuksilla se toimii.

## Oikeudet seuraavat tehtävää

Keskeinen periaate on yksinkertainen: oikeudet seuraavat tehtävää, eivät agentin yleistä kyvykkyyttä.

Ajatellaan tutkimusagenttia. Tehtävä: etsi uusia tutkimuksia tietystä aiheesta ja tee niistä yhteenveto. Oikeudet: verkkohaku ja julkisten sivujen lukeminen. Kirjoitusoikeus: yksi raporttitiedosto. Budjetti: 50 hakua. Voimassaolo: yhden ajon ajan.

Sähköposti, muut tiedostot ja muut järjestelmät jäävät kokonaan ulkopuolelle. Jos tehtävänä on etsiä tutkimuspapereita, sähköpostin lähettämiseen tai tiedostojen poistamiseen ei ole mitään syytä antaa oikeutta.

Tavoitteena on, että kun työ päättyy, myös oikeudet päättyvät. Tämän tekninen toteutus on kuitenkin yhä keskeneräinen: valtuuksien peruuttaminen ja kierrättäminen ovat vaikeita kysymyksiä, joihin ei ole yhtä vakiintunutta ratkaisua.

## Loki kertoo, mitä tapahtui – passi kertoisi, mitä oli luvallista

Nykyisissä agenttijärjestelmissä valtuudet voivat olla hajallaan eri paikoissa: ohjelmien välisissä tunnisteissa, järjestelmän asetuksissa, agentille annetussa ohjeistuksessa, käyttöoikeuksissa ja tapahtumalokeissa. Jälkikäteen voi olla yllättävän vaikea sanoa, mitä agentin oikeastaan piti saada tehdä.

Tapahtumaloki yksin ei ratkaise ongelmaa. Loki kertoo, mitä tapahtui, mutta ilman alkuperäistä sopimusta puuttuu vertailukohta: millä oli lupa tapahtua? Passi antaisi tämän vertailukohdan. Jos ajossa näkyy toiminto, jota sopimus ei sallinut – tai budjetti ylittyy tai tehtävä venyy yli voimassaoloajan – poikkeama voidaan havaita suoraan.

## Periaate on tuttu, käytäntö ei

Periaatteessa agenttipassi ei ole kovin futuristinen: ajatus siitä, että käyttöoikeudet rajataan ja kirjataan ennalta, on tuttua käyttöoikeushallinnasta. Mutta siirtäminen autonomisiin agentteihin tuo mukanaan aidosti uusia ongelmia. Valtuudet pitäisi pystyä esittämään niin, että sekä ihminen että ohjelmisto ymmärtävät ne, ja ne pitäisi pystyä myös peruuttamaan luotettavasti. Standardointiluonnoksissa on ehdotettu erilaisia tapoja, mutta yhtenäistä, vakiintunutta järjestelmää ei ole. Avoimeksi jää myös se, miten ihmisvastuu ja sääntely kytketään mukaan.

Mitä enemmän tekoälyagentille annetaan toimivaltaa, sitä oudommaksi muuttuu ajatus siitä, ettei mukana olisi mitään selvää käyttöoikeussopimusta. Agenttipassi ei ole eksoottinen keksintö. Päinvastoin – se on looginen seuraus siitä, että ohjelmisto alkaa toimia itsenäisesti, ja siksi myös vastuun pitää olla jäljitettävissä.
