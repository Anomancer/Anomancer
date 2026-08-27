# Anomancer 1.18.2 · Native Dialog Consolidation

## Ydinlausunto

1.18.1:n semanttisessa katselmuksessa jäi tietoisesti 21 legacy-adminin selaimen natiivia `alert()`, `confirm()` ja `prompt()` -käyttökohtaa. 1.18.2 korvaa nämä yhden yhteisen async-dialogi- ja overlay-controllerin kautta ilman Human Approval-, Artifact Boundary-, Archive-, Evidence-, Workspace Isolation- tai Orchestra-rajojen löysentämistä.

## Toteutus

### Yhteinen API

`window.anomancerDialogs` tarjoaa:

- `confirm(message, options)` → `Promise<boolean>`
- `prompt(message, defaultValue, options)` → `Promise<string|null>`
- `form(options)` → `Promise<object|null>`
- `notice(message, options)` → `Promise<boolean>`

Kaikki käyttävät samaa `coreSystemDialog`-pintaa ja olemassa olevaa `admin-overlays.js`-controlleria.

### Fokus ja modaliteetti

Dialogin avautuessa:

- laukaisija muistetaan,
- `#appView`, `#loginView` ja mobiilikomentoportaali asetetaan `inert`-tilaan,
- fokus siirtyy ensisijaiseen kontrolliin tai lomakekenttään.

Suljettaessa:

- inert poistuu,
- fokus palautuu alkuperäiseen laukaisijaan,
- Escape/peruuttaminen palauttaa `false` tai `null`, eikä sivuvaikutusta tehdä.

### Ihmisen toimivaltarajat

Yhteiseen vahvistukseen siirrettiin muun muassa:

- lähetyksen poistocommit GitHubiin,
- lähteen merkitseminen ihmisen tarkistamaksi,
- työtilan arkistointi ja tallentamattomien muutosten hylkäys,
- Archive Objectin poisto ja tombstone,
- mukautetun orkesterin poisto,
- agentin tekstin / visualisointien / julkaisupaketin soveltaminen,
- orkesterin checkpoint-konflikti ja lopputuloksen soveltaminen.

### Inline-validation

Työtilan puuttuva nimi ei avaa modalia. Virhe näkyy työtiladialogin omassa `role=status`-alueessa ja fokus siirtyy nimikenttään.

### Kuvan metatiedot

Kaksi peräkkäistä selain-`prompt()`-ikkunaa korvattiin yhdellä lomakedialogilla, jossa ovat alt-teksti ja valinnainen kuvateksti.

## PWA-raja

`lahetyskone-pwa.js` sisältää edelleen `prompt.prompt()`-kutsun. Kyse on selaimen `beforeinstallprompt`-eventistä saadun objektin metodista, ei `window.prompt()`-dialogista. Release-portti erottaa nämä toisistaan.

## Testit

`scripts/test-native-dialog-consolidation-1182.mjs` tarkistaa:

1. yhteisen dialogi-API:n,
2. natiivien alert/confirm/prompt-kutsujen puuttumisen admin-poluilta,
3. human authority -vahvistusten säilymisen,
4. kuvan alt/caption-lomakkeen,
5. dialogin HTML/CSS-semanttisuuden,
6. Chromium-desktopin fokus/inert/restore-polun,
7. 360 px mobiilin saman polun ja vaakavuodottomuuden.

## Hyväksyntäkriteeri

1.18.2 hyväksytään, kun uusi dialogiportti, Visual System -matriisi ja koko `npm run check` menevät läpi eikä mikään turvallisuuskriittinen sivuvaikutus muutu automaattiseksi.
