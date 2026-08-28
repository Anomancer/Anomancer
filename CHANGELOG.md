# Changelog

## 1.18.2 · P1 Codemancer Visual Surgery · 2026-08-28

- korvattu viisi määrittelemätöntä CSS-muuttujaa yhteisen Visual Systemin kanonisilla design-tokeneilla
- lisätty Codemancerin input-, select- ja textarea-kontrolleille eksplisiittinen tumma pinta, reunus, kontrasti, padding, hover-, focus- ja disabled-tila
- säilytetty natiivien kontrollien semantiikka sekä lisätty tumma `color-scheme` ja mobiilin 16 px tekstikoko
- tiivistetty Codemancerin mobiilikomennuspalkki yhdelle riville ja poistettu toistuva metadata pieneltä näytöltä
- muutettu governance-hierarkiaa: ihmisen lopullinen päätösvalta näkyy otsikon tunnisteena, varsinainen työ tulee ennen teknistä sopimusluukkua
- siirretty sopimusmetadata suljettuun tekniseen disclosureen työpinnan jälkeen
- päivitetty deterministinen Codemancer-fixture sekä Chromium-portti mittaamaan kontrollien pinta, kontrasti, korkeus, mobiilifontti, komentopalkin korkeus ja sisällön järjestys
- lisätty `scripts/test-p1-codemancer-visual-1182.mjs` pääregressioketjuun
- säilytetty pakettiversio 1.18.2, jotta roadmapin 1.18.3 pysyy varsinaisena Codemancer Workbench -julkaisuna

## 1.18.2 · P0 Integrity Hardening Patch · 2026-08-28

- lisätty yhteinen dirty-rekisteri Lähetyskoneelle, Romancerille ja geneerisille Mancer-työtiloille
- korjattu `beforeunload`, uloskirjautuminen ja työtilavaihto vartioimaan kaikkien rekisteröityjen editorien tallentamattomia muutoksia
- poistettu Codemancerin ja Romancerin revision conflict -polkujen automaattinen reload, joka saattoi korvata paikallisen työn
- lisätty konfliktipalkit: paikallisen ja palvelinversion JSON-turvakopio, palvelinversion hyväksyminen sekä eksplisiittinen paikallisen version säilyttäminen
- sidottu Mancer-, Romancer-, Nanomancer- ja Lähetyskone-pyynnöt workspace-id:hen, request-id:hen ja peruttavaan `AbortController`-signaaliin
- säilytetty tallennuspyynnön aikana syntyneet uudemmat paikalliset muutokset Mancer- ja Romancer-editoreissa
- tyhjennetty Nanomancerin tulos, lähteet ja capability-metadata välittömästi työtilavaihdossa
- estetty Nanomancer-analyysin arkistointi väärän työtilan alle
- estetty työtilavaihto aktiivisen Lähetyskone-tallennuksen aikana
- lisätty `scripts/test-p0-integrity-1182.mjs` pääregressioketjun ensimmäiseksi portiksi
- säilytetty pakettiversio 1.18.2: tämä on auditin P0-korjauspatch, ja roadmapin 1.18.3 pysyy varattuna Codemancer Workbenchille

## 1.18.2 · Senior Core / UI / Security Hardening · 2026-08-28

- päivitetty julkinen CORE vastaamaan 1.18.x-rakennetta: Workspace Runtime, Mancer Package Runtime, Codemancer, Capability Registry / Nanomancer, Archive / Arkistonhoitaja, Artifact Boundary, Constitution Runtime, Human Approval, Model Router, Tool Broker sekä yhteinen interface system
- lisätty CORE-sivulle 1.18.2 → 2.0 -roadmap natiivina `details`/`summary`-disclosure-pintana; se on oletuksena suljettu, näppäimistöllä käytettävä ja responsiivinen
- eroteltu FI/EN-roadmapit ja siivottu julkiselta CORE-sivulta vanhentunutta runtime-/snapshot-/fallback-jargonia
- muutettu julkinen Capability- ja Archive-esitys eksplisiittiseksi allowlistiksi: olemassaolo ja turvallinen metadata voivat näkyä ilman yksityisiä oikeus-, suoritus- tai governance-sopimuksia
- kovetettu JSON-body-raja myös valmiiksi parsituille request-bodyille
- muutettu mutatoivien pyyntöjen Origin-tarkistus fail-closed-malliin
- rajattu scrypt-parametrit ennen kallista derivointia resurssinkulutushyökkäysten pienentämiseksi
- lisätty `nosniff`, CORP, COOP sekä julkisen COREn tiukka CSP; kovetettu `target=_blank`-linkit `noopener noreferrer` -rajalla
- lisätty `scripts/test-senior-hardening-1182.mjs` ja oikeassa Chromiumissa ajettava `scripts/test-core-roadmap-ui-1182.mjs` osaksi pääregressioketjua
- päivitetty vanhat Nanomancer- ja Arkistonhoitaja-testisopimukset vastaamaan uutta turvallista julkisuusrajaa ilman private runtime -vuotoa
- säilytetty versiona 1.18.2, koska 1.18.3 on roadmapissa varattu Codemancer Workbenchille

## 1.18.2 · Native Dialog Consolidation

- Korvaa adminin natiivit `alert()`, `confirm()` ja `prompt()` -työpolut yhteisellä async-dialogi-API:lla.
- Säilyttää human authority -vahvistukset workspace-, Archive-, orchestra-, agentti- ja editorial-toiminnoissa.
- Lisää fokuspalautuksen, `inert`-rajan, Escape/peruuta-polun ja yhtenäisen mobiilidialogin.
- Yhdistää kuvan alt-tekstin ja kuvatekstin yhteen validoituun lomakedialogiin.
- Lisää 1.18.2 Chromium-portin desktopille ja 360 px puhelimelle.
- Jättää PWA install-promptin koskemattomaksi, koska `prompt.prompt()` ei ole `window.prompt()`.


## 1.18.1 · Semantic Workbench Hardening

- korjattu release-estävä Mancer CSS -integraatio: `admin-mancer.css` kuuluu nyt sekä tuotannon stylesheet-manifestiin että browser-porttiin
- vaihdettu käyttäjälle näkyvä Narramancer-nimi Romanceriksi legacy-ID:t säilyttäen
- lokalisoitu Codemancerin näkyvät osiot, hyväksymisvaiheet ja orkesterinimet kone-id:itä muuttamatta
- siirretty workspace-/package-id:t ja hashit avattaviin teknisiin tietoihin
- lisätty Codemancerin Tarkistus- ja Julkaisu-osioihin eksplisiittinen human authority -raja
- lisätty geneeriselle Mancer-kokoelman poistolle Kumoa ennen tallennusta
- yhtenäistetty Mancer-editorin ja Core Shellin tallennustila
- selkeytetty Arkiston ja Nanomancerin näkyvää protokollajargonia
- kovetettu alle 420 px Core-navin tilankäyttö
- lisätty `scripts/test-semantic-workbench-1181.mjs` ja päivitetty oikea Chromium-pohjainen Mancer UI -portti
- dokumentoitu 21 legacy-native-dialog -kutsua erilliseksi myöhemmäksi overlay-konsolidointivelaksi

