# Anomancer 16.0 · Interface System

16.0 on käyttöliittymä- ja semantiikkajulkaisu. Se ei lisää agenttimoottoriin uusia kyvykkyyksiä. Tavoite on tehdä 15.x-sarjassa kasvanut järjestelmä luettavaksi, saavutettavaksi ja ylläpidettäväksi yhtenä tuotteena.

## Kieliraja

Käyttäjälle näkyvä kieli määräytyy sivupinnan mukaan:

- `/` ja `/core` ovat suomeksi.
- `/en` ja `/en/core` ovat englanniksi.
- `/admin` on suomeksi.

FI- ja EN-Core ovat erillisiä HTML-dokumentteja, joilla on omat canonical-osoitteet ja vastavuoroiset `hreflang`-viittaukset. Ne käyttävät samaa turvallista Core-snapshotia, mutta dynaaminen käyttöliittymäsanasto valitaan dokumentin `lang`-attribuutista.

Tekniset protokolla-arvot, agentti-ID:t, hashit ja enumit eivät muutu käännöksen vuoksi. Jos konearvo on käyttäjän nähtävä, se esitetään teknisenä arvona esimerkiksi `<code>`-elementissä ja sen ympärillä oleva käyttöliittymä selittää merkityksen valitulla kielellä.

## Semanttinen nimeäminen

`workspace` tarkoittaa vain oikeaa agenttityötilaa. Editorin sisäisiä näkymiä ei enää kutsuta workspaceiksi.

Editorin rakenne käyttää nimiä:

- `editor-tabs`
- `editor-panel`
- `selectEditorView()`

Näin käyttöliittymän sanasto vastaa Coren ontologiaa: työtila on persistentti agenttiscope, editorin välilehti on vain näkymä.

## CSS-vastuut

16.0 jakaa visuaalisen järjestelmän viiteen vastuukerrokseen:

- `ui-tokens.css` — fontit, värit, pinnat, reunat, spacing, radius, focus, motion ja kosketuskohteen minimikoko.
- `styles.css` — julkisen sivuston yhteiset sivut, artikkelit, navigaatio ja sisältöpinnat.
- `core.css` — julkisen Coren tuoterakenne ja read-only-arkkitehtuurinäkymä.
- `admin.css` — editori, lähteet, evidenssi, media ja adminin yleinen layout.
- `admin-control-plane.css` — Agent Pool, orkestrointi, Tool Broker, Model Router, Run Explorer ja muu yksityinen Core.

CSS-osiot nimetään vastuun, eivät historiallisen versionumeron mukaan.

## Saavutettavuus

Editorin näkymät käyttävät oikeaa ARIA-tab-mallia:

`tablist → tab → tabpanel`

Välilehtiä voi vaihtaa myös nuolinäppäimillä. Järjestelmässä on yhteiset `:focus-visible`-säännöt, vähintään 44 pikselin interaktiokohteet, `prefers-reduced-motion` ja vahvemman kontrastin tuki.

## Responsiivinen rajaus

16.0 määrittää viewportin kovaksi rajaksi. Piilotetut lomakekontrollit eivät saa kasvattaa dokumentin leveyttä, mobiiliyläpalkki saa murtaa rakenteensa ja editorin sivupaneeli muuttuu pienellä näytöllä off-canvas-paneeliksi.

Release-auditissa responsiivisuus tarkistetaan lähdetasolla viewport-containment-, grid-collapse- ja breakpoint-säännöillä. Selainrenderi on suositeltu viimeinen visuaalinen hyväksyntä tuotantoympäristössä, mutta release-portti ei väitä headless-renderiä onnistuneeksi ilman todellista selaintulosta.

## Pysyvät regressioportit

`scripts/test-ui-semantics.mjs` valvoo muun muassa:

- yhteistä token-kerrosta
- CSS-vastuiden erottelua
- editorin semanttista nimeämistä
- ARIA-tab-rakennetta
- fokus- ja motion-sääntöjä
- kosketuskohteiden minimikokoa
- viewport-containmentia
- piilotettujen tiedostovalitsimien saavutettavia nimiä
- Vercelin 12 API-entrypointin rajaa

`scripts/test-language-boundaries.mjs` valvoo FI/EN-erottelua, canonical/hreflang-rakennetta, adminin suomenkielisyyttä, näkyvien vanhojen release-numeroiden poissaoloa sekä dynaamisen Core-sanaston kielivalintaa.

## Mitä 16.0 ei muuta

16.0 ei muuta Agent Contracteja, Tool Brokerin toimivaltarajoja, Model Routerin route-politiikkaa, Runtime Snapshotin turvallisuusmallia, Custom Orchestra -validointia, Run Storea tai Workspace Foundationin eristystä.

Persistenttien selaintilojen vanhat versionoidut avaimet voidaan säilyttää, jos niiden skeema ei muutu. Käyttöliittymäversion nousu ei yksinään saa katkaista checkpoint-, policy-log- tai workspace-valintojen jatkuvuutta.

## 16.0.1 · Surgical UX Pass

16.0.1 ei muuta Interface Systemin semanttista perustaa, vaan vähentää kognitiivista kuormaa Lähetyskoneessa. Lähetyslista on off-canvas drawer, editori/esikatselu-jako on käyttäjän säädettävä ja tallentuu selaimeen, ja toissijaiset työkalut ovat progressiivisen paljastamisen takana. Perustiedot ja varsinainen teksti pysyvät ensisijaisina. Evidenssin lomakekontrollit käyttävät samaa kontrollikieltä kuin muu editori.

Asettelun selainkohtainen tila ei ole agentin Runtime Profile eikä workspace-dataa. Se ei koskaan vaikuta agenttien toimivaltaan, mallireititykseen, evidenssiin tai julkaisuporttiin.
