---
title: "Kotidatakeskus: kuinka lakkasin murehtimasta ja opin rakastamaan lämmitysvastusta"
date: "2026-09-09"
category: "info-media"
audience: ["all"]
audienceDepth: "general"
description: "Kallis sähköpatteri, joka on opetettu laskemaan matriiseja — entä jos kotilämmitys ajaisi samalla omaa tekoälyä? Absurdi idea, jota jo kokeillaan."
slug: "kotidatakeskus-kuinka-lakkasin-murehtimasta-ja-opin-rakastamaan-lammitysvastusta"
lang: "fi"
translationKey: "kotidatakeskus-kuinka-lakkasin-murehtimasta-ja-opin-rakastamaan-lammitysvastusta"
aliases: []
coverImage: ""
coverAlt: ""
answer: ""
sources: [{"id":"src-zzs8io","title":"Qarnot creates green data centers by putting servers in central heating boilers","url":"https://techcrunch.com/2023/01/09/qarnot-creates-green-data-centers-by-putting-servers-in-central-heating-boilers/","publisher":"TechCrunch","date":"2023-01-09","origin":"source-agent","verification":"verified","retrievedAt":"2026-09-09T14:28:13.387Z","why":"Raportoi Qarnot'n liiketoimintamallista yksityiskohtaisesti ja mainitsee jopa Qarnot'n pilotti-datakeskuksen Suomessa.","supports":"Tukee tekstin kuvausta ranskalaisesta Qarnot'sta, joka upottaa palvelimia lämmitysratkaisuihin: jopa 95 % hukkalämmöstä käyttöveteen, rakennusten ja altaiden lämmitys.","challenges":"Qarnot ajaa asiakkaille kuuluvaa laskentaa (esim. BNP Paribas, Société Générale) — eli kyse on nimenomaan 'jonkun muun laskennasta', mitä teksti pitää ongelmana. Ratkaisut ovat myös asunto- tai kiinteistötason, ei koko sähköpatteri-GPU-filosofia.","verifiedBy":"human:admin","verifiedAt":"2026-09-09T15:05:19.056Z","verificationMethod":"direct-open","verificationEvidence":"https://techcrunch.com/2023/01/09/qarnot-creates-green-data-centers-by-putting-servers-in-central-heating-boilers/","verificationNotes":"Ihminen vahvisti avanneensa ja tarkistaneensa lähteen."},{"id":"src-13dxfzl","title":"Home based servers to generate hot water — PHAM News (Heata & British Gas)","url":"https://phamnews.co.uk/home-based-servers-to-generate-hot-water/","publisher":"PHAM News","date":"2025-02-10","origin":"source-agent","verification":"verified","retrievedAt":"2026-09-09T14:28:13.387Z","why":"Tuore ja konkreettinen kuvaus brittiläisestä Heatasta, joka siirtää palvelimien lämmön kodin käyttövesivaraajaan.","supports":"Tukee tekstin väitettä Heatan myyvän laitteita, joissa palvelin lämmittää vettä: jopa 4 kWh lämmintä vettä päivässä, kolmen kuukauden British Gas -pilotti.","challenges":"Heata maksaa laitteen käyttämän sähkön itse ja kompensoi talouden lämmityskuluja — tämä haastaa kirjoituksen 'kaupalliset ratkaisut ajavat jonkun muun laskentaa sinun sähkölläsi' -oletusta, jos oletuksena on että sähkölasku on asukkaan.","verifiedBy":"human:admin","verifiedAt":"2026-09-09T15:05:53.753Z","verificationMethod":"direct-open","verificationEvidence":"https://phamnews.co.uk/home-based-servers-to-generate-hot-water/","verificationNotes":"Ihminen vahvisti avanneensa ja tarkistaneensa lähteen."},{"id":"src-1dra6kk","title":"Datakeskukset ja kaukolämmön tulevaisuus energiamurroksessa","url":"https://oulunkauppakamari.fi/tiedote/datakeskukset-ja-kaukolammon-tulevaisuus-energiamurroksessa/","publisher":"Oulun kauppakamari","date":"2025-03-11","origin":"source-agent","verification":"verified","retrievedAt":"2026-09-09T14:28:13.387Z","why":"Antaa faktapohjan sille, miten paljon datakeskushukkalämpöä Suomessa oikeasti onnistutaan hyödyntämään.","supports":"Kontekstoi, että datakeskusten hukkalämpö on kaukolämmölle potentiaalinen mutta matalalämpöinen (~30 °C) lähde ja vain pieni osa todellisuudessa saadaan talteen.","challenges":"Haastaa optimismia: hukkalämmön hyödyntämistä rajoittavat sijainti ja matala lämpötila, ja 500 kW -datakeskuksia on vain 30–50 Suomessa. Kotimittakaavan lämpö (alle kW) ei vastaa kaukolämpölogiikkaa.","verifiedBy":"human:admin","verifiedAt":"2026-09-09T15:06:48.854Z","verificationMethod":"direct-open","verificationEvidence":"https://oulunkauppakamari.fi/tiedote/datakeskukset-ja-kaukolammon-tulevaisuus-energiamurroksessa/","verificationNotes":"Ihminen vahvisti avanneensa ja tarkistaneensa lähteen."}]
claims: [{"status":"interpretation","text":"GPU on pohjimmiltaan kallis sähköpatteri, joka on opetettu laskemaan matriiseja.","evidence":[],"note":"Retorinen rinnastus, ei kirjaimellinen tekninen määritelmä.","contradictions":[]},{"status":"open","text":"Sama sähkökuorma voi tuottaa lämpöä ja laskea yhtä aikaa.","evidence":[],"note":"Teknisesti mahdollinen ajatus, mutta yleistävä väite ilman vahvistettua lähdettä.","contradictions":[]},{"status":"open","text":"Kielimalli tarvitsee GPU:ta.","evidence":[],"note":"Pienet kielimallit voivat toimia myös CPU:lla. GPU on käytännössä tavallinen valinta, ei välttämättömyys.","contradictions":[]},{"status":"open","text":"16 ampeerin pääsulake on koko kodin sähkön yhteinen putki ja kotidatakeskuksen todellinen pullonkaula.","evidence":[],"note":"16 A on yleinen pääsulakekoko, mutta ei ainoa. Pullonkaula-ajatus on oma tulkintani.","contradictions":[]},{"status":"interpretation","text":"Kun pyykinpesukone käynnistyy, järjestelmä kvantisoi mallin 16 bitistä 8, 4 tai tarvittaessa 2 bittiin ja palauttaa sen täyteen tarkkuuteen pesun jälkeen.","evidence":[],"note":"Kuvaa suunniteltua ohjauslogiikkaa, ei olemassa olevaa järjestelmää. Kvantisointi on todellinen menetelmä, mutta kuvaus on yksinkertaistettu.","contradictions":[]},{"status":"interpretation","text":"Pyykinpesukone ei kilpaile GPU:n kanssa sähköstä; se päättää, kuinka älykäs GPU saa olla.","evidence":[],"note":"","contradictions":[]},{"status":"open","text":"Talvella laskenta tuottaa lämpöä juuri silloin, kun lämpöä tarvitaan, ja sähkön hinta on öisin usein alhaisempi.","evidence":[],"note":"Markkinariippuvainen yleistys: pörssisähkön hinta vaihtelee, eikä yöhalpuus ole tae.","contradictions":[]},{"status":"open","text":"Ilmalämpöpumppu on energiatehokkaampi tapa lämmittää, koska se siirtää ulkoilman lämpöä sisään eikä tuota lämpöä vastuksella.","evidence":[],"note":"Tarkempi hyötysuhde riippuu olosuhteista.","contradictions":[]},{"status":"interpretation","text":"Ilmalämpöpumpulla on kohtalokas heikkous: se ei osaa ajaa paikallista kielimallia.","evidence":[],"note":"Leikillinen vertaus, ei kirjaimellinen väite lämpöpumpun ominaisuuksista.","contradictions":[]},{"status":"open","text":"Brittiläinen Heata myy laitteita, joissa palvelin lämmittää käyttövesivaraajaa; yritys maksaa sähkön itse ja kompensoi talouden lämmityskuluja.","evidence":[],"note":"Vahvistamaton lähde. Väite on linjassa lähteen kanssa, mutta se ei ole vielä varmennettu.","contradictions":[]},{"status":"interpretation","text":"HomeNode olisi konsepti, joka yhdistää kodin lämmityksen, paikallisen tekoälyn ja datan hallinnan; ohjausjärjestelmä päättäisi laskennan tarkkuudesta, ajoituksesta ja lämmönjaosta.","evidence":[],"note":"Oma konseptiehdotus, ei väite olemassa olevasta tuotteesta.","contradictions":[]},{"status":"interpretation","text":"Kotidatakeskuksen hyöty ei ole ilmaisessa lämmössä, vaan siinä, että laskenta voidaan ajoittaa lämmöntarpeen mukaan ja että data ja mallit pysyvät kotona.","evidence":[],"note":"Argumentti konseptin puolesta, ei mitattavissa oleva väite.","contradictions":[]}]
citationMode: "inline"
citationPlacements: []
visualizations: []
pinned: false
draft: false
---