## 1.18.0 · Mancer Runtime + Codemancer

- Mancer Package Spec v1 + server-side package discovery/validation.
- Codemancer reference package: Project, Architecture, Code, Tasks, Tests, Runs, Review, Release, Documentation.
- Generic schema-workbench UI with package-driven desktop/mobile navigation.
- Generic workspace-scoped Mancer Artifact Store.
- Mancer Registry UI and safe missing-package fail-closed state.
- Package-local Constitution, Artifact Boundary, Approval Model, Agent Bindings, Orchestra Registry and Archive Policy.
- Browser and runtime release gates prove the Core Shell does not hardcode Codemancer navigation.

# Anomancer 1.17.3 · Arkistonhoitaja

- lisätty deterministinen Archive Governance Agent ja versionoidut governance report/proposal -sopimukset
- lisätty Archive-indeksi tyypeille, työtiloille, projekteille, statuksille ja tageille
- lisätty exact- ja near duplicate -seulonta ilman kielimallia
- lisätty relation integrity, project relation, retention review ja orphan object -havainnot
- lisätty Archive Health -pisteytys ja eheysraportti
- kaikki Arkistonhoitajan ehdotukset ovat `mutationAllowed:false` ja vaativat ihmisen päätöksen
- Arkistonhoitaja ei saa kirjoittaa, poistaa, myöntää granteja, varmentaa evidenssiä tai julkaista
- lisätty Arkisto-pintaan responsiivinen Arkistonhoitaja-paneeli ja human-approved raportin tallennus
- lisätty `scripts/test-archive-curator-1173.mjs` ja Chromiumissa ajettava `scripts/test-archive-curator-ui-1173.mjs`
- säilytetty Archive Core-, Nanomancer-, Human Approval-, Workspace-, Evidence- ja Public/Private Boundary -rajat

# Anomancer 1.17.2 · Nanomancer

- lisätty versionoitu Capability Registry ja `anomancer-capability-plugin/v1` -sopimus
- lisätty Nanomancer ensimmäiseksi uudelleenkäytettäväksi read-only capability-pluginiksi
- lisätty deterministiset compare-, diff-, consistency-, deviation- ja cross-run-operaatiot
- lisätty `anomancer-nanomancer-analysis/v1` structured analysis artifact ja deterministinen SHA-256 analysisHash
- rajattu Archive-luku owner/grant-periaatteella ja kirjattu käytetty muistijoukko Context Receiptiin
- rajattu Run Record -vertailu aktiiviseen workspaceen; raakaa promptia/outputia ei käsitellä
- lisätty private Capability API nykyisen Core gatewayn alle ilman uutta serverless entrypointtia
- lisätty Konehuoneeseen Nanomancer Analyysimikroskooppi ja erillinen human-approved Arkistoon tallennus
- lisätty `admin-nanomancer.js/css` Visual System -omistusrakenteeseen ja PWA/build stageen
- lisätty `scripts/test-nanomancer-1172.mjs` sekä Chromiumissa ajettava `scripts/test-nanomancer-ui-1172.mjs`
- säilytetty Human Approval-, Archive-, Workspace-, Artifact-, Evidence- ja Public/Private Boundary -rajat muuttumattomina

# Anomancer 1.17.1 · Archive Core

- lisätty server-authoritative Archive Store memory- ja GitHub tag -backendeilla
- lisätty versionoitu Archive Object v1 provenance-, relations-, retention-, visibility- ja integrity-kentillä
- tehty Archive-kirjoituksesta eksplisiittisen human approval -portin takainen
- lisätty workspace-oletuseristys ja ihmisen hyväksymä cross-workspace read grant
- lisätty Context Receipt v1 käytetyn ja avaamatta jääneen muistijoukon todentamiseen
- lisätty poistoihin integrity-tombstone hiljaisen muistiaukon estämiseksi
- lisätty globaali Arkisto-reitti, haku, suodatus, Inspector, provenance-, relation- ja grant-näkymät
- lisätty `admin-archive.js` ja `admin-archive.css` Visual Systemin omistusrakenteeseen
- lisätty Archive API olemassa olevan `/api/admin/core?resource=archive` -gatewayn alle ilman uutta serverless entrypointtia
- lisätty `scripts/test-archive-core-1171.mjs` ja oikeassa Chromiumissa ajettava `scripts/test-archive-ui-1171.mjs`
- säilytetty Archive erillään automaattisesta LLM-muistista sekä nykyiset Human Approval-, Workspace Isolation- ja Public/Private Boundary -rajat

# Anomancer 16.9.0 · Public Clarity Pass

- jaettu julkinen Core kolmeen päälukuun säilyttäen yhdeksän teknistä rakenneankkuria
- yhdistetty build-fallback ja client-renderi samaan `public-core-render.js`-snapshot-rendereriin
- poistettu kovakoodattu vanhentunut Core-fallback ja generoitu nykyiset agentit sekä orkesterit allowlist-snapshotista
- vaihdettu julkinen ohjaustaso/control plane -terminologia rakennenäkymäksi ja vähennetty toistuvat status-/Admin-CTA:t
- lisätty Narramancerin 9-vaiheiselle orkesterille kapean puhelimen pystyaikajana
- yhdistetty Lähetysten mobiilin aihe- ja yleisöfiltterit yhteen bottom sheetiin
- lisätty yleisöfiltterien määrät, aktiivisten suodattimien yhteenveto ja Tyhjennä-toiminto
- poistettu nollasisältöiset yleisöfiltterit aktiivisesta julkisesta suodatinpinnasta
- tiivistetty FI/EN-etusivun hero ja yhteyscopy sekä poistettu kovakoodattu ikä ja vanheneva aikajakso
- lisätty `scripts/test-public-clarity-169.mjs` osaksi `npm run check` -ketjua

# Anomancer 16.8.4 · Visual System Consolidation

