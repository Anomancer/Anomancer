# Anomancer 16.8.4 · Visual System Consolidation

16.8.4 kovettaa yksityisen Core-työpöydän visuaalisen järjestelmän ilman Agent Contract-, Constitution-, Artifact Boundary-, Evidence Layer- tai human authority -sopimusten muuttamista.

## CSS-vastuut

`admin.css` on nyt vain stylesheet-manifesti. Varsinaiset säännöt omistaa yksi seitsemästä kerroksesta:

- `ui-tokens.css` — semanttiset väri-, tila-, spacing-, typografia- ja kosketustokenit
- `admin-shell.css` — Core Shell, työtilakonteksti ja yhteiset kuorikomponentit
- `admin-workspace.css` — workspace-rakenteet ja paikalliset työpinnat
- `admin-editorial.css` — Anomancerin kirjoitus-, evidenssi- ja julkaisutyö
- `admin-narrative.css` — Narramancerin authoring-pinnat
- `admin-control-plane.css` — agentit, orkesterit, Konehuone ja tekninen ohjaustaso
- `admin-responsive.css` — kaikkien yksityisten työpintojen breakpointit ja mobiilireflow

Komponenttikerroksissa ei enää ole media queryja. Responsiivisuuden yksi omistaja on `admin-responsive.css`.

## Tokenisointi ja cascade

Yhteiseen token-kerrokseen lisättiin semanttiset surface-, border-, focus-, overlay-, varoitus-, fontti- ja line-height-tokenit. Toistuvia suoria arvoja korvattiin näillä ilman toiminnallisen värikielen muuttamista.

Komponentti-CSS:ään jäi vain yksi dokumentoitu `!important`-käyttö (`[hidden]` visibility-raja). Responsive-kerroksen kolme `!important`-sääntöä kuuluvat reduced-motion/utility-rajaan. Token-kerroksen visibility/reduced-motion utilityt säilyvät tarkoituksella vahvoina.

## Typografian ja kosketuksen minimit

Release-portti estää nyt sekä suorien `font-size`-määrittelyjen että `font:`-shorthandien putoamisen alle 12 pikselin. Tavallinen UI käyttää 14 px perustason tokenia ja metadata/chipit 12 px tokenia.

Pakollisilla painikkeilla ja valinnoilla on 44 px kosketuskohdesopimus. Mobiilin Core Shell + Workspace Context on tiivistetty auditoituun yläkromiin ilman pakollisten reittien piilottamista.

## Oikea selainmatriisi

`scripts/test-visual-system-1684.mjs` käynnistää paikallisen Chromium-pohjaisen selaimen ja käyttää Chrome DevTools Protocolia. Näin release-portti ei tarvitse erillistä Playwright-latausta mutta tarkistaa aidon selainrenderin eikä CSS-lähteen regexiä.

Matriisi:

- 1440×900 desktop
- 1024×768 pieni kannettava
- 768×1024 tabletti
- 390×844 puhelin
- 360×800 kapea puhelin
- 390×844 `prefers-reduced-motion: reduce`
- 390×844 `prefers-contrast: more`

Jokaisesta skenaariosta tarkistetaan ainakin:

- ei vaakasuuntaista dokumenttivuotoa
- näkyvät painikkeet ja selectit täyttävät kosketuskohteen minimin
- UI- ja metadatatekstin renderöity fonttifloori
- näkyvä näppäimistöfokus
- mobiilidokki / desktop-rail oikeassa breakpointissa
- mobiilin pysyvän yläkromin korkeus
- accessibility-puussa ei ole nimeämättömiä painikkeita
- renderöity screenshot syntyy onnistuneesti

Kuvakaappaukset syntyvät paikallisesti `.visual-regression/16.8.4/`-hakemistoon. Hakemisto on kehitystuotos eikä kuulu release-pakettiin.

Jos Chromium ei ole vakiohakemistossa, selaimen voi osoittaa muuttujalla `CHROMIUM_BIN=/polku/selaimeen`. Testi etsii automaattisesti yleiset Chromium-, Chrome- ja Brave-polut.

## Fixturet

`visual-fixtures/visual-system-1684.html` sisältää deterministisen visuaalifixturen, jossa on Core Shell, workspace-konteksti, mobiilidokki, Narramancer, Evidence Workbench, pitkä URL/hash/teksti, empty state, virhetila ja keskeiset kontrollit.

## Release-portti

`npm run check` ajaa uuden selainportin nykyisten turvallisuus-, workspace-, evidenssi-, orkesteri-, agentti-, public-boundary- ja kieliregressioiden lisäksi.

16.8.4 hyväksytään vain, jos lähdetason omistussäännöt ja oikea selainrenderi ovat yhtä aikaa vihreitä.
