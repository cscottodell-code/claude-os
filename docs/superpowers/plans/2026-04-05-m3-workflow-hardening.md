# M3: Workflow & Enforcement Hardening — Implementation Plan

**Date:** 2026-04-05
**Branch:** audit/m3-workflow-hardening
**Spec:** docs/superpowers/specs/2026-04-05-toolkit-audit-remediation-design.md (M3 section)
**Depends on:** M1 (Bun foundation), M2 (hooks migrated to TypeScript)

---

## Plan Overview

M3 adds enforcement gates to workflows, splits oversized phases, deduplicates context-gathering, expands stack checks, and adds a definitions file. Five parts (A-E) with minimal interdependency.

---

## Part A: File-System Gates

**Goal:** Prevent workflow phase skipping by requiring marker files from prerequisite phases.

### A1: Create guard functions

**File:** `hooks/guards/workflow-gates.ts`

New guard module with functions for each gate:

| Function | Workflow | Checks for marker | Blocks |
|----------|---------|-------------------|--------|
| `guardProjectScaffolded()` | new-project | `.project-scaffolded` | Phase 6+ without Phase 5 done |
| `guardDesignApproved()` | new-project | `.design-approved` | Phase 7+ without Phase 6 done |
| `guardHandoffReady()` | handoff-to-gary | `.handoff-ready` | Phase 5 without Phase 4 done |
| `guardChangesDrafted()` | toolkit-update | `.changes-drafted` | Phase 4+ without Phase 3 done |
| `guardReflectionComplete()` | retro | `.reflection-complete` | Phase 3+ without Phase 2 done |

Each function:
1. Determines the project root (cwd or git root)
2. Checks if the marker file exists
3. Returns `{ allow: boolean, message?: string }`

Detection strategy: The guard reads the tool input for context clues about which workflow/phase is active. Since these are skill-driven workflows (not automated pipelines), the guard watches for specific file writes or bash commands that indicate a phase transition.

### A2: Register gates in pretooluse-router.ts

Add a new guard section to the router that dispatches to workflow gate checks. The gate functions are advisory (warn + allow) in v1, with a flag to make them blocking in v2.

### A3: Add marker-writing steps to workflow files

Update each workflow to write its marker at phase completion:
- `new-project.md` Phase 5: write `.project-scaffolded` after repo created
- `new-project.md` Phase 6: write `.design-approved` after Scott approves design
- `handoff-to-gary.md` Phase 4: write `.handoff-ready` after setup verified
- `toolkit-update.md` Phase 3: write `.changes-drafted` after changes reviewed
- `retro.md` Phase 2: write `.reflection-complete` after reflection done

---

## Part B: Split God-Phases

**Goal:** Break oversized phases into clear sub-phases with explicit entry/exit criteria.

### B1: Split phase-closeout Phase 2 into 2a/2b/2c

Current Phase 2 (Code Review) does three distinct things. Split into:

- **Phase 2a: Stack Audit [AUTO]** — Move the stack-preflight, stack-check, and live audit logic from current Phase 1.5 here. Rename current Phase 1.5 to Phase 2a.
- **Phase 2b: Specialist Lens Review [AUTO]** — The lens dispatch logic (current Phase 2 Steps 1-2). Add context_files existence validation before dispatching each lens.
- **Phase 2c: General Code Review [STOP]** — Current Phase 2 Steps 3-4 (general review + fix cycle).

Wait, re-reading the spec more carefully: Phase 1.5 already IS the stack audit. The spec says "Phase 2 -> 2a, 2b, 2c" where 2a is stack audit. This means Phase 1.5 gets renumbered to 2a, and the current Phase 2 gets split into 2b (lenses) and 2c (general review).

Updated phase-closeout numbering:
- Phase 1: Verify [AUTO] (unchanged)
- Phase 2a: Stack Audit [AUTO] (was Phase 1.5)
- Phase 2b: Specialist Lens Review [AUTO] (was Phase 2, Steps 1-2)
- Phase 2c: General Code Review [STOP] (was Phase 2, Steps 3-4)
- Phase 3: Reflect [STOP] (was Phase 3, unchanged)
- Phase 4: Gate [AUTO] (was Phase 4, unchanged)

### B2: Split new-project Phase 3 into 3a/3b/3c

Current Phase 3 (Draft PRD) combines drafting, approval, and conflict resolution. Split into:

