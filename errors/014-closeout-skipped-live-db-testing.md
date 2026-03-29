# Error #014: Phase closeout verification skipped live database testing

**Date:** 2026-03-29
**Project:** Bresco

## What Happened
Phase closeout verification (Phase 1: Verify) only ran unit tests. It didn't start SurrealDB and run integration tests. A code review fix (#12: hardcode is_owner=false in SIGNUP) broke admin provisioning, and this was only caught when Scott asked "did you fire up SurrealDB to test?"

## The Triggering Prompt
```
Perform /scott:phase-closeout
```

## What Went Wrong
**Category:** Harness Error
**Root cause:** The phase-closeout workflow says "Run the full test suite" but the orchestrator only ran bun test on each package separately. It didn't start SurrealDB or run the integration test that requires a live instance.
**Surface symptom:** 17/18 integration tests passed, 1 failed (is_owner was false). Only discovered after manual intervention.

## What The Prompt Should Have Been
```
Phase closeout verify step should: (1) Start SurrealDB if the project uses it, (2) Run ALL tests including integration tests that require external services, (3) Report results from live tests, not just unit mocks.
```

## Prevention
1. Phase closeout verify must start SurrealDB before running tests on projects that use it
2. Add to lessons.md: "Always start SurrealDB during closeout verification"
3. Consider adding a `test:integration` script to package.json that handles SurrealDB lifecycle

## Pattern Check
- **Seen before?** No - first full phase closeout on a SurrealDB project
- **Added to toolkit?** Yes - lesson in tasks/lessons.md
