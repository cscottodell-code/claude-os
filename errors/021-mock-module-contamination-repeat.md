# Error #021: mock.module() Contamination Repeat
**Date:** 2026-04-05
**Project:** Bresco Platform

## What Happened
Phase 3 executor agent used `mock.module()` for handlebars in sequences.test.ts, contaminating handlebars.test.ts and sms.test.ts when run in the same Bun process. 9 tests failed in the full suite but passed in isolation.

## The Triggering Prompt
```
Execute plan 03-01 of phase 03-follow-up-engine. (gsd-executor subagent)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Subagent didn't read tasks/lessons.md before writing tests. Lesson from Phase 2 explicitly warned: "Never use mock.module() for shared packages like @bresco/db. Isolate integration tests."
**Surface symptom:** 9 test failures only visible when running full suite, not in isolated test files.

## What The Prompt Should Have Been
```
Execute plan 03-01. BEFORE writing any tests, read tasks/lessons.md and follow the mock isolation patterns documented there. Specifically: do not use mock.module() for modules that other test files import directly.
```

## Prevention
1. Add explicit "Read tasks/lessons.md FIRST" instruction to executor subagent prompts
2. Fix: split test script to run mock-heavy files in separate Bun processes

## Pattern Check
- **Seen before?** Yes — Error #020 (Phase 2, same mock.module contamination pattern)
- **Added to toolkit?** Yes — test script isolation fix committed
