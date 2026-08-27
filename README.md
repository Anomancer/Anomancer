# Anomancer 1.18.2 · Native Dialog Consolidation

1.18.2 kovettaa 1.18.1 Semantic Workbench -kerroksen yhdenmukaistamalla legacy-adminin ihmisen vahvistukset, syötedialogit ja virheilmoitukset yhteiseen async-dialogijärjestelmään.

Keskeiset muutokset:

- yhteinen `window.anomancerDialogs` confirm / prompt / form / notice API
- fokus palautuu toiminnon laukaisijaan
- muu sovellus on dialogin aikana `inert`
- Escape ja peruuttaminen palauttavat turvallisen false/null-tuloksen
- natiivit `window.alert()`, `window.confirm()` ja `window.prompt()` on poistettu adminin työpoluista
- kuvan alt-teksti ja kuvateksti kerätään yhdessä saavutettavassa lomakedialogissa
- workspace-, orkesteri-, Archive-, agentti- ja editorial-toimivaltarajat säilyvät eksplisiittisinä ihmisen päätöksinä
- PWA:n `beforeinstallprompt`-objektin `prompt.prompt()` säilyy, koska se ei ole selain-`window.prompt()`

Katso `NATIVE_DIALOG_CONSOLIDATION_1_18_2.md` ja `FULL_RELEASE_1_18_2.md`.
