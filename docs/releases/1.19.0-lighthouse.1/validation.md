# Validation contract — 1.19.0-lighthouse.1

Validated on 2026-08-29 from `architecture/lighthouse-v1`.

## Required gates

| Gate | Result |
| --- | --- |
| `npm run check` | 91/91 release-gate steps passed |
| `npm run check:lighthouse` | 14/14 Lighthouse steps passed |
| source syntax scan | 186 JavaScript and 16 JSON files passed |
| Lighthouse browser flow | D0 → D1 → D2/D3 passed on desktop and 390 px mobile |
| accessibility | axe passed; visible controls meet the 44 px mobile target |
| export allowlist | source and deploy manifests include required Lighthouse boundaries |

The browser gate uses Playwright 1.55.0, its pinned Chromium build and axe-core
4.10.3. It verifies the real built UI with a deterministic mocked session and
intent response; it does not spend provider tokens.

## Security assertions

- Preview and production deny the Lab unless explicitly enabled.
- An enabled remote Lab requires an authenticated admin session and CSRF token.
- API mutations require same-origin JSON requests under 64 KiB and rate limits.
- Workspace material and previous history are marked as untrusted prompt data.
- The Lab cannot claim publication or other external side effects.
- Automatic deployment is disabled for `architecture/lighthouse-v1`.

## Version boundary

The package identifies this branch as `1.19.0-lighthouse.1`. The stable public
Core remains `1.18.7`; this evidence does not authorize a production release.
