---
name: scott-stack-baseline
description: First-run stack audit for existing projects that have a stack-lock but no audit history. Generates initial audit data so the project appears in stack-metrics. Use when onboarding a project into the stack enforcement system or when Scott says "baseline this project" or "add this to stack tracking".
user_invocable: true
invocation_hint: /scott:stack-baseline - First-run stack audit for existing projects
section: stack
---

# Stack Baseline Audit

## Purpose
Run a comprehensive first-time audit on an existing project to establish
initial audit data. After this runs, the project will appear in
`/scott:stack-review` dashboards and contribute to learning loop metrics.

## Prerequisites
- Project has a `stack-lock.json` (if not, run `stack-detect.sh` first)
- Project does NOT yet have `.planning/audits/` (that's why we're doing a baseline)

## Instructions

### Phase 1: Preflight [AUTO]

1. Run `~/Sites/Global/scott-toolkit/tools/stack-preflight.sh <project-dir>`
2. Report the tier: FULL / REDUCED / MINIMAL
3. If MINIMAL (missing CLI tools): warn Scott but continue with static checks only

### Phase 2: Static Audit [AUTO]

1. Identify all source files in the project (exclude node_modules, .git, dist)
2. Determine which technologies are in the project's `stack-lock.json`
3. Run `~/Sites/Global/scott-toolkit/tools/stack-check.sh` on all source files
4. Collect results

### Phase 3: Live Audit (if Full tier + SurrealDB) [AUTO]

Only runs if:
- Tier is FULL
- Project uses SurrealDB (in stack-lock.json)
- SurrealDB server is reachable

Steps:
1. Create temp namespace: `audit_<project>_baseline_<timestamp>`
2. Apply all schema files in dependency order
3. Seed realistic test data
4. Test every `db.query()` pattern found in the codebase
5. Clean up temp namespace (always, even on failure)

If conditions aren't met, skip with a logged reason.

### Phase 4: Write Artifacts [AUTO]

1. Create `.planning/audits/` directory in the project
2. Write `audit_baseline_<date>.json` following the standard format:
   ```json
   {
     "audit_id": "audit_<project>_baseline_<timestamp>",
     "timestamp": "<ISO date>",
     "project": "<project-name>",
     "phase": "baseline",
     "tier": "<tier>",
     "duration_ms": <elapsed>,
     "tokens_used": <estimated>,
     "checks": [
       {
         "check_id": "<id>",
         "result": "PASS|FAIL",
         "file": "<path>",
         "line": <number>,
         "fix_applied": false,
         "false_positive": false,
         "fix_attempts": 0
       }
     ]
   }
   ```
3. Note: `fix_applied` is always false for baseline (we don't fix during baseline)

### Phase 5: Report [STOP]

Present results to Scott:
```
Stack Baseline: <project-name>
Tier: <FULL/REDUCED/MINIMAL>
Files scanned: <count>
Checks run: <count>
  Pass: <count>
  Fail: <count>

Failures:
  - <check-id>: <file>:<line> — <description>

This project will now appear in /scott:stack-review.
```

If there are failures, ask Scott:
"Want to fix these now, or just record them for tracking?"

## Completion Checklist
- [ ] Preflight completed
- [ ] Static checks run on all source files
- [ ] Live audit run (or skipped with reason)
- [ ] Audit artifact written to .planning/audits/
- [ ] Results reported to Scott
