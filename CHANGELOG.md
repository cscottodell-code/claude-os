# Toolkit Changelog

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
