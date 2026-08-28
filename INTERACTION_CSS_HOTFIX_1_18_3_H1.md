# Anomancer 1.18.3 Hotfix 1 — Interaction & CSS Bug Sweep

Päivä: 2026-08-28

## Miksi hotfix tehtiin

1.18.3 Codemancer Workbench läpäisi aiemmat rakenne- ja selainportit, mutta tuotantokäytössä havaittiin kaksi todellista ongelmaluokkaa: osa Workbenchin uusista kentistä putosi natiiviin selaintyyliin ja deployn jälkeen PWA saattoi yhdistää uuden HTML:n vanhaan välimuistissa olevaan JS/CSS-shelliin. Jälkimmäinen pystyi näyttämään käyttäjälle oireen "nappi ei tee mitään", vaikka nykyisen lähdekoodin handler oli olemassa.

## Korjaukset

- Yhteinen Mancer-control contract kattaa nyt sekä legacy `.mancer-form` -kentät että kaikki `#mancerPanel [data-mancer-path]` -ohjaimet.
- Hover, focus, disabled, placeholder ja mobiilin 16 px -sopimus käyttävät samaa yhteistä selector-linjaa.
- 360–420 px Core-nav käyttää lyhyitä semanttisia näyttölabel-varianteja ilman erillistä mobiili-DOMia.
- PWA-shell vaihtui cache-firstista network-first + cache fallback -malliin.
- Service worker rekisteröidään `updateViaCache: none` -asetuksella ja `registration.update()` kutsutaan latauksen jälkeen.
- Service workerin controller-vaihto lataa uuden shellin automaattisesti vain, jos aktiivista tallentamatonta työtä ei ole.
- Dirty-tilassa käyttäjä saa pysyvän varoituksen eikä sivua reloadaata työn alta.
- PWA cache epoch on `anomancer-lahetyskone-v1.18.3-hotfix1`.

## Vuorovaikutusportin kovennus

Codemancerin full-admin Chromium-testi käyttää nyt oikeita CDP-pointer-tapahtumia. Se varmistaa hit-testin ennen klikkausta eikä nojaa vain `element.click()`-kutsuun.

Testatut pointer-polut:

- Core-nav: Arkisto → Nykyinen työ
- paikallisnav: Tehtävät → Koodi
- Koodi: Lisää tiedosto
- Koodi: Poista
- Koodi: Kumoa poisto
- Asetukset: avaa → sulje
- tiedostopuun valinta
- mobiilin 360×800 kontrollityyli, fonttikoko ja Core-navin viewport-raja

## Rajaus

Hotfix ei muuta Core-version semanttista julkaisunumeroa. Paketti on edelleen 1.18.3 Codemancer Workbench. Tämä säilyttää 1.18.4:n roadmapissa Mancer Package Spec Hardening -julkaisuna.


## Installer revision r1

Content-safe installer synkronoi nyt riippuvuudet ja public-outputin ennen regressiotestejä. Tämä sulkee asennuspolun, jossa uusi root `admin-mancer.css` joutui `strictEqual`-vertailuun target-repon vanhaa `public/admin-mancer.css`-peiliä vastaan. Järjestys on nyt `npm install` → `npm run build` → `npm run check`, ja hotfix-testikone valvoo järjestystä eksplisiittisesti.
