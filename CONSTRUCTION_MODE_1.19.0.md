# Anomancer 1.19.0 Construction Mode
Production stays on `master`. Lighthouse is built locally on `architecture/lighthouse-v1`.

First slice:
D0 Door → IntentService → `llm.reasoning` → DeepSeek adapter → D1 Work.

Local:
```bash
vercel pull
npm run lab
```
Open `http://localhost:3000/lab`.

The lab API is disabled in production unless `ANOMANCER_LIGHTHOUSE_LAB=1`.
