# Lighthouse Mutation Rail

Lighthouse may prepare a repository mutation only after the normal D0 → read-only Hands → reasoning path has identified a software task with an explicit side-effect request.

The mutation rail is separate from normal reasoning:

```text
read named repository files
  → proposal pass
  → normalize to already-read paths only
  → re-read source files server-side
  → bind proposal to source SHAs + base branch SHA
  → sign approval token to the authenticated admin session
  → show diff + confirmation phrase
  → human written approval
  → re-check token, proposal hash, session, expiry, base SHA and source SHAs
  → create isolated anomancer/op-* branch + commit
  → return execution receipt
```

## Hard boundaries

- No default-branch write is exposed by the Lighthouse actuator.
- The proposal pass cannot create new files or delete files.
- Only repository paths successfully read in the same Lighthouse run may enter a proposal.
- High-authority surfaces are denied from the first actuator slice: `.github/`, deploy/package manifests, authentication/GitHub adapters, governance scripts and the mutation guard itself.
- The approval token is HMAC-signed, session-bound, proposal-hash-bound, base-SHA-bound, branch-bound and expires after a short window.
- A changed base branch or changed source file invalidates the approval.
- Reusing an already-created operation branch is rejected before write execution.
- Tests, pull requests, preview deployment, production deployment and merge remain separate operation capabilities with their own approvals.

The model may propose. The server may verify. Only the human may authorize the external side effect.
