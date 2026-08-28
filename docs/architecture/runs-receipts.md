# Runs, receipts and usage

A run is an execution record scoped to a workspace. A receipt is the bounded audit metadata describing what executed.

Receipts include agent/contract identity, model route/target facts, orchestration position when relevant, token/usage metadata, tool-policy facts, input/output hashes, timestamps and approval status. They intentionally avoid publishing raw prompts or raw model outputs through the public architecture surface.

The server-side Run Store is revision-protected and workspace-scoped. Usage views aggregate from stored run records rather than browser-only state.

Run and operation histories use integrity metadata/hash chaining where applicable. These mechanisms are audit aids and must not be described as stronger cryptographic proof than they actually provide.

Historical lineage incorporated from `RUN_EXPLORER.md` and current run-store/runtime code.
