# Error #028: Lens Review Agents Produce High False Positive Rate
**Date:** 2026-04-08
**Project:** Bresco

## What Happened
Schema lens reported 11 issues but only 1 was real (approval_counter missing schema). 10 were false positives. General code review reported 8 Important issues but 3 were factually wrong (claimed code was missing when it existed).

## The Triggering Prompt
```
Schema lens: "Compare every db.query() call against SCHEMAFULL table definitions"
General review: "Review all changes from this phase for general code quality"
```

## What Went Wrong
**Category:** Prompt Error
**Root cause:** (1) Schema lens wasn't given complete file list — missing `message.surql` caused 6 false positives about "undefined table". (2) General reviewer claimed dedup and error logging were missing when they existed in the actual code. Agents didn't verify their own findings.
**Surface symptom:** 13 false positive findings requiring manual triage, wasting ~10 minutes.

## What The Prompt Should Have Been
```
Schema lens: Include ALL schema files in context (not just Phase 4 files).
Add instruction: "Before flagging a missing table, verify it doesn't exist in other schema files."
General review: Add instruction: "Before flagging missing code, grep for the pattern first."
```

## Prevention
1. Schema lens must receive ALL .surql files, not just phase-scoped ones
2. Add "verify before flagging" instruction to lens prompts
3. Per claude-behavior.md: "Verify before presenting — subagents apply rules mechanically"

## Pattern Check
- **Seen before?** Yes — similar to subagent false positives noted in claude-behavior.md
- **Added to toolkit?** Partially — claude-behavior.md has the rule but lens prompts don't enforce it
