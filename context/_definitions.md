# Definitions

Shared definitions for ambiguous terms used across skills.
If a term feels unclear, check here first.

---

## Design Proof

A **working visual prototype** viewable in a browser. Not a sketch, wireframe, or Figma mockup.
It must render real (or realistic) data using the project's actual design tokens and component library.

**Used in:** `skills/scott-new-project/SKILL.md` Phase 6

---

## Stack Lock Staleness

A `stack-lock.json` file where `last_reviewed` is older than **30 days**.

**Action:** Warn the user. Do not block work.
**Message:** "Stack checks last reviewed X days ago. Consider running `stack-preflight` to verify your environment is current."

**Used in:** `skills/scott-resume/SKILL.md` Phase 1, `tools/validate-stack-lock.ts`

---

## Verify Execution

Compare the **current codebase** against the acceptance criteria in `PLAN.md` (or the phase's success criteria).

This means:
1. Read the acceptance criteria from the plan
2. For each criterion, find evidence in the code that it is met
3. Run tests that exercise the criteria
4. Report pass/fail per criterion

"Tests pass" alone is NOT verification. Tests verify mock behavior. Verification checks that the feature actually works as specified.

**Used in:** `rules/claude-behavior.md` (Verification section)
