# Toolkit Changelog

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
