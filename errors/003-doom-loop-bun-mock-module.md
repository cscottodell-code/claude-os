# Error #003: Doom-Loop on Bun mock.module (6+ Failed Attempts)

**Date:** 2026-03-22
**Project:** Bresco (test fixes)

## What Happened
Spent 6+ iterations trying to fix qstash.test.ts cross-contamination with sequences.test.ts. Each attempt was a variation of the same broken approach (trying to make Bun's process-global `mock.module` work across files). Tried: singleton reset function, globalThis shared mocks, getActiveMocks() helper, dynamic import, re-mock with factory reset, and multiple full rewrites. The actual fix (dependency injection via optional `client` parameter) was simple and took one attempt.

## The Triggering Prompt
```
(Internal reasoning after first fix attempt failed)
"The singleton needs to be reset between test files" -> kept trying variations of singleton/mock management instead of questioning the approach
```

## What Went Wrong
**Category:** Prompt Error (self-prompting)
**Root cause:** Failed to recognize when an approach is fundamentally broken. Bun's `mock.module` is process-global by design. No amount of reset/clear/shared-reference tricks can make two files independently mock the same module. The correct response after attempt 2 was: "this approach can't work, what's a different architecture?"
**Surface symptom:** 6+ edits to the same file with increasing complexity, each producing the same failure. Classic doom loop.

## What The Prompt Should Have Been
```
(After attempt 2 failed)
"mock.module is process-global in Bun. Two test files cannot independently mock the same module.
Stop trying to fix the mock approach. Instead:
- Option A: Dependency injection (pass mock client as parameter)
- Option B: Run conflicting files in separate processes
- Option C: Restructure to avoid mocking the same module"
```

## Prevention
1. After 2 failed attempts at the same approach, STOP and re-plan. This is already in claude-behavior.md ("doom-loop detection: 3+ edits without progress") but was violated.
2. When a test isolation problem persists across multiple fix attempts, the issue is architectural (shared state), not tactical (wrong mock setup).
3. Before attempting complex mock wiring, ask: "Can I use dependency injection instead?" DI is always simpler than module-level mocking.

## Pattern Check
- **Seen before?** Yes. claude-behavior.md already has the doom-loop rule. This is the first logged violation.
- **Added to toolkit?** The rule exists. Needs a specific sub-rule: "For test mock.module conflicts, go directly to DI. Do not iterate on mock wiring."
