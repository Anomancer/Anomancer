# Lighthouse Hands

Lighthouse Hands is the read-only capability runtime between D0 routing and adaptive reasoning.

```text
Intent
→ ProblemModel
→ CapabilityResolution
→ CapabilityRoute
→ Human Start
→ read-only Hands
→ adaptive reasoning
→ D1 result
→ D2 trust
→ D4 orchestration trace
→ D5 capability runtime
→ D6 provenance
```

## Read-only adapters

- `document.read` uses material already supplied to the browser workspace.
- `web.fetch` reads only explicit public HTTPS URLs. DNS is resolved before the request, private/reserved addresses are denied, the resolved public address is pinned for TLS transport, redirects are revalidated, and response type/size are bounded.
- `research.search` is runtime-available only when `BRAVE_SEARCH_API_KEY` exists. Core still requests the semantic capability, not the provider name.
- `repository.read` is runtime-available only when the existing GitHub content connection is configured. The first slice reads only explicitly named safe source paths and denies secret-like/private paths.
- `mancer.activate` loads an installed Mancer package as trusted internal method context. The package does not gain execution authority from activation.

External pages, search snippets, repository source and user material are treated as untrusted content when inserted into the model context. Mancer contract metadata is internal trusted method context, but it cannot override Core authority.

## Authority boundary

This route has `externalSideEffectsAllowed=false`. It does not write repositories, run approved tests, create pull requests, deploy, publish, delete, roll back or mutate external systems. Those capabilities remain behind their existing explicit operation and human-approval contracts.
