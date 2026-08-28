# Archive and memory capabilities

The Archive is a server-authoritative provenance store. It is intentionally not automatic model memory.

## Archive objects

Archive objects carry type, workspace/project context, provenance, relations, retention/visibility metadata and integrity information. Writes and destructive changes are human-gated.

Cross-workspace reads require explicit grants. Context Receipts record which authorized archive objects were actually supplied to a capability or run.

## Nanomancer

Nanomancer is a deterministic read-only capability plugin for comparison, diff, consistency and deviation analysis over authorized structured inputs. It does not automatically persist or mutate source data.

## Archive Curator

The Archive Curator is deterministic and suggestions-only. It can surface duplicate candidates, broken relations, retention issues, orphaned objects and archive-health observations, but cannot silently delete, grant access, verify evidence or publish.

## Integrity principle

Archive history is explicit. Deletion creates an integrity/tombstone trail rather than silently erasing the fact that remembered material existed.

Historical lineage incorporated from `ARCHIVE_CORE_1_17_1.md`, `NANOMANCER_1_17_2.md` and `ARKISTONHOITAJA_1_17_3.md`.
