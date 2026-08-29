# Validation — 1.22.0-lighthouse-actuator.1

Validated in the construction source workspace:

- Lighthouse non-browser suites: 18/18 passed.
- Legacy Core runtime regression suites: 11 suites passed, including Core Foundation, Agent Contracts, Agent Layer, Agent Pool, Custom Orchestras, Model Router, Orchestrator, Run Explorer, Runtime Profiles, Tool Broker and Workspace Foundation.
- Public API surface: 5/5 passed after adding the locked mutation endpoint.
- Export allowlist: 4/4 passed with the mutation proposal, actuator, API route and tests included.
- Actuator security regression verifies no write during proposal sealing, exact confirmation, proposal-hash binding, session binding, source-SHA drift denial, base-SHA binding, replay denial and operation-branch-only execution.
- The runtime mutation test verifies proposal generation changes D1 to `needs_approval`, records `mutationProposed` in D5/D6 and keeps `externalWriteUsed=false` before explicit execution.

Browser/axe coverage still belongs to the full repository gate because the content-safe source package does not bundle Playwright Chromium.
