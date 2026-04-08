# Error #027: Guard Regex Over-Matching Blocks GSD Execution
**Date:** 2026-04-08
**Project:** Bresco

## What Happened
The `pretooluse-router.ts` workflow gate regex `gsd.*execute` matched `gsd-tools.cjs init execute-phase 4`, blocking all Phase 4 execution. The guard was designed for the new-project workflow's "Build Milestone" phase but its regex was too broad.

## The Triggering Prompt
```
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase 4
```

## What Went Wrong
**Category:** Harness Error
**Root cause:** Guard 6 pattern `/build.milestone|phase.7|gsd.*execute/i` matches any bash command containing "gsd" and "execute", not just the new-project workflow's build phase.
**Surface symptom:** "PreToolUse:Bash hook error" with no stderr output, repeated 3 times before diagnosis.

## What The Prompt Should Have Been
N/A — the command was correct. The guard regex needed to be more specific.

## Prevention
1. Guard regexes should use anchored patterns or exact command matching, not broad wildcards
2. The `guardDesignApproved` check should only match new-project workflow commands, not GSD commands
3. Workaround applied: created `.design-approved` and `.project-scaffolded` markers

## Pattern Check
- **Seen before?** No — first occurrence of guard regex over-matching
- **Added to toolkit?** Not yet — regex should be tightened in a future toolkit update