- jaettu yksityisen UI:n CSS selkeisiin token-, shell-, workspace-, editorial-, narrative-, control-plane- ja responsive-omistajiin
- muutettu `admin.css` stylesheet-manifestiksi ja keskitetty breakpointit `admin-responsive.css`:ään
- laajennettu semanttisia design tokeneita sekä kovetettu fontti- ja spacing-rytmi
- poistettu alle 12 px suorat ja shorthand-fonttikoot yksityisestä UI:sta
- rajattu komponenttikerroksen `!important` visibility-rajaan
- lisätty 44 px kosketuskohdesopimus ja kompakti mobiilikromi
- lisätty pitkä-, empty-, error-, evidence- ja Narramancer-visuaalifixture
- lisätty oikeassa Chromium-renderissä ajettava desktop/tablet/mobile/reduced-motion/contrast-matriisi
- selainportti tarkistaa overflow'n, kosketuskohteet, fonttifloorit, fokuksen ja accessibility-puun
- lisätty `scripts/test-visual-system-1684.mjs` osaksi `npm run check` -ketjua

# Anomancer 16.8.3 · Evidence Interaction

- rakenteiset lähde- ja väitekortit Evidence Layeriin
- lähteiden valinta suoraan väitteille
- valmiusmittari ja väitekohtaiset julkaisuesteet
- raakamuoto siirretty Tekninen data -osioon
- serveripuolen evidenssi- ja julkaisuportti säilytetty muuttumattomana
- lisätty `scripts/test-evidence-interaction-1683.mjs`

# Anomancer 16.8.2 · Responsive Workspace + Narramancer Maturity

## 16.8.2

- lisätty Narramanceriin näkyvä Suomi / English -projektikieli ja viety kieli Markdown-artefakteihin
- lokalisoitu lukujen ja kaanonin kone-enumit käyttöliittymässä ilman tallennusformaatin rikkomista
- lisätty 10 sekunnin Kumoa-poisto hahmoille, luvuille, aikajanalle ja kaanonille
- lisätty lukujen ylös/alas-järjestely ja hallittu uudelleennumerointi
- lisätty projektin ja aktiivisen luvun selainotsikko sekä tallentamattoman työn indikaattori
- lisätty orkesteriehdotuksen rakenteinen diff ennen ihmisen soveltamista
- siirretty raaka agentti-JSON Tekninen data -pinnan alle
- PWA-cache ja release metadata päivitetty 16.8.2:een
- lisätty `scripts/test-narramancer-authoring-1682.mjs`

## 16.8.1

- lisätty Workspace Template -ohjattu `mobilePrimary` sekä Anomancerille että Narramancerille
- rakennettu mobiilidokki dynaamisesti samasta editorimetadatasta kuin desktopin paikallisnavigaatio
- poistettu Narramancerin vaakavieritettävä kolmas mobiilinavigaatiokerros
- lisätty yhteinen natiivi bottom sheet työtilan toissijaisille reiteille, työtilan vaihdolle ja komennoille
- lisätty yhteinen `admin-overlays.js`: yksi overlay kerrallaan, Escape, inert, fokusrajaus ja fokuksen palautus
- nostettu mobiilin pakollisten kosketuskohteiden ja navigaatiolabelien vähimmäiskokoa
- lisätty 360 px vaakavuodon suoja
- lisätty `scripts/test-responsive-workspace-navigation-1681.mjs`

# Anomancer 16.8.0 · Core Shell Semantics

## 16.8.0

- erotettu globaali Anomancer Core -shell Anomancerin Lähetyskone-työtilasta
- rajattu globaali navigaatio kohteisiin Työtilat, Nykyinen työ, Konehuone ja Asetukset
- siirretty Lähetykset, Orkesteriajo, Julkaisu sekä Aineisto & ulostulo Anomancerin metadataohjattuun paikallisnavigaatioon
- poistettu Lähetykset-reitin piilotettu työtilanvaihto ja siitä syntynyt tallentamattomien muutosten sivuvaikutus
- lisätty tyhjälle eristetylle työtilalle oma turvallinen kotinäkymä ilman Anomancer-editoria tai julkaisukohdetta
- siirretty näkyvä julkaisumetadata Asetusten Järjestelmätiedot-osioon
- säilytetty `/lahetyskone`-reitti, PWA-scope, Workspace/Constitution/Artifact Boundary -rajat ja ihmisen lopullinen päätösvalta
- lisätty 16.7-avainten jatkuvuusmigraatio 16.8-selaintilaan
- PWA-cache päivitetty 16.8.0:aan
- lisätty `scripts/test-core-shell-semantics-168.mjs`

# Anomancer 16.7.1 · Navigation Shell Visual Hardening

## 16.7.1

- korjattu Core Shellin 320 px puristus nollaamalla legacy `.app`-gridin sarakkeet
- yhtenäistetty Core Shellin desktop-header ja aktiivisen reitin visuaalinen tila
- kovetettu Workspace Context Barin grid, dropdownit ja tallennusstatus
- parannettu Konehuoneen leveys, spacing, 7 mittarin desktop-rivi ja Constitution-yhteenveto
- lisätty 1220/980/760 px hallittu reflow ilman vaakavuotoa
- säilytetty mobiilin pikatoiminnot ja metadataohjattu paikallisnavigaatio
- PWA-cache päivitetty 16.7.1:een
- lisätty `scripts/test-navigation-shell-1671.mjs`

# Anomancer 16.7.0 · Navigation Shell

## 16.7.0

- lisätty pysyvä Core Shell: Työtilat, Lähetykset, Artefaktit, Konehuone ja Asetukset
- lisätty Työtilat-kotipesä ja Workspace Context Bar
- siirretty Konehuone editorin paikallistabista globaaliksi control planeksi
- lisätty metadataohjattu navigaatiosopimus Anomancer- ja Narramancer-templateihin
- lisätty työtilakohtainen Artefaktit-näkymä
- säilytetty mobiilin tallenna-, julkaisu-, esikatselu-, Konehuone- ja asetustoiminnot uudessa shellissä
- lisätty Narramancer-orkesterin vaiheprogressi ja selainistunnon checkpoint-jatkaminen token-/mallikatkosta
- työtilan vaihto ei jatka navigointia, jos tallentamattomien muutosten portti perutaan
- lisätty `admin-shell.js` ja `scripts/test-navigation-shell-167.mjs`
- koko regressiosviitti läpäisee 16.7:n uuden informaatioarkkitehtuurin

# Anomancer 16.6.0 · Narramancer Vertical Slice

## 16.6.0

