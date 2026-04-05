# Toolkit Changelog

## v6.1.0 - 2026-04-05

Audit remediation phase 2: narrow audience, remove dead workflows, clean up active docs.

### M1: Audience Narrowing + Handoff Removal
- **Audience narrowed to Scott only** (MacBook Air + Mac Studio). Removed Brett references from README and user-guide.
- **Deleted handoff-to-gary workflow** (`workflows/handoff-to-gary.md`) and skill (`skills/scott-handoff/`). No replacement needed.
- **Removed handoff guard** (`guardHandoffReady`) from workflow-gates.ts and pretooluse-router.ts
- **Updated setup.sh** to remove scott-handoff from workflow skill verification
- **Updated claude-behavior.md** verification prompt (removed Gary reference)
- Historical docs (retros, design specs, changelogs) left untouched

### M2: Knowledge Skill Category Tags
- Added `category: knowledge` frontmatter to 5 knowledge skills: scott-power-laws, scott-war-strategies, scott-human-nature, scott-mastery, scott-bops
- These skills will migrate to Eleanor's knowledge module (M3) as source records. The category tag marks them for future extraction.

## v6.0.0 - 2026-04-05
Full audit remediation: independent audit graded toolkit C+, identified 22 real issues. Fixed all across 4 milestones. Toolkit is now TypeScript/Bun throughout, with enforcement gates, expanded stack checks, and leaner skills.

### M1: Critical Fixes + Bun Foundation
- Fixed 4 critical bash bugs (fail-open guards, macOS crashes, injection risks, fragile JSON parsing)
- Created Bun project foundation (package.json, tsconfig.json, shared utilities in src/)
- Rewrote 6 tools from bash to TypeScript (stack-check, stack-detect, stack-preflight, stack-metrics, toolkit-lint, pre-commit-hook)

### M2: Hook Migration + Security Hardening
- Consolidated PreToolUse router + 6 guards into TypeScript
- Migrated 13 standalone hooks from bash to TypeScript
- Migrated settings.json to reference .ts files
- Removed all .sh hook files (setup.sh stays bash)
- Added SurrealDB dependency graph (toolkit-graph.ts)

### M3: Workflow & Enforcement Hardening
- **File-system gates**: 5 new workflow gates (.project-scaffolded, .design-approved, .handoff-ready, .changes-drafted, .reflection-complete) with advisory mode (WORKFLOW_GATES_BLOCK=1 for enforcement)
- **Split god-phases**: phase-closeout Phase 2 -> 2a/2b/2c (stack audit, lens review with context_files validation, general review). new-project Phase 3 -> 3a/3b/3c (draft, approve, resolve conflicts)
- **Shared context template**: context/_gather-project-context.md used by retro, resume-project, and phase-closeout
- **Definitions file**: context/_definitions.md (Design Proof, Stack Lock Staleness, Verify Execution)
- **6 new check files**: typescript, zod, pinia, vercel-ai, trigger-dev, pnpm (25 new static checks)
- **Stack-lock validator**: tools/validate-stack-lock.ts (schema validation, staleness detection, check file coverage)

### M4: Skill Cleanup + Polish
- **5 skill splits**: skill-creator (479->52), scott-research (442->85), scott-eos (331->86), scott-council (312->102), scott-notebooklm (266->63). Heavy logic moved to references/ files.
- **Banned patterns**: version-manifest.json now catches stale .sh references from pre-v6 toolkit
- **README updated**: repo structure reflects new guards, tools, and check files

## v5.3.0 - 2026-04-04
Context engineering overhaul: tool consolidation, token budget optimization, and harness improvements based on deep research of modern context engineering practices (40+ sources, April 2026).

### Tool Consolidation
- **7 plugins disabled globally:** vercel, firebase, playwright, rust-analyzer-lsp, coderabbit, code-review, frontend-design. Kept: superpowers, impeccable, typescript-lsp, explanatory-output-style, firecrawl. Saves ~3,500 tokens/turn in skill descriptions alone. Re-enable per-project when needed.
- **2 MCP servers removed:** exa (replaced by Firecrawl + WebSearch), workspace-mcp (120 tools, replaced by lighter cloud MCPs). Saves ~1,700 tokens/turn in tool schemas.
- **Cloud MCPs disconnected:** Canva, Figma, Gamma, Notion, Vibe Prospecting, Calendly, n8n, Gmail, Google Calendar removed from claude.ai account connections. Context7 cloud duplicate also removed (local copy kept).
- **Overlap resolution:** 6 overlaps identified and resolved: Context7 duplicate, Gmail/Calendar duplicate (workspace-mcp vs cloud), 3 code review systems (kept Superpowers), 2 frontend-design skills (kept Impeccable), Firecrawl/Exa/WebSearch (kept Firecrawl + built-in), cloud MCPs unused during coding.

### Hook Consolidation
- **NEW: `hooks/bash-pretooluse-router.sh`:** Single entry point replacing 7 separate Bash PreToolUse hooks (logging, guard-git-push, guard-destructive, guard-npm-install, guard-phase-completion, inject-surrealdb-skill, gsd-validate-commit). Reads stdin once, dispatches by pattern matching. Reduces 7 subprocess spawns to 1 per Bash call.
- **`settings.json`:** Bash PreToolUse reduced from 7 entries to 1 router + kept SurrealDB injection for non-Bash tools (Read|Edit|Write).

