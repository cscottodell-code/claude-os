---
name: scott:toolkit-briefing
description: |
  Load full context about the scott-toolkit: its design philosophy, architecture,
  constraints, deployment model, and evolution. Use when Scott needs Claude to
  deeply understand the toolkit before making decisions about it, discussing it,
  or working near it. Trigger when Scott says "understand my toolkit",
  "toolkit briefing", "learn the toolkit", "read the toolkit", "explain the
  toolkit to me", "what does my toolkit do", "toolkit overview", "how does my
  system work", "how are my skills organized", or when any conversation involves
  modifying, moving, or reorganizing toolkit files.
user_invocable: true
invocation_hint: /scott:toolkit-briefing - Deep-read the toolkit so Claude fully understands it
section: tools
---

# Toolkit Briefing

## Purpose
Give Claude complete understanding of the scott-toolkit's design, architecture,
constraints, and evolution by reading the primary source files. This skill creates
no new content. It points to existing files so understanding stays current as the
toolkit evolves.

## When to use
- Before any conversation about changing, moving, or reorganizing the toolkit
- When Scott says Claude doesn't understand the toolkit
- When working on toolkit-adjacent tasks (Sites folder structure, CLAUDE.md files, project catalog)
- Before running /scott:update-toolkit or /scott:toolkit-spa-day if context is stale

## Instructions

### Phase 1: Read Core Design [AUTO]

Read these files in order. Do not skip any.

1. `~/Sites/Global/scott-toolkit/README.md`
   Focus on: canonical path, four-system architecture, repo structure, contributing rules
2. `~/Sites/Global/scott-toolkit/docs/v5-unified-design.md` (sections 1-6 and 12)
   Focus on: problem statement, goals, tech stack, available primitives, architecture overview, toolkit rationalization, rationalized file tree
3. `~/Sites/Global/scott-toolkit/CHANGELOG.md`
   Focus on: evolution from v1 to v5, what changed and why, what triggered each change

### Phase 2: Read Operational Rules [AUTO]

4. `~/Sites/Global/scott-toolkit/rules/claude-behavior.md`
   Focus on: operation resolution, workflow execution tags, phase closeout enforcement, subagent rules, verification requirements
5. `~/Sites/Global/scott-toolkit/config/interfaces.json`
   Focus on: the decoupling pattern, what operations map to what commands
6. `~/Sites/Global/scott-toolkit/setup.sh`
   Focus on: symlink deployment model, why the canonical path matters, what gets deployed where

### Phase 3: Confirm Understanding [STOP]

After reading all six files, confirm understanding of these eight constraints.
State each one back to Scott. Do not paraphrase from memory. Each must be
grounded in what you just read.

1. **Canonical path:** Where the toolkit must live and why (README line 5, setup.sh clone path, 45+ internal references)
2. **Four-system separation:** What each system owns and the integration pattern (README, claude-behavior.md)
3. **Two-tier knowledge hierarchy:** Quick-access (skills) vs. deep reference (references/), the "one place" rule, why knowledge/ was eliminated (v5-unified-design.md section 5)
4. **Decoupling:** How abstract operations resolve via interfaces.json and why this matters (config/interfaces.json, claude-behavior.md)
5. **Deployment model:** How setup.sh symlinks work, why moving the toolkit breaks things (setup.sh)
6. **Token budget:** The 250K agent window limit, the ~20 line CLAUDE.md soft budget (v5-unified-design.md)
7. **Hook enforcement:** Guards cannot be skipped, phase closeout is mandatory and physically enforced (claude-behavior.md, CHANGELOG v2.14)
8. **Plugin awareness:** How the `plugins` section in interfaces.json catalogs known plugins with `required` flags, how session-start.sh detects plugin-project misalignment bidirectionally, and how new projects generate `.claude/settings.json` to disable irrelevant plugins (config/interfaces.json, session-start.sh, CHANGELOG v5.1)
9. **SurrealDB knowledge guardrails:** The three-layer enforcement system: (1) skill auto-injection via `inject-surrealdb-skill.sh` hook with live instance health check, (2) "no general knowledge" rule requiring Context7/reference verification before writing any SurrealQL, (3) schema lens at phase closeout validating every query against SCHEMAFULL definitions (claude-behavior.md, checks/surrealdb.json, interfaces.json lenses section, CHANGELOG v5.1.4)

If Scott is satisfied, proceed with whatever task prompted the briefing.
If Scott identifies gaps, re-read the relevant file and try again.
