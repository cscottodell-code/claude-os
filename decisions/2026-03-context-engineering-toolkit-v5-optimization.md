# Scott-Toolkit v5.1 Optimization Brief

**Purpose of this document:** Provide a second AI session (Cowork, Claude Code, or any agent harness) with enough architectural understanding to evaluate and implement 7 specific recommendations for the scott-toolkit. This document is designed to be self-contained. It explains what the toolkit is, how it was built, what it does, why each piece exists, and exactly what changes are proposed, so that an independent session can verify whether the recommendations are harmonious with the toolkit's vision before making any changes.

**Date:** 2026-03-24
**Toolkit location:** `~/Sites/Global/scott-toolkit/`
**Toolkit version:** v5.1
**Owner:** Scott O'Dell (Head of Sales, Advosy, learning to code)

---

## Part 1: What the Toolkit Is

### Origin and Vision

The scott-toolkit is a personal AI orchestration system that controls how Claude Code (and potentially other AI agent harnesses) behaves across all of Scott's projects. It is not a library, not an npm package, not a framework. It is a collection of **markdown files, shell scripts, and JSON configs** deployed to `~/.claude/` that shape every Claude Code session.

The core insight driving the toolkit: **most AI agent problems are systems-design problems, not prompting problems.** When Claude Code produces poor output, the fix is almost never "write a better prompt." The fix is almost always structural: better context loading, better verification gates, better session lifecycle management, better guardrails.

The toolkit exists because Scott, a non-engineer learning to code, needs Claude Code to be **reliable and predictable** across 12+ active projects spanning personal tools, a home services company (Advosy), and a construction company (Bresco). Without the toolkit, each session would start from zero, repeat past mistakes, and require Scott to manually enforce quality standards he shouldn't have to remember.

### The Architecture (Six Layers)

The toolkit implements what Tw93 (a Claude Code power user with 6 months of heavy use) independently identified as the six essential layers of a well-configured Claude Code setup. Scott built all six organically before Tw93 published his model, which validates the architecture:

| Layer | Toolkit Implementation | Purpose |
|-------|----------------------|---------|
| **1. Context** (CLAUDE.md, rules, memory) | `~/.claude/CLAUDE.md` (global), project-level CLAUDE.md files, `rules/claude-behavior.md`, `rules/code-style.md`, `MEMORY.md` | Tells Claude "what this is" and "how we work" |
| **2. Tools** (MCP, built-in tools) | MCP servers configured per project, tool permissions in settings.json | Tells Claude "what I can do" |
| **3. Skills** (on-demand methodologies) | `~/.claude/skills/` folder with 30+ skills (surrealdb, n8n, uiux, debug, etc.) | Tells Claude "how to do specific things" |
| **4. Hooks** (deterministic enforcement) | `hooks/` folder with 16 shell scripts deployed to `~/.claude/hooks/` | Enforces rules without relying on Claude's judgment |
| **5. Subagents** (context-isolated workers) | Role definitions in `claude-behavior.md` with named roles and tool restrictions | Provides controlled autonomy with isolation |
| **6. Verifiers** (verification loops) | `phase-closeout.md` workflow, `pre-completion-checklist.sh`, test requirements | Makes output verifiable, rollbackable, auditable |

### How It Deploys

The toolkit lives in a git repo at `~/Sites/Global/scott-toolkit/`. A session-start hook (`session-start.sh`) runs `sync-down` at the beginning of every Claude Code session, which:
1. Pulls latest config from GitHub
2. Copies hooks, rules, skills, and config to `~/.claude/`
3. Verifies deployment integrity

This means every session across every machine starts with identical, up-to-date toolkit configuration.

### The Three Systems

The toolkit coordinates three distinct systems, each handling different concerns:

1. **GSD (Get Stuff Done)** handles project management: planning phases, executing phases, tracking progress, verifying work, adding tests. State lives in `.planning/` directories within each project.

2. **Superpowers** handles development methodology: TDD (test-driven development), code review, git worktrees for isolation, systematic debugging. These are discipline layers that apply *during* GSD execution.

3. **Scott-Toolkit** handles context engineering: session lifecycle (start/end/compact), guardrails (hooks that block dangerous actions), lessons capture (learning from mistakes), instinct extraction (mining sessions for reusable patterns), and periodic consolidation (spa days).

