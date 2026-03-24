# Phase Closeout

## Metadata
- Last updated: 2026-03-22
- Version: 2.0
- Changelog:
  - v2.0: Add Phase 1.5 (Stack Audit) between Verify and Code Review. Add lesson tagging to Reflect. Update phase numbering.
  - v1.0: Initial workflow. Replaces separate log-error, log-success, and retro workflows for GSD post-execution.

## Purpose
Single post-execution skill that runs after every GSD execution phase. Produces all
closeout artifacts in one conversation: code review, error logs, success logs,
retrospective, lessons learned, and the completion gate marker.

Replaces the old 5-step sequence (verification-before-completion, requesting-code-review,
log-error, log-success, retro) which was skipped 3 times because it was 5 separate
invocations with gaps between them.

## Prerequisites
- A GSD execution phase just completed (all plans executed, verification passed)
- The conversation has the full phase context
- `.planning/` directory exists with phase artifacts

## Instructions for Claude Code
This is a GATE workflow. The phase CANNOT be marked complete without it.
A hook (`guard-phase-completion.sh`) blocks `gsd-tools phase complete` unless
the `.post-execution-complete` marker file exists. This workflow writes that marker
as its final step.

Run each phase in order. Do not skip phases. Do not reorder.

## Phase 1: Verify [AUTO]

### What this phase does
Run the full test suite and confirm everything passes. Evidence before assertions.

### Steps
1. Detect the project's test runner (package.json scripts, Cargo.toml, etc.)
2. Run the full test suite
3. Show the complete pass/fail/skip counts to Scott
4. If ANY tests fail: STOP. Fix failures before proceeding. Do not continue with failing tests.

### Output
Test command + results shown to Scott. Example:
```
pnpm test — 245 pass, 0 fail, 0 skip
```

### Done when
All tests pass (0 fail). Skip count noted but acceptable if pre-existing.

## Phase 1.5: Stack Audit [AUTO]

### What this phase does
Run stack compliance checks on all files changed in this phase. This is the final
gate before code review, catching version-specific correctness issues (wrong API
names, deprecated patterns, SDK mismatches).

### Steps
1. Run `stack-preflight.sh` on the project directory to determine the degradation tier
2. Announce the tier: "Stack audit running in [FULL/REDUCED/MINIMAL] mode."
3. Run `stack-check.sh` on all files changed in this phase:
   ```bash
   # Get changed files since phase start
   git diff --name-only <base-sha> HEAD | xargs stack-check.sh --project-dir .
   ```
4. **If PASS:** Continue to Phase 2.
5. **If FAIL (errors):** Show the failure report. Fix all errors before proceeding.
   Each failure includes: what failed, why it's required, file:line, and suggested fix.