### Context Engineering Improvements
- **NEW: `~/.claudeignore`:** Global ignore file preventing Claude from reading build artifacts (node_modules, .nuxt, .output, dist, lock files, binaries, .git internals).
- **`CLAUDE.md`:** Added Context Routing table mapping 9 common needs to skills with auto-trigger indicators. Trimmed Quick References.
- **`rules/claude-behavior.md`:** Added `~/.claude/instinct-candidates.md` to post-compaction recovery checklist (was written by extract-instincts hook but not re-read after compaction). Added 5-field subagent briefing checklist (Objective, Files, Constraints, Output, Prior knowledge).
- **Memory staleness:** Added `last_verified: 2026-04-04` to all 17 memory file frontmatter blocks. Enables spa-day staleness detection (>60 days = flagged for review).
- **`config/interfaces.json` v1.2:** Added `mcp_servers` section cataloging context7 and surrealdb with `required_when` conditions and estimated token costs. Mirrors the plugins pattern.

### Maintenance Improvements
- **`workflows/toolkit-spa-day.md` v1.2:** Added Phase 7 (Token Budget Audit: count plugins, MCP servers, estimate always-on overhead) and Phase 8 (Permissions Pruning: flag one-offs, embedded secrets, removed MCP tools in settings.local.json). Added memory staleness check to Phase 1.
- **`settings.local.json`:** Pruned 103 allow rules (23 /tmp one-offs, 3 loop fragments, 17 embedded API keys/JWTs, 43 removed MCP tool permissions, 17 other one-offs). 591 rules reduced to 488. File size: 42KB to 28KB.

### Estimated Token Savings
- Plugin skill descriptions: ~3,500 tokens/turn
- MCP tool schemas: ~1,700 tokens/turn
- MCP server instructions: ~400 tokens/turn
- Eliminated Vercel false-positive context injections (observed firing on unrelated keywords like "bootstrap", "workflow", "verification", "ppr")
- Total: ~7,100 tokens/turn reduction (~41% of always-on overhead)

Triggered by: Deep research session comparing toolkit against 40+ context engineering sources (April 2026). Audit revealed 260+ deferred tools, 6 major overlaps, 12 enabled plugins (7 unnecessary), and unmeasured hook latency from 7 Bash PreToolUse subprocesses per command.

## v5.2.1 - 2026-04-03
Stability infrastructure: single source of truth for banned patterns, batch lint scanner, pre-commit gate, and setup.sh improvements.

### Single Source of Truth
- **`hooks/toolkit-coherence-check.sh`:** Rewritten to read banned patterns from `config/version-manifest.json` instead of hardcoding them. One place to update when patterns change.
- **`config/version-manifest.json`:** Added `scan_paths` section for external CLAUDE.md globs. Tightened `templates/` pattern to `scott-toolkit/templates/` to avoid false positives on project directories like `n8n-templates/`.

### Batch Lint Scanner
- **`tools/toolkit-lint.sh`** (NEW): Full-repo scanner that checks all toolkit .md files AND external project CLAUDE.md files for stale cross-references. Reads patterns from version-manifest.json. Supports `--fix` for auto-remediation (skips patterns needing human judgment). Exits 1 if stale refs found (works as a gate).
- Skips historical docs (v4-file-audit.md, v5-comparison-table.md, v5-unified-design.md) that legitimately reference old names.

### Pre-commit Gate
- **`tools/pre-commit-hook.sh`** (NEW): Git pre-commit hook that runs toolkit-lint.sh before commits. Symlinked to `.git/hooks/pre-commit`. Blocks commits with stale references.

### Setup Improvements
- **`setup.sh --verify-only`:** Lightweight health check mode that skips deployment and only runs verification. For quick "is everything linked?" checks.
- **`setup.sh` SCOTT_TOOLKIT_DIR check:** Prints recommendation to add env var to shell profile if unset, or warns if set to wrong path.

### Additional Stale Path Fixes
- Fixed `workflows/retro.md` (templates/ -> context/), `context/RETRO-TEMPLATE.md` (skills/reference/ -> skill system), `d2d-payroll/CLAUDE.md` and `life-os/CLAUDE.md` (skills/reference/ -> skill system).

## v5.2.0 - 2026-04-03
Toolkit coherence and guardrail hardening: eliminated all stale cross-references, standardized hook paths, and added automated coherence detection.

