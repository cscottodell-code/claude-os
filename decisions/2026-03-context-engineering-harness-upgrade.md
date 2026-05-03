# Toolkit Harness Upgrade Plan
Generated: 2026-03-14
Source: Context engineering review (16 sources, 25 toolkit files)
Approved by: Scott

## How to Use
- Work through phases in order using `/scott:toolkit-update` for each
- Check off items as completed
- Each phase is one session

---

## Phase 1: Rules & Knowledge Updates
*Low effort. Edit existing files only.*

- [x] **Iterative retrieval for subagents** — Edit rules/claude-behavior.md Subagents section. Add: "evaluate return, follow up if incomplete, max 3 cycles before returning what you have"
- [x] **Clarifying questions step** — Edit workflows/new-feature.md and workflows/new-project.md. Add step before implementation: "Ask 5 clarifying questions about requirements"
- [x] **Pattern referencing** — Edit rules/claude-behavior.md. Add rule: "Point to existing code patterns instead of describing verbally"
- [x] **Thinking token caps** — Edit knowledge/active/context-protection.md. Add guidance: `MAX_THINKING_TOKENS=10000` for routine coding sessions
- [x] **JSON state tracking pattern** — Edit knowledge/active/context-protection.md. Document: use JSON (not Markdown) for progress tracking in autonomous multi-session workflows
- [x] **Reasoning budget note** — Edit knowledge/active/context-protection.md. Add note: high reasoning for planning/verification, standard for implementation (API use only)

---

## Phase 2: New Hooks
*Medium effort. New hook files, plus one rewrite.*

- [x] **Auto-format on Write/Edit** — New hooks/auto-format.sh. PostToolUse hook runs Prettier after Write/Edit operations
- [x] **PreCompletionChecklist (structural)** — Rewrite hooks/pre-completion-checklist.sh. Strong warn with resume file + lessons checks.
- [x] **Context-aware reminders** — New hooks/context-reminders.sh. PostToolUse hook tracks duration + tool count. Warns at 60min and 100 tool uses.
- ~~**Shadow git snapshots**~~ — Dropped: checkpoint commits + pre-compact hook cover this
- ~~**Session cost tracking**~~ — Dropped: /cost built-in is sufficient

---

## Phase 3: Context Loading & Project Init
*Medium effort. New templates and shell aliases.*

- [ ] **Dynamic system prompt aliases** — Add to ~/.zshrc: `claude-dev`, `claude-review`, `claude-research` aliases that inject role-specific context
- [ ] **Portable .claude/ project kit** — New context/project-kit/ directory. Starter .claude/ with pre-configured rules/, hooks, CLAUDE.md template
- [ ] **Manifest files convention** — Edit knowledge/active/context-protection.md. Document _MANIFEST.md convention + create template
- [ ] **Environment init script** — Edit workflows/new-project.md. Add step: initializer creates executable init.sh for dev environment

Dependency: Project kit should bundle hooks from Phase 2.

---

## Phase 4: Workflow Upgrades
*Medium effort. Workflow modifications for fresh context and parallelism.*

- [ ] **Fresh context per workflow phase (Ralph loop)** — Edit workflows/compare-sources.md, workflows/new-project.md, workflows/new-feature.md. [DELEGATE] phases spawn fresh subagents
- [ ] **Two-instance project kickoff** — Edit workflows/new-project.md. Phases 2-3 spawn parallel scaffold + research agents
- [ ] **Checkpoint commands** — New skills: /checkpoint (saves state snapshot), /verify (runs full verification checklist)

Dependency: /verify should invoke PreCompletionChecklist hook from Phase 2.

---

## Phase 5: Knowledge Architecture
*High effort. Structural changes to knowledge storage.*

- [ ] **Skill graphs (wikilinks)** — Rewrite knowledge/active/surrealdb.md (12K lines), n8n-integration.md, nuxt-ui-v4.md into interconnected smaller files navigated via wikilinks (~30-50 files)
- [ ] **Dual-memory architecture** — Restructure ~/.claude/projects/-Users-scott/memory/. Separate episodic (facts, preferences) from working memory (bounded recent context)

Dependency: Manifest files (Phase 3) inform organization. Update project kit after.

---

## Phase 6: Advanced Capabilities
*High effort. New agent patterns for specialized scenarios.*

- [ ] **Adversarial 3-agent verification** — New skill or workflow. Bug-finder + disprover + referee. Use before Gary handoffs.
- [ ] **Trace analysis workflow** — New workflows/trace-analysis.md. Systematic review of agent traces to find failure patterns
- [ ] **MCP replacement with CLI skills** — Replace SurrealDB MCP, Playwright MCP with CLI-wrapped skills
- [ ] **Two-agent architecture (autonomous)** — New workflow for n8n-triggered multi-session builds

---

## Progress
| Phase | Status | Date Completed |
|-------|--------|---------------|
| 1 | Complete | 2026-03-14 |
| 2 | Complete | 2026-03-14 |
| 3 | Not started | |
| 4 | Not started | |
| 5 | Not started | |
| 6 | Not started | |
