# Error #34: Worktree Merge Deleted Wave 1-3 Files
**Date:** 2026-04-13
**Project:** Eleanor v2

## What Happened
Three separate worktree merges during Phase 4 execution deleted files from earlier waves. The worktree branches were based on older HEAD commits, so fast-forward merges overwrote newer files.

## The Triggering Prompt
```
Execute Phase 4 (parallel worktree execution)
```

## What Went Wrong
**Category:** Harness Error
**Root cause:** Worktree branches created from stale base commits. When merged back, git's merge strategy treated the older tree as authoritative for files not modified by the worktree agent.
**Surface symptom:** Files from Wave 1-3 disappeared after Wave 4-5 merges. Required 3 restore commits (b03bcc9, 5441f31, 8a9d181).

## What The Prompt Should Have Been
```
Before spawning worktree agents, capture EXPECTED_BASE=$(git rev-parse HEAD).
Each agent verifies its base matches EXPECTED_BASE before starting work.
Orchestrator backs up STATE.md and ROADMAP.md before merge.
```

## Prevention
1. execute-phase.md now includes worktree_branch_check with EXPECTED_BASE verification
2. Orchestrator snapshots orchestrator-owned files before merge (STATE.md, ROADMAP.md)
3. Post-merge resurrection detection removes files deleted on main but re-added by worktree

## Pattern Check
- **Seen before?** First occurrence of this specific worktree merge issue
- **Added to toolkit?** Yes, worktree cleanup step in execute-phase.md (step 5.5)
