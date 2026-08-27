# Anomancer 16.3.5 · Consolidated Full Release

Tämä paketti kokoaa 16.3.2 Mobile Workspace -full-pohjan sekä 16.3.3, 16.3.4 ja 16.3.5 -korjaukset yhdeksi kokonaisuudeksi.

## Mukana

- mobiilin peukalodokki, drawerit ja overlay-esikatselu
- Lisää-komentopinnan body-tason portal
- Mobile Control Plane Reflow ja vaakavuodon torjunta
- Editorial Gate Calibration
- Evidence Boundary Hygiene
- kaikki näiden regressiotestit osana `npm run check` -ketjua

## Asennus nykyiseen repoon

```bash
./INSTALL_TO_CURRENT.sh /täysi/polku/Anomancer
```

Asennin varmuuskopioi korvattavat tiedostot, ei kopioi `.git`-, `.vercel`-, `node_modules`- tai `.env*`-sisältöjä ja ajaa lopuksi koko testipatterin.