# Kotidatakeskus: kuinka lakkasin murehtimasta ja opin rakastamaan lämmitysvastusta

Talvella suorassa sähkölämmityksessä tapahtuu väistämätön asia: sähköstä tulee lämpöä. Se palaa vastuksessa, lattialangassa ja patterissa, eikä matkalla tapahdu yhtään mitään mielenkiintoista. Kun tätä on katsellut muutaman talven, alkaa väkisin kysyä: entä jos sähkö ehtisi tehdä muutaman matriisikertolaskun ennen kuin se muuttuu lämmöksi?

Ajatus kuulostaa hullulta, mutta pohja on kunnossa. GPU on pohjimmiltaan kallis sähköpatteri, joka on opetettu laskemaan matriiseja. Jos asunto on joka tapauksessa lämmitettävä, sama sähkökuorma voi tuottaa lämpöä ja laskea yhtä aikaa. Se ei tee lämmöstä ilmaista – GPU on vastukseen verrattuna kallis ja monimutkainen tapa tuottaa sama lämpö – mutta se tekee lämmityksestä koneoppimisen sivutuotteen. Tai laskennasta lämmityksen sivutuotteen. Riippuu siitä, kumpi on se juttu, jonka haluat maksavan sähkölaskun.

## Kaksi ongelmaa, yksi äänekäs laatikko

