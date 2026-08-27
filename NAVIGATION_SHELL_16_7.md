# Anomancer 16.7 · Navigation Shell

16.7 erottaa käyttöliittymän kolme navigaatiotasoa toisistaan.

## 1. Core Shell

Pysyvä ylin kerros kertoo missä osassa koko järjestelmää käyttäjä on:

- Työtilat
- Lähetykset
- Artefaktit
- Konehuone
- Asetukset

Konehuone ei ole enää Anomancer-editorin välilehti. Se on globaali control plane agenttien, orkestereiden, ajoprofiilien, ajojen ja sopimusrajojen tarkasteluun.

## 2. Työtilakonteksti

Core Shellin alla näkyvät valittu työtila, tarkoitus, orkesteri ja tallennustila. Työtilavalitsin toimii pikavaihtajana, mutta varsinainen kotipesä on Työtilat-näkymä.

Työtilakortit näyttävät työtilatyypin, tarkoituksen, artefaktirajan ja avaustoiminnon. Uuden koneen luonti alkaa samasta näkymästä.

## 3. Metadataohjattu paikallisnavigaatio

Paikallista navigaatiota ei kovakoodata Narramancerille tai Anomancerille. `Workspace Template.editorDefinition.navigation` määrittää ryhmät ja osiot.

Anomancer:

- Luo: Kirjoita
- Tarkista: Evidenssi, Agentit
- Ulos: Julkaisu

Narramancer:

- Luo: Projekti, Maailma, Hahmot, Juoni
- Kirjoita: Luvut, Aikajana, Kaanon
- Jalosta: Orkesteri
- Ulos: Vienti

Tämä rakenne antaa tuleville työtilatyypeille oman navigaation ilman uuden globaalin shellin rakentamista.

## Orkesterin keskeytyminen

Narramancer näyttää orkesterin vaiheet, nykyisen vaiheen ja valmiiden vaiheiden määrän. Jos ajo katkeaa mallivirheeseen tai tokenrajaan, valmiit vaiheet jäävät selainistunnon checkpointtiin ja ajo voidaan jatkaa samasta Runtime Snapshotista.

Checkpoint ei vielä säily selaimen uudelleenlatauksen yli. Se on tarkoituksellinen 16.7-raja, ei lupaus pysyvästä server-resumesta.

## Turvarajat

- työtilan vaihto ei ohita tallentamattomien muutosten varoitusta
- Narramancer ei saa Anomancerin julkaisukykyä
- Core Shell ei muuta Workspace Constitution- tai Artifact Boundary -sääntöjä
- content-safe asennin ei kopioi `content/`, `media/`, `public/` tai generoituja julkaisuja paketin mukana
