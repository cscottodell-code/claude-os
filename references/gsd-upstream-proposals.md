# GSD Upstream Proposals

Proposed changes to the GSD framework that would improve future builds.
These can't be applied directly (would be overwritten by /gsd:update).
Submit via GSD Discord or GitHub issues.

## 1. Research Prompt: SDK Runtime Compatibility Check
**Date:** 2026-03-22
**Source:** Eleanor M4 Phase 1 retro, error-002

**Problem:** When a phase involves a runtime migration (e.g., Node to Bun), the researcher doesn't ask whether SDK methods behave differently under the target runtime. This led to all 4 agent layers missing the SurrealDB SDK coercion bug.

**Proposed change:** Add to the research prompt in `plan-phase.md` (after the `<additional_context>` block):

```markdown
<runtime_migration_check>
If this phase involves changing the runtime (Node to Bun, CJS to ESM, etc.),
the researcher MUST investigate:
- Do the project's SDK/library methods behave the same under the target runtime?
- Are there transport-layer differences (WebSocket vs WASM, fetch vs node-fetch)?
- Test method-based APIs (create, update, delete) against a real service instance
  under the target runtime, not just read operations.
</runtime_migration_check>
```

**Impact:** Would have caught the Bun SDK coercion issue before planning, saving ~1 hour of debugging.