- lisätty `narramancer/story-studio/1.0.0` Workspace Template ja `narramancer/story-constitution/1.0.0`
- lisätty metadataohjattu Narramancer-editori: projekti, maailma, hahmot, juoni, luvut, aikajana, kaanon, orkesteri ja vienti
- lisätty workspace-kohtainen private Artifact Store revision conflict -suojalla
- lisätty 9 narratiivista agenttia ja built-in Narramancer Story Orchestra
- palvelin estää agentit, joita valitun Workspace Templaten `allowedAgentIds` ei salli
- Runtime Snapshot kantaa nyt koko Orchestra Contractin policy-kentät, myös Narramancerin continuity-policyn
- Narramancer-orkesteri toimii ehdotuskopiolla ja vaatii ihmisen soveltamisen sekä erillisen tallennuksen
- lisätty Markdown-projektikansio ZIPinä, koottu Markdown-käsikirjoitus ja JSON-varmuuskopio
- ei automaattista julkaisua eikä Anomancer-sisällön näkyvyyttä Narramancerissa
- lisätty `scripts/test-narramancer-166.mjs`

# Anomancer 16.5.0 · Workspace Types + Artifact Boundary

## 16.5.0

- Workspace Registry v2: server-authoritative `templateId`, Template- ja Constitution-hashit sekä artifact/content/output/UI-sidokset.
- Sisäänrakennettu Anomancer-template säilyttää `default`-id:n, legacy-tagit, sisällön ja julkaisuputken.
- Uusi `Tyhjä eristetty työtila` ei peri Anomancerin sisältöä, Editorial-orkesteria eikä Vercel-julkaisukohdetta.
- Artifact Boundary estää muun työtilan postaus-, media- ja julkaisukirjoitukset palvelimella; listaus palauttaa tyhjän näkymän ilman sisältövuotoa.
- Yläpalkissa erilliset Työtila- ja Orkesteri-valitsimet. Työtilan vaihto päivittää orkesterit, runtimen, ajot, käytön ja editorin artefaktikontekstin.
- Runtime Snapshot v4 allekirjoittaa Workspace Templaten, Constitutionin ja Artifact Boundaryn.
- Sisältöturvallinen asennin jättää `content/`, `media/`, `public/` ja generoidut julkaisuhakemistot kopioimatta sekä varmistaa sisältösormenjäljen testien jälkeen.

## 16.4.0

- Lisätty asennettava `/lahetyskone`-PWA, standalone-ikkuna ja turvallinen offline-sovelluskuori.
- Rajattu service worker vain Lähetyskoneeseen; API:t ja julkiset Anomancer-pinnat jätetään välimuistin ulkopuolelle.
- Lisätty sovelluksen asennusohjaus, verkkoyhteyden tila ja PWA-kuvakkeet.
- Ohjattu `/admin` yhteensopivasti `/lahetyskone`-osoitteeseen.
- Erotettu julkinen Core yksityisestä Konehuoneesta käyttöliittymäkielellä.
- Nimetty ihmisen lopullinen toiminto `Julkaise eetteriin` -portiksi muuttamatta palvelinauktoriteettia.
- Lisätty App Split -raja- ja regressiotestit.

# Anomancer 16.3.5 · Evidence Boundary Hygiene + consolidated full release

- `lähde-ehdokas`, `kandidaattilähde`, `source candidate` ja `candidate source` eivät saa vuotaa writer-, audience- tai voice-agentin julkaistavaan bodyyn.
- Evidenssin `verification: candidate` säilyy evidenssimetadatassa; neutralointi ei promotoi lähdettä varmennetuksi.
- Nykyiselle vanhalle luonnokselle admin tarjoaa hallitun workflow-leiman neutraloinnin editorissa ilman automaattijulkaisua.
- 16.3.4:n editorial-portti säilyy viimeisenä hard block -turvaverkkona.
- Full release sisältää myös 16.3.3:n mobiilin control-plane reflow'n ja Lisää-komentopinnan portal-korjauksen.

# Anomancer 16.3.4 · Editorial Gate Calibration

- Sisäiset lähdestatukset (`kandidaattilähde`, `lähde-ehdokas`) pysyvät julkaisuesteenä.
- Rehellinen epävarmuuskieli (`toistaiseksi varmistamaton`, vahvistamatta jääminen) on warning, ei hard block.
- Admin näyttää editorial-portin tarkan osuman ja onnistuneen julkaisun warningit.

# Anomancer 16.3.3 · Mobile Control Plane Reflow

- Myöhemmin ladattu `admin-control-plane.css` omistaa lopullisen mobiilicascaden.
- Core-mittarit, agentit, työkalut, usage-kortit, dialogit ja ajohistoria reflowavat puhelimessa ilman kirjainpylväitä tai hash-vesiputousta.
- Viewportin vaakavuoto katkaistaan control-plane-juuresta ja alapalkki pysyy ruudun sisällä.
- Lisää-komentopinta portaloidaan headerin stacking contextin ulkopuolelle.

# Anomancer 16.3.2 · Mobile Workspace

- Lähetyskoneen mobiili on nyt oma käyttötila eikä desktop-layoutin kutistettu versio.
- Uusi ohut safe-area-tietoinen alapalkki: Lähetykset, Kirjoita, Evidenssi, Agentit ja Lisää.
- Lähetykset avautuu täyskorkeana drawerina; editorin vanha mobiilissa ahdas listanäkymä poistuu.
- Kirjoita-, Evidenssi- ja Agentit-näkymiin vaihdetaan suoraan peukalodokista ilman erillistä sticky-tab-riviä.
- Lisää avaa mobiilin komentolevyn tallennukselle, julkaisulle, esikatselulle, Corelle, työtilalle, asettelulle, julkiselle sivulle ja poistumiselle.
- Esikatselu on puhelimessa oma overlay-työtila eikä editorin alle pinoutuva pitkä paneeli.
- Vanha sticky Tallenna/Julkaise-rivi poistuu mobiilissa dokin tieltä; poisto pysyy erillisenä vaaratoimintona.
- Markdown-editori saa 58dvh työskentelykorkeuden ja 16 px tekstikoon, joka ehkäisee mobiiliselainten tahatonta input-zoomia.
- Orkesteri-, evidenssi- ja Core-pinnat taittuvat puhelimessa yksipalstaisiksi, mutta agenttien toimivalta, evidenssiportit ja runtime pysyvät muuttumattomina.
- Uusi `test-mobile-workspace-1632.mjs` lukitsee mobiilinavigaation, overlay-esikatselun, drawerin ja safe-area-käytöksen regressiotestiksi.
- Core pysyy 16.3.0:ssa; muutos koskee yksityisen Lähetyskoneen käyttöliittymää.

# Anomancer 16.3.1 · Editorial Quality Hardening

