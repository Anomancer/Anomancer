# ANOMANCER 1.25 · selain- ja laitematriisi

## Automaattinen / tässä paketissa todennettu

| Ympäristö | Tila | Evidenssi |
| --- | --- | --- |
| Chromium, Linux desktop | PASS / candidate | full-app kirjautuminen, workspace-navigaatio, edit/save, revisiokonflikti, dirty guard, visual-system ja autentikoidut screenshot-kandidaatit |
| Chromium, 390×844 emulointi | PASS / candidate | Anomancer-editori, mobiilin Lisää-pinta, asetukset sekä computed-style-hardening |
| Staattinen responsive-matriisi | PASS | 360/390/768/1024/1440-sopimukset olemassa olevissa UI-porteissa |

## Kandidaatin ympäristörajat

Tässä sandboxissa lukittu `axe-core@4.10.3` ei ole asennettuna eikä npm-verkko ole käytettävissä. Siksi axe-pohjainen accessibility-matrix ja Lighthouse browser E2E jäävät lopullisen release-todisteen osalta OPEN-tilaan, vaikka muut Chromium-portit ovat vihreitä. Sandboxin Chromiumissa on lisäksi hallittu URLBlocklist, joka estää localhost-navigaation. Hallintapolitiikkaa ei poisteta testin vuoksi.

## Oikeat laitteet / avoin ennen ulkoista release-hyväksyntää

| Ympäristö | Tila | Vaadittu tarkistus |
| --- | --- | --- |
| Firefox, Linux desktop | OPEN | editori, dialogit, fokus, lomakkeet, sticky-rakenteet |
| Chrome, Android / OnePlus | OPEN | kirjautuminen, mobiilidokki, soft keyboard, orientaatio, PWA |
| Safari, iPhone/iPad | OPEN | safe area, viewport, zoom, inputit, dialogit, sticky |
| Safari, macOS | OPEN | desktop-editori, keyboard navigation, font rendering |

WebKit-automaatiota ei kirjata oikeaksi Safari-laitetestiksi. Apple-laitteen puuttuessa Safari-rivi pysyy tarkoituksella OPEN-tilassa.

## Manuaalinen hyväksyntäpolku

Kirjaudu sisään/ulos; vaihda työtilaa; muokkaa ja tallenna; varmista dirty-varoitus; avaa/sulje dialogit; testaa esikatselu; avaa julkaisutarkistus ilman julkaisusivuvaikutusta; testaa Kevyt tila → Työpöytä; avaa mobiilinäppäimistö; vaihda orientaatio; zoomaa teksti 200 %; katkaise/palauta verkko; varmista PWA/service worker -päivitys; tarkista ettei vaakavuotoa synny.

Virhe-evidenssiin kirjataan laite, OS, selain+versio, viewport/orientaatio, build, repro, odotettu/toteutunut tulos, kuva/video ja severity.