### Stale Path Fixes
- **`workflows/new-project.md`:** Fixed 4 references from `templates/` to `context/` (directory renamed in v4)
- **`workflows/retro.md`:** Fixed 8 shorthand `~/scott-toolkit/` paths to canonical `~/Sites/Global/scott-toolkit/`
- **`workflows/log-error.md`:** Fixed 5 shorthand paths
- **`workflows/log-success.md`:** Fixed 3 shorthand paths
- **`workflows/toolkit-update.md`:** Fixed 5 references to `scott-toolkit-instructions.md` (renamed to `docs/user-guide.md` in v5)
- **`context/CLAUDE-MD-TEMPLATE.md`:** Replaced stale `skills/reference/` section (deleted in v4) with current skill system references
- **`context/PRD-TEMPLATE.md`:** Fixed `templates/` to `context/`
- **`context/RETRO-TEMPLATE.md`:** Fixed `templates/` to `context/`
- **3 project CLAUDE.md files** (d2d-payroll, spotio-cf, life-os): Fixed shorthand toolkit paths

### Hook Infrastructure
- **`settings.json`:** Standardized all 7 PostToolUse/PreCompact/Stop hooks from direct `$HOME/Sites/Global/scott-toolkit/hooks/` paths to symlink paths (`$HOME/.claude/hooks/`). All hooks now go through the symlink layer for relocatability.
- **`settings.json`:** Registered `check-file-test-trigger.sh` and `uiux-reminder.sh` (PostToolUse, Edit|Write). These existed on disk and had symlinks but were never registered to actually fire.
- **`hooks/session-start.sh`:** Changed `TOOLKIT_DIR` assignment to use `SCOTT_TOOLKIT_DIR` env var with fallback for relocatability
- **`hooks/toolkit-coherence-check.sh`** (NEW): Advisory PostToolUse hook that fires on toolkit file edits and warns about stale cross-references (old shorthand paths, renamed directories, deleted files). Exits 0 always (never blocks).

### Setup Improvements
- **`setup.sh`:** Verification step now scans directories dynamically instead of hardcoded file lists. Adding new hooks, rules, checks, or tools no longer requires updating setup.sh.
- **`setup.sh`:** Added `--update-paths /old/path` flag for toolkit relocation. Replaces the old canonical path with the new one in all .md files.

### Dead Code Removal
- **Deleted `tools/toolkit-resolve`:** Zero runtime invocations found. Claude reads `config/interfaces.json` directly (per `rules/claude-behavior.md` Operation Resolution section). README updated with grep tip for finding operation references.

Triggered by: Exhaustive cross-reference audit found 33+ stale paths, 2 unregistered hooks, 7 inconsistent hook paths, and 1 dead tool across the toolkit.

## v5.1.4 - 2026-04-02
SurrealDB guardrail hardening: enforce Context7/reference-first development and live instance verification.

### SurrealDB Guardrails
- **`skills/scott-surrealdb/SKILL.md`:** Added "MANDATORY: No General Knowledge for SurrealQL" section between the reference links and the traps list. Explicitly prohibits writing SurrealQL from general SQL knowledge or LLM training data. Requires checking traps, Context7, or reference files before writing any query, and verifying against a live instance before committing.
- **`hooks/inject-surrealdb-skill.sh`:** Added live SurrealDB health check (2s timeout, non-blocking) on first injection. If `localhost:8000/health` is unreachable, injects a WARNING into additionalContext with the start command. Ensures Claude is immediately aware when the server is down, before any SurrealDB code gets written.

Triggered by: Guardrail audit found two gaps: (1) no explicit rule preventing general-knowledge SurrealQL, and (2) no automated check that SurrealDB is running during development.

## v5.1.3 - 2026-04-02
Specialist review lenses: parallel domain-specific code review during phase closeout.

### Specialist Lenses
- **`config/interfaces.json`:** Added `lenses` section with two initial lenses: `schema` (SurrealDB SCHEMAFULL compliance) and `security` (OWASP Top 10 + injection patterns). Each lens defines `applies_when` conditions, restricted `context_files`, `file_patterns`, and a focused review prompt.
- **`workflows/phase-closeout.md` v2.1:** Phase 2 (Code Review) now dispatches applicable specialist lenses as parallel Reviewer subagents before the general code review. Each lens agent has restricted scope ("blinders") and returns typed findings. Findings are merged, deduplicated, and presented before the fix cycle. Lenses skip when fewer than 5 files changed to avoid overhead on small phases.
- **`rules/claude-behavior.md`:** Updated phase closeout description to reference specialist lens dispatch.

Inspired by: GStack framework's "perspective constraint" pattern (specialist roles with restricted scope). Adopted the one pattern with evidence (focused SurrealDB audit caught 3 bugs generalist review missed in Bresco). Architecture and UX flow lenses deferred until evidence justifies them.

## v5.1.2 - 2026-03-29
Context engineering research: agent boundaries, subagent roles, and multi-agent landscape evaluation.

### Template Improvement
- **`context/CLAUDE-MD-TEMPLATE.md`:** Replaced `Constraints & Rules` section with `Boundaries` using the industry-standard three-tier system (Always/Ask First/Never). Gives Claude a quick mental model of what's off-limits per project while hooks handle enforcement.

### Subagent Roles
- **`rules/claude-behavior.md`:** Added two new named agent roles:
  - **Docs Agent:** Read, Grep, Glob, Write (documentation files only). For handoff documentation and README generation.
  - **Security Auditor:** Read, Grep, Glob only (report-only, no modifications). For pre-deploy security sweeps.

