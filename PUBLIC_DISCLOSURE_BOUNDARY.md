# Anomancer Public Disclosure Boundary

Version: 1.0 · Anomancer 16.1

Public Core is an intentionally reduced view of the system. It is generated from an explicit allowlist in `server/public-core.js`; it is not a redacted dump of the private control plane.

## Public by design

- agent id, public label, role and high-level description
- public model-route class, without provider target selection
- public tool ids, risk class and human-only boundary
- built-in orchestra stage topology
- contract / orchestra / tool hashes
- evidence and human-final-authority principles
- safe release provenance hashes
- high-level workspace isolation model

## Private by default

- system prompts, custom instructions and prompt templates
- raw model inputs and outputs
- exact authority/write matrices and runtime policy implementation
- exact token ceilings and provider cost data
- provider configuration, target selection and fallback order
- runtime profiles and signed runtime snapshot payloads
- run history and workspace contents
- session, CSRF, signing, provider and GitHub secrets
- unpublished R&D mechanisms and private IP-candidate material

## Invariant

Adding a field to the private Core does not make it public. A field reaches `/core-public.json` only when it is explicitly added to the public allowlist and the disclosure regression gate accepts it.

`/core` explains the system. It is not the system's blueprint archive.
