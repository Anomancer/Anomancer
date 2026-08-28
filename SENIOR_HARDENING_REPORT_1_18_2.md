# Anomancer 1.18.2 · Senior Core / UI / Security Hardening Report

**Päivä:** 2026-08-28  
**Pohja:** Anomancer 1.18.2 Native Dialog Consolidation  
**Versio:** 1.18.2 säilytetty tarkoituksella. Roadmap varaa 1.18.3:n Codemancer Workbenchille.

## Tiivistelmä

Tässä kierroksessa julkinen CORE, sen semantiikka ja turvallisuusraja sovitettiin nykyiseen 1.18.x-arkkitehtuuriin. Muutos ei tee yksityisestä control planesta julkista. Se tekee näkyväksi vain turvallisesti allowlistatun rakennekartan.

Samalla CORE-sivulle lisättiin 1.18.2 → 2.0 -roadmap natiivina disclosure-komponenttina. Roadmap on oletuksena suljettu ja käyttäjä avaa sen itse. Suomen- ja englanninkieliset versiot ovat erillisiä eivätkä nojaa sekalaisiin näkyviin kielikerroksiin.

## Korjatut valuvika-alueet

### 1. COREn semanttinen drift

Aiempi julkinen CORE kuvasi ensisijaisesti agentteja, orkestereita ja evidenssikerrosta. Nykyisessä koneessa on lisäksi Workspace Runtime, Mancer Package Runtime, Codemancer, Capability Registry / Nanomancer, Archive / Arkistonhoitaja, Artifact Boundary, Constitution Runtime ja yhteiset interface-rajat.

`server/public-core.js` muodostaa nyt eksplisiittisen public allowlist -rakenteen. Julkisuus ei perustu siihen, mitä private Core sattuu sisältämään, vaan siihen, mitä koodi nimenomaisesti sallii ulos.

### 2. Capability- ja Archive-julkisuusraja

Nanomancerin ja Arkistonhoitajan olemassaolo voidaan näyttää COREssa. Niiden private execution-, permissions-, operations- ja governance-runtimea ei julkaista. Vanhoja regressiotestejä päivitettiin vastaamaan tätä tarkempaa rajaa sen sijaan, että uutta arkkitehtuuria olisi piilotettu vanhan testioletuksen vuoksi.

### 3. Roadmapin UI/UX

Roadmap toteutettiin natiivilla `<details>` / `<summary>` -rakenteella:

- oletuksena suljettu ilman JavaScript-riippuvuutta,
- semanttinen selain- ja ruudunlukijakäyttäytyminen,
- näkyvä keyboard focus,
- vähintään 44 px kosketuskohde,
- 3 → 2 → 1 -sarakkeen responsiivinen korttirakenne,
- reduced-motion-raja,
- ei vaakasuuntaista ylivuotoa testatuilla näkymillä.

Chromium-portit: 1440×900, 390×844 ja 360×800.

### 4. FI/EN-kieliraja

COREn näkyvä tekninen sanasto lokalisoitiin siellä, missä kone-ID:tä ei tarvitse näyttää käyttäjälle. Suomenkielinen roadmap käyttää esimerkiksi nimiä Orkesterirekisteri, Kontekstiportti, Arkistograafi, Monimalliajo, Työkaluhiekkalaatikko, Komentopaletti ja Havainnoitavuus. Englanninkielinen CORE säilyttää oman englanninkielisen copy-kerroksensa.

### 5. Request body -kokoraja

`server/http.js` ja contact-reitti valvovat kokorajaa myös silloin, kun ympäristö on jo parsinnut request bodyn objektiksi. Näin parserin edeltävä kerros ei voi vahingossa ohittaa sovelluksen omaa kokorajaa.

### 6. Same-origin mutaatiot

Origin-tarkistus muutettiin fail-closed-malliin. Puuttuva, virheellinen tai eri originista tuleva Origin ei läpäise mutatoivaa rajaa. Testimockit päivitettiin jäljittelemään oikean selaimen turvallisuuskontekstia sen sijaan, että tuotantokoodia olisi löysennetty testien vuoksi.

### 7. Scrypt-parametrien resurssiraja

Salasanahashin parametrit validoidaan ennen kallista `scrypt`-derivointia. N-, r-, p- ja output-pituuksille on rajat, jotta vihamielisesti muotoiltu tallennettu hash ei voi pyytää rajatonta resurssikulutusta.

### 8. Selainrajat

Lisätty tai kovetettu:

- `X-Content-Type-Options: nosniff`,
- `Cross-Origin-Resource-Policy: same-origin`,
- `Cross-Origin-Opener-Policy: same-origin`,
- julkisen COREn tiukka Content Security Policy,
- `target="_blank"` -linkeille `rel="noopener noreferrer"`.

## Todennus

Täysi `npm run check` läpäisee. Pääketju sisältää vanhojen regressioiden lisäksi uudet:

- `scripts/test-senior-hardening-1182.mjs` · 7/7,
- `scripts/test-core-roadmap-ui-1182.mjs` · 3/3 viewport-porttia.

Lisäksi koko olemassa oleva agentti-, orkesteri-, evidence-, archive-, Mancer-, workspace-, public/private-boundary-, responsive-, visual-, domain- ja SEO-testikone läpäisee.

## Jäljelle jäävät tietoiset rajat

Tämä on hardening-kierros, ei todistus haavoittuvuuksien täydellisestä puuttumisesta.

- Contact rate limit on prosessikohtainen muistiraja. Hajautetussa serverless-ajossa vahvempi yhteinen rate-limit-store olisi erillinen kovennus.
- Julkinen UI käyttää edelleen Google Fonts -riippuvuutta. Sen voi myöhemmin self-hostata saatavuus- ja yksityisyysriippuvuuden pienentämiseksi.
- Multi-user tenant isolation, käyttäjäkohtaiset avaimet, roolit, retention ja billing eivät kuulu 1.18.2:een. Roadmap sijoittaa ne vasta mahdolliseen 2.0-kerrokseen.
- Codemancerin automaattista repository-writeä tai autonomista apply-silmukkaa ei lisätty. Human approval säilyy rajana.
- Dependency CVE -tilaa ei tässä raportissa väitetä auditoiduksi ulkoista advisory-lähdettä vasten.

## Periaate

CORE pysyy pienenä ja yleisenä. Mancerit määrittelevät työn maailmat, agentit roolit, capabilityt instrumentit, orkesterit työn yhdistämisen, Arkisto jäljen, Constitution toimivallan rajat ja ihminen lopullisen vallan.
