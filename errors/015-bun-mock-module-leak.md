# Error #015: Bun mock.module Leak Broke Entire Test Suite

**Date:** 2026-03-30
**Project:** Bresco Platform

## What Happened
Bun's `mock.module()` is process-global, not file-scoped. A RecordId mock in one test file leaked into all other test files, making every test pass with fake data instead of real SDK behavior. The entire Phase 2 test suite was silently broken.

## The Triggering Prompt
```
Execute Phase 2 plans with TDD
```

## What Went Wrong
**Category:** Harness Error
**Root cause:** Bun's `mock.module()` registers globally and persists across test files. The `@bresco/db` mock in one file replaced the real Surreal class everywhere.
**Surface symptom:** All tests passed, but none were actually testing real SurrealDB behavior. Caught during closeout when running integration tests against live DB.

## What The Prompt Should Have Been
```
Execute Phase 2 plans with TDD. Before writing any mocks, verify that
Bun's mock.module() is file-scoped (it isn't -- it's process-global).
Use per-test mock cleanup or isolate integration tests in separate files.
```

## Prevention
1. Never use `mock.module()` for shared packages like `@bresco/db` -- it leaks across all test files
2. Integration tests (`.integration.ts`) must run against live SurrealDB, not mocks
3. Run integration tests during execution, not just at closeout

## Pattern Check
- **Seen before?** No -- first encounter with Bun mock scoping
- **Added to toolkit?** Yes -- lesson added to tasks/lessons.md
