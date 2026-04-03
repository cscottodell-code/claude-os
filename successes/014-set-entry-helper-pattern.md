# Success #014: setEntry() Helper Prevents Record-Type Bugs

**Date:** 2026-03-30
**Project:** Bresco Platform

## What Worked
Created a `setEntry()` helper that automatically wraps `record<X>` fields with `type::record()` before writing to SurrealDB. Single abstraction, reusable across all CRM routes. Emerged from fixing error #018 (record-type fields passed as raw strings).

## The Triggering Prompt
```
Fix: SurrealDB schema compliance -- record type fields + import allowlists
```

## Why It Worked
**Key factor:** Instead of fixing each route individually, extracted the pattern into a shared helper that knows which fields are record types per table
**Contributing factors:** The fix was driven by a real bug (silently empty relational fields), so the abstraction solves a proven problem rather than a hypothetical one

## Reproducible?
- **Can repeat?** Yes -- any future table with record<X> fields uses setEntry()
- **Should become standard?** Yes -- all SurrealDB projects with SCHEMAFULL + record types should have a similar helper
