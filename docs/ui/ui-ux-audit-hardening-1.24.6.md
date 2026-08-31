# UI/UX audit hardening 1.24.6

Senior lead -tason UI/UX-katselmuksen korjausrelease. Muutokset on rajattu käyttöliittymän selkeyteen, saavutettavuuteen, mobiilikäytettävyyteen ja Kevyt tila → Työpöytä -jatkuvuuteen.

## Toteutettu

- Kevyen tilan tekninen D2–D6-sanasto piilotettiin ensisijaiselta pinnalta ja `Orkestra` korjattiin muotoon `Orkesteri`.
- Emoji-ikonit korvattiin skaalautuvilla käyttöliittymäikoneilla.
- Pitkien otsikoiden katkeaminen korjattiin ilman haitallista kirjainkohtaista rivitystä.
- Tila-vaihtimen ja mobiilin ensisijaisten toimintojen kosketuskohteet nostettiin vähintään 44 pikseliin.
- Tyhjä desktop-tarkastin ei enää varaa pysyvästi suurta sisältöpalstaa.
- Kevyen tilan valmis työ voidaan avata Työpöydällä ja tuoda suostumuksella uudeksi Anomancer-luonnokseksi. Alkuperäistä kevyen tilan työtä ei ylikirjoiteta.
- Työpöydälle lisättiin mobiilin tilanne- ja toimintopalkki: tallennus, esikatselu ja julkaisutarkistus.
- Työpöydän mobiiliotsake, dokin täydet labelit, asetukset-kuvake ja palautteen sijoittelu korjattiin.
- Kirjautumisnäkymä yhtenäistettiin Lighthouse-identiteettiin ja sen 390 px vaakavuoto poistettiin.
- Normaali käynnistys ei enää näytä Nanomancerin onnistumisilmoitusta globaalina toastina.
- Yhteystilan teksti erotettiin todellisesta sisäänkirjautumisesta (`Palvelu tavoitettavissa`).
- Disabled-tilojen erottuvuutta ja osoitinkäyttäytymistä parannettiin.

## Varmennus

- Release gate: 97/97 hyväksytty.
- Playwright: desktop 1440×900, mobiili 390×844 ja kapea 360×800.
- Lighthouse-selainpolku: D0 → D1 → D2/D3.
- Axe-saavutettavuusmatriisi: 7 reittiä × 2 viewportia.
- Uusi `tests/lighthouse/ui-ux-audit-hardening.mjs` vartioi korjatut labelit, 44 px kosketuskohteet, mobiilibrändin, toimintopalkin ja kirjautumisen vaakavuodon.

## Rajattu tämän releasen ulkopuolelle

- Koko CSS-omistajuuden ja token-järjestelmän laaja konsolidointi. Muutos on erillinen arkkitehtuurirefaktorointi, ei turvallinen auditointihotfix.
- Editorin koko DOM- ja informaatioarkkitehtuurin uudelleenjärjestely. Nykyiset kriittiset mobiilitoiminnot nostettiin näkyviksi ilman tallennus- ja julkaisuvirtojen rakenteellista siirtoa.
