---
name: scott:resume
description: >-
  Resume work on an existing project using the scott-toolkit workflow.
  Walks through 4 phases: Read Context, Summarize State, Confirm Direction,
  and Resume Work. Delegates to GSD for .planning/ state recovery.
user_invocable: true
invocation_hint: /scott:resume - Pick up where you left off on a project
section: project
---

# Resume Project

## Metadata
- Last updated: 2026-04-05
- Version: 2.3
- Changelog:
  - v2.3: Replace inline context file list with shared _gather-project-context.md template
  - v2.2: Add Superpowers discipline note to Phase 4 (GSD+Superpowers integration)
  - v2.1: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE])
  - v2.0: Slim to orchestrator — delegate GSD state recovery, keep Scott-specific summary + direction
  - v1.0: Initial workflow

## Purpose
Pick up a project after time away. Gets Claude Code back up to speed on where
things stand and confirms direction with Scott before continuing work.

Use this when Scott says "let's pick up [project]" or "where were we on [project]"
or returns to a project after days/weeks away.

## Prerequisites
- An existing project with CLAUDE.md
- Time has passed since the last work session

## Instructions for Claude Code
Read everything first, then summarize. Don't start working until Scott confirms
the direction. Priorities may have changed since the last session.

## Phase 1: Read Context [AUTO]

### What this phase does
Get fully up to speed on the project's current state by reading all relevant files.

### Files to read

**Standard context:** Read `~/Sites/Global/scott-toolkit/context/_gather-project-context.md` and gather all listed files (including GSD context if `.planning/` exists).

**Resume-specific additions:**
- Read any `.planning/phases/*/PLAN.md` for active phase details
- Check for open issues or pending work not captured in todo.md

### Stack-Lock Staleness Check
If the project has a `stack-lock.json`:
- Check the `last_reviewed` (or `locked`) date
- If older than 30 days, mention it to Scott: "Stack checks last reviewed X days ago. Consider running `stack-preflight.ts` to verify your environment is current."
- This is a nudge, not a blocker. Scott decides whether to act on it.

### Output
A mental model of where the project stands — both the human context (CLAUDE.md, PRD)
and the build state (GSD planning files).

### Done when
All context files have been reviewed.

## Phase 2: Summarize State [STOP]

### What this phase does
Tell Scott exactly where things stand in plain English.

### Format
Present a summary like this:

"Here's where we left off on [Project Name]:

**Last completed:** [what was finished in the last session]
**Current milestone:** [which milestone we're on] — [X of Y tasks done]
**GSD phase status:** [if GSD-managed: current phase, % complete, next step]
**Next up:** [what the next task or feature is]
**Known issues:** [any bugs or problems noted in CLAUDE.md or lessons.md]
**Time since last work:** [based on git log dates]"

### Done when
Scott confirms the summary is accurate.

## Phase 3: Confirm Direction [STOP]

### What this phase does
Check whether priorities have changed since the last session.

### Questions to ask Scott
1. Does this summary match what you remember?
2. Have your priorities changed since we last worked on this?
3. Is there anything new you want to add or change before we continue?
4. Do you want to continue with the planned next task, or pivot to something else?
5. Any feedback from Brett, Gary, or others since the last session?

### Output
Confirmed direction for this session.

### Done when
Scott confirms what to work on.

## Phase 4: Resume Work [DELEGATE]

### What this phase does
Continue from where the project left off, using the appropriate tools.

### Steps
1. Review tasks/lessons.md to avoid repeating past mistakes
2. Pick up the next task from tasks/todo.md
3. If Scott redirected to something else, update tasks/todo.md accordingly

4. Use the **execute_phase** operation to continue the current phase,
   or the **plan_phase** operation if starting a new phase
5. For quick tasks: Use the **quick_task** operation for ad-hoc work with state tracking
6. Follow the project's CLAUDE.md behavior rules
7. Work through tasks, checking in as appropriate

**Superpowers discipline applies during execution:**
- TDD: **tdd** operation for all feature and bug fix tasks
- Worktrees: **git_worktree** operation for feature branches
- Code review: **code_review** operation after completing a feature or phase
- Branch completion: **finish_branch** operation when merging back to main

### Output
Progress on the project.

### Done when
The session's work is complete (either the task is done or Scott ends the session).

## Completion Checklist
- [ ] Project context fully read (including .planning/ if GSD-managed)
- [ ] State summarized for Scott
- [ ] Direction confirmed
- [ ] Work resumed (or redirected based on Scott's input)
- [ ] CLAUDE.md Current Status updated at end of session
- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