- Ihmisen lisäohje tulkitaan toimitukselliseksi tarkoitukseksi, ei julkaisutekstiksi kopioitavaksi sanastoksi.
- Kirjoitusagentti ei saa nostaa varmistamattomia lähde-ehdokkaita julkiseen proosaan; evidenssivaje jää toimituksen huomioihin.
- Kriitikko ja äänieditori etsivät nyt prosessimetakieltä, toistuvia argumenttikaavoja, kasautuneita varauksia ja pääaiheesta harhautuvia otsikoita.
- Uusi deterministinen julkaisuportti torjuu orkesterin metakielen, sisäisen lähdevelan ja ylikäytetyn “ei X vaan Y” -rytmin. Luonnoksen voi silti tallentaa keskeneräisenä.
- Tämänpäiväiset työ- ja agenttiturvallisuustekstit on tiivistetty, luokiteltu uudelleen ja puhdistettu sisäisestä toimitussanastosta.
- Agenttiturvallisuustekstin otsikko ja slug kuvaavat nyt varsinaista aihetta. Vanha URL ohjautuu pysyvästi uuteen artikkeliin.
- Myös taide- ja opettajatekstien toistuvaa vastakkainasettelurytmiä on kevennetty merkitystä muuttamatta.
- Core-sopimukset, työkalupinta, toimivaltarajat ja Core 16.3.0 säilyvät ennallaan.

# Anomancer 16.3 · Living Machine Room

## Senior UI/UX + logic/security audit hardening

- Poistettu admin-dialogin CSP:n estämät inline-eventit ja lisätty painikkeiden eksplisiittiset tyypit.
- Korvattu konehuoneen ja orkesterisuunnitelman dynaamiset `innerHTML`-rakenteet turvallisilla tekstisolmuilla.
- Rajattu telemetrian tapahtumakoodit, numerot ja ohjausmerkit sekä selkeytetty ruudunlukijan live-alue.
- Korjattu orkesterin stop/resume-vaiheen kohdistus, keskeytettävä retry-viive ja kaikkien agenttien disabled-tila.
- Rajoitettu ajo kirjataan ja esitetään nyt rajoitettuna myös disabled-vaiheiden vuoksi.
- Agenttien väliset tulokset välitetään eksplisiittisesti epäluotettavana datana prompt-injektion vaikutuksen pienentämiseksi.
- Syväjäädytetty Core Registryjen sisäiset toimivalta-, reitti- ja orkesterirakenteet.
- Kovennettu custom/built-in Orchestra Contract -raja, cookie-parseri, media-polut, buildin kirjoituspolut, slug-validointi ja JSON-LD-karkaisu.
- Lisätty pysyvä `test-senior-audit-163.mjs`-regressioportti.

- Turvallinen `anomancer:telemetry`-tapahtumakerros orkesteriajolle.
- Kolme esitystilaa: Työrauha, Elävä konehuone ja OE-tila.
- Pesukarhu toimii prosessikursorina eikä muuta runtimea tai päätösvaltaa.
- Telemetrian detail on eksplisiittisesti allowlistattu eikä sisällä promptteja, post-dataa, raakavastauksia tai päättelyä.
- Virhe-, retry-, rinnakkaisajo-, evidenssi- ja julkaisupakettitilat saavat omat vakioidut event-koodit.
- `prefers-reduced-motion` sammuttaa animaatiot.
- Core 16.3.0.

# Anomancer 16.2 · Evidence Presentation + Visualization

- hyväksytyn evidenssin inline / lähderivi / molemmat -esitystapa
- Julkaisupaketti ehdottaa vain varmennettuja citation placement -rakenteita
- valinnainen Visualisointivahti, evidenssisidottu chart spec, deterministic SVG, human approval
- Core 16.2.0

# 16.1.0 — Boundary + Provenance Hardening

- Public Core siirtyy eksplisiittiseen allowlist-snapshotiin (`anomancer-core-public/v2`): tarkat tokenrajat, provider-targetit, fallback-järjestys, runtime-profiilit ja write/deny-matriisit eivät enää kuulu julkiseen JSONiin.
- Build tuottaa turvallisen `release-provenance.json`-kuitin: release/core-versio, build-aika, source revision kun saatavilla, public-schema-hash sekä agentti-, orkesteri- ja työkalurekisterien hashit.
- Vercel API -entrypointit yhdistetty 12 → 4: `auth`, `content`, `core`, `contact`. Domain-handlerit säilyvät erillisinä `server/admin-routes/`-kerroksessa.
- Tuntemattomat gateway-resurssit fail-closed 404:ään.
- Lisätty pysyvät Public Disclosure Boundary- ja API Surface -regressioportit.
- Ei uusia agentteja, työkaluoikeuksia tai julkaisuvaltaa.

# 16.0.3 — Combo Filter & Mobile Core Surgery

- Lähetykset: aihe + yleisö ovat nyt oikea AND-yhdistelmä. Nimetty yleisö näyttää vain eksplisiittisesti kohdennetun sisällön; `all` pysyy yleisenä sisältönä.
- Etusivu: yhteysosion koristekuva pienennetty 420 px desktop / 320 px mobile enimmäisleveyteen.
- Public Core: mobiilin 8-vaiheinen flow vaihtuu kelluvista nuolipalloista vakaaseen pystytimelineen.
- Private Core: sama mobiilitimeline orkesterivaiheille.

# 16.0.2 — Flow & Public UX Surgery

- Lähetyskoneen 8-vaiheinen orkesteri taittuu nyt 4×2, 2×4 ja 1×8 -poluksi ilman nuolten törmäystä kortteihin.
- Julkisen Coren orkesteri käyttää samaa hengittävää käärmevirtaa.
- Lähetykset pitää `all`-sisällön näkyvänä myös kohdeyleisösuodattimissa ja näyttää Opettajalle-suodattimen aina ensisijaisten yleisöjen joukossa.
- Vanha 16.0-suursiivous-roadmap korvattiin ei-sitovilla mahdollisilla seuraavilla kerroksilla.
- Etusivun henkilökohtaiset kortit on linjattu muun sisällön vasempaan reunaan.
- Yhteysosio muutettiin ahtaasta kolmipalstasta leveämmäksi kaksipalstaiseksi työpinnaksi; lomake käyttää kahden sarakkeen perustietoja desktopilla.
- Yhteyslomakkeen virheviestit erottavat sähköposti-, viestipituus- ja vanhentuneen lomakeistunnon virheet.
- Domain migration ei enää vaadi toimituksellisesti tiettyä teacher-artikkelia, vaan validoi audience-skeeman.

# 16.0.1 — Surgical UX Pass

