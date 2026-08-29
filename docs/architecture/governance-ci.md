# Governance & PR CI boundary

Phase 6 separates three responsibilities that previously overlapped operationally:

1. **Local/repository release gate** — `npm run check` is the deterministic quality contract. The runner derives and reports its step count from the current registry; governance does not duplicate a number that can drift.
2. **Pull-request CI** — `.github/workflows/pr-release-gate.yml` runs the same release gate on every PR targeting `master` with read-only repository authority and no deployment secrets.
3. **Repository governance state** — GitHub branch protection requires the successful `Release Gate` check before `master` can change.

## Required flow

```text
feature / phase branch
        ↓
pull request → PR Release Gate
        ↓           ↓
   merge candidate  npm ci → npm run check
        ↓           ↓
        └────── Release Gate = success
                       ↓
              protected master
                       ↓
                    merge
```

The PR workflow deliberately has no Vercel token, deployment authority, `pull_request_target`, write token, production environment, or rollback capability. Deployment operations remain in the separately dispatched capability workflow.

## Master protection contract

`scripts/governance/enable-master-protection.sh` is intentionally manual and fail-closed. It refuses to enable protection until an open non-draft PR targeting `master` already has a successful `Release Gate` check. The script resolves the GitHub App id that produced that successful check and binds the required check to that app.

The protection contract requires:

- changes through a pull request, with zero mandatory approvals for the current single-maintainer workflow;
- successful `Release Gate` status;
- strict/up-to-date branch status before merge;
- rules enforced for administrators;
- conversation resolution;
- force-push disabled;
- branch deletion disabled.

The repository intentionally does **not** require Vercel as a merge check. Vercel remains deployment evidence, while the deterministic repository release gate owns merge correctness.

## External-state verification

Branch protection is GitHub repository state, not a tracked file. `scripts/governance/verify-master-protection.sh` reads the live protection configuration and fails unless it matches the contract above.
