# Error #10: Used type::thing() Instead of type::record() (SurrealDB v3)
**Date:** 2026-03-23
**Project:** Bresco

## What Happened
The plan for the reschedule endpoint specified `type::thing('job', $id)` for parameterized record lookups. SurrealDB v3 renamed this to `type::record()`. The code failed at runtime with "Invalid function/constant path, did you maybe mean `type::record`".

## The Triggering Prompt
```
Use parameterized queries: SELECT * FROM type::thing('job', $id)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** The plan author (main context) knew about the v3 rename (it's in MEMORY.md: "type::thing() -- v2 only. v3 renamed to type::record()") but still wrote `type::thing()` in the plan. The executor agent followed the plan literally.
**Surface symptom:** Tests failed with SurrealDB parse error. Fixed by replacing with `type::record()`.

## What The Prompt Should Have Been
```
Use parameterized queries: SELECT * FROM type::record('job', $id)
(Note: v2 used type::thing(), v3 uses type::record())
```

## Prevention
1. When writing SurrealDB queries in plans, always use v3 syntax
2. MEMORY.md already has this documented -- check memory before writing SurrealDB code in plans

## Pattern Check
- **Seen before?** Yes -- MEMORY.md already tracks this as a known gotcha
- **Added to toolkit?** Already in memory and surrealdb skill
