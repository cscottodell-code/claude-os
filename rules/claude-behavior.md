# Claude Code Behavior Rules

Last updated: 2026-04-28
Loaded automatically for all projects via the rules system.

## Identity layer is the source of truth

Personal rules, decision principles, hard rules, anti-patterns, and Karpathy-grounded posture live in:

`~/Sites/Global/scott-context/wiki/identity.md`

Read it first. Apply it. This file only carries Claude Code-specific operational config that doesn't belong in the LLM-agnostic identity layer.

## Two-system model

| System | Purpose |
|---|---|
| `scott-toolkit/` | Claude Code config: hooks, skills, light pointers |
| `scott-context/` | Knowledge, identity, daily notes, log, capture pipeline |

GSD: abandoned 2026-04-28. Superpowers + Impeccable: opportunistic plugins, used skill-by-skill, not orchestrated.

## Operation resolution

When a workflow or skill references an abstract operation name (`tdd`, `code_review`, `git_worktree`), resolve it via `~/Sites/Global/scott-toolkit/config/interfaces.json`. Plugin IDs and MCP servers are cataloged there.

## Development methodology (when invoked)

- TDD via `tdd` operation for features and bug fixes (exception: throwaway experiments, low-stakes UI tweaks)
- Code review via `code_review` operation after features
- Git worktrees via `git_worktree` operation when isolation matters
- Plan writing via `write_plan` operation for non-trivial work

These are opportunistic, not mandatory. Match the tool to the chunk per the tool-stitching rule in identity.md.

## Resume protocol

Invoke `resume` operation when:
- Session-start hook says "AUTO-RESUME"
- Scott says "let's continue", "where were we", "pick up where we left off"
- A `.claude-resume.md` or `.planning/` directory exists in the project

## Post-compaction recovery

After any compaction, immediately re-read:
1. `.claude-resume.md` and `.context-snapshot.md` (written by pre-compact hook)
2. The current task from `tasks/todo.md`
3. Any relevant offloaded files from `.claude/tool-output-overflow/`
4. `~/.claude/instinct-candidates.md` (session learnings)

Do NOT continue work based on assumptions about what was in context before compaction.

## Subagent rules

- Use subagents for research, exploration, parallel analysis (3+ files, independent queries).
- One objective per subagent. Match tool set to role:
  - Researcher/Explorer: Read, Grep, Glob, WebSearch, WebFetch
  - Planner / Reviewer / Security Auditor: Read, Grep, Glob (+ Bash for Reviewer)
  - Executor: full tools
- Brief every subagent with: objective, files, constraints, output format, prior knowledge.
- Verify subagent findings against primary sources before presenting to Scott.

## Toolkit artifact commits (mandatory)

Changes to `~/Sites/Global/scott-toolkit/` must be `git add` + `git commit` before session ends. Uncommitted toolkit files are silently lost when the next session's sync runs. Real data loss has happened (scott-research, scott-council, 2026-03-28).

## What survives from prior versions

The hard rules (no autocommit, [VERIFIED]/[INFERRED]/[ASSUMED] labels, no em dashes, SurrealDB no-general-knowledge rule, no edit-settings-mid-session, pnpm preference) all live in `wiki/identity.md` now. This file does not duplicate them.
