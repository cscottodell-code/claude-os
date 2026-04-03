# Error #018: Record-Type Fields Passed as Raw Strings

**Date:** 2026-03-30
**Project:** Bresco Platform

## What Happened
SurrealDB schema defines `assigned_to`, `crew`, and `customer` as `record<X>` types. The API routes passed plain strings (e.g., `"user:abc"`) instead of using `type::record('table', $id)`. On SCHEMAFULL tables, this silently fails -- the field is never set, but no error is thrown.

## The Triggering Prompt
```
Build PATCH endpoint for leads and jobs
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Treated record-type fields like regular strings. SurrealDB v3 SCHEMAFULL tables require actual record references, not string representations. The SurrealDB skill wasn't loaded during execution, so this pattern wasn't top of mind.
**Surface symptom:** Leads/jobs appeared to save correctly, but relational fields (assigned_to, crew, customer) were silently empty.

## What The Prompt Should Have Been
```
Build PATCH endpoint for leads and jobs. Check the schema for record<X>
fields -- these MUST use type::record('table', $rawId) in queries.
Raw strings silently fail on SCHEMAFULL tables.
```

## Prevention
1. Before writing any route that touches a table: read the schema file and identify all `record<X>` fields
2. Use the `setEntry()` helper which wraps record fields with `type::record()` automatically
3. Load the surrealdb skill before any phase that writes SurrealQL

## Pattern Check
- **Seen before?** Partially -- Error #010 (type::thing v3 rename) is related but different
- **Added to toolkit?** Yes -- setEntry() helper added, lesson in tasks/lessons.md