Asunto tarvitsee lämpöä. Kielimalli tarvitsee GPU:ta. GPU voi hoitaa molemmat. Kyse ei ole ilmaisesta lämmöstä, mutta kun lämpö on joka tapauksessa pakko tuottaa, sama sähkökuorma voi tehdä kaksi asiaa kerralla.

Käytännössä tämä tarkoittaa, että olohuoneeseen ilmestyy laatikko, joka muistuttaa palvelinsalia ja kuulostaa sellaiselta. Tuuletinkohina muodostaa oman akustisen palomuurinsa: naapurin valitus ei enää erotu, eikä omaatuntoakaan tarvitse kuunnella. Pieni hinta siitä, että kodin lämmitys tekee myös jotain hyödyllistä.

## Pullonkaula: sulake, ei laskentateho

Kotidatakeskuksen todellinen vihollinen löytyy sähköliittymästä: 16 ampeerin pääsulake. Se on koko kodin sähkön yhteinen putki. Jos talo vetää sen täyteen, muu arki alkaa kilpailla tekoälyn kanssa.

Ratkaisu on kuitenkin olemassa, ja se on kaunis: kun pyykinpesukone kytkee lämmitysvastuksensa, järjestelmä ei sammuta tekoälyä. Se kvantisoi sen – eli laskee tarkkuutta, jolla mallin luvut esitetään. Vähemmän bittejä tarkoittaa karkeampaa mutta kevyempää laskentaa, ja siksi vähemmän sähköä. Mallin luvut pyöristetään 16 bitistä 8 bittiin, sitten tarvittaessa 4 bittiin ja äärimmäisessä tapauksessa 2 bittiin – teknisesti mahdollista, mutta laatu kärsii niin, että lopputulos on lähinnä rukous. Kun pesukone on lopettanut, malli palautetaan täyteen tarkkuuteen. Pyykinpesukone ei siis kilpaile GPU:n kanssa sähköstä – se päättää, kuinka älykäs GPU saa olla.

Talvella tämä toimii erityisen hyvin. Laskenta tuottaa lämpöä juuri silloin, kun lämpöä tarvitaan, ja sähkön hinta on öisin usein alhaisempi. Pakkasella kone voi laskea kovaa ja lämmittää; aamuyöllä talo on lämmin ja laskentaa voi hellittää.

Kesä on toinen juttu. Jos järjestelmään ei ole rakennettu minkäänlaista vuodenaikatietoisuutta, se on helvetillinen: ulkona 30 astetta, sisällä 35, ja kone jatkaa laskemista, koska se ei tajua, että nyt ei tarvitsisi. Silloin ihminen jäähdyttää asuntoa, jotta kone voi lämmittää asuntoa, jotta kone voi jatkaa laskemista. Se ei ole enää energiankäyttöä, vaan infrastruktuurinen maailmankatsomus.

