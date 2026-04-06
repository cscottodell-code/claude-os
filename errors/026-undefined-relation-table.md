# Error #026: RELATE Used Without TYPE RELATION Table Definition
**Date:** 2026-04-05
**Project:** Bresco Platform

## What Happened
webhook.ts used `RELATE $contactId->activity->$messageSid` but no `activity` TYPE RELATION table was defined. SurrealDB would auto-create it as SCHEMALESS, bypassing schema enforcement and permission rules.

## The Triggering Prompt
```
Execute plan 03-04 (inbound webhook, gsd-executor subagent)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Agent assumed `activity` was an existing relation table. The file `activity.surql` exists but defines `contacted`, `converted_to`, and `has_job` — not `activity`. The agent didn't verify the table name against the actual schema file contents.
**Surface symptom:** Schema lens caught it during closeout review.

## What The Prompt Should Have Been
```
Before using RELATE with any table, verify the relation table exists with TYPE RELATION in the .surql schema files. Don't assume from filename — read the actual DEFINE TABLE statements.
```

## Prevention
1. Phase 2 lesson already documented: "SurrealDB v3 edge tables require TYPE RELATION in DEFINE TABLE"
2. Schema lens catches missing relation tables in closeout

## Pattern Check
- **Seen before?** Related to Phase 2 lesson about TYPE RELATION requirement
- **Added to toolkit?** Fixed by adding activity table definition
