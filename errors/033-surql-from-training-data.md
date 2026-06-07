# Error #33: SurrealQL Written from Training Data Instead of Docs
**Date:** 2026-04-13
**Project:** Eleanor v2

## What Happened
Four SurrealDB v3 syntax patterns were written from general LLM knowledge: multi-field FULLTEXT indexes, FLEXIBLE keyword position, inline type::record() in RELATE, and IF/THEN/ELSE in ORDER BY. All were wrong.

## The Triggering Prompt
```
Execute plan 04-01 (migration 006 with all Phase 4 tables, edges, indexes, events)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Executor agent wrote SurrealQL from training data without querying Context7 or copying from existing working migrations (003, 005).
**Surface symptom:** Migration failed on live SurrealDB with parse errors and silent data loss.

## What The Prompt Should Have Been
```
Execute plan 04-01. Before writing any SurrealQL, verify syntax against Context7
(/websites/surrealdb) and copy patterns from existing migrations (003, 005).
Never write SurrealQL from memory.
```

## Prevention
1. SurrealDB verification protocol enforced via hooks (surrealdb-inject.ts, surrealdb-validate-write.ts)
2. Lessons.md updated with specific v3 syntax traps (FULLTEXT, FLEXIBLE, RELATE, IF syntax)
3. Rule: always copy from working migrations first, verify against docs second

## Pattern Check
- **Seen before?** Yes, recurring theme (Errors #15, #22)
- **Added to toolkit?** Yes, verification protocol in claude-behavior.md + hook chain