- **Phase 3a: Draft PRD [AUTO]** — Load template, draft content from brain dump answers
- **Phase 3b: Approve PRD [STOP]** — Present to Scott for review and approval
- **Phase 3c: Resolve Conflicts [AUTO]** — If an existing PRD exists, merge/reconcile

### B3: Add entry/exit criteria to all sub-phases

Each sub-phase gets explicit "Done when" criteria in the workflow file.

---

## Part C: Deduplicate Context-Gathering

**Goal:** Create a shared context template used by retro, phase-closeout, and resume-project.

### C1: Create `context/_gather-project-context.md`

Shared template with the 7 context items:
1. Project CLAUDE.md
2. PRD.md or README.md
3. tasks/todo.md
4. tasks/lessons.md
5. `git log --oneline -20` (NOT full log)
6. .planning/STATE.md (if GSD)
7. .claude-resume.md (if exists)

### C2: Update `workflows/retro.md` Phase 1

Replace the inline file list with a reference to the shared template. Keep retro-specific additions (error/success logs, GSD artifacts) as addenda.

### C3: Update `workflows/phase-closeout.md`

Add a context-gathering reference at the start of Phase 3 (Reflect). Currently the reflect phase assumes context is already loaded from the execution conversation, but for cross-session scenarios, the shared template ensures nothing is missed.

### C4: Update `workflows/resume-project.md` Phase 1

Replace the inline file list with a reference to the shared template. Keep resume-specific additions (stack-lock staleness check) as addenda.

---

## Part D: Stack Enforcement Expansion

**Goal:** Add 6 new check files and a stack-lock validator.

### D1: Create 6 new check files

Following the existing pattern (see `checks/bun.json`):

| File | Key checks |
|------|-----------|
| `checks/typescript.json` | strict mode, target version, path alias patterns |
| `checks/zod.json` | schema patterns, version-specific API (z.input vs z.infer) |
| `checks/pinia.json` | composition API usage, store scoping, stale state patterns |
| `checks/vercel-ai.json` | streaming patterns, model config, provider setup |
| `checks/trigger-dev.json` | task patterns, retry config, idempotency |
| `checks/pnpm.json` | workspace config, lockfile format, phantom dependency detection |

### D2: Create `tools/validate-stack-lock.ts`

New tool that validates a project's `stack-lock.json` against `checks/stack-lock.schema.json`:
- Validates JSON structure
- Checks all referenced technologies have matching check files
- Verifies `last_reviewed` date isn't stale (>30 days = warn)
- Called by session-start and stack-detect

### D3: Add lens context_files validation

In the phase-closeout Phase 2b (specialist lens review), before dispatching a lens subagent, verify every file in `context_files` exists. Missing file = log warning + skip that context file (don't crash the review).

This is a code change in the workflow description, not a hook change. The workflow instructions tell Claude to verify files before passing them to subagents.

---

## Part E: Definitions File

**Goal:** Define ambiguous terms referenced by workflows.

### E1: Create `context/_definitions.md`

Define:
- **Design Proof:** working visual prototype viewable in browser (not a sketch)
- **Stack Lock Staleness:** `last_reviewed` > 30 days. Action: warn, don't block.
- **Verify Execution:** compare codebase against PLAN.md acceptance criteria

---

## Execution Order

Parts are mostly independent. Execute in this order for logical flow:

1. **Part E** (definitions) — smallest, no dependencies
2. **Part C** (deduplicate context) — creates shared template before workflow edits
3. **Part D** (stack checks) — independent, can overlap with workflow edits
4. **Part B** (split phases) — modifies workflow files
5. **Part A** (gates) — modifies workflow files + router, do last to avoid conflicts with Part B

Commit after each part.

---

## Verification

After all parts complete:
1. `bun run tools/toolkit-lint.ts` — passes
2. `bun run hooks/pretooluse-router.ts` with test input — no crashes
3. New check files parse correctly: `bun run tools/stack-check.ts --list`
4. `bun run tools/validate-stack-lock.ts` against Eleanor's stack-lock.json
5. All workflow files have consistent phase numbering
6. Shared context template referenced by 3 workflows
7. `verify-toolkit.sh` passes

---

## Success Criteria (from spec)
- [x] `verify-toolkit.sh` passes
- [ ] Gate test: start new-project, skip to Phase 7 without Phase 5 marker — blocked
- [ ] `validate-stack-lock.ts` succeeds against Eleanor's stack-lock.json
- [ ] New check files parse correctly via `stack-check.ts`
- [ ] Split phases have clear entry/exit criteria in workflow files
- [ ] Shared context template used by 3 workflows
