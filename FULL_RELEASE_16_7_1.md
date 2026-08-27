# Anomancer 16.7.1 · Navigation Shell Visual Hardening

16.7.1 on 16.7:n UI/UX-korjausjulkaisu. Se ei muuta Workspace-, Constitution-, Artifact Boundary- tai orkesterisopimuksia.

## Korjattu

- nollattu 16.7:ssä vuotanut vanha kaksisarakkeinen `.app`-grid, joka puristi Core Shellin 320 px sarakkeeseen
- Core Shell on nyt yksi yhtenäinen desktop-header: brändi, päänavigaatio, yhteystila ja asetukset
- Workspace Context Bar erottaa nykyisen työn ja työtilakontrollit omaksi selkeäksi kerroksekseen
- Konehuoneen sisältörytmi, mittarikortit, välit, leveys ja Constitution-yhteenveto on kovetettu
- 7 control-plane-mittaria muodostavat desktopissa yhden rivin ja reflowavat 4/3/2 sarakkeeseen
- paikallisnavigaation typografiaa, osumia ja pystyrhythmia parannettu
- Narramancerin commandbar/panel-padding sovitettu samaan shell-rytmiin
- mobiilin yksisarakkeinen shell, pikatoiminnot ja Asetukset säilyvät
- PWA-cache bustattu versioon 16.7.1

## Hyväksymistesti

`npm run test:navigation-shell-visual` tarkistaa shell-gridin, desktop-hierarkian, workspace-kontekstin, Konehuoneen metric-reflow'n, mobiilirajan, PWA-version ja content-safe-asennuksen.

Koko regressio: `npm run check`.
