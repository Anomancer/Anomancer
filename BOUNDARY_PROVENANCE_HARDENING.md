# Anomancer 16.1 · Boundary + Provenance Hardening

16.1 is a stabilization release. It adds no new agent role, tool capability or publication authority.

## Public Core boundary

`server/public-core.js` builds `anomancer-core-public/v2` from an explicit allowlist. Public Core no longer exports exact token ceilings, provider targets, fallback order, runtime profiles or exact write/deny matrices. The private admin Core remains server-authoritative and retains the full runtime information needed by the control plane.

## Release provenance

Each build writes `/release-provenance.json` with the release/core version, build time, source revision when available, safe registry hashes, the public-schema hash and the deployed API surface count. It contains no raw prompts, outputs, provider configuration, runtime profiles or private workspace data.

## API function budget

Vercel entrypoints are reduced from 12 to 4:

- `/api/admin/auth`
- `/api/admin/content`
- `/api/admin/core`
- `/api/contact`

The gateway files only route requests. Existing domain handlers remain separated under `server/admin-routes/`, so reducing the Vercel function count does not collapse authentication, content, agent, runtime, run, workspace and orchestra logic into one implementation file.

## Compatibility routes inside the gateways

- `auth?resource=login|logout|session|status`
- `content?resource=posts|media`
- `core?resource=core|workspaces|agents|orchestras|runs|runtime`

Unknown resources fail closed with `404 ADMIN_RESOURCE_UNKNOWN`.

## Regression gates

16.1 adds two permanent gates:

- `test-public-boundary.mjs`: validates the public allowlist and rejects private fields or secret names.
- `test-api-surface.mjs`: requires the four-entrypoint API surface and rejects the old endpoint paths from shipped admin JavaScript.

Private IP lineage material is intentionally not part of this repository.
