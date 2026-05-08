# Claude Code Behavior Rules

Last updated: 2026-04-28
Loaded automatically for all projects via the rules system.

## Identity layer is the source of truth

Personal rules, decision principles, hard rules, anti-patterns, and Karpathy-grounded posture live in:

`~/Scott/growth-os/wiki/identity.md`

Read it first. Apply it. This file only carries Claude Code-specific operational config that doesn't belong in the LLM-agnostic identity layer.

## Two-system model

| System | Purpose |
|---|---|
| `~/Scott/claude-os/` | Claude Code config: hooks, skills, light pointers |
| `~/Scott/growth-os/` | Knowledge, identity, daily notes, log, capture pipeline |

GSD: abandoned 2026-04-28. Superpowers + Impeccable: opportunistic plugins, used skill-by-skill, not orchestrated.

## Operation resolution

When a workflow or skill references an abstract operation name (`tdd`, `code_review`, `git_worktree`), resolve it via `~/Scott/claude-os/config/interfaces.json`. Plugin IDs and MCP servers are cataloged there.

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

## Subagent and agent prompt template

When dispatching ANY subagent (Task tool, Agent tool, scheduled remote agents, custom agents in `~/.claude/agents/`, or skills that produce LLM behavior), apply the template at `@~/Scott/claude-os/rules/subagent-template.md`.

Quick rules (full template at the path above):

- One objective per subagent. Do not bundle.
- Match tool set to role. Researcher: Read/Grep/Glob/WebSearch/WebFetch. Reviewer: same plus Bash. Executor: full tools. Scope deliberately; omitting `tools` grants all by default.
- Brief format: objective, files, constraints, output format, prior knowledge, termination criterion.
- Return format: distilled summary 1-2K tokens, not raw output.
- No preamble, no closing commentary in returned output.
- Verify subagent findings against primary sources before presenting to Scott.
- Spawn in parallel when fanning out. Do not spawn for work doable in one response.

Inheritance is by convention, not enforcement: every new agent file in `~/.claude/agents/` and every new skill in `~/.claude/skills/` should reference this template in its description or header. Anthropic's harness does not auto-import the template into agent prompts; the orchestrator (Claude) is responsible for applying it when crafting agent briefs.

## Toolkit artifact commits (mandatory)

Changes to `~/Scott/claude-os/` must be `git add` + `git commit` before session ends. Uncommitted toolkit files are silently lost when the next session's sync runs. Real data loss has happened (scott-research, scott-council, 2026-03-28).

## What survives from prior versions

The hard rules (no autocommit, [VERIFIED]/[INFERRED]/[ASSUMED] labels, no em dashes, SurrealDB no-general-knowledge rule, no edit-settings-mid-session, pnpm preference) all live in `wiki/identity.md` now. This file does not duplicate them.
