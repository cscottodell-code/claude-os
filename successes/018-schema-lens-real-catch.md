# Success #018: Schema Lens Caught Missing approval_counter Table
**Date:** 2026-04-08
**Project:** Bresco

## What Worked
Despite 10 false positives, the schema lens correctly identified that the `approval_counter` table had no DEFINE TABLE SCHEMAFULL definition. This would have caused silent write failures in production — SCHEMAFULL tables reject undefined fields, and an undefined table would reject all operations.

## The Triggering Prompt
```
Schema lens: "Compare every db.query() call against SCHEMAFULL table definitions"
```

## Why It Worked
**Key factor:** Systematic comparison of all db.query() calls against schema files. The lens's broad scope caught a table that was invented during execution but never given a schema.
**Contributing factors:** SCHEMAFULL enforcement means the catch prevents real production failures, not just style issues.

## Reproducible?
- **Can repeat?** Yes — schema lens should run on every phase with DB changes
- **Should become standard?** Already standard (Phase 2b lens review). Needs improvement: pass ALL schema files, not just phase-scoped ones.
