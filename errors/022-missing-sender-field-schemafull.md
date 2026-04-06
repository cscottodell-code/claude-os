# Error #022: Missing sender Field on SCHEMAFULL Message CREATE
**Date:** 2026-04-05
**Project:** Bresco Platform

## What Happened
3 of 4 `CREATE message SET` statements in Phase 3 were missing the required `sender` field. The `message` table is SCHEMAFULL, so the field would be silently absent, making it impossible to identify message origin.

## The Triggering Prompt
```
Execute plans 03-02, 03-03, 03-04 (gsd-executor subagents)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Executor agents wrote CREATE statements by pattern-matching within Phase 3 code instead of verifying against the Phase 1 `message.surql` schema definition. The schema requires `sender`, `type`, `payload` but agents only included `type` and `payload`.
**Surface symptom:** Schema lens caught it during closeout review.

## What The Prompt Should Have Been
```
Before writing any CREATE/UPDATE for existing tables, read the table's .surql schema definition and verify all required fields are included.
```

## Prevention
1. Executor subagent prompt should include "verify all CREATE/UPDATE statements against the target table's .surql schema"
2. Schema lens in closeout catches this as a second safety net

## Pattern Check
- **Seen before?** Related to Phase 2 lessons about SCHEMAFULL silently rejecting unknown fields
- **Added to toolkit?** Fixed in code review phase
