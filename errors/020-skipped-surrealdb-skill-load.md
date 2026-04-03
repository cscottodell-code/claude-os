# Error #020: Didn't Load SurrealDB Skill or Run Live DB Tests

**Date:** 2026-03-30
**Project:** Bresco Platform

## What Happened
Started Phase 2 execution (CRM Pipeline -- heavy SurrealDB work) without loading the surrealdb skill. Wrote 5 plans of SurrealQL-heavy code relying on memory alone. Multiple v3-specific issues (record types, BM25 syntax, type::record double-prefix) weren't caught until closeout.

## The Triggering Prompt
```
Execute Phase 2
```

## What Went Wrong
**Category:** Prompt Error
**Root cause:** The skill system didn't enforce loading domain skills before execution. The surrealdb skill contains critical v3 gotchas that would have prevented errors #017 and #018.
**Surface symptom:** Multiple SurrealDB-specific bugs that required 4 fix commits during closeout.

## What The Prompt Should Have Been
```
Execute Phase 2. This phase is CRM Pipeline (heavy SurrealDB).
Load /scott:surrealdb skill first. Run integration tests against live
SurrealDB after each plan, not just at closeout.
```

## Prevention
1. Before any phase that touches SurrealDB: load the surrealdb skill
2. Run integration tests after each plan during execution, not just at closeout
3. Lesson from Phase 1 closeout already said this -- it was ignored

## Pattern Check
- **Seen before?** Yes -- Error #014 (closeout skipped live DB testing) is the same class of mistake
- **Added to toolkit?** Yes -- reinforced in lessons.md. This is now a repeat pattern.
