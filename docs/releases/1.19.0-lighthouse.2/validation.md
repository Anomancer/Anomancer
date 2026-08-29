# Validation — 1.19.0-lighthouse.2

Primary regression:

```bash
node tests/lighthouse/intelligence.mjs
```

Expected behavior:

- simple request → direct strategy → one reasoning pass
- complex debug/audit request → planned + reviewed strategy → three reasoning passes
- failed planner → work pass still returns a result and runtime marks the path degraded
- Core provenance records the intelligence contract
- D4 and D5 expose the selected strategy and pass trace

Full Lighthouse validation:

```bash
npm ci
npm run check:lighthouse
```
