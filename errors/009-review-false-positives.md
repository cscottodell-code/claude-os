# Error #9: Code Review False Positives (BM25, jose-wrapper)
**Date:** 2026-03-23
**Project:** Bresco

## What Happened
The initial code review flagged two items as bugs that weren't bugs. (1) BM25 search was flagged as CRITICAL because the reviewer assumed `@1@` is an index number -- it's actually a scoring reference for `search::score(1)`. (2) `jose-wrapper.ts` was flagged as dead code (M4), but it's actively imported by `tv.ts` for ESM mock testability. Both were caught during execution (the BM25 agent tested against live SurrealDB; the cleanup agent grepped for imports).

## The Triggering Prompt
```
Look for Missing implementations, Security gaps, Schema issues, Test gaps, API contract issues, Dependency issues, Type safety issues.
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Review agents made assumptions about SurrealDB syntax and file usage without verifying. The BM25 reviewer assumed SQL-like index numbering. The cleanup reviewer checked imports superficially.
**Surface symptom:** We almost "fixed" working code and almost deleted a file that would have broken TV Mode.

## What The Prompt Should Have Been
```
For any issue flagged as a bug: verify it by reading the actual behavior, not just the code.
For SurrealDB-specific syntax, check SurrealDB v3 docs before assuming it's wrong.
For "dead code" claims, grep for ALL imports (including test files and dynamic imports).
```

## Prevention
1. Review agents should verify SurrealDB syntax claims against live DB or docs before flagging
2. "Dead code" claims must include a grep showing zero imports, not just a visual scan
3. Executor agents should test assumptions before applying fixes (the BM25 agent did this correctly)

## Pattern Check
- **Seen before?** No -- first occurrence of review false positives
- **Added to toolkit?** Captured in lessons.md
