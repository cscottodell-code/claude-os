# Error #031: Queried Wrong SurrealDB Database
**Date:** 2026-04-12
**Project:** Eleanor v2

## What Happened
Used `--database eleanor` when querying SurrealDB via CLI, but the app connects to `--database production` (configured in db.ts). Got false "table doesn't exist" results.

## The Triggering Prompt
```
Let me check SurrealDB directly for what credentials actually exist.
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Assumed the database name matched the project name. Did not check db.ts for the actual connection config.
**Surface symptom:** CLI queries returned empty results, leading to wrong conclusions about DB state.

## What The Prompt Should Have Been
```
Let me check db.ts for the database connection config first, then query with the correct namespace and database.
```

## Prevention
1. Always read db.ts (or equivalent) before running direct DB queries
2. The namespace and database names are in db.ts, not assumed from the project name

## Pattern Check
- **Seen before?** No
- **Added to toolkit?** Yes, lesson added to tasks/lessons.md
