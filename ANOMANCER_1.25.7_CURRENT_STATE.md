# Anomancer 1.25.7 · current reconstructed working tree

This package is the full Git-free source tree reconstructed from the 1.25 release line and the hotfix chain applied in this conversation.

Included hotfix state:
- 1.25.2: workspace-scoped Run Store write queue, 12-attempt CAS recovery, mobile workspace sheet / preview fixes.
- 1.25.3: dispatch draft counts + sticky filters, fail-soft orchestra telemetry, orchestra result → human publish review.
- 1.25.3.1: native workspace dialog close fix.
- 1.25.4: runtime service shadow fix, DeepSeek/MODEL length recovery route, compact Critic response budget, PWA cache bump.
- 1.25.5: publication read-back confirmation, public-route freshness, duplicate URL guard and one-click source verification.
- 1.25.6: Vercel production output no longer contains static dispatch files that shadow dynamic listing and article routes. Empty installations seed bundled content safely, and the publication integration test is independent of user content.
- 1.25.7: release archive preserves the nested `api/public/` source directory and validates both public API entrypoints before delivery.

Validation performed before packaging:
- npm run check: 97/97 release steps PASS
- Publication write → read-back → public route integration: PASS
- Duplicate public URL rejection: PASS
- Immediate public content freshness headers: PASS
- One-confirmation source verification: PASS
- Run Explorer + usage metering: 11/11 PASS
- Orchestrator resilience: 18/18 PASS
- Agent layer: 21/21 PASS
- Model Router: 11/11 PASS
- Mobile workspace: 8/8 PASS
- Mobile control-plane reflow: 9/9 PASS

This archive intentionally does not contain Git metadata, Vercel project metadata, node_modules, environment files or test-result output.
