# Anomancer 16.7.0 · Navigation Shell

16.7 on informaatioarkkitehtuurin uudelleenrakennus 16.6:n monityötilaytimen päälle.

## Uutta

- pysyvä Anomancer Core Shell: Työtilat, Lähetykset, Artefaktit, Konehuone ja Asetukset
- oikea Työtilat-kotipesä kortteineen ja uuden työtilan luonnilla
- erillinen Workspace Context Bar työtilalle, orkesterille ja tallennustilalle
- metadataohjattu paikallisnavigaatio sekä Anomancerille että Narramancerille
- Konehuone siirretty globaaliksi control planeksi pois editoritabeista
- Artefaktit-näkymä näyttää valitun työtilan store-, input-, output- ja Constitution-rajan
- mobiilin Tallenna, Julkaise, Esikatselu, Konehuone ja Asetukset säilyvät Lisä-pinnassa
- Narramancer-orkesterin vaiheprogressi ja selainistunnon checkpoint-jatkaminen
- uusi `admin-shell.js`
- uusi `scripts/test-navigation-shell-167.mjs`

## Hyväksyntä

`npm run check` läpäisee koko olemassa olevan regressiosviitin sekä 12 uutta Navigation Shell -testiä.

Asennus säilyttää kohderepon `content/`-aineiston bittitasolla ja rakentaa julkaisut kohteen omasta Markdown-aineistosta test/build-vaiheessa.
