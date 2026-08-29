# Validation contract — 1.18.7

Run from the repository root:

```bash
npm ci
npm run check
```

The release gate must verify:

- generated articles use a closed `article-evidence` disclosure;
- candidate-source styling is neutral and the status label remains visible;
- Home and Core footers link to `/admin` in Finnish and English;
- Core typography and current roadmap render without horizontal overflow;
- the visible Codemancer workspace action is an addressable link and opens the Project workbench;
- the complete static, content, browser, accessibility and security suite passes.
