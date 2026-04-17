# Error #038: Briefing Builder Used Wrong Status Enum Values
**Date:** 2026-04-16
**Project:** Eleanor v2

## What Happened
briefing-builder.ts used `status = 'completed'` for task queries, but the task table schema defines status as `['todo', 'in_progress', 'done', 'cancelled']`. Also queried `completed_at` which is not a defined field on the SCHEMAFULL task table. This made all wins queries return zero results.

## The Triggering Prompt
```
Execute plan 03 of phase 05-proactive-engine. (briefing generation backend)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** The executor agent wrote queries against the task table without reading the actual schema definition in 006_people_commitments.surql. It assumed standard naming ('completed') instead of the actual enum values ('done').
**Surface symptom:** Morning/evening briefing wins sections always show "No wins logged" even when tasks are marked done.

## What The Prompt Should Have Been
```
Before writing any db.query() calls, read the SCHEMAFULL table definitions in 
server/migrations/ to verify exact field names and enum values. Do not assume 
standard naming conventions.
```

## Prevention
1. Executor agents must read relevant migration files before writing queries
2. Schema lens review in phase closeout catches this (it did in this case)
3. Add schema-reading instruction to executor prompt for phases that query existing tables

## Pattern Check
- **Seen before?** No -- first schema enum mismatch
- **Added to toolkit?** No -- needs executor prompt enhancement
