# Error #006: Code Quality Issues in Audit Fixes

**Date:** 2026-03-22
**Project:** Bresco (Pass 3 fixes)

## What Happened
Several of the 31 code fixes introduced their own quality issues:

1. **EOD timezone fix is overly complex** (checkin-eod.ts:36-45): Wrote a 6-line offset calculation with `localMidnight` (unused), `todayStartUtc`, `utcDate`, `tzDate`, `offsetMs` when the other 3 cron files use a simple one-liner: `new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())`. Inconsistent patterns across the same codebase.

2. **Dead code: `localMidnight` variable** (checkin-eod.ts:38): Declared but never used. Leftover from an abandoned approach.

3. **Production API changed for test convenience** (qstash.ts): Added optional `client` parameter to `scheduleSequenceSend()` and `cancelScheduledMessage()`. While DI is valid, this changed the public API surface to work around Bun test tooling limitations, not for architectural reasons. Should have been flagged as a tradeoff.

4. **Fragile test command** (package.json): Split `test` script into 4 sequential `bun test` processes. Any new test file with `mock.module` could break if added to the wrong group. This tech debt wasn't flagged.

5. **applySchemas() error handling added but not cleaned up** (auth.ts): Added `try/catch` with `console.error` for debugging, which is good. But the error message includes `err instanceof Error ? err.message : err` which could log sensitive schema content in production.

## The Triggering Prompt
```
(Internal execution of "fix all 31 issues in priority order")
Speed of execution prioritized over consistency and quality of each fix.
```

## What Went Wrong
**Category:** Prompt Error (self-direction)
**Root cause:** Batch-fixing 31 issues in sequence prioritized throughput over quality. Each fix was reviewed individually but not compared against existing patterns in the codebase. The doom-loop on mock.module also burned time that could have been spent on quality review.
**Surface symptom:** Inconsistent patterns (EOD vs other crons), dead code, and tech debt introduced while fixing tech debt.

## What The Prompt Should Have Been
```
(Before writing each fix)
"Check existing code for the same pattern. Use the same approach as the other files that do this."
(After writing all fixes)
"Review all fixes for consistency, dead code, and unnecessary complexity before committing."
```

## Prevention
1. Before fixing a bug, read how the same thing is done elsewhere in the codebase and match the pattern.
2. After batch fixes, do a self-review pass before committing. Grep for unused variables, inconsistent patterns.
3. When modifying a public API for test reasons, add a comment explaining why and flag it as tech debt.
4. When splitting test commands for isolation, add a comment explaining the grouping rationale.

## Pattern Check
- **Seen before?** No (first logged code quality issue in fixes).
- **Added to toolkit?** No. Consider adding "consistency check" to the fix workflow: "does this fix match existing patterns?"
