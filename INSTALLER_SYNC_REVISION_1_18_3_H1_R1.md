# Anomancer 1.18.3 Hotfix 1 r1 — Installer mirror sync

Tämä revision korjaa content-safe-installerin release-portin järjestyksen.

## Korjaus

- `admin-mancer.css` lisätään public runtime -allowlistiin.
- `lahetyskone-pwa.js` lisätään public runtime -allowlistiin.
- installer ajaa `npm install` ennen testejä.
- installer ajaa `npm run build` ennen `npm run check` -porttia.
- Hotfix-regressio tarkistaa järjestyksen `npm install → npm run build → npm run check`.

Tämä estää tilanteen, jossa uusi root-runtime joutuu strictEqual-peilitestiin target-repon vanhaa `public/`-runtimea vastaan.

## Varmennus

- shell syntax: PASS
- Interaction + CSS Hotfix: 9/9 PASS
- P1 Codemancer Visual Surgery: 6/6 PASS
- Codemancer Workbench browser/pointer: 13/13 PASS
- root/public `admin-mancer.css`: identtinen paketissa buildin jälkeen

Täysi historiallinen testiketju eteni sandboxissa ilman assertion-regressiota, mutta työkalun aikaraja katkoi pitkän ajon ennen ketjun loppua.
