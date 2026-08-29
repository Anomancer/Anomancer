# Anomancer 1.19.0 Lighthouse Construction Mode

Package: `1.19.0-lighthouse.2`

Branch: `architecture/lighthouse-v1`

Stable public Core: `1.18.7` on `master`

Lighthouse is the progressive D0–D6 shell for Anomancer. The construction slice is intentionally single-provider but keeps provider selection behind the capability boundary. Lighthouse now adapts reasoning depth without granting new authority:

```text
D0 Door
  → IntentService
  → adaptive intelligence profile
      ├─ direct: work
      ├─ planned: plan → work
      └─ reviewed: plan → work → review
  → llm.reasoning capability
  → provider adapter
  → D1 Work
  → optional D2–D6 inspection
```

## Local development

Requirements: Node.js 20+, Vercel CLI and local environment values pulled from
the intended Vercel project.

```bash
npm ci
vercel pull
npm run lab
```

Open `http://localhost:3000/lab`. Development allows the Lab by default. Set
`ANOMANCER_LIGHTHOUSE_LAB=0` to verify the locked state locally.

## Remote safety boundary

Preview and production are locked by default. A remote Lab is available only
when all of these are true:

1. `ANOMANCER_LIGHTHOUSE_LAB=1` is configured for that environment.
2. The requester has a valid authenticated admin session.
3. The request is same-origin and includes the session-bound CSRF token.
4. The request is JSON and stays within the 64 KiB body limit and rate limit.

The construction branch has automatic Vercel deployments disabled in
`vercel.json`. Create an intentional preview only through the existing bounded
preview/deployment workflow. Production remains on `master`.

## Validation and export

```bash
npm run check:lighthouse
npm run check
npm run export:source
npm run export:deploy
```

The source and deploy exporters use explicit allowlists. Lighthouse `app/`,
`core/`, `catalog/` and `providers/` files must remain covered by the export
gate whenever the architecture grows.

To publish the branch explicitly after review:

```bash
git push -u origin architecture/lighthouse-v1
```
