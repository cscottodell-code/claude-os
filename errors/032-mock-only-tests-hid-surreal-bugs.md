# Error #32: Mock-Only Tests Hid 4 SurrealDB Schema Bugs
**Date:** 2026-04-13
**Project:** Eleanor v2

## What Happened
All Phase 4 unit tests used `vi.fn().mockResolvedValue()` for DB calls. Tests passed but 4 real bugs existed: `status = 'pending'` rejected by schema ASSERTs, multi-field FULLTEXT indexes unsupported, FLEXIBLE keyword position wrong, IF/THEN/ELSE invalid in ORDER BY.

## The Triggering Prompt
```
Execute plan 04-01 of phase 04-people-commitments (schema + encryption)
```

## What Went Wrong
**Category:** Process Error
**Root cause:** TDD cycle wrote mocks that returned expected shapes without ever hitting a real SurrealDB instance. The mocks validated JavaScript logic but not SurrealQL syntax or schema constraints.
**Surface symptom:** All tests green, but first live DB test revealed 4 failures.

## What The Prompt Should Have Been
```
Execute plan 04-01. For any SurrealDB migration or query code, include integration tests
against a live SurrealDB instance alongside unit tests. Use tests/integration/db-setup.ts pattern.
```

## Prevention
1. Integration tests against live SurrealDB are now mandatory for any phase touching DB (added to lessons.md)
2. Hook `surrealdb-integration-tests.ts` blocks phase completion if SurrealDB files changed but no integration tests exist

## Pattern Check
- **Seen before?** Yes, similar to Error #28 (mock tests passing while real queries fail)
- **Added to toolkit?** Yes, guard hooks enforce integration tests for SurrealDB phases
