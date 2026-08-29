# Anomancer 1.18.6 — Validation

Release decision command:

```bash
npm ci
npm run check
```

Expected evidence:

- package and Core version `1.18.6`;
- 20 published articles and no drafts;
- 57 registered sources and 57 structured claims;
- no invalid `verified` records;
- pinned Playwright `1.55.0` with Chromium `140.0.7339.16`;
- static, content and browser groups complete without a failed step;
- accessibility matrix covers seven critical routes at desktop and mobile widths;
- source and deploy export allowlists complete in dry-run and artifact modes.

The commit, CI run, deployment and production smoke evidence are recorded by GitHub and Vercel for the published release rather than copied into a moving document.
