# Anomancer documentation

Current architecture:

- `architecture/lighthouse-unification.md` — Lighthouse shell, Mancer taxonomy, migration aliases and Publishing Target boundary

- `architecture/workspaces.md` — workspace isolation and Vercel/local persistence
- `architecture/lighthouse-hands.md` — bounded local project-source access
- `development/project-layout.md` — project directory layout
- `architecture/boundaries-provenance.md` — public/private disclosure and provenance boundary

Release execution is intentionally simple: validate locally with `npm run check`, then deploy directly to Vercel production with `npm run deploy:prod`. Generated `public/` output is disposable.
