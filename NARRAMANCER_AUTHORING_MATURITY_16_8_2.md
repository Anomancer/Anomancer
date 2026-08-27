# Anomancer 16.8.2 · Narramancer Authoring Maturity

16.8.2 tekee Narramancerista turvallisemman varsinaisen kirjoitustyöpöydän ilman että sen yksityinen Artifact Boundary, Constitution tai ihmisen lopullinen päätösvalta muuttuvat.

## Toteutus

- Projektin `language` on näkyvä Suomi / English -valinta ja kulkee myös Markdown-vientiin.
- Luvun konearvot `idea`, `draft`, `revised`, `locked` näytetään käyttöliittymässä muodossa Idea · Luonnos · Tarkistettu · Lukittu.
- Kaanonin konearvot saavat suomalaiset labelit, mutta tallennusformaatti pysyy yhteensopivana.
- Hahmon, luvun, aikajanan tapahtuman ja kaanonmerkinnän poisto tarjoaa 10 sekunnin Kumoa-portin.
- Lukuja voi siirtää ylös ja alas; järjestys numeroidaan hallitusti uudelleen.
- Selaimen title näyttää projektin ja aktiivisen luvun sekä `•`-merkin tallentamattomille muutoksille.
- Narramancer-orkesterin ehdotus diffataan nykyiseen projektiin ennen soveltamista.
- Raaka agentti-JSON jää `Tekninen data` -details-pinnan alle eikä ole ehdotuksen ensisijainen tarkistusmuoto.

## Hyväksyntä

```bash
npm run test:narramancer-authoring
```

Portti tarkistaa kielen, lokalisoidut enum-labelit, Kumoa-poiston, lukujärjestelyn, document titlen, proposal diffin sekä vientikontekstin.
