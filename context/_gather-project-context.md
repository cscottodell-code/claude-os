# Gather Project Context

Shared context-gathering template. Read these files (in order) when resuming
or reviewing a project. Skills reference this template instead of maintaining
their own file lists.

---

## Standard Context (always gather)

1. **Project CLAUDE.md** -- current status, key decisions, architecture
2. **PRD.md** (or README.md if no PRD) -- what the project is trying to accomplish
3. **tasks/todo.md** -- what remains to be done
4. **Recent git log** -- `git log --oneline -20` (NOT full log, keeps context lean)

## Session Context (if resuming mid-session)

5. **.claude-resume.md** -- where the last session left off

---

## Usage

Skills that reference this template:
- `skills/scott-resume/SKILL.md` Phase 1 (Read Context)

Each skill may add skill-specific files on top of this standard set.