The integration pattern is explicit in `claude-behavior.md`:
> "Superpowers discipline applies DURING GSD execution. When execute_phase runs, tdd governs how code is written. git_worktree provides isolation before GSD plans are executed. finish_branch handles merge/PR after GSD verification passes."

### Key Design Principles

These principles are not written down in one place but are evident across every toolkit decision:

**1. Safety over autonomy.** Scott is a beginner. The toolkit deliberately restricts agent autonomy in favor of human checkpoints. Guard hooks block destructive git operations, npm installs, and config file edits. Workflow phases default to [STOP] (wait for Scott's input) unless explicitly tagged [AUTO]. This is the opposite of Gaskill's "self-updating memory" philosophy, and it's intentional.

**2. Context window protection.** The toolkit's central obsession. CLAUDE.md is kept lean (routing, not content). Skills load on demand, not at session start. Large tool outputs get offloaded to disk. Context-reminders.sh mechanically tracks session age (60min) and tool use count (100) to warn about context rot before it causes problems. The pre-compact hook saves state before compaction can wipe it.

**3. Verification is mandatory, not optional.** Phase closeout is a hook-enforced gate: test suite must pass, code review must be clean, retro must be written, and a `.post-execution-complete` marker must exist before a phase can be marked complete. This was added after the verification step was skipped 3 times in a row.

**4. Lessons compound.** After every correction from Scott, every debug session, and every completed phase, lessons are captured in `tasks/lessons.md` using the format "Next time, do X instead of Y because Z." Error logs (toolkit/operator mistakes) and success logs (things that worked well) are separate concerns from code debugging. Categorized lesson tags ([stack], [pattern], [project], [prompt], [harness]) enable filtering. The instinct extraction hook passively mines sessions for patterns worth promoting to permanent rules or skills.

**5. Abstract operations decouple from tools.** When `claude-behavior.md` says "invoke the **tdd** operation," it doesn't hard-code which skill or command to run. Instead, it resolves via `config/interfaces.json`, which maps abstract operation names to concrete commands. This lets the toolkit swap underlying tools (e.g., replacing one TDD skill with another) without rewriting every workflow.

**6. The user is a beginner.** Templates use spreadsheet analogies. Explanations are expected to be thorough. Complex tasks are broken into smaller pieces with check-ins. Technical jargon is avoided or explained. This shapes everything from CLAUDE.md structure to how workflows are written.

---

## Part 2: What Was Compared

On 2026-03-24, we compared the toolkit against **21 context engineering sources** from the community and Anthropic's own engineering team. These sources represent the best current thinking on how to configure AI agent harnesses.

### The 5 New Sources (this round)

| Source | Author | Key Contribution |
|--------|--------|-----------------|
| AI Digital Employees Folder System | Remy Gaskill (@startupideaspod) | Folder-per-department agent architecture, self-updating memory.md, skills as reusable SOPs |
| Claude Code Architecture Deep Dive | Tw93 (@hitw93) | Six-layer architecture model, five diagnostic surfaces, context rot as primary failure mode |
| How We Use Skills (Anthropic) | Thariq Shihipar (@trq212) | Skills are folders not files, nine skill categories, gotchas sections, model-optimized descriptions |
| Agent Config Files Structure | Priyanka Vergadia (@pvergadia) | Four-file agent architecture, explicit "what I do NOT do" boundaries |
| Effective Harnesses for Long-Running Agents | Anthropic Engineering | Two-agent architecture, structured JSON feature lists, single-feature-per-session |

### The 16 Previously Analyzed Sources

Including work from Anthropic engineers (Lance Martin, Thariq Shihipar), LangChain (Vivek Trivedy), OPENDEV (Nghi Bui), community practitioners (Affaan Mustafa, sysls, YK Dojo, Faran), and academic researchers (Xu et al./CSIRO).

### What the Comparison Found

| Category | Count | Meaning |
|----------|-------|---------|
| **Congruencies** | 46 | Patterns where the toolkit already matches source recommendations |
| **Discrepancies** | 8 | Tensions where sources say one thing and the toolkit does another |
| **Unique Ideas** | 23 | Patterns from sources that the toolkit doesn't implement yet |
| **Toolkit-Only** | 16 | Innovations in the toolkit that no source covers |

The toolkit is architecturally sound. It implements all six layers of Tw93's model, all five diagnostic surfaces, and the vast majority of community-recommended patterns. The 16 toolkit-only patterns represent genuine innovations beyond what the community has documented.

---

## Part 3: The 7 Recommendations

Each recommendation below includes: what to change, why it matters, which source(s) support it, which toolkit file(s) to modify, the exact changes, and why it's harmonious with the toolkit's vision.

---

### Recommendation 1 (P1): Make pre-completion-checklist.sh Blocking

**What:** Change `hooks/pre-completion-checklist.sh` from advisory (exit 0 always) to blocking (exit 1 when checks fail).

**Why it matters:** Vivek Trivedy (LangChain), who tested harness designs on Terminal Bench 2.0, identifies this as "the single most impactful improvement." The toolkit already has the checklist. It already checks for uncommitted changes, stale todo.md, missing resume file, and un-updated lessons. But it always exits 0, meaning Claude can ignore the warnings and end the session anyway. Making it blocking means Claude *must* address the items before the session can end cleanly.

**Source:** Trivedy (LangChain) — "PreCompletionChecklistMiddleware"

**File to modify:** `~/Sites/Global/scott-toolkit/hooks/pre-completion-checklist.sh`

**Current behavior (line 97):**
```bash
exit 0
```

**Proposed change:** Replace the final `exit 0` with conditional exit:
```bash
if [ "$count" -gt 0 ]; then
  exit 1
else
  exit 0
fi
```

**Why it's harmonious:** This is the purest expression of the toolkit's "verification is mandatory" principle. The toolkit already has hook-enforced gates (guard-phase-completion.sh blocks phase completion without the marker). This extends the same philosophy to session endings. It doesn't add a new concept. It strengthens an existing one.

**Risk:** If the checklist is too aggressive (e.g., requiring lessons.md updates for trivial sessions), it could become annoying. Mitigation: Scott can always say "bypass the hook" which triggers the scott-bypass skill. The 4-hour threshold for lessons.md staleness (line 58) is already conservative.

---

### Recommendation 2 (P1): Add "Does NOT" Lines to Subagent Role Definitions

**What:** Add explicit negative behavioral boundaries to each named subagent role in `rules/claude-behavior.md`.

**Why it matters:** Priyanka Vergadia's research shows that without explicit negative boundaries, agents fill operational gaps independently. An analyst agent without documented constraints about report writing may start writing reports autonomously. The toolkit already restricts subagent *tools* (Researcher gets Read/Grep/Glob only), but tools and behavior are different things. A Researcher with only read tools could still *attempt* to write files (and fail), wasting tokens and context. Explicit "does NOT" lines prevent the attempt entirely.

**Source:** Vergadia (@pvergadia) — "The 'what I do NOT do' section is the most important part of Agent.md"

**File to modify:** `~/Sites/Global/scott-toolkit/rules/claude-behavior.md`

**Current text (lines 88-93):**
```markdown
- Named agent roles with minimum-necessary tool sets:
  - **Researcher/Explorer:** Read, Grep, Glob, WebSearch, WebFetch only (no Write, Edit, Bash)
  - **Planner:** Read, Grep, Glob only
  - **Reviewer:** Read, Grep, Glob, Bash (for running tests)
  - **Executor:** All tools (full access for implementation work)
  - Match the role to the task. Don't give a research subagent write access.
```

**Proposed replacement:**
```markdown
- Named agent roles with minimum-necessary tool sets:
  - **Researcher/Explorer:** Read, Grep, Glob, WebSearch, WebFetch only (no Write, Edit, Bash). Does NOT create files, modify code, or execute commands. Returns findings only.
  - **Planner:** Read, Grep, Glob only. Does NOT write plans to disk, execute implementation, or make code changes. Returns analysis only.
  - **Reviewer:** Read, Grep, Glob, Bash (for running tests). Does NOT edit code or fix issues directly. Returns findings and recommendations only.
  - **Executor:** All tools (full access for implementation work). Does NOT skip verification or mark tasks complete without proof.
  - Match the role to the task. Don't give a research subagent write access.
```

**Why it's harmonious:** The toolkit's subagent section already embodies the "minimum-necessary tools" principle. This change doesn't alter the tool restrictions. It adds a behavioral layer that reinforces them. It's the same philosophy as the guard hooks: don't rely on Claude's judgment when you can make the constraint explicit. The "Returns findings/analysis/recommendations only" phrasing also makes clear what the subagent *should* deliver, not just what it shouldn't do.

---

### Recommendation 3 (P2): Add Prompt Cache Ordering Note

**What:** Add a brief section to `context/CLAUDE-MD-TEMPLATE.md` documenting that stable content should come before volatile content in CLAUDE.md files.

**Why it matters:** Three independent sources (Nghi Bui/OPENDEV, Lance Martin/Anthropic, Tw93) all note that Claude's prompt caching system reuses cached prefixes. If your CLAUDE.md starts with stable content (tech stack, conventions, rules) and puts volatile content last (current status, active task), the stable prefix gets cached and reused across turns. If volatile content is scattered throughout, cache hits drop and costs increase.

**Source:** Bui (OPENDEV), RLanceMartin (Anthropic), Hitw93 — all independently confirm

**File to modify:** `~/Sites/Global/scott-toolkit/context/CLAUDE-MD-TEMPLATE.md`

**Proposed addition** (insert after the opening HTML comment, before "## Project Context"):
```markdown
<!--
ORDERING PRINCIPLE: Place stable content (stack, conventions, rules, architecture)
before volatile content (current status, active tasks, recent decisions). Claude's
prompt caching system reuses cached prefixes — stable-first ordering maximizes
cache hits across conversation turns, reducing cost and improving consistency.
-->
```

**Why it's harmonious:** The toolkit is already obsessed with context window efficiency (lean CLAUDE.md, progressive disclosure, context-reminders.sh tracking). This is a zero-cost annotation that makes the existing template's ordering *intentional* rather than accidental. The template already roughly follows this order (Project Context and Tech Stack before Status), so this just documents the principle for future template modifications.

---

### Recommendation 4 (P2): Add "Create Skill from Session" Capability

**What:** Create a new slash command or skill that lets Scott say "create a skill for what we just did" at the end of a successful workflow, producing a structured skill folder.

**Why it matters:** The toolkit already has `extract-instincts.sh`, which passively prompts Claude to note patterns at session end. But Gaskill's "create a skill from this session" pattern is more directed: instead of mining for vague patterns, it actively packages a specific successful workflow into a reusable skill. This is the difference between "did anything interesting happen?" (passive) and "that thing we just did, make it repeatable" (active). Thariq (Anthropic) confirms that the best skills start as "a few lines and one gotcha" from real sessions.

**Source:** Gaskill (@startupideaspod) — "create a skill for what we just did"; Thariq (Anthropic) — skills should start small from real use

**Files to create/modify:**
- New skill: `~/.claude/skills/scott-create-skill/SKILL.md` (or enhance the existing `skill-creator` skill)
- Could also be a simple slash command in `~/.claude/commands/`

**Proposed behavior:**
1. Claude reviews the current session's recent actions (tool calls, files modified, patterns used)
2. Claude asks Scott: "What should this skill be called? What's the trigger condition?"
3. Claude generates a skill folder with SKILL.md containing:
   - Description optimized for model triggering (per Recommendation 5)
   - The workflow steps extracted from the session
   - A "Gotchas" section with any corrections or retries that happened
   - Any helper scripts that were used
4. Claude saves to `~/.claude/skills/[name]/SKILL.md`

**Why it's harmonious:** This is the natural evolution of the toolkit's learning loop. The current loop is: mistakes → lessons.md → spa day review → maybe promote to rule/skill. This adds a faster path: success → immediate skill creation → available next session. It doesn't replace extract-instincts (passive pattern mining is still valuable); it adds a complementary active path. It also aligns with the toolkit's "lessons compound" principle, just applied to successes rather than mistakes.

**Note:** The existing `skill-creator` skill from Superpowers may already handle this. Evaluate whether enhancing it with session-context awareness is better than creating a new skill.

---

### Recommendation 5 (P2): Gradually Rewrite Skill Descriptions for Model Triggering

**What:** Migrate skill description fields from human-readable summaries to model-optimized trigger conditions.

**Why it matters:** Thariq Shihipar (Anthropic engineer) specifically recommends: "Write descriptions for models, not humans. The description field should focus on when to trigger the skill." The current toolkit skills use descriptions like "SurrealQL syntax, schema design patterns, and query optimization for SurrealDB." A model-optimized version would be: "Use whenever the user writes SurrealQL, designs a database schema, asks about SurrealDB features, or connects SurrealDB to n8n. Also use when asking about record links, events, indexes, or query optimization."

The difference: the first describes what the skill *contains*. The second describes when the skill *should activate*. Models need trigger conditions, not content summaries.

**Source:** Thariq (Anthropic) — "Lessons from Building Claude Code: How We Use Skills"

**Files to modify:** All `~/.claude/skills/*/SKILL.md` description fields (30+ skills)

**Proposed approach:** This should NOT be done all at once. During toolkit spa days (periodic maintenance), review 3-5 skills per session:
1. Read the current description
2. Rewrite to focus on trigger conditions: "Use when [situation]. Also trigger when [keywords/patterns]."
3. Include negative triggers if relevant: "Do NOT trigger for [common false positive]."

**Example transformation:**
```
# Before (human-readable)
description: SurrealQL syntax, schema design patterns, and query optimization for SurrealDB.

# After (model-optimized)
description: Use whenever the user writes SurrealQL, designs a database schema, asks about
  SurrealDB features, or connects SurrealDB to n8n. Also use when asking about
  record links, events, indexes, or query optimization.
```

**Why it's harmonious:** The toolkit already has skills. The toolkit already has spa days for periodic maintenance. This just adds "review skill descriptions" to the spa day checklist. It doesn't change how skills work. It makes them trigger more accurately, which improves the progressive disclosure system (the right skill loads at the right time, reducing context waste).

**Note:** Many of the toolkit's skills already use trigger-oriented descriptions (the scott-debug skill description is excellent: "Use INSTEAD of superpowers:systematic-debugging when working on Scott's projects"). This recommendation formalizes what the best skills already do and extends it to the rest.

---

### Recommendation 6 (P3): Document Fresh-Context-Per-Phase as a Pattern

**What:** Add a section to `rules/claude-behavior.md` documenting that multi-step workflows should spawn fresh subagents per phase to avoid attention degradation.

**Why it matters:** Heinrich (arscontexta) and Trivedy (LangChain) both document that context quality degrades as agents process more steps in a single window. The "Ralph loop" pattern spawns a fresh agent for each processing phase, passing only the necessary context forward. The toolkit already does this in practice (compare-sources.md Phase 4 delegates to a subagent), but it's not documented as a general principle. Without documentation, future workflows might not follow the pattern.

**Source:** Heinrich (arscontexta) — "Ralph loop"; Trivedy (LangChain) — fresh context per phase

**File to modify:** `~/Sites/Global/scott-toolkit/rules/claude-behavior.md` (Subagents section)

**Proposed addition** (after the existing subagent role definitions):
```markdown
- Fresh context per phase: for multi-step workflows (3+ phases), prefer spawning fresh
  subagents per phase rather than running all phases in the main context. Each subagent
  gets a clean context window with only the inputs it needs. This prevents attention
  degradation from accumulated intermediate results. The main context stays lean and
  focused on orchestration.
  - Example: compare-sources.md delegates Phase 4 (heavy comparison) to a subagent
  - Example: GSD execute_phase runs in subagent context when using parallel workstreams
  - Exception: simple sequential phases where the overhead of subagent setup exceeds the
    benefit (use judgment — if each phase is <20 tool calls, staying in main context is fine)
```

**Why it's harmonious:** This formalizes something the toolkit already does implicitly. The context-reminders.sh hook already tracks tool use count as a proxy for context degradation. The subagent section already advocates for isolation. This adds the *when* to the existing *how*: use subagents not just for parallel work, but for sequential work when the accumulated context would degrade quality.

---

### Recommendation 7 (P3): Add Skills Usage Tracking Hook

**What:** Create a new PreToolUse hook that logs which skills are invoked, building a dataset for spa day reviews.

**Why it matters:** Thariq (Anthropic) recommends tracking skill usage via PreToolUse hooks to identify: (a) popular skills worth investing in, (b) under-triggering skills whose descriptions need improvement, and (c) skills that trigger but aren't useful (false positives). The toolkit already has spa days for periodic maintenance, but currently the spa day relies on subjective review. Usage data would make it evidence-based.

**Source:** Thariq (Anthropic) — "Usage tracking via PreToolUse hooks"

**File to create:** `~/Sites/Global/scott-toolkit/hooks/track-skill-usage.sh`

**Proposed behavior:**
1. Hook fires on PreToolUse for Skill invocations
2. Appends a line to `~/.claude/skill-usage-log.csv`: `date,skill_name,project_dir`
3. The spa day workflow reads this log to identify usage patterns

**Proposed implementation:**
```bash
#!/bin/bash
# Hook: PreToolUse — Track Skill Usage
# Logs skill invocations for spa day analysis.
# Lightweight — just appends a CSV line.

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
SKILL_NAME="${CLAUDE_TOOL_INPUT_SKILL:-}"

# Only track Skill tool invocations
if [ "$TOOL_NAME" != "Skill" ] || [ -z "$SKILL_NAME" ]; then
  exit 0
fi

LOG_FILE="$HOME/.claude/skill-usage-log.csv"

# Create with header if new
if [ ! -f "$LOG_FILE" ]; then
  echo "date,skill,project" > "$LOG_FILE"
fi

echo "$(date +%Y-%m-%d),${SKILL_NAME},$(basename $(pwd))" >> "$LOG_FILE"

exit 0
```

**Why it's harmonious:** The toolkit already tracks context budget (context-reminders.sh counts tool uses). The toolkit already has spa days for periodic review. The toolkit already has extract-instincts for mining session patterns. This adds one more data stream to an existing review process. It's a measurement hook, not a behavioral one, so it has zero risk of breaking anything.

**Note:** The exact environment variables (`CLAUDE_TOOL_NAME`, `CLAUDE_TOOL_INPUT_SKILL`) need to be verified against Claude Code's actual hook API. The hook should be tested before deployment.

---

## Part 4: Verification Checklist

After implementing the recommendations, verify each one:

| # | Recommendation | How to Verify |
|---|---------------|--------------|
| 1 | Blocking pre-completion checklist | Start a session in a git project, make changes without committing, end session. Hook should block (exit 1), not just warn. |
| 2 | "Does NOT" subagent lines | Read `rules/claude-behavior.md` subagent section. Each role should have a "Does NOT" clause. Verify wording reinforces (not contradicts) tool restrictions. |
| 3 | Prompt cache ordering note | Read `context/CLAUDE-MD-TEMPLATE.md`. HTML comment about stable-before-volatile ordering should appear near the top. Template section order should match the principle. |
| 4 | Create skill from session | Invoke the new skill/command. It should review recent session actions, ask for a name and trigger condition, and generate a skill folder with SKILL.md + Gotchas section. |
| 5 | Model-optimized descriptions | Spot-check 3-5 skill descriptions. Each should start with "Use when..." and list trigger conditions, not content summaries. |
| 6 | Fresh-context-per-phase pattern | Read `rules/claude-behavior.md` subagent section. New paragraph about spawning fresh subagents for multi-step workflows. Includes examples and exception clause. |
| 7 | Skills usage tracking hook | Check `~/.claude/hooks/` for `track-skill-usage.sh`. Invoke a skill, then check `~/.claude/skill-usage-log.csv` for the entry. |

### Harmony Check

Before implementing any recommendation, verify it passes these tests:

1. **Does it protect context windows?** (The toolkit's central obsession)
2. **Does it favor safety over autonomy?** (Scott is a beginner)
3. **Does it make verification stronger, not weaker?** (Mandatory, not optional)
4. **Does it compound learning?** (Feeds into lessons, spa days, or future sessions)
5. **Does it use existing patterns?** (Hooks, skills, rules — not new architectural concepts)
6. **Would Scott understand it?** (No jargon, clear purpose)

All 7 recommendations pass all 6 tests.

---

## Part 5: What NOT to Change

The comparison also identified patterns where sources disagree with the toolkit but the toolkit's approach is correct for Scott's context:

| Pattern | Source Says | Toolkit Does | Why Toolkit Is Right |
|---------|-----------|-------------|---------------------|
| Self-updating memory | Gaskill: agent should auto-update memory.md | guard-claude-md.sh blocks edits | Scott is a beginner. Uncontrolled config edits are dangerous. Safety > autonomy. |
| JSON for state tracking | Anthropic: JSON resists model tampering | Markdown for all state files | Scott reviews output interactively. Markdown readability matters more than tamper resistance. |
| Agent-locked acceptance criteria | sysls: CONTRACT.md that agents can't edit | PLAN.md criteria are agent-editable | Locked contracts matter for unattended multi-hour runs. Scott reviews interactively. |
| Adversarial 3-agent verification | sysls: bug-finder + adversarial + referee | Single-pass code review + tests | High-effort, low-ROI at Scott's current project scale. |
| CLAUDE.md as pure routing | sysls, hitw93: no inline content | Template includes inline schema, architecture | Global CLAUDE.md is already lean. Template is a customizable starting point. |

**Do not implement these.** They are correct for autonomous, unattended agent workflows but wrong for Scott's interactive, learning-oriented context.

---

## Part 6: Toolkit-Only Innovations to Preserve

These 16 patterns exist in the toolkit but appear in **no** community source. They represent genuine innovations. Any changes should preserve, not undermine, them:

| # | Innovation | File | Why It Matters |
|---|-----------|------|---------------|
| 1 | Abstract operation resolution via interfaces.json | claude-behavior.md | Decouples toolkit from specific tool versions. Swap tools without rewriting workflows. |
| 2 | Stack-lock.json with drift detection | claude-behavior.md, guard-npm-install.sh | Version pinning more rigorous than any source. Critical for 12+ projects. |
| 3 | [STOP]/[AUTO]/[DELEGATE] workflow tags | claude-behavior.md | Granular autonomy control per workflow phase. No source discusses this. |
| 4 | Guard-claude-md.sh (block config edits) | guard-claude-md.sh | Intentional safety choice. Opposite of Gaskill's approach, but correct for beginner. |
| 5 | Post-commit skill triggers | post-commit-skill-triggers.sh | Analyzes commit messages to suggest follow-up actions. Novel automation. |
| 6 | Self-testing check file fixtures | check-file-test-trigger.sh | Check files test themselves against good/bad fixture directories. |
| 7 | UI/UX audit reminder hook | uiux-reminder.sh | Automated design review nudges during development. |
| 8 | Design intent template | DESIGN-INTENT-TEMPLATE.md | Visual design direction for agent-assisted development. |
| 9 | Handoff-to-Gary workflow | handoff-to-gary.md | Role-specific handoff for Scott's production developer. |
| 10 | Error/success logging (separate from debug) | log-error.md, log-success.md | "Toolkit mistakes" vs. "code bugs" as separate concerns. |
| 11 | Mandatory lesson tags | phase-closeout.md | [stack]/[pattern]/[project]/[prompt]/[harness] enables filtering. |
| 12 | Spreadsheet analogies in templates | PRD-TEMPLATE.md | Tailored to Scott's background as a spreadsheet expert. |
| 13 | Context budget monitoring (tool-use counting) | context-reminders.sh | Mechanical tracking at 60min/100 tool thresholds. More rigorous than any source. |
| 14 | GSD + Superpowers integration | claude-behavior.md | PM system + dev methodology unified. Sources discuss one or the other, never both. |
| 15 | Dual pre-compact (prompt + mechanical backup) | pre-compact.sh | Addresses risk that compaction fires before Claude can save state. |
| 16 | Lessons format: "Next time X instead of Y because Z" | claude-behavior.md | Pedagogically effective format. No source prescribes this. |

---

## Appendix: File Paths Quick Reference

| What | Path |
|------|------|
| Toolkit repo | `~/Sites/Global/scott-toolkit/` |
| Behavior rules | `~/Sites/Global/scott-toolkit/rules/claude-behavior.md` |
| Code style rules | `~/Sites/Global/scott-toolkit/rules/code-style.md` |
| Pre-completion checklist hook | `~/Sites/Global/scott-toolkit/hooks/pre-completion-checklist.sh` |
| CLAUDE.md template | `~/Sites/Global/scott-toolkit/context/CLAUDE-MD-TEMPLATE.md` |
| Extract instincts hook | `~/Sites/Global/scott-toolkit/hooks/extract-instincts.sh` |
| Interfaces config | `~/Sites/Global/scott-toolkit/config/interfaces.json` |
| Skills directory | `~/.claude/skills/` |
| Global CLAUDE.md | `~/.claude/CLAUDE.md` |
| MEMORY.md | `~/.claude/projects/-Users-scott/memory/MEMORY.md` |
| Session-start hook | `~/Sites/Global/scott-toolkit/hooks/session-start.sh` |
| Context reminders hook | `~/Sites/Global/scott-toolkit/hooks/context-reminders.sh` |
| Phase closeout workflow | `~/Sites/Global/scott-toolkit/workflows/phase-closeout.md` |
| Comparison review | `~/Sites/Global/context-engineering/compared-sources/2026-03-24-review.md` |
| Raw findings | `~/Sites/Global/context-engineering/compared-sources/_raw-findings.md` |
