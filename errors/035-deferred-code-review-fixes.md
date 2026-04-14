# Error #35: Code Review Fixes Deferred Across Phase Boundaries
**Date:** 2026-04-13
**Project:** Eleanor v2

## What Happened
Phase 3 code review identified 5 findings (CR-01, WR-02/03/04, IR-04) that were not fixed before Phase 3 closed. They were addressed during Phase 4 execution instead. Similarly, Phase 2 auth test failures were left for 2 phases.

## The Triggering Prompt
```
/scott:phase-closeout (Phase 3)
```

## What Went Wrong
**Category:** Process Error
**Root cause:** Phase closeout allowed proceeding despite open code review findings. The fix cycle (Phase 2c step 2) was not enforced, and the gate marker was written without confirming all Critical/Important fixes were committed.
**Surface symptom:** Phase 4 inherited tech debt from Phases 2 and 3, requiring cleanup commits before its own work could begin cleanly.

## What The Prompt Should Have Been
```
Phase closeout Phase 2c: Fix all Critical and Important findings before proceeding.
Run second verification pass. Do not write .post-execution-complete until second pass is clean.
```

## Prevention
1. Phase closeout v3.0 explicitly requires second-pass verification after fixes
2. Lessons.md reinforces: fix code review findings in-phase, never defer
3. Hook blocks phase completion marker until review is clean

## Pattern Check
- **Seen before?** Yes, this is why phase-closeout was created (old 5-step sequence was skipped 3 times)
- **Added to toolkit?** Yes, phase-closeout v3.0 fix cycle is mandatory
