# Codemancer adapters

1.18.4 keeps `mancer/package-artifact-store/v1` and `mancer/schema-workbench-ui/v1` as the artifact and UI adapters, and adds bounded server-side capability adapters behind the Operations contract.

Repository writes create only a new `anomancer/op-*` branch from an exact planned base SHA. Tests and Vercel preview/production/rollback use one allowlisted GitHub Actions workflow; the browser cannot provide a command string. Pull requests are never auto-merged. Production and rollback require their own written plan-bound approval and the GitHub `production` environment can require reviewers.

Secrets stay in server or GitHub Actions configuration. They are never returned to the browser or persisted in operation audit records.