## Ilmalämpöpumppu, joka ei osaa ajaa kielimalleja

Ilmalämpöpumppu on energiatehokkaampi tapa lämmittää, koska se siirtää ulkoilman lämpöä sisään eikä keksi sitä vastuksella. Sillä on kuitenkin yksi kohtalokas heikkous: se ei osaa ajaa paikallista kielimallia. Siinä kohtaa optimointifunktio vaihtuu.

| Muuttuja | Voittaja |
|---|---|
| Energiatehokkuus | Ilmalämpöpumppu |
| Laskentateho ja paikallinen tekoäly | GPU-farmi |
| Datan ja mallien omistus | GPU-farmi |
| Olohuoneen lämpötila | riippuu kuormasta |
| Järjenmukaisuus | ei määritelty |

## Hetkinen: tämä on jo tehty

Kirjoitin koko ajatuksen puhtaana absurdismina. Sitten huomasin, ettei idea ole edes uusi. Julkisuudessa on kuvattu palvelinratkaisuja, joissa laskenta on rakennettu osaksi lämmitystä: palvelimia on upotettu lämmityskattiloihin, vedenlämmittimiin ja rakennusten lämmitysjärjestelmiin. Ranskalainen Qarnot on upottanut palvelimia boileriratkaisuihin, ja brittiläinen Heata puolestaan myy laitteita, joissa palvelin lämmittää käyttövesivaraajaa. Joissakin malleissa yritys jopa maksaa sähkön itse, koska sen liiketoiminta on laskentatehossa, ei lämmössä.

Suomessakin yli megawatin datakeskuksilla on hukkalämmön hyödyntämiseen liittyvä velvoite, mutta se ei ole ehdoton kaukolämpöpakko: jos talteenotto ei ole teknisesti tai taloudellisesti järkevää, siitä voi vapautua. Suunta on kuitenkin selvä: laskennan tuottamaa lämpöä ei saa enää pitää pelkkänä jätteenä.

Valmiissa ratkaisuissa on kuitenkin yksi aukko. Niillä ajetaan usein jonkun muun laskentaa tai jonkun muun koodia, ja data liikkuu pois kotoa. Heata tosin maksaa laitteen käyttämän sähkön itse ja kompensoi talouden lämmityskuluja – mutta sekin ajaa silti ulkopuolisten kuormia. Omaa dataa, omia malleja ja omaa lämpöä yhdistävää kotiratkaisua saa etsiä. Tässä kohdassa absurdi ajatus muuttuu tuotekonseptiksi.

## HomeNode: lämmitä koti, aja malli

Entä jos tällainen laite suunniteltaisiin nimenomaan kodin omaksi? Kutsutaan konseptia vaikka HomeNodeksi. Se olisi kodin laskenta- ja lämmitysyksikkö: lämmitin, joka ajaa tekoälyä, tai tekoälypalvelin, joka lämmittää kotia. Lämpöä voisi ohjata joko huoneilmaan tai vesikiertoon, mutta tärkein osa olisi ohjausjärjestelmä. Se seuraisi rakennuksen sähkökuormaa, sähkön hintaa, sisälämpötilaa ja laskentatarpeita ja päättäisi, milloin lasketaan, kuinka isolla tarkkuudella ja kuinka paljon lämpöä samalla tuotetaan.

Kylmä talo tarkoittaisi enemmän laskentaa, lämmin talo vähemmän, ja pyykinpesukoneen käynnistys pudottaisi tarkkuutta. Kesällä laskenta siirtyisi viileämpiin tunteihin tai tarvittaessa pilveen. Koti ei lähetä dataa datakeskukseen; koti on datakeskus.

Onko tämä järkevää? Ei aivan. Rehellisyyden nimissä on sanottava, ettei HomeNode yritä huijata termodynamiikkaa. GPU tuottaa samalla sähköteholla suunnilleen yhtä paljon lämpöä kuin vastus – sähkö muuttuu lopulta lämmöksi, olipa se kulkenut kumman läpi tahansa. Hyöty ei ole lämmön ilmaisuudessa, vaan siinä että lämmön tuottamisen matkalla ehditään laskea ja että laskenta voidaan ajoittaa sinne, missä lämpöä tarvitaan. Lisäksi data ja mallit pysyvät kotona.

Jos sähkövastus muuttaa sähkön joka tapauksessa lämmöksi, kysymys on yksinkertainen: miksi lämmitysvastus ei saisi tehdä matkalla muutamaa matriisikertolaskua?

*Lämmitä koti. Aja malli. Säilytä data.*