- Lähetyslista muuttuu desktopillakin oletuksena suljetuksi draweriksi, jotta editori saa koko työleveyden.
- Lisätty muistava Asettelu-valikko: editorin leveys, lähetysvalikon leveys ja esikatselun näkyvyys.
- Lisätty editorin ja esikatselun väliin hiirellä, kosketuksella ja näppäimistöllä säädettävä separator.
- Julkaisun toissijaiset asetukset, yksittäinen agenttiajo sekä orkesterin vaihelista/lisäohje ovat oletuksena suljettuja.
- Evidenssieditorin textarea-kentät yhtenäistetty muun editorin form-control-kieleen ja täysleveiksi.
- Lähetyskorttien päivämäärärivin katkeilu korjattu ja julkisen Coren sisäisen navigaation luettavuutta nostettu.
- Ei muutoksia agenttisopimuksiin, Tool Brokeriin, Model Routeriin, Runtime Snapshotiin, orkesterivalidointiin tai julkaisun turvallisuusportteihin.

# 16.0.0 — Interface System / UI-UX + Semantic Cleanup

- Ei uusia agenttimoottorin ominaisuuksia: release keskittyy käyttöliittymän rakenteeseen, kieleen ja ylläpidettävyyteen.
- Lisätty yhteinen `ui-tokens.css` design-token-kerros ja erotettu julkinen Core sekä yksityinen control plane omiin CSS-vastuisiin.
- Editorin vanha `workspace-tabs`-semantiikka korvattu `editor-tabs` / `editor-panel` -rakenteella, jotta `workspace` tarkoittaa vain oikeaa agenttityötilaa.
- Lisätty oikea ARIA `tablist → tab → tabpanel` -malli, nuolinäppäinnavigointi, `focus-visible`, reduced-motion, contrast-tuki ja 44 px vähimmäiskosketuskohde.
- `/core` on nyt johdonmukaisesti suomeksi ja uusi `/en/core` johdonmukaisesti englanniksi; reiteillä on omat canonicalit ja vastavuoroiset hreflangit.
- Dynaaminen Core-sanasto valitaan dokumentin `lang`-attribuutista ilman että teknisiä protokolla-arvoja muutetaan.
- `/admin` siivottu näkyvältä sanastoltaan suomeksi; kone-enumit esitetään tarvittaessa eksplisiittisinä teknisinä arvoina.
- Poistettu CSS:n release-arkeologiakommentit ja nimetty osiot nykyisen vastuun perusteella.
- Korjattu piilotettujen audience-checkboxien aiheuttama näkymätön vaakasuuntainen overflow sekä mobiiliyläpalkin työtilavalitsimen murtuminen.
- Lisätty `test-ui-semantics.mjs` ja `test-language-boundaries.mjs` pysyviksi regressioporteiksi. Piilotetut tiedostovalitsimet saavat saavutettavat nimet, ja adminin näkyvästä semantiikasta torjutaan myös vanhat 15.x-releasefossiilit.
- Vercel Hobby -raja säilyy: `/api/**/*.js` sisältää edelleen tasan 12 deployattavaa JavaScript-entrypointtia.
- Koko release läpäisee 235 numeroitua regressiotestiä sekä build-, domain migration- ja SEO-smoket.

## 15.9.2 · Hobby Function Layout

- siirretty kaikki shared server helperit `api/_lib/` → `server/`, jotta Vercel ei käsittele niitä deployattavina API-funktioina
- päivitetty API- ja testimportit käyttämään `server/`-hakemistoa
- Hobby-regressiotesti laskee nyt rekursiivisesti kaikki `api/**/*.js`-tiedostot eikä vain `api/admin`-entrypointteja
- `/api`-puussa on nyt tasan 12 JavaScript-entrypointtia: 11 admin/API-reittiä + contact

# 15.9.1 — Hobby-funktioiden yhdistäminen

- Työtilojen admin-API yhdistettiin reittiin `/api/admin/core?resource=workspaces`.
- Erillinen `/api/admin/workspaces` Serverless Function poistettiin.
- Vercel Hobby -deployment pysyy 12 deployattavassa funktiossa ilman Workspace Foundation -ominaisuuksien poistamista.
- Hobby-funktiorajalle lisättiin regressiovartija.

# 15.9.0 — Workspace Foundation

- Lisätty server-side Workspace Registry ja yksityisen Coren workspace-valitsin.
- Nykyinen Anomancer toimii automaattisesti `default`-workspacena ilman runtime/orchestra/run-historian migraatiota.
- Runtime Profiles, Custom Orchestras, Runs ja Usage eristyvät workspace-kohtaisiin store-refeihin.
- Runtime Snapshot v3 sitoo `workspaceId` + `workspaceHash` osaksi allekirjoitettua orkesteriajoa.
- Agent API, Tool Broker, Run Receipt ja checkpointit tarkistavat workspace-scopen.
- Workspace Registryllä ja workspace-kohtaisilla storeilla on revision/concurrency-suoja.
- Agent Registry, Tool Registry ja Model Router pysyvät yhteisenä platform-kerroksena.
- Julkinen `/core` näyttää vain workspace-arkkitehtuurin, ei yksityisiä workspaceja tai usage-dataa.
- Artikkelisisältö on 15.9:ssa edelleen yhteinen; multi-user ACL, jäsenyydet ja billing eivät kuulu tähän julkaisuun.

# 15.8.0 — Run Explorer + Usage Metering

- Lisätty server-authoritative `Run Store` ja `/api/admin/runs`.
- Agenttien Run Receiptit kootaan `orchestraRunId`:n alle yhdeksi Run Recordiksi.
- Run Store käyttää oletuksena erillistä `refs/tags/anomancer-run-state`-refiä eikä kirjoita masteriin.
- Lisätty Run Explorer: status-, agentti-, provider- ja orkesterisuodattimet sekä stage-kohtainen detail timeline.
- Lisätty lifetime/recent Usage Metering: tokenit, providerit, agentit, orkesterit, fallbackit ja Tool Broker -päätökset.
- Lisätty runHash / previousRunHash -ketju lopullisille ajoille.
- Recoverable checkpoint ja stop eivät lukitse ajoa lopulliseksi; niitä voi jatkaa samalla orchestraRunId:llä.
- `editor_applied` kirjataan erikseen eikä sitä tulkita julkaisuksi.
- Kustannusarvio on fail-honest: euroja näytetään vain eksplisiittisillä server-side EUR/token-kertoimilla.
- Julkinen `/core` kertoo Run Explorerin ja Usage Meteringin olevan käytössä, mutta ei saa oikeaa run- tai account-dataa.

# 15.7.0 — Custom Orchestras

