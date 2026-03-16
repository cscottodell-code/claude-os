---
name: scott:debug
description: |
  Scott's personal debugging workflow with lesson capture. Use INSTEAD of
  superpowers:systematic-debugging when working on Scott's projects — this
  skill adds Scott-specific context (reads project CLAUDE.md, checks
  tasks/lessons.md for past issues) and captures lessons after fixing.
  Walks through 5 phases: Describe Problem, Gather Evidence, Hypothesize,
  Test & Fix, and Capture Lesson. Use when something is broken, failing,
  crashing, returning wrong results, or behaving unexpectedly in one of
  Scott's projects. Triggers include: errors after merging branches, hydration
  mismatches, blank screens, silent failures, wrong calculations, CORS errors,
  500 errors, or any "it was working but now it's not" situation. This builds
  institutional memory. For non-Scott projects, use superpowers:systematic-debugging.
user_invocable: true
invocation_hint: /scott:debug - Debug a problem with structured diagnosis
input_examples:
  - "/scott:debug -- the page is showing a blank screen after I merged the feature branch"
  - "/scott:debug -- API returns 500 but only on the production server"
---

# Debug Skill

Debug a problem using a structured 5-phase workflow.

## What to do

1. Read the current project's `CLAUDE.md` and `tasks/lessons.md` for context
2. Follow the phases below in order
3. After fixing, capture the lesson in `tasks/lessons.md`

## Phase 1: Describe Problem

Ask Scott:
- "What's going wrong? Describe the problem — what did you expect to happen, and what happened instead?"
- "When did it start? Did anything change recently?"

Capture: expected behavior, actual behavior, steps to reproduce.

## Phase 2: Gather Evidence

Before forming any hypothesis:
- Read error messages, logs, and stack traces
- Check the specific code involved
- Look at recent changes (`git log`, `git diff`)
- Check `tasks/lessons.md` for similar past issues
- Reproduce the bug if possible

## Phase 3: Hypothesize

Based on evidence (not guesses):
1. List 2-3 possible root causes, ranked by likelihood
2. For each, explain what evidence supports it
3. Identify the simplest test to confirm or rule out each one

**Neutral framing:** When investigating, use "trace the logic of each component and report findings" rather than "find the bug in X." Biased prompts cause sycophancy-driven false positives.

Present hypotheses to Scott before proceeding.

## Phase 4: Test & Fix

1. Test the most likely hypothesis first
2. Make the minimal fix — don't refactor surrounding code
3. Verify the fix resolves the original problem
4. Check for regressions (run tests if available)

## Phase 5: Capture Lesson

Add to `tasks/lessons.md`:
```
### [Date] - [Brief title]
**Problem:** [What went wrong]
**Root cause:** [Why it happened]
**Fix:** [What you did]
**Lesson:** Next time, do X instead of Y because Z
```
