# Anomancer 1.17.2 · Nanomancer Full Release

1.17.2 rakentuu 1.17.1 Archive Coren päälle ja lisää ensimmäisen versionoidun Capability Plugin -kerroksen sekä sen referenssitoteutuksen, Nanomancerin.

## Uutta

- `anomancer-capability-plugin/v1` Capability Registry
- Nanomancer read-only plugin contract
- deterministinen compare / diff / consistency / deviation / cross-run -runtime
- `anomancer-nanomancer-analysis/v1` structured analysis artifact
- Archive Context Grant -valvonta Nanomancer-syötteille
- automaattinen Context Receipt, kun analyysi lukee Arkistoa
- workspace-eristetty Run Record -vertailu
- private `/api/admin/core?resource=capabilities` gateway
- Konehuoneen Nanomancer Workbench
- ihmisen erillinen analyysin arkistointitoiminto
- 360 px ja desktop Chromium UI -portit
- tuotantobuildin asset-varmistus

## Turvallisuusperiaate

```text
NANOMANCER = READ-ONLY INSTRUMENT

Archive read  -> owner / explicit grant
Run read      -> current workspace only
Model access  -> none
Workspace write -> none
Archive write -> none
Persistence   -> human-approved separate action
```

## Release-portit

- Nanomancer runtime: 12/12
- Nanomancer UI Chromium: 2/2
- Visual System: 8/8
- koko `npm run check`: vihreä

Katso `NANOMANCER_1_17_2.md`.