- Lisätty serverillä validoitu `Orchestra Contract v2` sekä Custom Orchestra Builder yksityiseen Coreen.
- Sisäänrakennettu Editorial säilyy immuuttina oletusorkesterina; customit tallentuvat omaan server-side Orchestra Storeen.
- Custom Orchestra Store käyttää erillistä `refs/tags/anomancer-orchestra-state`-refiä eikä kirjoita sisältöhaaraan.
- Sequential- ja turvalliset parallel-vaiheet; rinnakkaisagentit saavat saman jäädytetyn inputin ja tulokset yhdistetään deterministisesti vasta koko ryhmän onnistuttua.
- Palvelin torjuu päällekkäiset rinnakkaiset kirjoituspinnat, pakottaa Package-agentin viimeiseksi ja Claims-agentin body-muokkausten jälkeen.
- Runtime Snapshot sitoo valitun Orchestra Contractin ja `orchestraHash`in koko ajoon.
- Agentti-API valvoo allekirjoitetun orkesterin `stageIndex`iä ja torjuu väärän agentin `ORCHESTRA_STAGE_MISMATCH`-virheellä ennen mallikutsua.
- Stop abortoi kaikki käynnissä olevat rinnakkaiset agenttikutsut.
- Custom Orchestra Store käyttää revision-conflict-suojaa eikä julkinen `/core` näytä yksityisiä custom-orkestereita.
- Lisätty `CUSTOM_ORCHESTRAS.md` ja Custom Orchestras -regressiosviitti.

# 15.6.0 — Server-side Runtime Profiles

- Runtime Profilet siirretty admin-selaimen localStoragesta server-authoritative Runtime Storeen.
- Pysyvä GitHub tag-ref `refs/tags/anomancer-runtime-state` pitää runtime-tilan erossa sisältöhaarasta ja deploy-historiasta.
- Uusi `/api/admin/runtime` GET/PUT/DELETE/POST(snapshot) -rajapinta, admin-auth + CSRF mutaatioille.
- Agentti-API ei enää luota clientin `runtimeProfile`-payloadiin.
- Orkesteri käyttää `orchestraRunId`:hen sidottua HMAC-allekirjoitettua Runtime Snapshotia.
- Runtime Store käyttää revisionumeroa rinnakkaisten admin-istuntojen yliajon estämiseksi.
- Agent Contract -hashin muutos palauttaa vanhan Runtime Profilen turvallisesti sopimuksen oletuksiin.
- Uusi `SERVER_RUNTIME_PROFILES.md` ja 12 regressiotestiä runtime-storelle/snapshotille.

# 15.5.0 — Model Router

- Lisätty palvelinpuolen Model Router, joka erottaa Agent Contractin loogisen mallireitin provider-targetista.
- Kolme reittiä: `research`, `writer` ja `critic`; agentti voi vaihtaa vain oman reittinsä sallittuun targettiin.
- DeepSeek säilyy oletuksena, mutta Writer/Critic tukevat myös OpenAI-, Anthropic- ja Gemini-targetteja; Research tukee DeepSeek-, OpenAI- ja Gemini-web-searchia.
- Runtime Profileen lisätty `modelTarget`; palvelin normalisoi ja clampaa sen Agent Contractin route-rajaan.
- Fallback käyttää vain saman loogisen reitin sallittuja, konfiguroituja targetteja ja vain tilapäisissä provider-/verkko-/rate-limit-virheissä.
- Run Receipt kirjaa route-, provider-, target- ja fallback-metadatan ilman API-avaimia.
- Yksityinen Core näyttää providerien konfiguraatiotilan; julkinen Core näyttää vain tuetun topologian eikä paljasta, mitkä providerit on kytketty.
- Lisätty `test-model-router.mjs` regressiosviitti ja nykyiset orkesteri-/Tool Broker -rajat säilytetty.

# 15.4.0 — Tool Broker + Policy Gate

- Lisätty kanoninen Tool Registry ja palvelinpuolen fail-closed Tool Broker.
- Source Agentin oikea `web.search` valtuutetaan Agent Contractin ja capabilityn perusteella ennen mallikutsua.
- Tuntematon tai sopimukseen kuulumaton työkalu estyy `TOOL403`-päätöksellä.
- `source.verify`, `publication.publish` ja `github.write` ovat eksplisiittisiä human-only-rajoja.
- Client ei voi kasvattaa Tool Surfacea omalla request-kentällä; palvelin käyttää vain Agent Contractin työkaluja.
- Run Receipt sisältää redaktoidun Tool Policy -lokin ilman raakaa promptia/outputia.
- Yksityinen Core näyttää Tool Registryn, ALLOW/DENY/HUMAN ONLY -tilat ja paikallisen Policy Login.
- Julkisen Coren Tools-alue nousi FOUNDATION-tilasta LIVE POLICY -tilaan.
- Lisätty `test-tool-broker.mjs` regressiosviitti.

# 15.3.0 — Agent Pool Control

- Agent Contract ja Runtime Profile erotettu toisistaan.
- Agenttikortista avautuva hallintadialogi yksityiseen Coreen.
- ACTIVE / OFF vaikuttaa yksittäisiin agenttiajoihin ja seuraaviin orkesteriajoihin.
- Output-tokenkatto on säädettävä sopimuksen minimi- ja maksimialueella.
- Serveri clampaa Runtime Profilen eikä hyväksy sillä uusia oikeuksia tai työkaluja.
- Orkesteri jäädyttää Runtime Profilet ajon alussa ja checkpointtaa ne.
- OFF-stage näkyy `disabled`-tilana eikä tee mallikutsua.
- Run Receipt sisältää käytetyn runtime-tokenkaton ilman raakaa promptia/outputia.
- Uusi regressiosviitti `test-agent-pool-control.mjs`.

# 15.2.0 — Core Product Shell

- `/core` sai pysyvän tuoterakenteen: Overview, Agent Pool, Orchestras, Runs, Evidence, Models, Tools ja Usage.
- Models, Tools ja Usage johdetaan julkisesta Agent Registry -snapshotista ilman admin-API:a.
- Runs näyttää vain demo-kuitin; oikea run history pysyy yksityisenä.
- Evidence-politiikka on näkyvä osa tuotetta eikä piilossa orkestroijan sisällä.
- Foundation/read-only -tilat erottavat valmiin moottorin tulevista kirjoitusoikeuksista.
- CORE_VERSION ja pakettiversio 15.2.0.

# 15.1.0 — Public Core Showcase

- `/core` on nyt julkinen, indeksoitava arkkitehtuurinäkymä eikä admin-rewrite.
- `/admin` säilyy yksityisenä oikeana control planena.
- Julkinen Core näyttää turvallisen Agent Registry -snapshotin, Editorial-orkesterin, toimivaltarajat ja demomuotoisen Run Receiptin.
- Public Core ei kutsu admin-API:a eikä näytä oikeita ajolokeja, promptteja, sessioita tai salaisuuksia.
- Build tuottaa `core-public.json`-snapshotin suoraan Agent Registrystä, joten julkinen rakennekartta ei irtoa moottorin todellisuudesta.
- `/core` lisätään sitemap- ja llms-discoveryyn.

