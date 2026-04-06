# Error #024: Raw String Passed to record<user> SCHEMAFULL Field
**Date:** 2026-04-05
**Project:** Bresco Platform

## What Happened
`performed_by` on `approval_log` is `TYPE record<user>` but received a plain string userId. SCHEMAFULL would silently fail to store the value, breaking the approval audit trail.

## The Triggering Prompt
```
Execute plan 03-03 (approval flow, gsd-executor subagent)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Agent treated record<X> fields the same as string fields. Phase 1 lesson explicitly documented: "record<X> schema fields MUST use type::record() in queries. Raw strings silently fail on SCHEMAFULL tables."
**Surface symptom:** Schema lens caught it during closeout review.

## What The Prompt Should Have Been
```
When writing CREATE/UPDATE for SCHEMAFULL tables, use type::record('table', $id) for every field defined as record<X> in the schema.
```

## Prevention
1. Already documented in tasks/lessons.md from Phase 2 — agents need to read it
2. Schema lens catches this in closeout

## Pattern Check
- **Seen before?** Yes — same class as Phase 2 `type::record()` issues
- **Added to toolkit?** Already in lessons.md, reinforced this phase
