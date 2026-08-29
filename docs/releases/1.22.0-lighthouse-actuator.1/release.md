# 1.22.0-lighthouse-actuator.1 — Human-approved Actuator

This construction release adds the first bounded write-capability to Lighthouse.

The actuator does not write to the default branch. A software request that explicitly asks for a change may produce a structured proposal for repository files that were read in the same run. The server re-reads those files, creates a diff, binds the proposal to repository and source SHAs, and issues a short-lived approval token tied to the authenticated admin session.

Execution requires the exact visible confirmation phrase. The server revalidates every binding and then creates only an isolated `anomancer/op-*` branch and commit. The response contains a receipt and GitHub compare URL.

Tests, pull requests, deploys, merges and destructive actions are not chained automatically from this capability.
