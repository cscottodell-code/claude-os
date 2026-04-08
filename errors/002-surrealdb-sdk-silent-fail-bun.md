---
resolved: true
---
# Error #002: SurrealDB SDK Methods Fail Silently Under Bun Runtime
**Date:** 2026-03-22
**Project:** Eleanor (M4 Phase 1: Hono on Bun)

## What Happened
During the Hono migration, all 4 executor agents wrote routes using `db.create('table', data)` and `db.update('table:id').merge(data)` patterns copied from existing Nitro code. These methods work under Node/Nuxt (WASM-backed SDK transport auto-coerces strings to RecordId), but fail under Bun (native WebSocket transport sends strings as-is). SurrealDB v3's strict typing then rejects the strings where `record<table>` is expected. The error only surfaced during manual browser testing, after all 4 plans were "complete" and 188 tests passed.

## The Triggering Prompt
```
Execute plan 01-02 of phase 01-hono-on-bun.
(Plans instructed agents to follow existing route patterns from server/api/)
```

## What Went Wrong
**Category:** Context Error (multi-layer)

**Root cause:** No one in the agent chain (researcher, planner, plan-checker, executor) knew that the SurrealDB JS SDK's `db.create()` and `db.update().merge()` methods behave differently under Bun vs Node runtimes. This is a runtime transport difference, not a code pattern difference.

**Surface symptom:** Chat endpoint returned `{"ok":false,"error":{"code":"INTERNAL","message":"Internal server error"}}` when tested in browser. All automated tests passed because they mock the DB.

**Contributing factors:**
1. **Research gap** - The researcher investigated Hono patterns, Bun.env behavior, and vitest compatibility, but never asked "do SurrealDB SDK methods work the same under Bun?" The research prompt didn't include runtime-specific SDK behavior as a concern.
2. **Planning gap** - Plans specified `db.create()` and `db.update().merge()` patterns because they matched existing code. The planner didn't question whether these method-based APIs work across runtimes.
3. **Plan-checker gap** - Verified all 10 dimensions and passed. Dimension 7 (Context Compliance) checked decisions D-01 through D-14, but none of those decisions covered SDK method compatibility. Dimension 10 (CLAUDE.md Compliance) checked SurrealDB patterns but those patterns assumed Node runtime.
4. **Testing gap** - Dual testing strategy (D-08) was smart but mocked DB tests don't exercise the real SDK transport layer. The `db.create()` calls in tests never hit SurrealDB, so the coercion difference was invisible.

## What The Prompt Should Have Been
```
Research prompt addition for any runtime migration phase:

"Does the SurrealDB JS SDK (or any SDK the project uses) behave differently
when running under Bun vs Node? Specifically: do method-based APIs like
db.create(), db.update().merge(), db.select() handle string arguments the
same way across both runtimes? Test with the actual SDK version (2.0.1)
against a running SurrealDB instance."
```

## Prevention
1. **Add to scott-surrealdb skill:** Document the Bun vs Node SDK transport difference. When any plan involves running SurrealDB SDK under Bun, flag that `db.create(string)` and `db.update(string).merge()` must be replaced with `db.query()` + `type::record()`.
2. **Research prompt improvement:** For runtime migration phases (Node to Bun, CJS to ESM, etc.), the researcher should always ask "do the project's SDK/library methods behave differently under the target runtime?"
3. **Integration test requirement:** For migration phases, at least one test per route group should hit a real DB instance (not mocked). Mocked tests verify logic but miss transport-layer issues.
4. **Already captured in Eleanor:** `tasks/lessons.md` has the full fix pattern. Memory file `feedback_surrealdb_bun_coercion.md` created for cross-project awareness.

## Pattern Check
- **Seen before?** No. Error #001 was about stale context in CLAUDE.md, unrelated.
- **Added to toolkit?** Yes:
  - Eleanor `tasks/lessons.md` updated with full Bun coercion fix pattern
  - `~/.claude/projects/-Users-scott/memory/feedback_surrealdb_bun_coercion.md` created
  - `MEMORY.md` updated with cross-project pointer
  - TODO: Update `scott-surrealdb` skill with Bun-specific section
