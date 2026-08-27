# Anomancer 1.17.3 · Arkistonhoitaja Full Release

1.17.3 rakentuu 1.17.1 Archive Coren ja 1.17.2 Nanomancerin päälle. Julkaisu lisää ensimmäisen varsinaisen Archive Governance Agentin.

## Uutta

- `server/archive-curator.js`
- Archive Governance Agent v1
- Archive Governance Report v1
- Archive Governance Proposal v1
- deterministinen Archive-index
- Archive Health -mittarit
- exact + near duplicate -seulonta
- relation integrity + project relation -ehdotukset
- retention review -ehdotukset
- orphan object -havainnot
- Arkistonhoitaja-UI Arkisto-pintaan
- human-approved governance report persistence
- server- ja Chromium-regressioportit

## Perustuslaki

Arkistonhoitaja on `suggestionsOnly`. Se ei voi tehdä Archive-mutaatioita tai laajentaa omia oikeuksiaan. Human Approval-, Archive Boundary-, Workspace Isolation-, Context Grant-, Evidence- ja Public/Private-rajat säilyvät.

## Testit

- `scripts/test-archive-curator-1173.mjs`
- `scripts/test-archive-curator-ui-1173.mjs`
- kaikki aiemmat regressioportit osana `npm run check`
