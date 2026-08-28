# Repository layout and generated-output boundary

The repository separates durable source from build products.

```text
Anomancer/
├── api/                 # Vercel HTTP entry adapters
├── server/              # server-authoritative Core/domain services
├── mancers/             # package-defined domain workbenches
├── content/             # editorial source corpus
├── media/               # source media
├── scripts/             # build/dev utilities
├── tests/               # semantically grouped release-gate suites
├── docs/                # canonical current documentation
├── visual-fixtures/     # browser/visual QA fixtures
├── *.html/*.js/*.css    # current static/runtime source pending later src/ split
└── public/              # GENERATED, ignored by Git
```

## Generated root products

The following are also build outputs and are ignored by Git:

- `lahetykset.html`, `dispatches.html`
- `lahetykset/`, `dispatches/`
- `rss.xml`, `rss-en.xml`, `sitemap.xml`, `robots.txt`
- `content-manifest.json`, `evidence-manifest.json`, `discovery-manifest.json`
- `core-public.json`, `release-provenance.json`, `llms.txt`

`npm run check` bootstraps the build first, so a clean clone does not require generated output to be committed.

## Transitional source/build hybrid

`index.html`, `en.html`, `core.html` and `core-en.html` remain tracked source files that the build synchronizes in-place before staging. Separating these into immutable templates and generated output is a later refactor and is intentionally not mixed into the repository-hygiene cleanup.
