# Final Validation — Anomancer 1.18.4 P3 GREEN

Päivä: 2026-08-28

## Lopputulos

**1.18.4 release gate: PASS.** Täysi `npm run check` -ketju ajettiin onnistuneesti alusta loppuun Chromium mukaan lukien.

- P3 capability backend: **7/7 PASS**
- P3 Operations UI, Package Spec ja CI/CD-sopimus: **7/7 PASS**
- P0 Integrity Hardening: **6/6 PASS**
- P1 Codemancer Visual Surgery: **6/6 PASS**
- P2 Interaction & Navigation Hardening: **9/9 PASS**
- Codemancer Workbench static: **8/8 PASS**
- Codemancer Workbench Chromium: **13/13 PASS**
- Interaction + CSS Hotfix: **9/9 PASS**
- Full-app Admin Story E2E: **6/6 PASS**
- Visual System Chromium matrix: **8/8 PASS**
- kaikki muut `npm run check` -ketjuun kuuluvat regressio-, build-, domain-, SEO-, agentti- ja orkestrointitestit: **PASS**
- `npm run check`: **EXIT 0**

## Viimeiset GREEN-korjaukset

### 1. Julkaisurajan semanttinen sopimus

Codemancerin Julkaisu-inspektori ilmaisee nyt eksplisiittisesti:

> Tämä hyväksyntäpinta ei suorita Git-pushia.

P3-malli säilyy ennallaan: hyväksyntädata ei tee sivuvaikutusta, default-haaraa ei kirjoiteta suoraan eikä PR:ää yhdistetä automaattisesti.

### 2. Full-app E2E save-race

`test-admin-story-1182.mjs` ei enää aloita muokkausta kesken asynkronisen työtila-artefaktin latauksen. Testi odottaa nyt eksplisiittistä valmis-tilaa, varmistaa että input on todella päivittynyt Mancer-malliin ja hyväksyy tallennuksen vasta kun sekä UI että Mancer-data ovat samassa tallennetussa tilassa.

Race-korjaus varmistettiin kolmella peräkkäisellä erillisellä Chromium-ajolla ennen koko release-gaten ajoa.

## Todennetut P3-rajat

1. Tuntematon capability ja komentomerkkijono fail-closed.
2. Operations API vaatii admin-session; mutaatio vaatii same-origin + sessioniin sidotun CSRF:n.
3. Repository-write vaatii hyväksytyn review’n, täsmällisen written confirmationin ja muuttumattoman artefaktin.
4. Repository-adapteri luo vain uuden `anomancer/op-*`-refin eikä tee default-haaraan PUT/PATCH-operaatiota.
5. Testi-, PR-, preview- ja production-portit avautuvat vain edellisen vaiheen evidenssistä.
6. PR ei automergaa; production vaatii merged PR:n sekä release-checkin ja ihmisen release-päätöksen.
7. Productionin checkout sidotaan täsmälliseen merge commit SHA:han.
8. Repository rollback poistaa vain muuttumattoman ja yhdistämättömän operation-haaran.
9. Deployment rollback sallii vain rajatun Vercel deployment -URLin tai `dpl_...`-id:n.
10. File path-, duplikaatti-, koko- ja secret-guardit suoritetaan ennen GitHub-kirjoitusta.
11. Operation-audit on workspace-scopeinen, revision-lukittu ja hash-ketjutettu.
12. Keskeytyneen branch- tai PR-sivuvaikutuksen tila voidaan palauttaa GitHub-evidenssistä ilman uuden sivuvaikutuksen sokkona toistamista.

## Release boundary

Tämä GREEN-validointi todentaa paikallisen/full-package release-gaten. Se ei väitä, että oikea GitHub repository-write, GitHub Actions -workflow, Vercel preview, production-deploy tai rollback olisi jo ajettu kohdeympäristössä.

Seuraava vaihe on erillinen **live-path verification**, jossa oikeat sivuvaikutukset suoritetaan tarkoituksella testirepossa ja niiden evidenssi varmennetaan käyttöliittymästä.
