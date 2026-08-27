# Anomancer 16.8.1 · Responsive Workspace Navigation

16.8.1 poistaa työtilakohtaiset mobiilipoikkeukset navigaatiosta. Workspace Templaten `editorDefinition.navigation.mobilePrimary` määrittää enintään neljä ensisijaista mobiilityökalua, ja sama editorimääritys rakentaa desktopin paikallisrailin sekä puhelimen alapalkin.

## Toteutus

- Anomancer: Kirjoita · Evidenssi · Orkesteri · Esikatselu · Lisävalikko.
- Narramancer: Projekti · Hahmot · Luvut · Orkesteri · Lisävalikko.
- Muut työtilan osiot, työtilan vaihto ja Core-komennot ovat yhdessä natiivissa `dialog`-bottom sheetissä.
- Narramancerin vanha vaakavieritettävä mobiilin paikallisnavirivi poistuu käytöstä.
- Työtilan desktop-rail ei muutu puhelimessa kolmanneksi sticky-palkiksi.
- `admin-overlays.js` hallitsee bottom sheetin, lähetysdrawerin ja mobiiliesikatselun yhteisiä sääntöjä: yksi overlay kerrallaan, Escape, `inert`, fokusrajaus ja fokuksen palautus laukaisijaan.
- Mobiilidokin kosketuskohde on vähintään 44 px ja pysyvät labelit nostetaan mikrotekstialueelta.
- 360 px näkymälle asetetaan eksplisiittinen vaakavuodon esto.

## Hyväksyntä

```bash
npm run test:responsive-workspace-navigation
```

Portti lukitsee template-ohjauksen, Narramancerin yhteisen dokin, bottom sheetin, overlay-sopimuksen, minimikosketuskohteet ja 16.8.2 full release -version.
