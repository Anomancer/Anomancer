# Anomancer 1.18.2 · P2 Interaction & Navigation Hardening

## Tavoite

P2 kovettaa olemassa olevan monityötilaisen Coren navigaation, pitkien työpintojen palautteen, Arkiston mobiilityönkulun, responsive-kaskadin ja koko sovelluksen selainregression. Tämä ei vielä rakenna 1.18.3 Codemancer Workbenchia.

## Toteutettu

### 1. URL-state ja selainhistoria

Adminin osoite säilyttää nyt kolme palautettavaa tilaa:

- `workspace`
- `view`
- `section`

Core Shell kirjoittaa tilan History API:lla, palauttaa sen `popstate`-tapahtumasta ja päivittää aktiivisen paikallisosion ilman kovakoodattua Codemancer-haaraa. Workspace voidaan valita suoraan URL:sta ennen localStorage-fallbackia.

### 2. Yhteinen palaute pitkille työpinnoille

Uusi `admin-feedback.js` tarjoaa yhden saavutettavan status centerin. Lähetyskone, Mancer, Romancer, Arkisto ja Nanomancer voivat nostaa tallennus-, onnistumis- ja virhepalautteen samaan näkyvään kanavaan. Alkuperäiset paikalliset statuspinnat säilyvät, joten palaute ei riipu toastista yksin.

### 3. Arkiston mobiili master/detail

Alle mobiilibreakpointin Arkisto näyttää yhden tehtävän kerrallaan:

`lista → inspector → takaisin listaan`

Objektin valinta siirtää inspectoriin ja Takaisin listaan palauttaa selausnäkymän. Desktopin kaksipalstainen lista + inspector säilyy.

### 4. Responsive-kaskadin konsolidointi

`admin-responsive.css` muutettiin kronologisesta patch-pinosta kanoniseksi kaskadiksi:

- ennen: 58 media query -blokkia
- ennen: 29 erillistä `max-width:760px`-blokkia
- jälkeen: 15 yksilöllistä mediaehtoa
- jälkeen: yksi `max-width:760px`-blokki

Säännöt säilytettiin mediaehdon sisällä alkuperäisessä järjestyksessä, jotta cascade-semanttiikka ei muutu vahingossa.

### 5. Full-app admin story E2E

Uusi selainportti käyttää oikeaa `admin.html`:ää, oikeita tuotantomoduuleja ja mockattua API-rajapintaa. Se todistaa seuraavan tarinan:

1. session/login → URL:sta valittu Codemancer-työtila
2. section navigation → History API → back
3. edit → save
4. revision conflict → paikallinen työ säilyy
5. dirty workspace switch → peruuta estää vaihdon; puhdas workspace switch päivittää URL-kontekstin
6. yhteinen feedback center on osa oikeaa admin-DOMia

Testi paljasti lisäksi lifecycle-racen: Mancer saattoi erittäin nopeassa käynnistyksessä rekisteröityä vasta workspace-ready-eventin jälkeen. Moduuli ottaa nyt myös jo olemassa olevan workspace-kontekstin kiinni rekisteröityessään.

## Build, PWA ja installer

`admin-feedback.js` kuuluu nyt buildin staattiseen runtime-listaan ja service workerin shell-cacheen. `INSTALL_TO_CURRENT.sh` säilyttää edelleen `content/`- ja `media/`-rajat, mutta synkronoi muuttuneet `public/`-adminruntime-tiedostot eksplisiittisellä allowlistillä, jotta root/public-peilit eivät jää eri versioihin.

## Hyväksyntäportit

- P0 Integrity: 6/6 PASS
- P1 Codemancer Visual Surgery: 6/6 PASS
- P2 Interaction & Navigation static gate: 7/7 PASS
- P2 Full-app Admin Story E2E: 6/6 PASS
- Visual System: 8/8 PASS
- Native Dialog Consolidation: 7/7 PASS
- Living Machine Room: 21/21 PASS
- koko `npm run check`: PASS 2026-08-28

Pääketjun aikana kaksi vanhaa regressiotestiä päivitettiin mittaamaan media queryn käyttäytymistä eikä historiallista CSS-blokin järjestystä. Lisäksi Visual System löysi kaksi P2:ssa syntynyttä komponenttikohtaista media querya. Ne siirrettiin `admin-responsive.css`:n omistukseen. Lopputila on 0 komponenttimediaa ja 15 yksilöllistä responsive-mediaehtoa.

## Seuraava varsinainen vaihe

P2-hardening-portti on nyt vihreä koko release-ketjussa. Seuraava varsinainen tuoteaskel on 1.18.3 Codemancer Workbench: erikoisrendererit kuten file tree, code editor, diff view, task board, test run list, approval review ja release gate.
