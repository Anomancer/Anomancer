# ANOMANCER 1.25 · UI Architecture Hardening

## Perustuslaki

1.25 ei ole visuaalinen redesign. Se siirtää nykyisen Lighthouse/Workbench-kielen kanonisiin omistajiin ja tekee editorin lähdejärjestyksestä käyttäjän työjärjestystä vastaavan. `content/`, `media/`, autentikointi, tallennussopimukset ja julkaisuputki ovat muutoksen ulkopuolella.

## CSS-omistajuus

`admin.css` on vain latausmanifesti. Omistusjärjestys on:

1. `ui-tokens.css` · semanttiset värit, typografia, spacing, radii, varjot, fokus, kontrollikoot, shell-geometria, safe area, motion ja z-index-kerrokset.
2. `admin-shell.css` · globaali Lighthouse-shell, login, työtilakonteksti ja palautekanava.
3. `admin-workspace.css` · työtilan yhteiset pinnat ja overlayt.
4. `admin-editorial.css` · Anomancerin editori, evidenssi, metadata ja julkaisuportti.
5. `admin-narrative.css`, `admin-control-plane.css`, `admin-archive.css`, `admin-nanomancer.css`, `admin-mancer.css` · rajatut workspace/capability-pinnat.
6. `lighthouse-workbench.css` · Lighthouse-identiteetin Workbench-sovitus.
7. `admin-responsive.css` · ainoa adminin viewport-reflow’n omistaja.

Komponenttitiedostot eivät sisällä viewport-media queryja. Globaalin responsiivisuuden ratkaisut kuuluvat `admin-responsive.css`:ään. Workspace-pinta ei saa määritellä shellin korkeuksia tai kerrosjärjestystä.

## Kanoniset rakenne-tokenit

1.25 nostaa aiemmat kaskadissa toistuneet mitat tokeneiksi:

- `--shell-height-desktop`, `--workspace-bar-height-desktop`
- `--shell-height-mobile`, `--workspace-bar-height-mobile`
- `--mobile-dock-height`, `--mobile-action-height`
- `--safe-area-top/right/bottom/left`
- `--control-height-sm/md/lg`, `--tap-target`
- `--layer-base/content/sticky/local-nav/workspace-bar/overlay/overlay-control/dock/shell/feedback/dialog`
- `--motion-fast/base`, `--motion-ease-standard`

Vanhat runtime-nimet kuten `--core-shell-height`, `--workspace-bar-height`, `--mobile-dock-h` ja `--mobile-action-h` ovat yhteensopivuusaliaksia, eivät enää raakamittojen omistajia.

## Breakpointit

Adminin kanoninen viewport-matriisi on nyt yhdessä tiedostossa. Jäljellä olevat rajat ovat 1220, 1100, 980, 900, 850, 760, 720, 600, 560, 520, 460, 420, 390 ja 360 px sekä `display-mode:standalone` ja `prefers-reduced-motion:reduce`.

1.25 poisti saman mediaehdon sisällä aina hävinneitä shell-, brand- ja dock-arvoja. Erityisesti mobiilin shell-, workspace-, dock- ja toimintorivikorkeudet tulevat nyt yhdestä tokeniketjusta. Testimatriisissa säilytetään vähintään 360×800, 390×844, 768×1024, 1024×768 ja 1440×900.

## Editorin lähdejärjestys

Anomancer-editorin DOM etenee nyt näin:

`otsikko → varsinainen teksti → tallennus → evidenssi/lähteet → metadata ja julkaisuasetukset → julkaisuportti → agentit ja tekniset työkalut`

Julkaisun asetukset ovat edelleen disclosure-kerroksessa. Save-, publish- ja delete-ID:t, API-kutsut ja hyväksyntädialogi ovat ennallaan. Näin muutos on informaatioarkkitehtuurinen eikä tallennus- tai julkaisulogiikan uudelleenkirjoitus.

## Authentikoitu visual baseline

Kandidaattibaseline sijaitsee hakemistossa `.visual-regression/1.25.0/authenticated-workbench/`. Se käyttää oikeaa `admin.html`-DOMia, determinististä muististorea ja mockattua autentikointia/API:a. Tuotannon salasanoja tai käyttäjädataa ei käytetä.

Baselinea ei kirjoiteta normaalissa release gate -ajossa:

- `npm run visual:workbench:verify` tarkistaa nykyisen pinnan hyväksyttyä kuvaa vasten.
- `npm run visual:workbench:update` kirjoittaa uudet kuvat vain eksplisiittisesti.

Baseline-manifesti merkitään kandidaatiksi, kunnes ihminen on tarkastanut kuvadiffit. Epäonnistunut testi ei koskaan päivitä baselinea automaattisesti.

## Release-raja

1.25 säilyttää nykyisen release-gaten askelmäärän. Uudet arkkitehtuurisopimukset on lisätty olemassa oleviin UI/visual-portteihin, jotta portin semantiikka kovenee ilman että lähtötason 97-porttista rakennetta paisutetaan uudella rinnakkaisella testimaailmalla.

## QA-evidenssi tässä kandidaatissa

- Static release gate on todennettu nykyisestä työpuusta kahdessa peräkkäisessä segmentissä: vaiheet 1–63 sekä 64–85, yhteensä 85/85 ilman koodimuutoksia segmenttien välissä. Yhtenäinen ajo osuu tämän sandboxin 300 sekunnin suorituskattoon vaiheessa 64, ei testivirheeseen.
- Browser gate eteni oikealla Linux Chromiumilla 9/12 vaiheeseen ennen ympäristörajaa. Codemancer, full-app Workbench, Archive, Nanomancer, Arkistonhoitaja, Mancer UI, native dialogit, Core roadmap ja visual-system menivät läpi.
- `tests/lighthouse/ui-ux-audit-hardening.mjs` menee lisäksi erillisenä computed-style-ajona läpi 390×844-fixturellä.
- `content/` ja `media/` on verrattu alkuperäiseen 1.24.6-pakettiin tiedosto- ja SHA-256-tasolla: 20/20 content-tiedostoa ja 9/9 media-tiedostoa ovat identtisiä.
- Tämän sandboxin npm-verkko ei ole käytettävissä ja lähdepaketin `node_modules/axe-core` on tyhjä/puuttuva. Siksi oikeaa axe 4.10.3 -ajoa ei merkitä PASS-tilaan tässä evidenssissä. Kandidaatti vaatii `npm ci` + koko `npm run check` -ajon ympäristössä, jossa lukitut dev-riippuvuudet ovat saatavilla.
- Sandboxin Chromiumissa on hallittu `URLBlocklist: ["*"]`, minkä vuoksi localhost-navigaatio on estetty. Ympäristön hallintapolitiikkaa ei poistettu eikä ohitettu; localhostia käyttävät tunnetut browser-fixturet jätettiin ennalleen ja niiden lopullinen ajo siirrettiin normaaliin QA-ympäristöön.
