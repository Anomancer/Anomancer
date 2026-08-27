# Anomancer 16.8.0 · Core Shell Semantics

16.8.0 toteuttaa 16.7.1-koodikannan senior/lead UI/UX -auditin ensimmäisen julkaisuvaiheen. Julkaisu korjaa käyttöliittymän käsitemallin ja vastuurajat muuttamatta yksityistä reittiä, PWA-scopea tai Core-turvallisuussopimuksia.

## Toimitus

- työtilariippumaton Anomancer Core -identiteetti
- globaali navigaatio: Työtilat, Nykyinen työ, Konehuone, Asetukset
- metadataohjattu Anomancer-navigaatio: Lähetykset, Kirjoita, Evidenssi, Agentit, Orkesteriajo, Julkaisu, Aineisto & ulostulo
- tyhjän eristetyn työtilan oma kotinäkymä
- julkaisutiedot Asetusten järjestelmätiedoissa
- 16.7 → 16.8 selaintilan jatkuvuusmigraatio
- PWA-cache 16.8.0
- content-safe installer ja täysi regressiosviitti

## Rajaus

Tämä julkaisu ei tee 16.8.1:n suunniteltua dynaamista mobiilidockia eikä laajaa CSS-arkkitehtuurin uudelleenkirjoitusta. Se säilyttää 16.7.1:n visuaalisen hardeningin ja tekee 16.8.0:n semanttisen muutoksen sen päälle.

## Tarkistus

```bash
npm run test:core-shell-semantics
npm run check
```

Täysi tarkistus rakentaa julkisen outputin uudelleen lähdekoodista, tarkistaa yksityisen/julkisen rajan, Workspace/Constitution/Artifact Boundary -sopimukset, Narramancerin eristyksen, Core-rekisterit, responsiiviset regressiot ja uuden shell-semanttiikan.