6. **If WARN only:** Show warnings, continue to Phase 2 (warnings don't block).
7. **At Full tier with SurrealDB:** Dispatch a live audit agent:
   - Create temp namespace: `audit_<project>_<branch>_<timestamp>`
   - Apply all schemas in dependency order
   - Seed realistic data
   - Test every `db.query()` pattern from the codebase
   - Clean up temp namespace (always, even on failure)
8. Write structured results to `.planning/audits/audit_<phase>.json`:
   ```json
   {
     "phase": "<phase-id>",
     "date": "<ISO date>",
     "tier": "full|reduced|minimal",
     "static": { "pass": 0, "fail": 0, "warn": 0 },
     "live": { "pass": 0, "fail": 0, "skipped": false },
     "issues": []
   }
   ```

### Degraded behavior
- **Reduced tier:** Static checks run. Live audit skipped (closeout logs the gap).
- **Minimal tier:** Static checks only. Announce: "Live and agent-based checks unavailable."
- **Any degradation:** Log the degradation in the audit JSON and note it in the Phase 4 summary.

### Output
Audit results shown to Scott. PASS/FAIL/WARN with details.

### Done when
Static checks pass (0 errors). Live audit passes or was skipped with logged reason.

## Phase 2: Code Review [DELEGATE]

### What this phase does
Dispatch a thorough code review of everything changed in this phase.

### Steps
1. Determine the diff range:
   - **Base SHA:** The commit before phase execution started (check STATE.md or git log for the `begin-phase` marker)
   - **Head SHA:** Current HEAD
2. Invoke the **code_review** operation with prompt:
   ```
   Review all changes from this phase. Check for schema alignment, security issues,
   race conditions, cross-module integration, and adherence to the project's tech stack.
   ```
3. Fix all **Critical** issues immediately
4. Fix all **Important** issues before proceeding
5. After fixes: run a SECOND review pass on just the fix commits
6. Only proceed when the second pass returns no Critical or Important issues

### Output
Review findings table. If fixes were needed, second-pass confirmation.

### Done when
Code review is clean (no Critical/Important remaining after second pass).

## Phase 3: Reflect [STOP]

### What this phase does
ONE conversation with Scott covering mistakes, wins, and lessons. Produces all
reflection artifacts: error logs, success logs, RETRO.md, and lessons.md.

This phase replaces the separate log-error, log-success, and retro workflows.
Same quality, one interview instead of three.

### Steps

**Part A: What went wrong?**

1. Review the session for mistakes, failures, and issues
2. Present your initial list to Scott
3. **Push for completeness:** After Scott's response, ask "Is that all? Does that cover everything from this phase?" (This pattern tripled error capture in the Bresco Pass 3 session.)
4. For each confirmed mistake:
   - Read `~/Sites/Global/scott-toolkit/errors/_metadata.json` for the next ID
   - Create an error log file using this template:

   ```markdown
   # Error #[ID]: [Short Descriptive Name]
   **Date:** [Date]
   **Project:** [Project name]

   ## What Happened
   [2-3 sentences]

   ## The Triggering Prompt
   \```
   [Exact prompt that caused the issue — verbatim from conversation]
   \```

   ## What Went Wrong
   **Category:** Prompt Error / Context Error / Harness Error
   **Root cause:** [specific]
   **Surface symptom:** [what Scott saw]

   ## What The Prompt Should Have Been
   \```
   [Rewritten prompt that would have avoided the issue]
   \```

   ## Prevention
   1. [Specific action for next time]
   2. [CLAUDE.md or skill change if applicable]

   ## Pattern Check
   - **Seen before?** Yes/No — [reference prior error if recurring]
   - **Added to toolkit?** Yes/No — [what was added]
   ```

   - Increment the counter in `_metadata.json`
   - Check `~/Sites/Global/scott-toolkit/errors/` for similar past errors — flag patterns

5. If Scott says there are no errors: confirm and note "No errors identified for this phase."

**Part B: What went well?**

1. Review the session for wins, good patterns, and time saved
2. Present highlights to Scott
3. For each confirmed success:
   - Read `~/Sites/Global/scott-toolkit/successes/_metadata.json` for the next ID
   - Create a success log file:

   ```markdown
   # Success #[ID]: [Short Descriptive Name]
   **Date:** [Date]
   **Project:** [Project name]

   ## What Worked
   [2-3 sentences]

   ## The Triggering Prompt
   \```
   [Exact prompt — verbatim]
   \```

   ## Why It Worked
   **Key factor:** [what made the difference]
   **Contributing factors:** [context, skill, approach]

   ## Reproducible?
   - **Can repeat?** Yes/No
   - **Should become standard?** Yes/No — [what to standardize]
   ```

   - Increment the counter in `_metadata.json`

4. If Scott says there are no successes to log: confirm and move on.

**Part C: Retrospective + Lessons**

1. Create or update `RETRO.md` in the project root using this structure:

   ```markdown
   # Retrospective: [Project Name]

   ## Metadata
   - Last updated: [date]
   - Version: [increment]
   - Project: [name]
   - Milestone: [milestone/phase]

   ## 1. Project Summary
   - What was built, time spent, deployment target, milestones completed

   ## 2. What Went Well
   - [Bullets — reference success log entries if created above]
   - Skills/templates that helped most

   ## 3. What Went Wrong
   - [Bullets — reference error log entries if created above]
   - Biggest time sink + root cause

   ## 4. Lessons Learned
   - [Each lesson: "Next time, do X instead of Y because Z"]

   ## 5. Toolkit Updates Needed
   | Action | File | Change Needed | Reason |
   |--------|------|--------------|--------|

   ## 6. Patterns Discovered
   - Code patterns worth reusing
   - Process patterns worth standardizing
   ```

2. Update `tasks/lessons.md` with lessons from this phase. This is NON-NEGOTIABLE.
   If lessons.md is empty or unchanged after this step, the phase closeout has failed.
   Format: what happened, why, what to do differently next time.

3. **Tag each lesson.** After writing each lesson, suggest a tag based on its content:
   - `[stack]` — technology version, SDK, or compatibility issue
   - `[pattern]` — reusable code or process pattern discovered
   - `[project]` — project-specific context or decision
   - `[prompt]` — prompting technique or context engineering insight
   - `[harness]` — toolkit, skill, or hook issue
   Scott approves, overrides, or skips the tag. Untagged defaults to `[project]`.
   Tags go at the start of the lesson line: `[stack] Next time, use db.query() instead of...`

### Output
Error log files (if any), success log files (if any), RETRO.md, updated lessons.md.

### Done when
Scott confirms the reflection is complete and accurate.

## Phase 4: Gate [AUTO]

### What this phase does
Write the completion marker and summarize all artifacts created.

### Steps
1. Write the marker file:
   ```bash
   touch "${PHASE_DIR}/.post-execution-complete"
   ```
   (The `guard-phase-completion.sh` hook checks for this file and blocks `phase complete` without it.)

2. Present summary:
   ```
   ## Phase Closeout Complete

   **Verification:** [pass count] tests passed
   **Stack Audit:** [PASS/WARN/degraded] at [tier] tier
   **Code Review:** Clean (no Critical/Important)
   **Errors Logged:** [count] entries (or "None")
   **Successes Logged:** [count] entries (or "None")
   **Retro:** RETRO.md [created/updated]
   **Lessons:** tasks/lessons.md updated with [count] entries (tagged)

   Phase is now eligible for completion.
   ```

### Done when
Marker file exists and summary shown.

## Completion Checklist
- [ ] Tests pass (Phase 1)
- [ ] Stack audit pass or degraded with logged reason (Phase 1.5)
- [ ] Code review clean — no Critical/Important (Phase 2)
- [ ] Errors captured or confirmed none (Phase 3A)
- [ ] Successes captured or confirmed none (Phase 3B)
- [ ] RETRO.md created/updated (Phase 3C)
- [ ] tasks/lessons.md updated with tagged lessons (Phase 3C)
- [ ] .post-execution-complete marker written (Phase 4)
