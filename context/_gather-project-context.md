# Gather Project Context

Shared context-gathering template. Read these files (in order) when resuming,
reflecting on, or reviewing a project. Workflows reference this template instead
of maintaining their own file lists.

---

## Standard Context (always gather)

1. **Project CLAUDE.md** — current status, key decisions, architecture
2. **PRD.md** (or README.md if no PRD) — what the project is trying to accomplish
3. **tasks/todo.md** — what remains to be done
4. **tasks/lessons.md** — mistakes and corrections from past sessions
5. **Recent git log** — `git log --oneline -20` (NOT full log, keeps context lean)

## GSD Context (if `.planning/` directory exists)

6. **.planning/STATE.md** — phase progress and overall project state
7. **.planning/ROADMAP.md** — the full plan structure
8. **.planning/phases/*/VERIFICATION.md** — verification results for completed phases

## Session Context (if resuming mid-session)

9. **.claude-resume.md** — where the last session left off

---

## Usage

Workflows that reference this template:
- `workflows/retro.md` Phase 1 (Gather Context)
- `workflows/phase-closeout.md` Phase 3 (Reflect) — for cross-session scenarios
- `workflows/resume-project.md` Phase 1 (Read Context)

Each workflow may add **workflow-specific files** on top of this standard set.
For example, retro.md also reads error/success logs from the toolkit.