# Changelog

## 15.0.0 · 2026-08-26

- uusi Anomancer Core Foundation: Agent Registry, Agent Contract, Orchestra Registry ja Run Receipt
- nykyinen 8-agentin Lähetyskone rekisteröity `editorial/1.0.0` Core-orkesteriksi
- agentti-API hakee tokenbudjetit ja toimivaltamallin Agent Registrystä kovakoodattujen rajojen sijaan
- jokainen onnistunut agenttiajo palauttaa raakasisällöttömän ajokuitin input/output-hasheineen, tokenmetadatoineen ja sopimushashilla
- orkesterin kaikki stage-ajot sidotaan samaan `orchestraRunId`:hen
- uusi Core-välilehti näyttää Agent Poolin, sopimushashit, orkesterit, usage-mittarit ja hash-ketjutetun paikallisen Run Ledgerin
- julkisen Anomancerin Observatorio-portti vaihdettu Core-reitiksi (`/core`); `/admin` säilyy teknisenä taustareittinä
- lisätty `api/admin/core`, `server/core-registry.js`, `server/core-receipt.js`, `admin-core.js` ja `CORE_FOUNDATION.md`
- lisätty Core Foundation -regressiotestit

## 14.3.1 · 2026-08-26

- Nostettu agenttien output-tokenbudjetit pitkien artikkelien ja Audience Layer -ajojen katkeilun vähentämiseksi.
- Uudet budjetit: Source 16k (env 8k–32k), Structure 12k, Writer 24k, Critic 12k, Audience 24k, Voice 24k, Claims 16k, Package 12k.
- Lisätty chat-agenttien metadataan `maxOutputTokens`, jotta admin-loki näyttää käytön muodossa `käytetty/katto`.
- Säilytetty tokenrajat enimmäismäärinä: agentti saa lopettaa normaalisti ennen budjetin täyttymistä.
- Lisätty regressiotesti tokenbudjeteille ja Source-agentin uudelle clampille.

## 14.3.0 · 2026-08-26

- Lisätty ensimmäisen luokan **Audience Layer** ja uusi `audience`-agentti.
- Muutettu kohdeyleisö toiminnalliseksi `Audience Contract` -signaaliksi: rakenne, kirjoitus, kritiikki, yleisöadapteri ja äänieditori näkevät saman kohdeyleisön.
- Lisätty `audienceDepth`: `plain`, `general`, `professional`, `technical`. Valinta tallentuu Markdown-frontmatteriin ja kulkee API:n sekä checkpointin läpi.
- Uusi orkesterijärjestys: `source → structure → writer → critic → audience → voice → claims → package`. Väitevahti auditoi siis edelleen viimeisen proosaversion.
- Yleisöadapteri saa muuttaa kehystä, järjestystä, määritelmiä, esimerkkejä, terminologian tiheyttä ja painotuksia, mutta ei evidenssin tilaa tai väitteiden varmuutta.
- Lukittu `audience` ja `audienceDepth` pakettivaiheessa ihmisen toimitukselliseksi intentioksi. Package-agentin mahdolliset audience-ehdotukset ohitetaan palvelimella.
- Lisätty editoriin syvyystason UI, Audience Contract -selite ja Yleisöadapteri yksittäisten agenttien valikkoon.
- Laajennettu regressiotestejä Audience Layerin tulossopimukselle, orkesterijärjestykselle, syvyystason roundtripille ja pakettivaiheen audience-immuuttisuudelle.

## 14.2.1 · 2026-08-26

- Siirretty Väitevahti orkesterissa äänieditoinnin jälkeen, jotta claims kuvaa lopullista proosaa eikä lähtöluonnosta.
- Lukittu Evidence Layer pakettivaiheessa: Julkaisupaketti ei enää voi keksiä, pudottaa, refrasoida tai ylentää claims/sources-dataa.
- Lähdeagentin ehdokkaille luodaan deterministinen `src-*`-ID heti palvelinvalidoinnissa; selainmerge täyttää ID:n myös vanhalle tyhjälle riville.
- Sallittu candidate-URL:n säilyminen `open`/`interpretation`-väitteen provisionaalisena tutkimusjälkenä ilman supported-ylennystä.
- Tiukennettu Writer- ja Voice-prompteja: candidate ei ole varmistettu faktatuki, ja kriitikon korvaama vanha muotoilu pitää poistaa eikä jättää uuden rinnalle.
- Lisätty tallentamattomille uusille luonnoksille istuntokohtainen `instanceId`, jotta checkpointia ei voi soveltaa toiseen path/sha-arvoltaan tyhjään luonnokseen.
- `verified`-merkintä vaatii nyt nimenomaisen ihmisen vahvistuksen siitä, että lähde on avattu ja asiayhteys tarkistettu.
- Laajennettu regressiotestejä Evidence Layerin immuuttisuudelle, candidate-jäljille, source-ID:ille ja luonnosidentiteetille.

## 14.2.0 · 2026-08-26

- Korjattu monen yleisön suodatus siirtämällä selaimen logiikka ulkoiseen testattavaan moduuliin.
- Lisätty lähteiden provenance- ja verification-malli sekä ihmisen julkaisuportti.
- Säilytetty Source Agentin why/supports/challenges-tiedot koko putken läpi.
- Lisätty kaikkien agenttiroolien palvelinpuolen tulosnormalisointi.
- Estetty agenttia keksimästä pakettivaiheessa lähteitä, kategorioita tai yleisöjä.
- Sidottu checkpointit luonnoksen polkuun, SHA:han ja sormenjälkeen.
- Säilytetty valmis orkesteritulos session reloadin yli ja lisätty konfliktivaroitus.
- Lisätty DeepSeek-pyyntöjen peruutus, finish reason -käsittely, retry-luokitus, jitter ja Retry-After.
- Uudistettu adminin informaatioarkkitehtuuri, mobiilinavigaatio, lähdekortit ja julkaisu-dialogi.
- Lisätty dirty-state, busy-state ja slug-aliasit.
- Korjattu otsikkohierarkia, fokusindikaattorit, skip-linkit ja filterien aria-pressed.
- Optimoitu etusivun kuvat WebP-muotoon.
- Korvattu vaarallinen oletusasennus varmuuskopioivalla turvallisella asennuksella.
- Laajennettu regressio-, agenttisopimus-, evidenssi-, SEO- ja build-testit.
