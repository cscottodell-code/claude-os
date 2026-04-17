# Error #036: Rogue Executor Agent Deleted 70+ Files via git add -A
**Date:** 2026-04-16
**Project:** Eleanor v2

## What Happened
The 05-03 executor agent, running in a git worktree, staged and committed deletions of ~70 files it didn't create or modify. This wiped all Phase 4 code, Wave 1 artifacts, planning docs, and tests. Required manual recovery from git history.

## The Triggering Prompt
```
Execute plan 03 of phase 05-proactive-engine.
Commit each task atomically. Create SUMMARY.md.
Do NOT update STATE.md or ROADMAP.md.
```

## What Went Wrong
**Category:** Prompt Error
**Root cause:** The executor agent used `git add -A` or `git add .` before committing, which in a worktree context stages every file difference between the worktree and its branch, including deletions of files the agent never touched.
**Surface symptom:** After merging the worktree back to main, all Phase 4 code, Wave 1 files, planning artifacts, and tests were gone.

## What The Prompt Should Have Been
```
Execute plan 03 of phase 05-proactive-engine.
Commit each task atomically. Create SUMMARY.md.
Do NOT update STATE.md or ROADMAP.md.

CRITICAL SAFETY RULE: You must ONLY `git add` the specific files you create or modify.
NEVER use `git add -A`, `git add .`, or `git add --all`. The worktree contains the full
repo -- staging everything will delete files you didn't touch. Only add files by explicit name.
```

## Prevention
1. All executor agent prompts now include the explicit `git add` safety rule (added for Wave 3)
2. The execute-phase workflow should be updated to include this rule in the executor prompt template
3. Post-merge spot-checks should verify file count hasn't decreased unexpectedly

## Pattern Check
- **Seen before?** No -- first occurrence of worktree-based file deletion
- **Added to toolkit?** Partially -- added to Wave 3 prompt manually. Needs permanent fix in execute-phase.md