### Research
- Evaluated Tier 2 multi-agent tools (Vibe Kanban, Gastown, Claude Squad, Agent Teams, Conductor). Decision: no adoption for now. Solo developer on tightly-coupled codebases. Current GSD manager + wave parallelism is sufficient.
- Compared toolkit against the 4-file pattern (Agent.md, Context.md, Memory.md, Skill.md). Toolkit already implements this with stronger enforcement.
- Research saved to MEMORY.md for future reference.

Triggered by: Scott watched a video on the 4-file context engineering pattern, wanted to compare against the toolkit and evaluate multi-agent orchestration options.

## v5.1.1 - 2026-03-29
Version propagation: auto-detect stale version references after CHANGELOG updates.

### Version Propagation
- **NEW: `hooks/version-propagate.sh`:** PostToolUse hook fires when CHANGELOG.md is edited. Extracts latest version, checks all files in version-manifest.json for stale references, outputs a bordered checklist. Non-blocking reminder (content updates need Claude's reasoning).
- **NEW: `config/version-manifest.json`:** Lists all files that must reference the current toolkit version, with patterns and descriptions. Used by version-propagate.sh.
- **`setup.sh`:** Added version-propagate.sh to hook verification list. Version bumped to v5.1.
- **Documentation updates for v5.1.0:** README.md, user-guide.md, v5-unified-design.md, toolkit-briefing, and claude-behavior.md all updated to reflect plugin awareness features.

## v5.1.0 - 2026-03-28
Plugin tuning: reduce token overhead by detecting plugin/project misalignment.

### Plugin Awareness
- **`config/interfaces.json`:** Added `plugins` section cataloging Vercel, Superpowers, and Impeccable with `required` flag. Schema version bumped to 1.1.
- **`hooks/session-start.sh`:** Bidirectional plugin-project alignment check. Warns when Vercel plugin is active on non-Vercel projects (~52K tokens saved) or disabled on Vercel projects. Suggests copy-paste `.claude/settings.json` content.
- **`workflows/new-project.md`:** Phase 5 now generates `.claude/settings.json` alongside `stack-lock.json` for non-Vercel projects.
- **`tools/toolkit-resolve`:** Updated exclusion filter to skip `plugins` section entries.
- **`rules/claude-behavior.md`:** Added plugin ID resolution note under Operation Resolution.
- **`checks/stack-lock.schema.json`:** Now accepts schema_version 1.1.

## v5.0.0 - 2026-03-24
Major rewrite: three new systems (stack enforcement, learning loop, decoupling) plus full toolkit rationalization.

### Stack Enforcement (Steps 1-3)
- **NEW: `checks/` directory** with technology check files: surrealdb.json, nuxt.json, tailwind.json, bun.json, hono.json
- **NEW: `checks/stack-lock.schema.json`** -- JSON Schema for validating stack-lock.json files
- **NEW: `checks/test-fixtures/`** -- good/bad sample files for check validation
- **NEW: `tools/stack-detect.sh`** -- auto-detect project technologies from package.json
- **NEW: `tools/stack-check.sh`** -- run static checks from check files against source code
- **NEW: `tools/stack-preflight.sh`** -- system readiness verification with degradation tiers (full/reduced/minimal)
- **`workflows/phase-closeout.md` v2.0:** Added Phase 1.5 (Stack Audit) between Verify and Code Review. Lesson tagging with Claude-suggested tags.
- **NEW: `hooks/check-file-test-trigger.sh`** -- auto-runs test fixtures when check files are edited

### Guard Hooks + Setup (Step 4)
- **NEW: `hooks/uiux-reminder.sh`** -- nudge to run /impeccable:audit when .vue files change during GSD execution
- **`hooks/guard-npm-install.sh`:** Extended for stack drift detection
- **`setup.sh` v5:** Deploys checks/, tools/, config/ directories alongside hooks/rules/skills

### Workflow Integration (Step 5)
- **`workflows/new-project.md`:** Added stack-lock.json generation in Phase 5 (Create Repository)
- **`workflows/resume-project.md`:** Added stack-lock staleness check in Phase 1

### Decoupling (Step 6)
- **NEW: `config/interfaces.json`** -- maps 17 abstract operations to concrete GSD/Superpowers/Toolkit commands
- **NEW: `tools/toolkit-resolve`** -- shell helper to resolve operation names
- **`rules/claude-behavior.md`:** Rewrote with abstract operation names + operation resolution rule + stack enforcement section
- **All workflow files:** Updated to use abstract operation names instead of hardcoded commands
- **`context/CLAUDE-MD-TEMPLATE.md`:** Updated PM Mode section with abstract operations + resolution reference
- **`tools/stack-preflight.sh`:** Added provider health check (verifies interfaces.json operations are resolvable)

### Learning Loop (Step 7)
- **NEW: `tools/stack-metrics.sh`** -- aggregates audit artifacts across all projects into checks/metrics.json
- **NEW: `skills/scott-stack-review/`** -- 5-section dashboard (system health, check candidates, health report, refinement, overlap)
- **NEW: `skills/scott-stack-baseline/`** -- first-run audit for existing projects
- **NEW: `skills/scott-rebuild-metrics/`** -- regenerate metrics.json from audit artifacts
- **NEW: `.gitignore`** -- excludes checks/metrics.json (computed cache)

### Documentation + Polish (Step 8)
- **`README.md`:** Rewritten for v5. Updated architecture (four-system), repo structure, contributing rules, learning loop diagram.
- **`docs/user-guide.md`:** Added stack enforcement skills, updated hooks table, abstract operations in build loop, v5 "What Lives Where" table.
- **`workflows/toolkit-spa-day.md` v1.1:** Added Phase 6 (Stack Review), replaced knowledge/ with checks/ in audit, added interfaces audit to contradiction scan.
- **`workflows/toolkit-update.md` v1.3:** Added v5 ripple effect checks (check files, interfaces.json, tools/).
- **`workflows/handoff-to-gary.md` v1.4:** Added stack-lock.json to handoff checklist.
- **`rules/code-style.md`:** Added Version Compliance section (stack-lock.json, SurrealDB v3, Tailwind v4 patterns).

### Rationalization (Step 0)
- **DELETED: `knowledge/` directory** -- all content absorbed into matching skills
- **Root files cleaned:** about-me.md, conventions.md, gsd-upstream-proposals.md deleted
- **Files moved:** ADRs to Eleanor, surrealdb-v3-reference to skills, instructions to docs/
- **Scope notes added** to log-error.md, log-success.md, retro.md

Triggered by: v4 file audit of all 160 toolkit files revealed duplication, misplacement, and the need for stack enforcement after Bresco's code-reading reviews missed 3 real bugs that a live SurrealDB audit caught in minutes.

## v2.14.0 - 2026-03-22
- **NEW: `/scott:phase-closeout`** — single unified skill replacing separate log-error, log-success, and retro skills for GSD post-execution. Runs verification, code review, and one reflection interview. Produces error logs, success logs, RETRO.md, and lessons.md in one conversation.
- **NEW: `guard-phase-completion.sh` hook** — PreToolUse hook that blocks `gsd-tools phase complete` unless `.post-execution-complete` marker file exists. The marker is written by phase-closeout as its final step. This is physical enforcement, not instructions.
- **`execute-phase.md`:** Replaced the `code_review_gate` step (skipped 3 times) and the 5-step `post_execution_sequence` with a single `/scott:phase-closeout` invocation. Hook-enforced gate.
- **`rules/claude-behavior.md`:** Updated Project Management section to reference phase-closeout. Consolidated old MUST rules for log-error/log-success/retro into the unified skill.
- **REMOVED: `scott-log-error`, `scott-log-success`, `scott-retro`** as separate skills. Their functionality is now part of phase-closeout. Old workflow files retained in workflows/ for reference.
- **`setup.sh`:** Added phase-closeout deployment, removed old 3 skill deployments, added hook to verification list.
- **`settings.json`:** Registered guard-phase-completion.sh as PreToolUse hook on Bash.
- **`README.md`:** Updated command table and learning loop diagram.
- Triggered by: Bresco Pass 3 audit session. The old code_review_gate was skipped 3 times (errors #003, #005). Rules alone don't enforce. Hooks do.

## v2.13.0 - 2026-03-22
- **BMAD removal (all files):** Removed all BMAD references across toolkit. GSD + Superpowers is now the only PM methodology. BMAD-METHOD folder marked as archived.
- **GSD + Superpowers integration model:** Established clear division of labor. GSD = orchestration (plan, execute, verify). Superpowers = discipline (TDD, code review, worktrees, brainstorming). Added 7-step build loop to instructions, templates, and all workflows.
- **`scott-toolkit-instructions.md`:** Added "GSD + Superpowers Integration Model" section replacing the old PM Mode switching logic.
- **`rules/claude-behavior.md`:** Rewrote Project Management section. Added integration pattern explaining how Superpowers discipline applies during GSD execution.
- **`context/CLAUDE-MD-TEMPLATE.md`:** Expanded PM Mode from one-liner to structured explanation with build loop sequence.
- **`workflows/new-project.md` (v1.8):** Aligned Phase 7 to GSD+Superpowers build loop. Removed Superpowers-only execution pipeline references.
- **`workflows/new-feature.md` (v2.3):** Restructured Phase 4 as explicit "GSD + Superpowers Build Loop" with numbered handoff sequence.
- **`workflows/resume-project.md` (v2.2):** Added Superpowers discipline note to Phase 4.
- **`workflows/retro.md` (v1.2):** Phase 1 now reads GSD artifacts (.planning/STATE.md, ROADMAP.md, VERIFICATION.md files).
- **`skills/pause/SKILL.md`:** Now captures Superpowers state (active plans, worktrees) and GSD state (STATE.md) for resume.
- **`references/project-catalog.md`:** BMAD Method marked as archived.
- **`~/.claude/CLAUDE.md`:** Added "Proactive Toolkit Usage" section with "what comes next" flow map, proactive triggers, and build loop sequence.
- **Eleanor:** Deleted 42 BMAD command files. Updated .planning/, .claude-resume.md, and architecture refs to GSD + Superpowers.
- Triggered by: Scott's decision to standardize on GSD + Superpowers across all projects. Research revealed GSD and Superpowers were operating as parallel pipelines with no integration. This update unifies them.

## v2.12.0 - 2026-03-22
- **`rules/claude-behavior.md` (Verification):** Added mandatory second verification pass after code review fixes. "One pass is never enough for production code."
- **`rules/claude-behavior.md` (Verification):** Added "tests pass does NOT mean code is correct" rule. Tests verify mocks; schema compliance and race conditions require end-to-end walkthroughs.
- **`rules/claude-behavior.md` (Context Engineering):** Added "update lessons.md after EVERY phase" rule. Empty lessons.md at end of multi-phase build is a failure mode.
- **`~/.claude/get-shit-done/workflows/execute-phase.md` (code_review_gate):** NEW mandatory step between verify_phase_goal and update_roadmap. Dispatches superpowers:requesting-code-review with SurrealDB adherence prompt. Requires two-pass review (fix, then re-review) before phase can be marked complete.
- **Superpowers `code-reviewer.md` (SurrealDB Schema Audit):** NEW checklist section for field-by-field SCHEMAFULL table comparison. Catches silent field drops in SurrealDB v3.
- **Superpowers `code-reviewer.md` (End-to-End User Story):** NEW checklist section requiring 3-5 user journey walkthroughs checking for race conditions, cascade failures, and timezone bugs.
- **Retro:** `retros/2026-03-bresco-phases-1-6.md` and retro index updated.
- Triggered by: Bresco Phases 1-6 retrospective. Two-pass code review caught 21 Critical + Important issues that a single pass missed. SurrealDB SCHEMAFULL silent field drops were the #1 finding.

## v2.11.0 - 2026-03-14
- **`hooks/auto-format.sh` (NEW):** PostToolUse hook runs Prettier on Write/Edit for .js/.ts/.vue/.css/.json files. Checks for project Prettier config, uses local binary, notifies Claude when formatting changes occur.
- **`hooks/pre-completion-checklist.sh` (REWRITE):** Added resume file and lessons file checks. Stronger visual formatting with bordered box and item count. Still warns only.
- **`hooks/context-reminders.sh` (NEW):** PostToolUse hook tracks session duration and tool use count via /tmp state file. Warns at 60min (then every 30min) and 100 tool uses (then every 50). Replaces behavioral context rot self-monitoring.
- **`rules/claude-behavior.md`:** Simplified context rot rule to reference context-reminders hook instead of relying on self-monitoring.
- **`~/.claude/settings.json`:** Registered auto-format (PostToolUse Write|Edit) and context-reminders (PostToolUse all) hooks.
- Triggered by: Phase 2 of 6-phase harness upgrade plan (from `/scott:compare-sources` review)

## v2.10.0 - 2026-03-14
- **`rules/claude-behavior.md` (Subagents):** Added pattern referencing rule (point to existing code patterns instead of describing verbally)
- **`knowledge/active/context-protection.md`:** Added thinking token cap guidance (`MAX_THINKING_TOKENS=10000` for routine coding)
- **`knowledge/active/context-protection.md`:** Added JSON state tracking pattern (use JSON over Markdown for autonomous progress tracking)
- **`knowledge/active/context-protection.md`:** Added reasoning budget allocation table (high for planning/verification, standard for implementation)
- Triggered by: `/scott:compare-sources` review of Justin Young's "Effective Harnesses for Long-Running Agents" (Phase 1 of 6-phase harness upgrade plan)

## v2.9.0 - 2026-03-14
- **`workflows/new-feature.md` (v2.2):** Added clarifying questions follow-up step to Phase 1 (scope, edge cases, constraints, integration points)
- **`workflows/new-project.md` (v1.7):** Added follow-up questions step to Phase 1 Brain Dump (simplest version, technical unknowns, who touches code)
- **`rules/claude-behavior.md` (Subagents):** Added iterative retrieval rule (evaluate results, follow up if incomplete, max 3 cycles)
- **`rules/claude-behavior.md` (Subagents):** Added named agent roles with restricted tool sets (researcher, planner, reviewer, executor)
- **`rules/claude-behavior.md` (Planning):** Added checkpoint commit rule before significant refactors
- **`hooks/pre-completion-checklist.sh` (NEW):** Stop hook that structurally enforces verification (uncommitted changes, todo.md freshness). Warns but doesn't block.
- **`~/.claude/settings.json`:** Registered pre-completion-checklist hook on Stop event
- Triggered by: `/scott:compare-sources` review of Faran's "15 Battle-Tested Tips" (new source) against 14 existing sources

## v2.8.0 - 2026-03-13
- **10 context engineering improvements** across 3 chains (Context Protection, Task Execution, Learning & Maintenance)
- **Chain A — Context Protection Pipeline:**
  - `~/.zshrc`: Set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` for earlier compaction (3 sources recommend)
  - `hooks/offload-large-output.sh` (NEW): PostToolUse hook offloads tool results >4KB to `.claude/tool-output-overflow/`
  - `rules/claude-behavior.md`: Added post-compaction recovery rule (re-read resume, snapshot, task, offloaded files after any compaction)
  - `knowledge/active/context-protection.md` (NEW): Documents deferred loading (already native), caching, offloading, and skill example conventions
- **Chain B — Task Execution Lifecycle:**
  - `rules/claude-behavior.md`: Added task contract convention (define completion criteria upfront with immutable tests)
  - `rules/claude-behavior.md`: Added neutral prompting discipline (avoid sycophancy bias in investigations)
  - `rules/claude-behavior.md`: Upgraded doom-loop detection with fresh subagent recovery option
- **Chain C — Learning & Maintenance Cycle:**
  - `hooks/extract-instincts.sh` (NEW): PreCompact/Stop hook prompts instinct capture to `~/.claude/instinct-candidates.md`
  - `workflows/toolkit-spa-day.md` (NEW): Periodic consolidation workflow (audit, review candidates, scan contradictions, consolidate)
  - Skill `input_examples` convention documented in context-protection.md
- **`~/.claude/settings.json`:** Registered offload hook (PostToolUse) and instinct hook (PreCompact + Stop)
- **`/scott:tweet-to-source`:** Fixed tweet extraction — added fxtwitter/vxtwitter API as primary method, demoted WebSearch to fallback
- **Firecrawl CLI** installed globally (v1.10.0)
- Triggered by: `/scott:compare-sources` review of Lance Martin ("Give Claude a Computer") and sysls ("World-Class Agentic Engineer")

## v2.7.0 - 2026-03-13
- **`rules/claude-behavior.md`:** 5 additions from context engineering source comparison
  - Pre-completion verification checklist (4-item gate before declaring tasks done) -- from Trivedy's harness engineering research
  - Doom-loop detection rule (3+ edits to same file without progress = re-plan) -- from Bui/Trivedy
  - Subagent trigger threshold (3+ files for investigation = spawn subagent) -- from Divyansh
  - Context rot awareness (suggest /compact or fresh session after 1+ hours) -- from Trivedy/Xu/Bui
  - TDD exception for low-criticality UI changes (with Scott's approval) -- from YK Dojo
- Triggered by: `/scott:compare-sources` review of 4 new sources (Trivedy harness anatomy, Bui OPENDEV paper, Mishra Cowork practices, Divyansh subagent rule)

## v2.6.0 - 2026-03-11
- **`workflows/new-project.md` v1.6:** Add API key model access verification to Phase 1 Brain Dump
- **`skills/scott-surrealdb-patterns/SKILL.md`:** Add SurrealDB v3 Breaking Changes section (surrealkv://, no /rpc, ORDER BY in SELECT, type::record, StringRecordId pattern)
- **MEMORY.md:** Add LLM JSON fence-stripping as a standard integration pattern
- **First retro:** Eleanor M1 Foundation retrospective saved to `retros/2026-03-eleanor-m1.md` and retro index updated
- Triggered by: `/scott:retro` on Eleanor M1 Foundation milestone

## v2.5.0 - 2026-03-03
- **CLAUDE.md:** Add conversation history path (`~/.claude/projects/`) to Quick References
- Triggered by: `/scott:compare-sources` review of YK Dojo's 42 Claude Code tips — tip #14 identifies conversation history as a searchable knowledge base

## v2.4.0 - 2026-03-03
- **`/scott:compare-sources` v1.2** — redesigned workflow for streamlined pipeline
  - Phase 1: "Ingest & Refresh Raw Sources" — paste links, content, repos, or PDFs directly in session; Claude converts to `.md` and saves to `raw-sources/`. Then scans all sources for outdated content and updates in place
  - Phase 2: "Revise Sources" — cuts fluff, keeps only what's useful for Claude Code customization
  - New Phase 6: "Archive Processed Sources" — moves processed files to `completed/` subfolders
  - Folder renames: `research-sources/` → `raw-sources/`, `sources/` → `revised-sources/`, `reviews/` → `compared-sources/`
  - Moved `ce-synthesis.md` from `sources/` to root of `context-engineering/`
- **`/scott:tweet-to-source`** — updated 4 path references to use `raw-sources/` instead of `sources/`
- Triggered by: Scott wants a more autonomous pipeline — paste sources, run the command, get results

## v2.3.0 - 2026-03-03
- **New workflow: `/scott:compare-sources`** — compare context engineering sources against the current toolkit to surface congruencies, discrepancies, and unique ideas
  - 5-phase workflow: Collect Sources, Process Sources, Build Comparison Inventory, Run Comparison Analysis (subagent), Generate Review & Act
  - Uses manifest/index pattern for context window protection — subagent gets its own fresh window for the heavy comparison work
  - Review output feeds directly into `/scott:toolkit-update` via `_pending-updates.md`
- **Fix: `/scott:tweet-to-source`** — corrected 4 path references from `~/Sites/context-engineering/` to `~/Sites/Global/context-engineering/`
- **New directory:** `~/Sites/Global/context-engineering/reviews/` for review outputs and intermediate artifacts
- Triggered by: need to systematically compare collected sources against toolkit configuration

## v2.2.0 - 2026-03-03
- **toolkit-update v1.1:** Add Phase 5 — auto-update `scott-toolkit-instructions.md` and regenerate PDF after every toolkit change
- **New skill: `/scott:bypass`** — temporarily disable a guard hook, run the blocked action, re-enable
- Triggered by: instructions doc and PDF were getting stale after toolkit changes

## v2.1.0 - 2026-03-03
- Add "Global" as 4th work context for cross-cutting projects (toolkit, shared references, infrastructure)
- **new-project v1.4:** Global option in Phase 1 (Brain Dump) and Phase 5 (Create Repository)
- **PRD-TEMPLATE, CLAUDE-MD-TEMPLATE:** Updated project type options to include Global
- **project-catalog.md:** Changed "Tool" org label to "Global" for consistency
- **session-start.sh:** Detect and display project category (Global/Personal/Advosy/Bresco) at session start
- **scott-toolkit-instructions.md:** Fixed 6 stale path references to use ~/Sites/Global/
- Triggered by: Scott wants a 4th project context for cross-cutting projects

## v2.0.0 - 2026-03-03
Major restructure: context engineering update based on ce-synthesis.md findings.

### Architecture
- **Three-system ownership:** Toolkit owns context engineering, GSD owns project management, Superpowers owns dev methodology
- **Directory restructure:** templates/ -> context/, skills/workflows/ -> workflows/, skills/reference/ -> knowledge/active/ + knowledge/archive/
- **New hooks/ directory:** Top-level for session automation

### Workflows
- **debug:** REMOVED — replaced by `/gsd:debug` + `superpowers:systematic-debugging` + behavior rule for lesson capture
- **resume-project v2.0:** Slimmed to orchestrator — delegates GSD `.planning/` state recovery, keeps Scott-specific summary + direction
- **new-feature v2.0:** Slimmed to orchestrator — delegates build phase to `/gsd:plan-phase` + `/gsd:execute-phase` + Superpowers

### Knowledge
- **surrealdb.md:** Consolidated from surrealdb-v3.md + surrealql.md into single reference (~430 lines -> ~280 lines, no content lost)
- **Archived:** tauri-nuxt.md, rust-tauri-commands.md, error-handling.md, frontend-design.md (moved to knowledge/archive/)

### Hooks (NEW)
- **session-start.sh:** Discovers and lists project context files at session start
- **pre-compact.sh:** Saves .context-snapshot.md before context compaction
- **session-end.sh:** Reminds to update CLAUDE.md, todo.md, lessons.md at session close

### Rules
- **claude-behavior.md v2.0:** Restructured into 3-system sections (Development Methodology -> Superpowers, Project Management -> GSD, Context Engineering -> Toolkit)

### Infrastructure
- **setup.sh:** NEW — one-command deployment script with symlinks and --toolkit-path support
- **SETUP.md:** REMOVED (replaced by setup.sh)
- **FILE-STRUCTURE-TEMPLATE.md:** REMOVED (new-project Phase 5 generates from PRD)
- **mcp-config/:** REMOVED (machine-specific, not toolkit's concern)
- **_WORKFLOW-TEMPLATE.md, _SKILL-TEMPLATE.md:** REMOVED (meta-templates, toolkit-update handles creation)
- **references/ai-orchestration/:** Reorganized into subfolder with shorter names

## v1.2.0 - 2026-02-27
- **debug v1.2:** Require human verification of fix before resolution (Phase 4)
- **new-project v1.3:** Add post-build test coverage review with /gsd:add-tests (Phase 7)
- **new-feature v1.3:** Add post-build test coverage review with /gsd:add-tests (Phase 4)
- **handoff-to-gary v1.2:** Add test coverage assessment with /gsd:add-tests (Phase 1)
- **ai-orchestration-assessment:** Update GSD evidence to reflect v1.21.x capabilities
- Triggered by: GSD versions 1.21.0 and 1.21.1 release

## v1.1.0 - 2026-02-26
- Integrate Superpowers plugin (v4.3.1) across all workflows
- **new-project v1.2:** Git worktrees, TDD, subagent-driven development in Phase 7 (Build); two-stage code review and branch merging in Phase 8 (Milestone Review)
- **new-feature v1.2:** Git worktrees, TDD, subagent-driven development, code review, and branch merging in Phase 4 (Build)
- **handoff-to-gary v1.1:** Two-stage code review in Phase 1 (Code Review); test verification items in Phase 5 (Handoff Checklist)
- **debug v1.1:** TDD-first bug fixing in Phase 4 (Test & Fix); Superpowers skill authoring reference in Phase 5 (Capture Lesson)
- **claude-behavior.md:** New Testing, Code Review, and Git Workflow global rules

## v1.0.0 - 2026-02-25
- Initial toolkit creation
- Templates: PRD, CLAUDE.md, File Structure, Design Intent, Retro
- Workflow skills: new-project, new-feature, retro, debug, handoff-to-gary, toolkit-update, resume-project
- Reference skills: surrealdb-v3, surrealql, tauri-nuxt, nuxt-ui-v4, rust-tauri-commands, n8n-integration, error-handling, frontend-design
- References: stack-overview, advosy-context, bresco-context
- MCP config: servers reference, setup guide
