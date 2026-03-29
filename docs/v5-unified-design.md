# Scott-Toolkit v5.1: Unified Design Document

**Date:** 2026-03-23 (v5.0) | 2026-03-28 (v5.1 plugin awareness)
**Status:** Implemented. v5.0 delivered 2026-03-24, v5.1 delivered 2026-03-28.
**Supersedes:** `docs/toolkit-rewrite-design.md` (v4) and `docs/v4-file-audit.md`
**Purpose:** Single document covering the entire toolkit: what exists, what changes, what's added, and why.

**What v5 means:** The v4 design doc designed three new systems (stack enforcement, learning loop, decoupling) but treated the existing toolkit as a fixed base. A file audit of all 160 existing files revealed duplication, misplacement, and consolidation opportunities. v5 merges both efforts into one unified approach: rationalize the existing toolkit AND add the three new systems simultaneously. One implementation, one delivery.

**What v5.1 adds:** Plugin-project alignment detection. The `plugins` section in `config/interfaces.json` catalogs known plugins (Vercel ~52K tokens, Superpowers, Impeccable) with `required` flags. The session-start hook now checks bidirectionally: warns when an optional plugin is active on a project that doesn't use it (token waste) or disabled on a project that needs it (missing guidance). New projects generate per-project `.claude/settings.json` to disable irrelevant plugins at creation time.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals](#2-goals)
3. [Scott's Tech Stack](#3-scotts-tech-stack)
4. [Available Primitives](#4-available-primitives)
5. [Toolkit Architecture Overview](#5-toolkit-architecture-overview)
6. [Toolkit Rationalization](#6-toolkit-rationalization)
7. [Stack Enforcement](#7-stack-enforcement)
8. [Learning Loop](#8-learning-loop)
9. [Decoupling](#9-decoupling)
10. [BOPs Alignment](#10-bops-alignment)
11. [Complete File Manifest](#11-complete-file-manifest)
12. [Rationalized File Tree](#12-rationalized-file-tree)
13. [Implementation Order](#13-implementation-order)
14. [All Design Considerations](#14-all-design-considerations)
15. [Changelog](#15-changelog)

---

## 1. Problem Statement

The scott-toolkit has two problems, discovered at different times, that are best solved together.

### Problem A: No Stack Enforcement

The toolkit has **knowledge** (skills, MEMORY.md, Context7 IDs) but **no enforcement**. Claude can forget, skip, or misapply stack-specific rules. Code-reading reviews can't catch runtime bugs.

Evidence from Bresco (2026-03-23):
- 2 code-reading review passes missed 3 real bugs (missing `tenant_id`, missing `delivery_address`, wrong schema load order)
- A live SurrealDB audit caught all 3 in minutes
- The same reviews produced 5 false positives from misunderstanding SurrealQL syntax
- Lesson: SurrealDB v3 SCHEMAFULL tables now throw runtime errors for extra/undefined fields (unlike v2, which silently dropped them). But these errors only surface at runtime, not during code review. Missing required fields still produce no error at CREATE time if the field has no ASSERT. Only live DB testing catches schema mismatches before deployment.

**Important v3 context:** SurrealDB v3 changed several behaviors from v2. Extra fields on SCHEMAFULL tables now throw errors instead of being silently dropped. Querying non-existent tables now throws errors instead of returning empty arrays. `type::thing()` was renamed to `type::record()`. `<future>` types were removed in favor of COMPUTED fields. These are all breaking changes that static checks and live audits must cover.

This is not a SurrealDB-specific problem. Every technology in Scott's stack has version-specific gotchas that code-reading can't catch.

### Problem B: Toolkit Rot

A file audit of all 160 toolkit files revealed organic accumulation problems:

- **Three overlapping knowledge stores.** `knowledge/` was the first attempt at reference material, then `skills/` became the better pattern, then `references/` landed somewhere in between. Result: the same SurrealDB information lives in `knowledge/active/surrealdb.md`, `skills/scott-surrealdb/SKILL.md`, and `references/surrealdb-v3-reference.md`. Same pattern for n8n, context protection, and Advosy context.
- **Project-specific files in the toolkit.** Three Architecture Decision Records (ADR-001 through ADR-003) are Eleanor-specific, not toolkit-wide. `gsd-upstream-proposals.md` is 26 lines of stale feature requests.
- **Archived knowledge that nobody reads.** `knowledge/archive/` has 4 files totaling 1,678 lines that are superseded by skills, Context7, or project docs.
- **Root-level redundancy.** `about-me.md` duplicates `~/.claude/CLAUDE.md`. `conventions.md` duplicates `README.md`. `scott-toolkit-instructions.md` should be in `docs/`.
- **Inconsistent naming.** Error logs alternate between `error-001.md` and `008-eod-timezone-regression.md`.
- **Hardcoded external dependencies.** 13+ GSD/Superpowers commands are referenced by name across 7+ files. Any upstream rename breaks multiple toolkit files.

### Why Solve Both Together

Adding three new systems (checks/, tools/, config/) on top of a toolkit with 8+ redundant files and a dead directory makes the problem worse, not better. Rationalize first, build on a clean foundation.

---

## 2. Goals

| Priority | Goal | Description |
|----------|------|-------------|
| **B (highest)** | Stack enforcement | Every line of code validated against exact stack versions. Explicit, visible checkpoints. |
| **A** | Learning loop | Lessons from each project automatically improve the toolkit for all projects. |
| **C** | Decoupling | Toolkit survives GSD/Superpowers updates without rework. |
| **D** | Rationalization | Remove duplication, consolidate knowledge stores, fix placement. Smaller toolkit = better context efficiency. |
| **All** | Context protection | No agent window exceeds 250K tokens. |
| **All** | Quality over speed | Thoroughness matters more than artificial time limits. |

---

## 3. Scott's Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| Language | TypeScript | - |
| Runtime | Bun | latest |
| Backend API | Hono | latest |
| Frontend | Nuxt 4 + Nuxt UI v4 | 4.x |
| Styling | Tailwind CSS v4 | 4.x |
| State | Pinia | - |
| Validation | Zod | - |
| Database | SurrealDB v3 | v3, JS SDK surrealdb@2.0.1 |
| AI Orchestration | Vercel AI SDK | - |
| Background Jobs | Trigger.dev | - |
| Cache / Pub-Sub | Upstash (Redis + QStash) | - |
| SMS / Voice | Twilio | - |
| AI Receptionist | Vapi | - |
| E-Signatures | DocuSeal | - |
| SaaS Billing | Stripe | - |
| Package Manager | pnpm | - |
| Hosting | Hetzner + Coolify | - |

Not all projects use the full stack. The system must detect and enforce only what applies.

---

## 4. Available Primitives

| Primitive | Strength | Weakness | Best for |
|-----------|----------|----------|----------|
| **Hooks** (shell scripts) | Can't be skipped. Fire automatically. 24 lifecycle events available, 11 can block. | Can't do complex logic. No Claude context. | Gates, reminders, blocking actions |
| **Skills** (SKILL.md files) | Rich instructions. Claude follows them. | Opt-in. Can be forgotten. | Knowledge, step-by-step procedures |
| **Workflows** (workflow .md files) | Multi-phase orchestration. | Opt-in. Can be forgotten. | Multi-step processes with gates |
| **Subagents** | Isolated context (<250K each). Parallel execution. Fresh context avoids parent token spend. | Can't share state. Each needs full context. Parallel agents multiply token cost linearly. | Focused analysis, parallel checks |
| **CLI tools** (bash/node scripts) | Deterministic. Repeatable. No token cost. | No AI reasoning. | Static analysis, file detection, diffing |
| **MCP servers** (Context7, SurrealDB) | Live external data. Always current. | Network latency. Token cost. | Fresh docs, live DB testing |
| **Commands** (/gsd:*, /scott:*) | User-invocable entry points. | Depend on Claude following through. | Entry points that trigger the system |

**Tool resolution hierarchy:** CLI first, MCP if CLI can't do it, Context7 for doc lookups, Agent reasoning as last resort.

**Hook types available:** Command hooks (shell scripts, block via exit code 2), HTTP hooks (remote endpoints), Prompt hooks (single-turn Claude evaluation), Agent hooks (subagent verification with tool access). Hooks receive event-specific JSON data, not full Claude context, but can read the transcript file if needed.

---

## 5. Toolkit Architecture Overview

### Three-System Architecture (unchanged)

| System | Owns | Use for |
|--------|------|---------|
| **Scott-toolkit** | Context engineering | Session management, templates, domain knowledge, learning capture, **stack enforcement** |
| **GSD** | Project management | Phases, milestones, execution, task tracking, verification |
| **Superpowers** | Development methodology | TDD, git worktrees, code review, plan writing, debugging |

Toolkit workflows are **orchestrators**: they call GSD and Superpowers at the right moments. In v5, the toolkit also enforces stack compliance and feeds lessons back into itself.

### Knowledge Hierarchy (v5 rationalization)

v5 collapses three overlapping knowledge stores into two clean tiers:

| Tier | What | Where | When loaded |
|------|------|-------|-------------|
| **Quick-access** | Knowledge Claude needs when a skill is invoked | `skills/<name>/SKILL.md` | On skill invocation |
| **Deep reference** | Comprehensive docs too large for SKILL.md | `skills/<name>/references/*.md` or `references/*.md` | On demand, when SKILL.md directs |

**Eliminated:** The `knowledge/` directory. Its active files are absorbed into matching skills. Its archive files are deleted (superseded by skills, Context7, or project docs).

**Rule:** Every piece of reference material must live in exactly one place. If a skill exists for that topic, the reference lives under the skill. If no skill exists, it lives in `references/`. Never both.

### Directory Purposes (v5)

| Directory | Purpose | Loaded when |
|-----------|---------|-------------|
| `checks/` | **NEW.** Per-technology enforcement rules (static patterns, live checks, tool references) | During stack audits |
| `config/` | **NEW.** Decoupling config (abstract operation names to concrete commands) + plugin catalog | When resolving operations or checking plugin alignment |
| `context/` | Project templates (CLAUDE.md, PRD, Design Intent, Retro) | During project creation |
| `docs/` | Design documents and user guide | On demand |
| `errors/` | Logged errors from all projects (learning loop input) | During retros and stack-review |
| `hooks/` | Shell scripts triggered by Claude Code events | Automatically by harness |
| `references/` | Cross-project reference docs (infra, project catalog) | On demand |
| `retros/` | Milestone retrospectives | On demand |
| `rules/` | Persistent behavioral instructions (loaded every session) | Every session |
| `skills/` | Reusable prompt-driven workflows and domain knowledge | On skill invocation |
| `successes/` | Logged wins from all projects (learning loop input) | During retros and stack-review |
| `tools/` | **NEW.** CLI scripts for stack detection, checking, metrics | During audits and reviews |
| `workflows/` | Multi-step workflow definitions (skills wrap these) | On workflow invocation |

---

## 6. Toolkit Rationalization

This section covers every change to existing files. Organized by verdict: removals, consolidations, moves, modifications, and unchanged files.

### 6.1 Files Removed (12 files, ~2,700 lines eliminated)

| File | Lines | Why removed | Content destination |
|------|-------|-------------|-------------------|
| `about-me.md` | 19 | Duplicated by README.md + `~/.claude/CLAUDE.md` | None needed |
| `conventions.md` | 25 | Absorbed into README.md | README.md |
| `knowledge/active/surrealdb.md` | 290 | Duplicated by `skills/scott-surrealdb/SKILL.md` | skills/scott-surrealdb/ |
| `knowledge/active/n8n-integration.md` | 181 | Duplicated by `skills/scott-n8n-reference/` (24 files) | skills/scott-n8n-reference/ |
| `knowledge/active/nuxt-ui-v4.md` | 640 | Partially duplicated by Context7; patterns absorbed | skills/scott-uiux/references/ |
| `knowledge/active/context-protection.md` | 85 | Duplicated by `rules/claude-behavior.md` + hooks | rules/claude-behavior.md |
| `knowledge/archive/error-handling.md` | 304 | Archived. Superseded by general patterns. | None needed |
| `knowledge/archive/frontend-design.md` | 370 | Archived. Superseded by `skills/scott-uiux/` + Impeccable. | None needed |
| `knowledge/archive/rust-tauri-commands.md` | 414 | Archived. Context7 has current Tauri docs. Eleanor-specific. | None needed |
| `knowledge/archive/tauri-nuxt.md` | 590 | Archived. Eleanor-specific. | None needed |
| `references/advosy-context.md` | 150 | Duplicated by `skills/advosy-context/SKILL.md` | skills/advosy-context/ |
| `references/gsd-upstream-proposals.md` | 26 | Stale (26 lines). Decoupling makes upstream tracking less critical. | None needed |

**After removal:** The entire `knowledge/` directory is deleted. 12 files totaling ~3,094 lines eliminated. Unique content from 3 active files is absorbed into their matching skills before deletion.

### 6.2 Files Moved (3 files)

| File | From | To | Why |
|------|------|----|-----|
| `scott-toolkit-instructions.md` | root | `docs/user-guide.md` | User guide belongs in docs/, not root |
| `references/ADR-001-schema-bridge.md` | references/ | Eleanor repo `docs/` | Eleanor-specific, not toolkit-wide |
| `references/ADR-002-migrations.md` | references/ | Eleanor repo `docs/` | Eleanor-specific, not toolkit-wide |

### 6.3 Files Modified (significant changes)

#### rules/claude-behavior.md -- REWRITE

Current: 116 lines. 13 hardcoded GSD/Superpowers command references. No stack enforcement awareness.

Changes:
1. **Add Stack Validation section.** "Before execution, verify stack-lock.json exists. During execution, `stack-check.sh` runs after each step. At closeout, full stack audit runs."
2. **Decouple all command references.** Replace 13 hardcoded commands with abstract operation names that resolve via `config/interfaces.json`. Example: "Run the **plan_phase** operation" instead of "Run `/gsd:plan-phase`".
3. **Add Learning Loop reference.** "After phase closeout, Claude suggests `[stack]`/`[pattern]`/`[project]` tags for each lesson."
4. **Add CLAUDE.md soft budget note.** "Toolkit section of project CLAUDE.md should stay under ~20 lines."
5. **Add interfaces.json resolution rule.** "When a workflow references an operation name, resolve it by reading `config/interfaces.json` and using the command value."

Hardcoded commands being decoupled:

| Current hardcoded reference | Abstract operation name |
|---|---|
| `superpowers:test-driven-development` | tdd |
| `superpowers:requesting-code-review` | code_review |
| `superpowers:using-git-worktrees` | git_worktree |
| `superpowers:finishing-a-development-branch` | finish_branch |
| `superpowers:systematic-debugging` | debug_systematic |
| `superpowers:writing-plans` | write_plan |
| `/gsd:plan-phase` | plan_phase |
| `/gsd:execute-phase` | execute_phase |
| `/gsd:quick` | quick_task |
| `/gsd:debug` | debug_gsd |
| `/gsd:verify-work` | verify_work |
| `/gsd:add-tests` | add_tests |
| `/scott:phase-closeout` | phase_closeout |
| `/scott:resume` | resume |
| `/scott:debug` | debug |
| `/scott:new-feature` | new_feature |
| `/scott:new-project` | new_project |

#### workflows/phase-closeout.md -- REWRITE

Current: ~60 lines visible, ~120 total. 4 phases: Verify, Code Review, Reflect, Gate.

Changes:
1. **Insert Phase 1.5: Stack Audit** between Verify (Phase 1) and Code Review (Phase 2):
   - Run `stack-preflight.sh` to determine degradation tier
   - Run `stack-check.sh` on all files changed in this phase
   - For SurrealDB projects at Full tier: dispatch live audit agent (schema apply + seed + query in temp namespace)
   - For other technologies: dispatch doc compliance agents as needed (parallel per technology)
   - Write structured JSON results to `.planning/audits/audit_*.json`
   - PASS = continue to Phase 2. FAIL = fix before proceeding.
   - Degraded tiers: announce tier, run what's available, continue.
2. **Update Phase 3 (Reflect):** Add Claude-suggested lesson tagging. After each lesson is captured, Claude suggests `[stack]`/`[pattern]`/`[project]` tag. Scott approves, overrides, or skips. Untagged defaults to `[project]`.
3. **Decouple command references.** Replace `superpowers:requesting-code-review` with `code_review` operation.

#### workflows/new-project.md -- UPDATE

Changes:
- In Phase 5 (Create Repository): add "Generate `stack-lock.json` using `stack-detect.sh`. Auto-detect technologies from package.json, show Scott for approval."
- Decouple all command references to use abstract operation names.

#### workflows/new-feature.md -- UPDATE
- Decouple command references. No structural changes.

#### workflows/resume-project.md -- UPDATE
- In Phase 1 (Read Context): add stack-lock staleness check. If `last_reviewed` > 30 days, nudge.
- Decouple command references.

#### workflows/handoff-to-gary.md -- UPDATE
- Add "stack-lock.json is included in handoff artifacts" so Gary knows what's enforced.
- Decouple command references.

#### workflows/toolkit-update.md -- UPDATE
- Add awareness of v5 directories (checks/, tools/, config/).
- When updating check files, note that test fixtures should also be updated.

#### workflows/toolkit-spa-day.md -- EXTEND
- Add new phase: "Review Stack Check Health" that runs `/scott:stack-review` as part of spa day.
- Add "Review interfaces.json for stale mappings."

#### workflows/log-error.md, log-success.md, retro.md -- ADD SCOPE NOTE
- These are supplementary to phase-closeout.md. Add a note at top of each:
  - log-error.md: "For GSD phase errors, use /scott:phase-closeout. This is for mid-session, non-GSD error capture."
  - log-success.md: Same pattern.
  - retro.md: "phase-closeout captures phase-level retros. This is for milestone-level or project-level retros."

#### setup.sh -- EXTEND
- Deploy `checks/` directory (symlink entire dir to `~/.claude/checks/`)
- Deploy `tools/` scripts (symlink, ensure executable, to `~/.claude/tools/`)
- Deploy `config/interfaces.json` (symlink to `~/.claude/config/interfaces.json`)
- Add verification for new dirs in the health check section
- Update version banner to v5

#### hooks/guard-npm-install.sh -- EXTEND
- After confirming the install, compare newly installed packages against `stack-lock.json`.
- If a package conflicts with the locked stack (e.g., wrong SurrealDB SDK version), warn loudly.
- This is the drift detection mechanism.

#### hooks/session-start.sh -- MINOR UPDATE
- Add stack-lock staleness check. If project has stack-lock.json and `last_reviewed` > 30 days, show nudge: "Stack checks last reviewed 45 days ago."

#### README.md -- UPDATE
- Absorb content from conventions.md (folder structure table, toolkit rules).
- Add v5 sections: checks/, tools/, config/.
- Update architecture overview to show stack enforcement, learning loop, decoupling.
- Update version to v5.

#### rules/code-style.md -- MINOR UPDATE
- Add note: "Version-specific API compliance is enforced by stack checks (checks/*.json), not this file. This file handles coding patterns and conventions."

#### context/CLAUDE-MD-TEMPLATE.md -- UPDATE
- Add `report_mode` field (standard/explained) for failure report formatting.
- Add note about stack-lock.json.
- Keep toolkit section under ~20 line soft budget.

#### context/RETRO-TEMPLATE.md -- UPDATE
- Add `[stack]`/`[pattern]`/`[project]` tag column to the lessons table.

### 6.4 Files Unchanged

**Root:** CHANGELOG.md, start-n8n.sh, start-surreal.sh, scott-toolkit-instructions.pdf

**Hooks (12 unchanged):** auto-format.sh, context-reminders.sh, extract-instincts.sh, guard-claude-md.sh, guard-destructive.sh, guard-git-push.sh, guard-phase-completion.sh, offload-large-output.sh, post-commit-skill-triggers.sh, pre-compact.sh, pre-completion-checklist.sh, session-end.sh

**Workflows (1 unchanged):** compare-sources.md

**Context (2 unchanged):** PRD-TEMPLATE.md, DESIGN-INTENT-TEMPLATE.md

**References (4 unchanged):** ADR-003-infrastructure.md, bresco-context.md, hetzner-surrealdb-setup.md, project-catalog.md

**All errors/, successes/, retros/ files:** Unchanged (naming standardization is forward-only)

**All 24 existing skills:** Unchanged (3 get absorbed content from knowledge/ and references/, but the skills themselves don't structurally change)

**Docs:** toolkit-rewrite-design.md stays as design history

### 6.5 Naming Standardization (forward-only)

Error and success logs currently alternate between `error-001.md` and `008-eod-timezone-regression.md`. Going forward, all new logs use the descriptive format: `NNN-short-description.md`. No retroactive rename of existing files.

---

## 7. Stack Enforcement

### 7.1 Core Components

```
toolkit/checks/
  surrealdb.json          -- version, CLIs, MCP, Context7 ID, static patterns, live checks
  nuxt.json
  tailwind.json
  bun.json
  hono.json

toolkit/tools/
  stack-detect.sh          -- reads package.json/configs, outputs detected technologies
                           -- runs once at session start, caches result
                           -- re-runs only if package.json or config files change
  stack-check.sh           -- runs ALL static checks (grep patterns from check files)
  stack-preflight.sh       -- verifies CLIs, MCP, DB available, SDK versions, determines degradation tier
  stack-metrics.sh         -- aggregates audit artifacts into metrics.json (see Section 8.3)

Per project:
  stack-lock.json          -- which checks apply, at what version, approved exceptions

hooks/
  guard-phase-completion.sh  -- existing hook, unchanged. One gate for everything.

workflows/
  phase-closeout.md        -- updated: stack audit is Phase 1.5
```

### 7.2 Check Files (One Per Technology)

Each check file is the single source of truth for validating one technology. Contains everything: version info, tool references, static grep patterns, live checks, Context7 ID, and optional custom validation scripts for technologies without standard tooling.

```json
{
  "technology": "surrealdb",
  "golden_version": "v3",
  "sdk": "surrealdb@2.0.1",
  "dependencies": [],
  "tools": [
    { "type": "cli", "command": "surreal validate", "for": "schema validation" },
    { "type": "mcp", "server": "surrealdb", "for": "live queries" },
    { "type": "context7", "id": "/surrealdb/docs.surrealdb.com", "for": "doc reference" },
    { "type": "validation_script", "path": "toolkit/scripts/check-surreal-sdk.sh", "for": "SDK version verification" }
  ],
  "checks": {
    "static": [
      { "id": "surreal-no-type-thing", "pattern": "type::thing\\(", "message": "Use type::record() in v3", "severity": "error" },
      { "id": "surreal-no-future-type", "pattern": "<future>", "message": "<future> removed in v3. Use COMPUTED fields instead.", "severity": "error" },
      { "id": "surreal-no-type-is-colon", "pattern": "type::is::", "message": "type::is:: renamed to type::is_ in v3", "severity": "error" },
      { "id": "surreal-no-type-from-colon", "pattern": "type::from::", "message": "type::from:: renamed to type::from_ in v3", "severity": "error" },
      { "id": "surreal-no-db-create-bun", "pattern": "db\\.create\\(", "condition": "bun_project", "message": "Use db.query() in Bun projects", "severity": "error" }
    ],
    "live": [
      { "id": "surreal-schema-apply", "description": "Apply all schemas in dependency order to temp namespace" },
      { "id": "surreal-seed-and-query", "description": "Seed realistic data and test every db.query() pattern from codebase" }
    ]
  }
}
```

**Check file extensibility:** The format handles CLI tools, MCP servers, Context7 lookups, and custom validation scripts. The `validation_script` field covers edge cases like DocuSeal, Vapi, or Stripe where there's no CLI, MCP, or Context7 entry. The script can do anything: API health checks, version queries via HTTP, custom config file regex.

**Dependencies:** The optional `dependencies` field declares ordering. Example: the Nuxt check depends on the Tailwind check passing first.

Adding a new technology = add one check file. Modifying checks for one technology doesn't touch anything else.

**Relationship to skills:** Check files enforce rules. Skills provide knowledge. `checks/surrealdb.json` says "flag `type::thing()` as an error." `skills/scott-surrealdb/SKILL.md` explains why and how to migrate. These are complementary, not overlapping.

### 7.3 stack-lock.json (Per Project)

Generated during project creation. Auto-generated 90% from `stack-detect.sh` output, then Scott approves. Scott never fills in JSON by hand.

```json
{
  "_readme": "Locks the approved technology stack. Toolkit audits against these versions. Deviations require Scott's approval.",
  "schema_version": "1.0",
  "locked": "2026-03-23",
  "approved_by": "scott",
  "tier": "full",
  "technologies": {
    "surrealdb": { "version": "v3", "sdk": "surrealdb@2.0.1", "audit": true },
    "nuxt": { "version": "4", "audit": true },
    "nuxt-ui": { "version": "4", "audit": true },
    "tailwind": { "version": "4", "audit": true },
    "bun": { "version": "latest", "audit": true },
    "hono": { "version": "latest", "audit": true }
  },
  "services": {
    "hosting": "coolify-hetzner",
    "cache": "upstash"
  },
  "paths": {
    "schemas": "packages/db/schemas/",
    "api": "src/",
    "frontend": "app/"
  },
  "exceptions": [
    {
      "check_id": "surreal-no-db-create-bun",
      "file": "scripts/seed.ts",
      "reason": "Seed script runs once, not in production path",
      "accepted": "2026-03-23",
      "accepted_by": "scott"
    }
  ]
}
```

Two tiers:
- **Full projects** (Bresco, Eleanor) -- full stack-lock with approval flow
- **Experiments** (`~/Sites/Personal/*`) -- auto-generated from package.json, no approval needed. Can promote to full later.

**No simpler alternative exists.** You need a per-project record of what's approved. Reading package.json alone can't express exceptions, service-level config, or path mappings. The auto-generation from `stack-detect.sh` keeps the creation friction low.

### 7.4 Three Audit Touchpoints

#### Planning -- "Check Before You Build"

**When:** During plan creation, before any code is written.
**How:** The planning agent loads relevant check files into its context. No separate audit agent needed. The planning agent has the right knowledge to write a compliant plan.
**Depth:** Lightweight. Agent reads plan + check files + Context7 docs for relevant technologies. Context7 results are always post-filtered against locked version (see Section 7.11).
**Output:** PASS (plan is stack-compliant) or corrections before execution starts.
**Enforcement:** Plan can't be finalized with conflicts.

#### Executing -- "Check As You Build"

**When:** After each plan step completes (static checks). Live audit agents are batched.
**How:**
1. `stack-check.sh` runs static checks on changed files (CLI only, instant, zero tokens). Runs every step.
2. Smart dispatch: CLI checks what files changed, cross-references stack-lock.json, only flags technologies that were touched.
3. SurrealDB live audit agents are **batched every 3-5 SurrealDB-touching steps**, not dispatched per step. This prevents audit friction on phases with many DB changes. The closeout audit is the safety net for anything the batched checks miss.

**Depth:** Medium. Scoped to changed files, not whole codebase.
**Output:** PASS = continue. FAIL = fix before next step (static) or before next batch window (live).
**Enforcement:** Executor pauses on FAIL.

| Files changed | What runs |
|---|---|
| `*.surql`, `**/db/**`, files with `db.query` | CLI static every step + SurrealDB live agent batched every 3-5 steps |
| `*.vue`, `nuxt.config.ts` | CLI static + Nuxt doc comparison agent (if new components) |
| `*.css`, `tailwind.config.*` | CLI static only |
| `*.ts` in Bun project | CLI static only (Bun gotchas) |
| None of the above | Skip |

**Hard rule: Scoped check file loading.** Audit agents only load check files for technologies that appear in the dispatch table above. If only SurrealDB files changed, the agent gets `surrealdb.json`, not `nuxt.json` or `tailwind.json`. Every irrelevant check file loaded into agent context increases cost and reduces effectiveness. This is a correctness requirement, not an optimization.

#### Closeout -- "Final Gate Before Code Review"

**When:** Phase 1.5 of phase-closeout, before code review.
**How:**
1. Verify all execution steps logged a PASS
2. `stack-check.sh` on any post-step changes (fix commits, review changes)
3. SurrealDB live integration audit: full schema apply + seed + run every query pattern (the proven pattern from Bresco)
4. Write results to `.planning/` artifacts in structured JSON format (see Section 7.17)

**Depth:** Integration-level. Catches cross-file issues that per-step checks miss.
**Output:** Full PASS/FAIL report. Phase-closeout only continues if audit passes.
**Enforcement:** Existing `guard-phase-completion.sh` blocks phase completion. The audit is inside phase-closeout, so one gate enforces everything.

### 7.5 Agent Architecture

**Split by task type first (specialization), then by technology if needed (token budget):**

```
Level 1: Split by TASK TYPE
  -- Planning validator agent
  -- Static analysis (CLI, no agent needed)
  -- Live runtime audit agent
  -- Doc compliance agent

Level 2: Split by TECHNOLOGY (if a single task type exceeds 250K budget)
  -- SurrealDB live agent
  -- Nuxt doc compliance agent
  -- etc.

Level 3: Split by SCOPE (if a single technology exceeds budget)
  -- Almost never needed
```

**Agent prompt design:** Thin dispatchers, not knowledge containers. The prompt says "pull Context7 docs for SurrealDB, read stack-lock.json, verify all queries are compliant." Knowledge lives in Context7 and check files, not in the prompt. When Context7 updates, agents automatically use current docs without prompt changes.

**Agent timeout and failure handling:** Every audit agent has a timeout (configurable per check file, default 120 seconds). If an agent does not respond within the timeout, the system:
1. Logs the timeout as an incident
2. Degrades to the next tier for the remainder of this audit
3. Continues execution (does not block indefinitely)
4. Reports the degradation: `Audit agent timed out for SurrealDB live check. Degraded to Reduced mode. Closeout audit will retry.`

This prevents a crashed or hung agent from leaving the executor in an undefined state.

**Context window budget per agent:**

| Agent | Context sources | Estimated tokens |
|---|---|---|
| Planning audit | Plan text (~5K) + check files (~3K) + Context7 per tech (~30K each, 2-3 techs) | ~100K max |
| Execution step audit | Changed files (~10K) + one check file (~1K) + one tech's Context7 (~30K) | ~50K max |
| Closeout live audit | Phase diff (~20K) + Context7 (~30K) + check file (~1K) | ~60K max |

**Token cost note:** Parallel subagents multiply token cost linearly. Three agents in parallel use 3x the tokens. The design mitigates this by keeping agents thin and only dispatching when needed (smart dispatch based on changed files + batched live checks).

### 7.6 Three Audit Outcomes

| Outcome | Meaning | What happens |
|---------|---------|--------------|
| **PASS** | Code is compliant | Continue |
| **FAIL** | Code violates stack rules | Must fix before proceeding |
| **ACCEPT** | Scott reviewed, intentional deviation | Recorded in stack-lock.json exceptions. Future audits skip this check for this pattern. |

Without ACCEPT, Scott will bypass the whole audit to get past one intentional deviation.

### 7.7 Failure Report Format

Every FAIL includes:
- **What failed** -- the specific check
- **Why it's required** -- reference to schema definition or doc
- **Where to fix it** -- file path and line number
- **Suggested fix** -- corrected code (agent generates from Context7 context)

Two modes:
- **Standard** -- for Scott (concise, technical)
- **Explained** -- for Brett (plain English, step-by-step fix instructions, links failures to documentation). Detected from CLAUDE.md `report_mode: explained` field (primary) or git branch `brett/*` (fallback).

### 7.8 Degradation Tiers

System detects available resources at pre-flight and runs at the highest possible tier.

| Tier | What works | What's lost | Trigger |
|------|-----------|-------------|---------|
| **Full** | CLI + agents + MCP + Context7 | Nothing | All systems available |
| **Reduced** | CLI + single agent | Parallel dispatch, some Context7 | Context7 or MCP partially unavailable |
| **Minimal** | CLI static checks only | All agent-based checks | No MCP, no Context7 |
| **Bypass** | Nothing | All enforcement | Scott explicitly runs /scott:bypass with reason logged |

The system announces its tier: `Stack audit running in REDUCED mode (Context7 unavailable).`

**Dynamic degradation:** If an audit agent times out or crashes mid-run, the system degrades to the next tier for the remainder of that audit (not the whole session). See Section 7.5 for details.

### 7.9 Pre-Flight Checks

Before any audit runs:
1. Is SurrealDB running? (MCP connection test, if project uses it)
2. What server version? (Compare against stack-lock.json)
3. **What SDK version?** (Check `node_modules/surrealdb/package.json` against stack-lock.json. Server can match but SDK can be stale.)
4. Are required CLIs installed? (`which nuxi`, etc.)
5. Is Context7 reachable? **Not just a ping, but a test query.** Context7 might be reachable but rate-limited. A connectivity check returns 200 but subsequent calls fail.
6. Temp namespace is truly empty? (For SurrealDB live audit)

If any pre-flight fails, degrade to the appropriate tier with a clear message.

### 7.10 Parallel vs Sequential Execution

```
PLANNING:
  CLI: detect stack --> Agent: validate plan
  (Sequential. Agent needs CLI output.)

EXECUTING (per step):
  CLI: static checks --> IF needed: accumulate "dirty" technologies
  Every 3-5 SurrealDB-touching steps (or at natural breakpoint): one batched live agent
  (Sequential trigger for static. Batched for live. If multiple techs flagged at batch point, agents run in parallel.)

CLOSEOUT:
  1. Verify step results (instant, no agent)
  2. CLI: delta static check (instant)
  3. Agents for integration checks: parallel per technology
     |-- SurrealDB live agent (MCP: surrealdb)
     |-- Nuxt doc agent (MCP: Context7)
     |-- etc.
  4. Merge results
  (Fan-out/fan-in pattern.)
```

### 7.11 Version-Aware Doc Queries

Critical correctness issue: Context7 uses natural language matching for version queries, not structured API parameters. There is no `version=` parameter or guaranteed pinning mechanism.

**Default behavior (not fallback):** Every Context7 query follows three steps:
1. **Include locked version in the query text:** "SurrealDB v3 documentation for type::record()"
2. **Post-retrieval filtering:** Agent reviews returned docs and filters against the locked version in stack-lock.json
3. **Flag newer features:** If docs reference features newer than the locked version, the agent notes them as inapplicable

This three-step approach is the default path for all Context7 queries, not a fallback for when natural language matching fails.

### 7.12 Multi-Tenant Audit Isolation

For live DB audits: namespace naming uses `audit_${project}_${branch}_${timestamp}`. Cleanup always runs, even if the agent crashes mid-audit.

### 7.13 stack-lock.json Management

- **Version controlled** but doesn't trigger code review discussions
- **Created during project setup** (/scott:new-project or manually for existing projects). Auto-generated from `stack-detect.sh`, Scott just approves.
- **Updated when:** Scott approves a deviation, golden stack changes, or project upgrades
- **Drift detection:** `guard-npm-install.sh` (extended in v5) compares against stack-lock
- **Golden stack changes:** `/scott:resume` checks `last_reviewed` date on check files. If 30+ days stale, nudges: "Stack checks last reviewed 45 days ago."

### 7.14 Audit Scope Boundary

**Hard rule:** The stack audit checks **version-specific correctness only**. "Is this code valid for the exact versions in stack-lock.json?"

NOT in scope: security, performance, code style, test coverage. Those are the code review's job.

### 7.15 First-Run Baseline

`/scott:stack-baseline` (new skill) for existing projects:
1. Create stack-lock.json if it doesn't exist (auto-generated from `stack-detect.sh`)
2. Run full closeout-level audit against entire codebase (not just a phase diff)
3. Produce baseline report
4. Scott triages: fix now, fix later, or "intentional" (recorded as exception)

### 7.16 Audit Self-Testing

Test fixtures validate the audit system itself:
```
toolkit/checks/test-fixtures/
  surrealdb/good/    -- should all PASS
  surrealdb/bad/     -- should all FAIL with specific expected messages
  nuxt/good/
  nuxt/bad/
  degradation/       -- chaos test scenarios (see below)
```

**Trigger:** A `PostToolUse` hook (`check-file-test-trigger.sh`, new in v5) fires on check file edits and runs the test fixtures automatically. Also run manually via `/scott:audit-selftest`.

**Degradation stress tests:** Test fixtures that simulate degraded conditions to verify the 4 degradation tiers work as designed:

```
toolkit/checks/test-fixtures/degradation/
  context7-unavailable/    -- simulates Context7 down, expects Reduced tier
  mcp-timeout/             -- simulates MCP timeout, expects dynamic degradation
  surrealdb-down/          -- simulates DB unavailable, expects Minimal for DB checks
  all-external-down/       -- simulates everything down, expects Minimal tier
```

Each scenario defines the expected tier and verifies the system announces the degradation correctly.

### 7.17 Audit Artifact Format

Every audit run produces a structured JSON artifact for the learning loop:

```json
{
  "audit_id": "audit_bresco_main_20260323_143022",
  "timestamp": "2026-03-23T14:30:22Z",
  "project": "bresco",
  "phase": "closeout",
  "tier": "full",
  "duration_ms": 45000,
  "tokens_used": 52000,
  "checks": [
    {
      "check_id": "surreal-no-type-thing",
      "result": "PASS",
      "file": null,
      "line": null,
      "fix_applied": false,
      "false_positive": false,
      "fix_attempts": 0
    },
    {
      "check_id": "surreal-schema-apply",
      "result": "FAIL",
      "file": "packages/db/schemas/order.surql",
      "line": 12,
      "fix_applied": true,
      "false_positive": false,
      "fix_attempts": 2
    }
  ]
}
```

**Fields:**
- `audit_id`: Unique identifier following namespace pattern
- `project`, `phase`, `tier`: Context for the learning loop
- `duration_ms`, `tokens_used`: For cost tracking
- `checks` array: Each entry has `check_id`, `result` (PASS/FAIL/ACCEPT), `file`, `line`, `fix_applied` (boolean), `false_positive` (Scott can mark during review), `fix_attempts` (number of commits touching the same file after FAIL before check passed, 0 if PASS)

The `fix_attempts` field directly measures suggested fix quality. One attempt = good suggestion, the fix worked on the first try. Three attempts = bad suggestion, the developer had to iterate. Unlike wall-clock time (which includes breaks, context switches, and coffee runs), attempt count is a clean signal for "does this check's suggested fix actually work?"

### 7.18 Self-Pruning Checks

The learning loop (Section 8) tracks per-check metrics via `toolkit/checks/metrics.json`:
- `helpful_count` -- how often this check caught a real bug that was fixed
- `harmful_count` -- how often applying this check's fix caused a new problem
- `false_positive` rate -- how often this check fires on compliant code

Checks that consistently produce false positives or never catch anything get auto-flagged for removal during `/scott:stack-review`. Refinement of noisy checks is prioritized over adding new checks (boosting principle).

**Pruning thresholds (cost-based split):** Live checks (which consume agent tokens) are flagged for removal after 60 days of zero catches. Static checks (which are zero-cost CLI grep operations) are flagged after 90 days. The asymmetry is justified: keeping a free check longer costs nothing, while a useless live check burns tokens every audit.

### 7.19 Silent on PASS, Loud on FAIL

When everything passes: `Stack audit: 23 checks passed`
When something fails: prominent display with full fix instructions.

Don't train Scott to ignore output by making success verbose.

### 7.20 UI/UX Reminder Hook

**Scope:** This is NOT part of the stack audit system. It is a separate, lightweight hook that nudges the developer toward UI/UX quality checks.

**Trigger:** A `PostToolUse` hook (`uiux-reminder.sh`, new in v5) fires when `.vue` files are written (created or edited) during a GSD execution phase.

**Behavior:** Displays a one-line reminder: `Consider running /impeccable:audit before closeout.`

**Properties:**
- Non-blocking (exit code 0, never exit code 2)
- Fires at most once per phase (tracks state via a temp file to avoid repeating every `.vue` edit)
- Does not run outside of GSD execution phases
- Does not run the audit itself, only reminds

---

## 8. Learning Loop

**Problem:** Lessons from each project (Bresco's lessons.md, Eleanor's lessons.md) stay siloed. Knowledge doesn't flow back to the toolkit automatically.

**Prior art:** This design draws from ACE (Stanford/SambaNova, 2025) which uses Generator/Reflector/Curator roles with delta edits to a playbook, and Roblox's production pipeline that doubled AI code acceptance by clustering feedback from rejected PRs into reusable patterns. Key differences: we add a human-approval gate (ACE auto-evolves, which is dangerous for a learning coder), and we aggregate across multiple projects (most systems are single-project).

### 8.1 Data Sources

| Source | What it contains | Where it lives | Format | Version controlled? |
|--------|-----------------|----------------|--------|---------------------|
| Audit artifacts | Per-check PASS/FAIL/ACCEPT results with metadata | `.planning/audits/*.json` per project | Structured JSON (Section 7.17) | Yes (per project) |
| Project lessons | Lessons from debug sessions and phase closeouts | `tasks/lessons.md` per project | Tagged free text (see 8.2) | Yes (per project) |
| Check metrics | Aggregated cost/benefit per check over time | `toolkit/checks/metrics.json` | Structured JSON (see 8.3) | **No. Gitignored.** Regenerated from audit artifacts by `stack-metrics.sh`. |

**Why metrics.json is gitignored:** It is a computed cache, not source data. The audit artifacts are the source of truth. If metrics.json is lost or corrupted, run `/scott:rebuild-metrics` (alias for `stack-metrics.sh --full-rebuild`) to regenerate it from all audit artifacts across all projects.

### 8.2 Stage 1: Collect

Audit artifacts are already produced in structured JSON by every audit run (Section 7.17). No new collection needed.

For project lessons, the gap is that `tasks/lessons.md` is free text. The loop needs to identify which lessons are stack-relevant.

**Addition to phase-closeout reflection:** When lessons are captured, Claude suggests a tag for each lesson based on its content. This turns tagging from a recall task (hard when tired at end of phase) into a recognition task (easy).

Flow:
1. Scott writes or dictates the lesson during phase-closeout reflection
2. Claude reads the lesson and suggests a tag: "This mentions SurrealDB schema behavior. Suggest: `[stack]`"
3. Scott approves, overrides, or skips the tag
4. Untagged lessons default to `[project]`

Tags:
- `[stack]` -- version-specific gotcha that should become a check (e.g., "SurrealDB v3 SCHEMAFULL tables reject extra fields")
- `[pattern]` -- reusable code pattern (goes to skills/references, not checks)
- `[project]` -- project-specific context (stays in the project)

This is a lightweight addition to the existing reflection step. No new workflow. Claude's suggestion ensures stack-relevant lessons don't get lost because Scott forgot to tag them.

### 8.3 Stage 2: Aggregate

A new CLI tool, `stack-metrics.sh`, runs on demand via `/scott:stack-review`:

1. **Discovers project directories dynamically** by scanning `~/Sites/` subdirectories for any directory containing **both** `stack-lock.json` and `.planning/audits/` (meaning it has actually been through the audit system). No hardcoded paths. Ignores projects that have a stack-lock but no audit history.
2. Scans discovered projects for `.planning/audits/*.json`
3. Aggregates per-check statistics into `toolkit/checks/metrics.json`
4. Scans all `tasks/lessons.md` files for `[stack]`-tagged lessons without matching checks
5. Outputs a summary to stdout for the review step

```json
{
  "last_aggregated": "2026-03-23T14:30:00Z",
  "discovered_projects": [
    "~/Sites/Bresco/bresco-app",
    "~/Sites/Advosy/sales-tools",
    "~/Sites/Personal/eleanor"
  ],
  "overall_pass_rate": 0.94,
  "checks": {
    "surreal-no-type-thing": {
      "total_runs": 47,
      "pass": 44,
      "fail": 3,
      "accept": 0,
      "false_positives": 0,
      "fixes_applied": 3,
      "helpful_count": 3,
      "harmful_count": 0,
      "avg_fix_attempts": 1.3,
      "value_score": "high",
      "last_caught": "2026-03-20"
    }
  },
  "unmatched_lessons": [
    {
      "project": "bresco",
      "lesson": "SCHEMAFULL tables with missing ASSERT on required fields accept incomplete records",
      "date": "2026-03-23",
      "suggested_check_id": "surreal-missing-assert-required"
    }
  ]
}
```

**Value score computation:**
- `high` -- helpful_count >= 3, harmful_count == 0
- `proven` -- helpful_count >= 1, harmful_count == 0
- `untested` -- never caught anything (0 fails)
- `noisy` -- false_positive rate > 30%
- `harmful` -- harmful_count > 0 (fix caused new problems)

**Rebuild command:** `/scott:rebuild-metrics` runs `stack-metrics.sh --full-rebuild`, which deletes metrics.json and regenerates from all audit artifacts.

### 8.4 Stage 3: Review

`/scott:stack-review` (new skill) shows Scott a dashboard with five sections:

**1. System health** -- overall pass rate across all checks and all projects
- Displayed as a number (e.g., "Overall pass rate: 94%"). No automated thresholds yet. Scott develops intuition for what "normal" looks like over the first few months of data.

**2. New check candidates** -- `[stack]`-tagged lessons without matching checks
- Shows the lesson text, source project, date
- Suggests a check ID and pattern if derivable
- Scott approves (system generates the check entry) or skips

**3. Check health report** -- all checks ranked by value
- High-value checks (keep, possibly tighten)
- Noisy checks (refine pattern or remove)
- Untested checks (never caught anything past pruning threshold, removal candidate)
- Harmful checks (fix caused problems, immediate attention)
- Hard-fix checks (high avg_fix_attempts, suggested fix needs improvement)

**4. Refinement candidates** (prioritized over new additions)
- Checks with high false-positive rates
- Boosting principle: improving existing checks yields more value than adding new ones

**5. Overlap detection** -- manual review
- At Scott's scale (10-20 checks total), overlap is visible at a glance. The dashboard lists all checks grouped by technology. Scott can spot redundancy by reading the patterns side by side.
- No automated overlap algorithm for now. Add later if check count grows past 30+.

Scott approves or rejects each recommendation. **No automatic promotion.** The system recommends, Scott decides.

### 8.5 Stage 4: Propagate

When Scott approves a new check:
1. The check entry is added to the relevant technology's check file
2. It applies to ALL projects with that technology in their stack-lock.json
3. No per-project opt-in needed (that's the point of golden stack checks)
4. If a project needs to be exempt, they add an ACCEPT exception to their stack-lock.json

When a lesson becomes a check:
- The original lesson stays in `tasks/lessons.md` for context
- Gets annotated: `[promoted to check: surreal-missing-assert-required]`
- The annotation prevents the aggregator from flagging it as "unmatched" again

When Scott removes a check:
- The check entry is deleted from the check file
- All ACCEPT exceptions referencing that check ID are cleaned up from stack-lock.json files

### 8.6 Timing

- **Collection:** Automatic (audit artifacts written during every audit, lessons tagged with Claude-suggested tags during phase-closeout)
- **Aggregation + Review:** On demand via `/scott:stack-review`. Recommended cadence: monthly (aligned with toolkit-spa-day), or after completing a major project milestone.
- **No scheduled automation.** The loop runs when Scott decides to run it.

### 8.7 Cold Start

New toolkit installations have zero metrics data. The system works fine with empty metrics. Value scores default to `untested`. The first few `/scott:stack-review` runs will mostly show "untested" checks and any `[stack]`-tagged lessons. Data accumulates naturally over weeks of use.

---

## 9. Decoupling

**Problem:** The toolkit hardcodes GSD commands and Superpowers skills by name in workflows, skills, and rules. If those tools rename commands, change APIs, or get replaced entirely, every reference in the toolkit breaks. Currently ~17 distinct external command references are scattered across ~10 files (see table in Section 6.3).

### 9.1 Approach: Static Config File

A JSON mapping of abstract operations to concrete tool commands. When GSD renames a command, update one config line instead of hunting through 10 files.

```
toolkit/config/
  interfaces.json          -- maps abstract operations to concrete commands
```

```json
{
  "_readme": "Maps toolkit operations to external tool commands. Update here when GSD or Superpowers change.",
  "schema_version": "1.0",
  "operations": {
    "plan_phase": {
      "command": "/gsd:plan-phase",
      "provider": "gsd",
      "type": "command",
      "description": "Create a detailed phase plan"
    },
    "execute_phase": {
      "command": "/gsd:execute-phase",
      "provider": "gsd",
      "type": "command",
      "description": "Execute all plans in a phase"
    },
    "verify_work": {
      "command": "/gsd:verify-work",
      "provider": "gsd",
      "type": "command",
      "description": "Validate built features through UAT"
    },
    "quick_task": {
      "command": "/gsd:quick",
      "provider": "gsd",
      "type": "command",
      "description": "Execute a quick task with GSD guarantees"
    },
    "debug_gsd": {
      "command": "/gsd:debug",
      "provider": "gsd",
      "type": "command",
      "description": "GSD systematic debugging"
    },
    "add_tests": {
      "command": "/gsd:add-tests",
      "provider": "gsd",
      "type": "command",
      "description": "Generate tests for completed phase"
    },
    "code_review": {
      "command": "superpowers:requesting-code-review",
      "provider": "superpowers",
      "type": "skill",
      "description": "Run code review on completed work"
    },
    "tdd": {
      "command": "superpowers:test-driven-development",
      "provider": "superpowers",
      "type": "skill",
      "description": "Test-driven development workflow"
    },
    "git_worktree": {
      "command": "superpowers:using-git-worktrees",
      "provider": "superpowers",
      "type": "skill",
      "description": "Create isolated git worktree for feature work"
    },
    "finish_branch": {
      "command": "superpowers:finishing-a-development-branch",
      "provider": "superpowers",
      "type": "skill",
      "description": "Complete and merge a development branch"
    },
    "write_plan": {
      "command": "superpowers:writing-plans",
      "provider": "superpowers",
      "type": "skill",
      "description": "Write implementation plan before coding"
    },
    "debug_systematic": {
      "command": "superpowers:systematic-debugging",
      "provider": "superpowers",
      "type": "skill",
      "description": "Systematic debugging for non-Scott projects"
    },
    "debug": {
      "command": "/scott:debug",
      "provider": "toolkit",
      "type": "command",
      "description": "Systematic debugging with lesson capture"
    },
    "phase_closeout": {
      "command": "/scott:phase-closeout",
      "provider": "toolkit",
      "type": "command",
      "description": "Mandatory post-execution closeout"
    },
    "resume": {
      "command": "/scott:resume",
      "provider": "toolkit",
      "type": "command",
      "description": "Resume work on existing project"
    },
    "new_feature": {
      "command": "/scott:new-feature",
      "provider": "toolkit",
      "type": "command",
      "description": "Add feature to existing project"
    },
    "new_project": {
      "command": "/scott:new-project",
      "provider": "toolkit",
      "type": "command",
      "description": "Start a new project from scratch"
    }
  }
}
```

**The `type` field** tells the health check how to verify each operation:
- `"command"` -- check that the command is registered (e.g., `/gsd:plan-phase` is a known slash command)
- `"skill"` -- check that the skill .md file exists on disk

### 9.2 How Files Reference Operations

Toolkit files (workflows, skills, rules) reference abstract operation names, not concrete commands. A shell helper resolves them:

```bash
# In a hook:
COMMAND=$(toolkit-resolve plan_phase)
# Returns: "/gsd:plan-phase"
```

`toolkit-resolve` is a tiny shell function (in `tools/`) that reads `interfaces.json` and returns the command for a given operation name. If the operation isn't found, it returns an error: `"Unknown operation: plan_phase. Check config/interfaces.json"`

For skill/workflow .md files (which Claude reads, not executes), the skill references the abstract name, and Claude resolves it at runtime by reading `interfaces.json`:

```markdown
<!-- In a workflow .md file -->
After execution, run the **phase_closeout** operation.
```

**Resolution rule (added to rules/claude-behavior.md):** "When a workflow references an operation name (plan_phase, execute_phase, phase_closeout, etc.), resolve it by reading config/interfaces.json and using the command value for that operation."

**CLAUDE.md size discipline:** The toolkit's instructions in CLAUDE.md should be as short as possible. Knowledge belongs in check files, Context7, and skills, not in CLAUDE.md. If the toolkit section exceeds ~20 lines, review for consolidation during `/scott:stack-review`.

### 9.3 What Gets Decoupled

| Category | Operations | Provider |
|----------|-----------|----------|
| Project management | plan_phase, execute_phase, verify_work, quick_task, debug_gsd, add_tests, phase_closeout | GSD + Toolkit |
| Development methodology | tdd, code_review, git_worktree, finish_branch, write_plan, debug_systematic, debug | Superpowers + Toolkit |
| Workflow entry points | resume, new_feature, new_project | Toolkit |

**Not decoupled:** Internal toolkit operations (hooks calling other hooks, CLI tools). These are tightly coupled by design and change together.

### 9.4 Migration Path

1. Create `config/interfaces.json` with all current mappings
2. Add the interfaces.json resolution rule to `rules/claude-behavior.md`
3. Update toolkit files one at a time to use abstract references
4. Each file update is independently testable (does the resolved command still work?)
5. No big-bang migration. Files that haven't been updated yet still work with hardcoded references.

### 9.5 When a Provider Changes

**GSD renames a command** (e.g., `/gsd:plan-phase` becomes `/gsd:plan`):
1. Update one line in `interfaces.json`
2. All toolkit files that reference `plan_phase` automatically use the new command
3. No grep-and-replace across 10 files

**Superpowers replaces a skill:**
1. Update one line in `interfaces.json`
2. Done

**GSD gets replaced entirely:**
1. Update all `"provider": "gsd"` entries in `interfaces.json`
2. All toolkit workflows continue to work with the new tool

### 9.6 Provider Health Check

`stack-preflight.sh` (part of stack enforcement) is extended to verify that all commands in `interfaces.json` are resolvable. The `type` field tells it how:
- `"command"`: check the command is registered
- `"skill"`: check the skill file exists on disk

If a command is missing: warn (not block). The toolkit degrades gracefully.

### 9.7 Scope Boundary

The interface layer handles **command name mapping only**. It does NOT handle:
- Argument format changes (if GSD changes its CLI args, you still need to update the calling code)
- Behavioral changes (if a command's output format changes, consuming code needs updating)
- Version negotiation (no "use v1 of this command if available, v2 otherwise")

These are explicitly out of scope. The 80/20 here is that command renames are the most common breaking change, and this layer handles them completely.

---

## 10. BOPs Alignment

Full BOPs audit performed against all 10 frameworks from Sebastian Marshall's Background Operations methodology.

| BOPs Principle | How This Design Applies It | Verdict |
|---|---|---|
| EIB Protocol | Explicated the broken process (knowledge without enforcement), improved each step (static + live + closeout), then backgroundized via hooks + CLI | Full alignment |
| Value Stream Mapping | Removed 12 duplicated/stale files in rationalization. Smart dispatch routes checks only to changed technologies. Tool resolution hierarchy puts cheapest tools first. | Full alignment |
| Hard Rules > Soft Guidelines | Guard hooks block, they don't warn. Learning loop recommends, doesn't auto-promote. Audit scope is hard-bounded. Knowledge hierarchy rule (one place per reference) prevents future duplication. | Full alignment |
| Worst Week Rule | No manual steps required. Hooks fire automatically. Learning loop runs on demand, not on a schedule. Claude suggests tags so Scott doesn't have to remember. | Full alignment |
| Error Logging | Audit artifacts (Section 7.17) capture all failures in structured JSON for the learning loop. false_positive field = "log it = safe." | Full alignment |
| Never Skip Diagnosis | Pre-flight check diagnoses system state before running audit (6 checks including SDK version). File audit diagnosed toolkit rot before adding new systems. | Full alignment |
| Operational Entrainment | The system is drilled into every phase (planning, executing, closeout). Stress tests (Section 7.16) verify the system works under degraded conditions. Spa day includes stack-review. | Full alignment |
| Reduce Coupling | Interface layer (Section 9) isolates toolkit from external tool command names. Knowledge hierarchy eliminates cross-directory duplication. | Full alignment |
| Explore/Exploit Balance | Learning loop refines existing checks (exploit) before adding new ones (explore). Boosting principle. Rationalization eliminates waste before adding features. | Full alignment |
| Lights Spreadsheet | System health calibration: overall pass rate displayed in stack-review dashboard. No automated thresholds yet (data needed first). | Partial (data needed) |

---

## 11. Complete File Manifest

Every file in the v5 toolkit with its verdict. Organized by directory.

### Root Level

| File | Lines | Verdict | Notes |
|------|-------|---------|-------|
| CHANGELOG.md | ~200 | KEEP | Bump to v5 |
| README.md | 50 | MODIFY | Absorb conventions.md, add v5 architecture |
| setup.sh | 226 | MODIFY | Deploy checks/, tools/, config/ |
| start-n8n.sh | ~10 | KEEP | Utility script |
| start-surreal.sh | ~10 | KEEP | Utility script |
| scott-toolkit-instructions.pdf | - | KEEP | Regenerate after v5 |
| about-me.md | 19 | REMOVE | Duplicated |
| conventions.md | 25 | REMOVE | Absorbed into README |
| scott-toolkit-instructions.md | 80 | MOVE | To docs/user-guide.md |
| .claude-resume.md | - | EPHEMERAL | Gitignore |

### checks/ (NEW)

| File | Verdict | Notes |
|------|---------|-------|
| surrealdb.json | ADD | SurrealDB v3 check file |
| nuxt.json | ADD | Nuxt 4 check file |
| tailwind.json | ADD | Tailwind CSS v4 check file |
| bun.json | ADD | Bun runtime check file |
| hono.json | ADD | Hono API check file |
| metrics.json | ADD | GITIGNORED. Computed by stack-metrics.sh |
| test-fixtures/surrealdb/good/ | ADD | PASS test cases |
| test-fixtures/surrealdb/bad/ | ADD | FAIL test cases |
| test-fixtures/nuxt/good/ | ADD | PASS test cases |
| test-fixtures/nuxt/bad/ | ADD | FAIL test cases |
| test-fixtures/degradation/ | ADD | Chaos test scenarios |

### config/ (NEW)

| File | Verdict | Notes |
|------|---------|-------|
| interfaces.json | ADD | Abstract operation to concrete command mapping |

### context/

| File | Verdict | Notes |
|------|---------|-------|
| CLAUDE-MD-TEMPLATE.md | MODIFY | Add report_mode, stack-lock note |
| DESIGN-INTENT-TEMPLATE.md | KEEP | No changes |
| PRD-TEMPLATE.md | KEEP | No changes |
| RETRO-TEMPLATE.md | MODIFY | Add lesson tag columns |

### docs/

| File | Verdict | Notes |
|------|---------|-------|
| toolkit-rewrite-design.md | KEEP | Design history |
| v4-file-audit.md | KEEP | Audit history |
| v5-unified-design.md | ADD | This document |
| user-guide.md | ADD | Moved from root, updated for v5 |

### errors/

| File | Verdict | Notes |
|------|---------|-------|
| _metadata.json | KEEP | |
| error-001.md through 010-*.md | KEEP | Forward-only naming standardization |

### hooks/

| File | Verdict | Notes |
|------|---------|-------|
| auto-format.sh | KEEP | |
| check-file-test-trigger.sh | ADD | Auto-run test fixtures on check edits |
| context-reminders.sh | KEEP | |
| extract-instincts.sh | KEEP | |
| guard-claude-md.sh | KEEP | |
| guard-destructive.sh | KEEP | |
| guard-git-push.sh | KEEP | |
| guard-npm-install.sh | MODIFY | Stack-lock drift detection |
| guard-phase-completion.sh | KEEP | |
| offload-large-output.sh | KEEP | |
| post-commit-skill-triggers.sh | KEEP | |
| pre-compact.sh | KEEP | |
| pre-completion-checklist.sh | KEEP | |
| session-end.sh | KEEP | |
| session-start.sh | MODIFY | Stack-lock staleness check |
| uiux-reminder.sh | ADD | /impeccable:audit nudge for .vue |

### references/

| File | Verdict | Notes |
|------|---------|-------|
| ADR-001-schema-bridge.md | MOVE | To Eleanor repo |
| ADR-002-migrations.md | MOVE | To Eleanor repo |
| ADR-003-infrastructure.md | KEEP | Toolkit-wide |
| advosy-context.md | REMOVE | Absorbed into skill |
| bresco-context.md | KEEP | |
| gsd-upstream-proposals.md | REMOVE | Stale |
| hetzner-surrealdb-setup.md | KEEP | |
| project-catalog.md | KEEP | |
| surrealdb-v3-reference.md | MOVE | To skills/scott-surrealdb/references/ |

### retros/

| File | Verdict | Notes |
|------|---------|-------|
| _retro-index.md | KEEP | |
| 2026-03-bresco-phases-1-6.md | KEEP | |
| 2026-03-eleanor-m1.md | KEEP | |
| 2026-03-eleanor-m2.md | KEEP | |
| 2026-03-eleanor-m4-phase1.md | KEEP | |

### rules/

| File | Verdict | Notes |
|------|---------|-------|
| claude-behavior.md | REWRITE | Stack validation, decoupled refs, learning loop |
| code-style.md | MODIFY | Version compliance note |

### skills/ (24 existing + 3 new)

| Skill | Verdict | Notes |
|-------|---------|-------|
| advosy-claimsforce | KEEP | |
| advosy-context | KEEP | Absorbs references/advosy-context.md |
| advosy-crm | KEEP | |
| pause | KEEP | |
| scott-automation-guide | KEEP | |
| scott-bops | KEEP | |
| scott-bypass | KEEP | |
| scott-compare-sources | KEEP | |
| scott-debug | KEEP | Decouple command refs |
| scott-handoff | KEEP | |
| scott-human-nature | KEEP | |
| scott-mastery | KEEP | |
| scott-n8n-reference | KEEP | |
| scott-new-feature | KEEP | |
| scott-new-project | KEEP | |
| scott-phase-closeout | KEEP | |
| scott-power-laws | KEEP | |
| scott-presentation | KEEP | |
| scott-rebuild-metrics | ADD | Regenerate metrics.json |
| scott-resume | KEEP | |
| scott-save-tweet | KEEP | |
| scott-stack-baseline | ADD | First-run audit for existing projects |
| scott-stack-review | ADD | Check health dashboard |
| scott-surrealdb | KEEP | Absorbs surrealdb-v3-reference.md |
| scott-uiux | KEEP | Absorbs nuxt-ui-v4 patterns |
| scott-update-toolkit | KEEP | |
| scott-war-strategies | KEEP | |
| skill-creator | KEEP | |

### successes/

| File | Verdict | Notes |
|------|---------|-------|
| _metadata.json | KEEP | |
| success-*.md and 006-*.md, 007-*.md | KEEP | Forward-only naming |

### tools/ (NEW)

| File | Verdict | Notes |
|------|---------|-------|
| stack-check.sh | ADD | Run static checks from check files |
| stack-detect.sh | ADD | Detect technologies from package.json |
| stack-metrics.sh | ADD | Aggregate audit artifacts |
| stack-preflight.sh | ADD | Pre-flight system verification |
| toolkit-resolve | ADD | Shell helper for interfaces.json lookup |

### workflows/

| File | Verdict | Notes |
|------|---------|-------|
| compare-sources.md | KEEP | |
| handoff-to-gary.md | MODIFY | Stack-lock in handoff, decouple refs |
| log-error.md | MODIFY | Add scope note (supplementary) |
| log-success.md | MODIFY | Add scope note (supplementary) |
| new-feature.md | MODIFY | Decouple command refs |
| new-project.md | MODIFY | Stack-lock generation, decouple refs |
| phase-closeout.md | REWRITE | Phase 1.5 stack audit, lesson tagging |
| resume-project.md | MODIFY | Stack-lock staleness, decouple refs |
| retro.md | MODIFY | Add scope note (milestone-level) |
| toolkit-spa-day.md | MODIFY | Add stack-review + interfaces audit |
| toolkit-update.md | MODIFY | Awareness of v5 directories |

### knowledge/ (DELETED)

| File | Verdict | Destination |
|------|---------|-------------|
| active/surrealdb.md | ABSORB | skills/scott-surrealdb/ |
| active/n8n-integration.md | ABSORB | skills/scott-n8n-reference/ |
| active/nuxt-ui-v4.md | ABSORB | skills/scott-uiux/references/ |
| active/context-protection.md | ABSORB | rules/claude-behavior.md |
| archive/error-handling.md | DELETE | |
| archive/frontend-design.md | DELETE | |
| archive/rust-tauri-commands.md | DELETE | |
| archive/tauri-nuxt.md | DELETE | |

---

## 12. Rationalized File Tree

```
scott-toolkit/
├── CHANGELOG.md
├── README.md                             # (updated: absorbs conventions.md, v5 architecture)
├── setup.sh                              # (extended: deploys checks/, tools/, config/)
├── start-n8n.sh
├── start-surreal.sh
├── scott-toolkit-instructions.pdf
│
├── checks/                               # NEW — Stack enforcement check files
│   ├── surrealdb.json
│   ├── nuxt.json
│   ├── tailwind.json
│   ├── bun.json
│   ├── hono.json
│   └── test-fixtures/
│       ├── surrealdb/
│       │   ├── good/
│       │   └── bad/
│       ├── nuxt/
│       │   ├── good/
│       │   └── bad/
│       └── degradation/
│           ├── context7-unavailable/
│           ├── mcp-timeout/
│           ├── surrealdb-down/
│           └── all-external-down/
│
├── config/                               # NEW — Decoupling config
│   └── interfaces.json
│
├── context/                              # Project templates
│   ├── CLAUDE-MD-TEMPLATE.md             # (updated)
│   ├── DESIGN-INTENT-TEMPLATE.md
│   ├── PRD-TEMPLATE.md
│   └── RETRO-TEMPLATE.md                 # (updated)
│
├── docs/                                 # Design docs + user guide
│   ├── toolkit-rewrite-design.md         # Design history (v1-v4)
│   ├── v4-file-audit.md                  # Audit history
│   ├── v5-unified-design.md              # THIS DOCUMENT
│   └── user-guide.md                     # (moved from root)
│
├── errors/                               # Error logs (learning loop input)
│   ├── _metadata.json
│   └── *.md
│
├── hooks/                                # 14 existing + 2 new = 16
│   ├── auto-format.sh
│   ├── check-file-test-trigger.sh        # NEW
│   ├── context-reminders.sh
│   ├── extract-instincts.sh
│   ├── guard-claude-md.sh
│   ├── guard-destructive.sh
│   ├── guard-git-push.sh
│   ├── guard-npm-install.sh              # (extended)
│   ├── guard-phase-completion.sh
│   ├── offload-large-output.sh
│   ├── post-commit-skill-triggers.sh
│   ├── pre-compact.sh
│   ├── pre-completion-checklist.sh
│   ├── session-end.sh
│   ├── session-start.sh                  # (updated)
│   └── uiux-reminder.sh                  # NEW
│
├── references/                           # Cross-project reference docs
│   ├── ADR-003-infrastructure.md
│   ├── bresco-context.md
│   ├── hetzner-surrealdb-setup.md
│   └── project-catalog.md
│
├── retros/
│   ├── _retro-index.md
│   └── *.md
│
├── rules/                                # Loaded every session
│   ├── claude-behavior.md                # (rewritten)
│   └── code-style.md                     # (minor update)
│
├── skills/                               # 24 existing + 3 new = 27
│   ├── advosy-claimsforce/
│   ├── advosy-context/
│   ├── advosy-crm/
│   ├── pause/
│   ├── scott-automation-guide/
│   ├── scott-bops/
│   ├── scott-bypass/
│   ├── scott-compare-sources/
│   ├── scott-debug/
│   ├── scott-handoff/
│   ├── scott-human-nature/
│   ├── scott-mastery/
│   ├── scott-n8n-reference/
│   ├── scott-new-feature/
│   ├── scott-new-project/
│   ├── scott-phase-closeout/
│   ├── scott-power-laws/
│   ├── scott-presentation/
│   ├── scott-rebuild-metrics/            # NEW
│   ├── scott-resume/
│   ├── scott-save-tweet/
│   ├── scott-stack-baseline/             # NEW
│   ├── scott-stack-review/               # NEW
│   ├── scott-surrealdb/
│   │   └── references/
│   │       └── v3-reference.md           # (moved from references/)
│   ├── scott-uiux/
│   │   └── references/
│   │       └── nuxt-ui-v4-patterns.md    # (absorbed from knowledge/)
│   ├── scott-update-toolkit/
│   ├── scott-war-strategies/
│   └── skill-creator/
│
├── successes/
│   ├── _metadata.json
│   └── *.md
│
├── tools/                                # NEW — CLI tools
│   ├── stack-check.sh
│   ├── stack-detect.sh
│   ├── stack-metrics.sh
│   ├── stack-preflight.sh
│   └── toolkit-resolve
│
└── workflows/                            # 11 existing, 0 new
    ├── compare-sources.md
    ├── handoff-to-gary.md                # (updated)
    ├── log-error.md                      # (scope note added)
    ├── log-success.md                    # (scope note added)
    ├── new-feature.md                    # (updated)
    ├── new-project.md                    # (updated)
    ├── phase-closeout.md                 # (rewritten)
    ├── resume-project.md                 # (updated)
    ├── retro.md                          # (scope note added)
    ├── toolkit-spa-day.md                # (extended)
    └── toolkit-update.md                 # (updated)
```

**Deleted directories:** `knowledge/` (entire directory)
**Deleted files:** 12 total (~3,094 lines removed)
**Moved files:** 4 total (3 to other repos/dirs, 1 within toolkit)
**New files:** ~20 (checks, tools, config, hooks, skills, docs)
**Modified files:** ~15
**Unchanged files:** ~130

---

## 13. Implementation Order

Each step is independently useful. Steps within a group can be done in any order.

### Step 0: Rationalization (prerequisite, no new features)

| Task | What | Value |
|------|------|-------|
| 0a | Absorb knowledge/active/ content into matching skills | Eliminates duplication before adding new systems |
| 0b | Delete knowledge/archive/ (4 stale files) | Remove dead weight |
| 0c | Delete knowledge/ directory | Clean directory structure |
| 0d | Move ADR-001, ADR-002 to Eleanor repo | Remove project-specific files |
| 0e | Delete about-me.md, conventions.md, gsd-upstream-proposals.md | Remove duplicated/stale files |
| 0f | Move surrealdb-v3-reference.md to skills/scott-surrealdb/references/ | Correct placement |
| 0g | Absorb advosy-context.md into skills/advosy-context/ | Eliminate duplication |
| 0h | Absorb conventions.md content into README.md | Consolidate |
| 0i | Move scott-toolkit-instructions.md to docs/user-guide.md | Correct placement |
| 0j | Add scope notes to log-error.md, log-success.md, retro.md | Clarify purpose |
| 0k | Standardize error/success naming convention (forward-only, update _metadata.json) | Consistency |

**Done when:** `knowledge/` directory is gone. No file exists in two places. Every reference doc lives under its matching skill or in `references/` (not both).

### Step 1: Check files + stack-lock.json schema

| Task | What | Value |
|------|------|-------|
| 1a | Create `checks/surrealdb.json` | Claude can read these for context even without automation |
| 1b | Create remaining check files (nuxt, tailwind, bun, hono) | Full stack coverage |
| 1c | Define stack-lock.json JSON Schema | Validation baseline |

### Step 2: CLI tools

| Task | What | Value |
|------|------|-------|
| 2a | Build `tools/stack-detect.sh` | Standalone tech detection, zero tokens |
| 2b | Build `tools/stack-check.sh` | Standalone static analysis, zero tokens |
| 2c | Build `tools/stack-preflight.sh` | System readiness verification |

### Step 3: Closeout audit integration + test fixtures

| Task | What | Value |
|------|------|-------|
| 3a | Rewrite `workflows/phase-closeout.md` with Phase 1.5 | The gate that catches the most bugs |
| 3b | Create test fixtures (good/bad per technology) | Audit self-testing |
| 3c | Create degradation stress tests | Verify tiers work under failure |
| 3d | Create `hooks/check-file-test-trigger.sh` | Auto-test on check edits |

### Step 4: Guard hook integration

| Task | What | Value |
|------|------|-------|
| 4a | Extend `hooks/guard-npm-install.sh` for drift detection | Stack-lock enforcement on installs |
| 4b | Update `hooks/session-start.sh` for staleness check | Proactive nudge |
| 4c | Create `hooks/uiux-reminder.sh` | UI/UX quality nudge |
| 4d | Extend `setup.sh` to deploy checks/, tools/, config/ | Full deployment pipeline |

### Step 5: Planning + execution audit integration

| Task | What | Value |
|------|------|-------|
| 5a | Update `workflows/new-project.md` with stack-lock generation | Earlier catches |
| 5b | Update `workflows/resume-project.md` with staleness check | Awareness |
| 5c | Integrate static checks into GSD execution step cycle | Continuous enforcement |

### Step 6: Decoupling

| Task | What | Value |
|------|------|-------|
| 6a | Create `config/interfaces.json` | Central mapping |
| 6b | Build `tools/toolkit-resolve` | Shell helper |
| 6c | Rewrite `rules/claude-behavior.md` with abstract refs + stack validation + learning loop | Master ruleset updated |
| 6d | Update all workflow files to use abstract operation names | Full decoupling |
| 6e | Extend `stack-preflight.sh` for provider health check | Verify mappings work |

### Step 7: Learning loop

| Task | What | Value |
|------|------|-------|
| 7a | Build `tools/stack-metrics.sh` | Aggregation engine |
| 7b | Create `skills/scott-stack-review/SKILL.md` | Dashboard skill |
| 7c | Create `skills/scott-stack-baseline/SKILL.md` | First-run audit skill |
| 7d | Create `skills/scott-rebuild-metrics/SKILL.md` | Metrics rebuild skill |
| 7e | Update phase-closeout reflection with Claude-suggested tagging | Collection mechanism |

### Step 8: Documentation + polish

| Task | What | Value |
|------|------|-------|
| 8a | Update README.md for v5 | Current docs |
| 8b | Update docs/user-guide.md for v5 | User-facing docs |
| 8c | Update context/CLAUDE-MD-TEMPLATE.md | Template current |
| 8d | Update context/RETRO-TEMPLATE.md | Template current |
| 8e | Update workflows/toolkit-spa-day.md with stack-review | Monthly maintenance |
| 8f | Update workflows/toolkit-update.md with v5 awareness | Self-maintenance |
| 8g | Update workflows/handoff-to-gary.md with stack-lock | Handoff completeness |
| 8h | Update rules/code-style.md with version compliance note | Clarity |
| 8i | Update CHANGELOG.md | Version history |
| 8j | Regenerate scott-toolkit-instructions.pdf | Brett's reference |

**Recommended order:** Steps 6 and 7 are independent of each other. Consider shipping Step 6 before Step 7: decoupling protects against GSD/Superpowers renames that can happen at any time, while the learning loop needs months of accumulated data to show value.

---

## 14. All Design Considerations

### Architecture-Defining

| # | Consideration | Resolution |
|---|---|---|
| 1 | Agent prompts hardcode knowledge | Thin prompts. Knowledge in Context7 + check files. |
| 24 | Context windows will grow | Configurable `max_context_budget`. Split by task type first, then technology, then scope. |
| 25 | CLIs becoming better than MCPs | Tool resolution hierarchy: CLI first, MCP if CLI can't, Context7 for docs, agent reasoning last. |
| 26 | AI models will improve at code | Checks are discrete removable units in check files. Disabling = remove from file. |
| 27 | GSD/Superpowers may change | Interface layer decouples toolkit from specific commands. Static config file. |
| 30 | stack-lock.json needs a formal schema | JSON Schema with required/optional fields, valid values, schema version for migration. |
| 31 | No inventory of what checks exist | Check registry: each technology's check file lists all checks explicitly with IDs. |
| 37 | Manifest doing too much | Eliminated manifest. One check file per technology is the single source of truth. |

### Critical for Daily Use

| # | Consideration | Resolution |
|---|---|---|
| 2 | No failure fallbacks | Degradation tiers: Full, Reduced, Minimal, Bypass. Dynamic degradation on agent timeout. |
| 4 | Audit scope creep | Hard rule: version-specific correctness only. |
| 11 | No "accept" outcome | Three outcomes: PASS, FAIL, ACCEPT. Exceptions recorded in stack-lock. |
| 14 | Context7 returns wrong version docs | Three-step default: include version in query, post-retrieval filtering, flag newer features. |
| 15 | Local DB state could corrupt results | Pre-flight checks: server version, SDK version, empty namespace, connectivity. |
| 19 | Audit fatigue | Silent on PASS, loud on FAIL. Batched live checks during execution. |
| 29 | No system-wide degradation plan | Four degradation tiers with automatic detection + dynamic degradation on agent failure. |
| 33 | "One more thing" trap | Check cost/benefit tracking. Auto-flag low-value checks for removal. |

### Important, Addable Incrementally

| # | Consideration | Resolution |
|---|---|---|
| 3 | No incremental delivery path | 9-step delivery order (see Section 13). Step 0 is rationalization. |
| 7 | Non-code stack not covered | `services` section in stack-lock.json. |
| 8 | Multi-tenant audit isolation | Namespace: `audit_${project}_${branch}_${timestamp}`. Guaranteed cleanup. |
| 9 | stack-lock clutters PRs | Auto-committed, no review trigger. |
| 10 | Audit says WHAT not WHY | Every FAIL includes: what, why, where, suggested fix. |
| 12 | Brett can't interpret failures | Explained mode detected from CLAUDE.md `report_mode` field (primary) or git branch `brett/*` (fallback). |
| 13 | No performance budget | Targets defined. Audit reports own duration. Quality over speed. |
| 17 | Monorepo path ambiguity | `paths` section in stack-lock.json. |
| 20 | Golden stack gets stale | Staleness nudge in /scott:resume (30+ days). |
| 21 | New project friction | Two tiers: full projects (approval flow) vs experiments (auto-generated). |
| 22 | Stack drift across projects | `/scott:stack-review` dashboard: golden vs all projects at a glance. |
| 23 | Testing the audit system itself | Test fixtures: known-good and known-bad samples per technology. Auto-triggered on check file edits. Degradation stress tests. |
| 28 | Toolkit needs its own requirements | `toolkit-requirements.json` validated by setup.sh. |
| 32 | Scott's cognitive load | Self-contained reports. No memory required. |
| 34 | Brett's learning path | Explained mode links failures to documentation. |
| 35 | Onboarding new developers | Self-documenting stack-lock with _readme field. |
| 36 | CLI discovery and health | Pre-flight verifies every CLI in check files. |

### From Cowork Research (v1)

| # | Consideration | Resolution |
|---|---|---|
| 38 | Audit agent timeout/crash leaves executor stuck | Agent timeout (default 120s) with automatic degradation to next tier. Closeout retries. |
| 39 | Execution-step live audit friction | Batch SurrealDB live checks every 3-5 DB-touching steps. Closeout is the safety net. |
| 40 | Technologies without CLIs, MCP, or Context7 | `validation_script` field in check files. Custom script for API health checks, version queries, config regex. |
| 41 | SDK version can diverge from server version | Pre-flight checks installed SDK version against stack-lock.json. |

### From Learning Loop + Decoupling Design

| # | Consideration | Resolution |
|---|---|---|
| 44 | Lessons stay siloed in projects | Learning loop aggregates `[stack]`-tagged lessons across all projects via `stack-metrics.sh` |
| 45 | Auto-evolution without human review is dangerous | Human-approval gate on all promotions. System recommends, Scott decides. |
| 46 | Refining existing checks vs adding new ones | Boosting principle: prioritize refinement of noisy checks over adding new checks. |
| 47 | Toolkit hardcodes ~17 external command references across ~10 files | `interfaces.json` maps abstract operations to concrete commands. One-line updates. |

### From Cowork Research (v2)

| # | Consideration | Resolution |
|---|---|---|
| 48 | Lesson tagging depends on Scott remembering | Claude suggests tags based on lesson content during phase-closeout. Recognition > recall. |
| 49 | metrics.json has no defined lifecycle | Gitignored. Regenerated from audit artifacts. `/scott:rebuild-metrics` for full rebuild. |
| 50 | interfaces.json resolution is implicit for .md files | Resolution rule added to rules/claude-behavior.md. Explicit for every session. |

### From Claude Code Review + BOPs Audit

| # | Consideration | Resolution |
|---|---|---|
| 51 | time_to_fix_ms conflates system quality with human behavior | Replaced with `fix_attempts` (commit count). Clean signal for suggested fix quality. |
| 52 | Automated overlap detection is too coarse at current scale | Manual review for now (10-20 checks). Add algorithm when checks exceed 30+. |
| 53 | No system-level calibration of audit difficulty | Overall pass rate displayed in stack-review. No thresholds yet. |

### From v4 Review Session

| # | Consideration | Resolution |
|---|---|---|
| 54 | Audit agents load all check files regardless of relevance | Scoped check file loading: agents only load check files for technologies in the dispatch table. |
| 55 | CLAUDE.md size can grow unbounded | Soft budget: keep as short as possible. If exceeds ~20 lines, review during /scott:stack-review. |
| 56 | Pruning treats all checks equally regardless of cost | Split threshold: 60 days for live checks (token cost), 90 days for static checks (zero cost). |
| 57 | No nudge for UI/UX quality during Vue development | PostToolUse hook reminds /impeccable:audit when .vue files are written. Non-blocking. |

### From v5 File Audit (NEW)

| # | Consideration | Resolution |
|---|---|---|
| 58 | Three overlapping knowledge stores (knowledge/, skills/, references/) | Collapsed to two tiers: skills (quick-access) and references (deep, under skills or standalone). knowledge/ eliminated. |
| 59 | Project-specific files in toolkit-wide directories | ADR-001, ADR-002 moved to Eleanor repo. Rule: toolkit files must be cross-project or not exist here. |
| 60 | Archived knowledge without clear value | knowledge/archive/ deleted. If content is needed, it's re-derivable from Context7 or project docs. |
| 61 | Root-level file proliferation | about-me.md and conventions.md removed (absorbed). User guide moved to docs/. Root stays lean. |
| 62 | Supplementary workflows confused with primary workflows | log-error.md, log-success.md, retro.md get scope notes clarifying their relationship to phase-closeout.md. |
| 63 | Surrealdb-v3-reference.md placement (references/ vs skill) | Moved to skills/scott-surrealdb/references/. Rule: if a matching skill exists, the reference lives under it. |
| 64 | Knowledge hierarchy rule needed | Every reference lives in exactly one place. Rule enforced during toolkit-spa-day and toolkit-update. |
| 65 | Adding new systems on top of accumulated rot | Rationalization (Step 0) is a prerequisite. Clean foundation before new features. |

### Deferred to Future

| # | Consideration | Resolution |
|---|---|---|
| 5 | valid_from/valid_until on check entries | Add when multiple golden versions need simultaneous support. Currently one version per tech. |
| 6 | Token cost visibility | Report usage per audit run via audit artifacts. Build dashboard when needed. |
| 16 | Cross-technology failure attribution | Group related failures in result merger. Build when it burns us. |
| 18 | Audit versioning | `audit_version` field in artifacts. Build when learning loop needs it. |
| 42 | Evidence weighting for learning loop | Define weights after running the loop for a few months with real data. Rolling 90-day window as first step. |
| 43 | Disk space pre-flight check | If disk is full, everything breaks. Not audit-specific. |

---

## 15. Changelog

### v4 to v5

| Change | Section | Reason |
|---|---|---|
| Merged file audit into design doc | 6 | One document for the entire toolkit transformation, not two separate efforts |
| Added Problem B (toolkit rot) | 1 | File audit revealed organic accumulation problems that should be solved alongside new features |
| Added Goal D (rationalization) | 2 | Explicit goal for reducing duplication and fixing placement |
| Added Knowledge Hierarchy (two-tier rule) | 5 | Replaces the three-way overlap of knowledge/, skills/, references/ with a clear rule |
| Added Step 0 (rationalization) to implementation order | 13 | Clean foundation before new features. 11 tasks that remove 12 files and fix placement. |
| Added design considerations #58-65 | 14 | File audit findings formalized as design constraints |
| Expanded decoupling operations table | 9.1 | 17 operations (up from 12 in v4) reflecting full audit of hardcoded references |
| Updated file manifest format | 11 | Complete per-file verdicts organized by directory with line counts |
| Added rationalized file tree | 12 | Shows the toolkit as it SHOULD look after all changes |
| BOPs alignment updated | 10 | Value Stream Mapping now includes rationalization. Never Skip Diagnosis includes file audit. |
| Implementation order restructured | 13 | 9 steps (0-8) instead of 7 (1-7). Step 0 prerequisite. Step 8 documentation. |

### v1 through v4

See `docs/toolkit-rewrite-design.md` Section 12 for full history of the v1-v4 design iterations.
