# Anomancer 1.18.5 — Final Validation

Päiväys: 2026-08-28

## Release-portti

Paikallinen 1.18.5 Live Path Verification & Canary Gate on validoitu kokonaan vihreäksi.

```text
npm ci                              PASS
npm run build                       PASS
npm run test:live-path              PASS · 10/10
CHROMIUM_BIN=/usr/bin/chromium \
  npm run check                     PASS
```

Koko `npm run check` -ketju valmistui ilman assertion-, npm- tai regressiofailia. Mukana olivat 1.18.5 live-path backend/UI -portit sekä olemassa olevat Chromium-, Workbench-, P3-, visuaali-, agentti-, orkestroija-, domain migration- ja SEO/content/admin-portit.

## Todennetut 1.18.5-suojat

- operation repository voidaan pakottaa eksplisiittiseen allowlistiin
- väärä tai puuttuva allowlist failaa ennen GitHub-sivuvaikutusta
- tests ja preview sidotaan operation commit SHA:han, ei liikkuvaan haaraan
- repository-write tallentaa default-haaran SHA:n ennen ja jälkeen
- default-haaran drift sulkee jatkoportin `drifted`-tilaan
- workflow-evidenssi vaatii operation id:n ja moden täsmällisen run-name-sidonnan
- preview käyttää `--target=preview --skip-domain` -suojaa
- Operation Console näyttää plan hashin, artefaktirevision, branch/ref/commit-evidenssin, workflow-ajon, PR:n ja merge-evidenssin
- `npm run live:preflight` tarkistaa live-konfiguraation ilman sivuvaikutuksia

## Ulkoinen canary

Tämä validation ei väitä GitHub/Vercel-live-canarya suoritetuksi. Paikallinen release-portti todistaa toteutuksen ja regressiot, mutta oikea canary tarvitsee eksplisiittisen testirepon, GitHub/Vercel-ympäristömuuttujat ja Operation Consolen autentikoidun live-runtime-polun.

Live-canary katsotaan valmiiksi vasta kun ulkoinen evidenssiketju on todistanut:

```text
plan
→ written approval
→ repository execute
→ tests
→ PR
→ preview
→ merge
→ production
→ rollback
```

ja Operation Consolen evidenssi vastaa GitHubin/Vercelin todellista tilaa jokaisessa portissa.

## Tila

```text
1.18.5 LOCAL RELEASE GATE   GREEN
LIVE CANARY                 READY / NOT YET EXECUTED
PRODUCTION WRITE            LOCKED BEHIND APPROVAL GATES
```
