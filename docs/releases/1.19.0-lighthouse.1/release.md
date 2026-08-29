# Anomancer 1.19.0-lighthouse.1 — Lighthouse Construction Mode

This prerelease establishes the local-first Lighthouse vertical slice without
changing the stable public Core version.

## Included

- D0 Door and D1 Work with continuation and retry states
- optional D2 Trust, D3 Workspace, D4 Orchestra, D5 Machine and D6 Core depth
- one-room mobile navigation and fixed desktop inspection
- browser-local workspace materials and versions
- provider-neutral `llm.reasoning` intent route with a DeepSeek adapter
- remote-default lock with admin authentication, CSRF and same-origin checks
- explicit Lighthouse coverage in source and deploy export allowlists

## Not a production release

The stable public release remains 1.18.7 on `master`. The Lab is intended for
local development and deliberately requires an explicit environment flag and
admin session when enabled remotely.

See [`../../../CONSTRUCTION_MODE_1.19.0.md`](../../../CONSTRUCTION_MODE_1.19.0.md)
for the operating contract.
