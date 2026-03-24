# Scott-Toolkit Rewrite: Full Design Document

**Date:** 2026-03-23
**Revised:** 2026-03-23 (v3: Cowork v2 applied, Claude Code pushbacks applied, BOPs audit integrated)
**Status:** All three topics designed. Ready for implementation planning.
**Purpose:** Comprehensive design for implementation in Claude Code

**Changes from v2:** Claude-suggested lesson tagging during phase-closeout, interfaces.json resolution via CLAUDE.md rule, metrics.json is gitignored/regenerated, fix_attempts replaces time_to_fix_ms in audit artifacts, type field added to interfaces.json for health check routing, stack-metrics.sh discovers project directories dynamically (narrowed scan), overlap detection simplified to manual review, system health calibration signal added to stack-review, degradation stress tests added to Step 3 DoD. See Section 12 for full changelog.

---

## 1. Problem Statement

The scott-toolkit has **knowledge** (skills, MEMORY.md, Context7 IDs) but **no enforcement**. Claude can forget, skip, or misapply stack-specific rules. Code-reading reviews can't catch runtime bugs.

Evidence from Bresco (2026-03-23):
- 2 code-reading review passes missed 3 real bugs (missing `tenant_id`, missing `delivery_address`, wrong schema load order)
- A live SurrealDB audit caught all 3 in minutes
- The same reviews produced 5 false positives from misunderstanding SurrealQL syntax
- Lesson: SurrealDB v3 SCHEMAFULL tables now throw runtime errors for extra/undefined fields (unlike v2, which silently dropped them). But these errors only surface at runtime, not during code review. Missing required fields still produce no error at CREATE time if the field has no ASSERT. Only live DB testing catches schema mismatches before deployment.

**Important v3 context:** SurrealDB v3 changed several behaviors from v2. Extra fields on SCHEMAFULL tables now throw errors instead of being silently dropped. Querying non-existent tables now throws errors instead of returning empty arrays. `type::thing()` was renamed to `type::record()`. `<future>` types were removed in favor of COMPUTED fields. These are all breaking changes that static checks and live audits must cover.

This is not a SurrealDB-specific problem. Every technology in Scott's stack has version-specific gotchas that code-reading can't catch.

## 2. Goals

| Priority | Goal | Description |
|----------|------|-------------|
| **B (highest)** | Stack enforcement | Every line of code validated against exact stack versions. Explicit, visible checkpoints. |
| **A** | Learning loop | Lessons from each project automatically improve the toolkit for all projects. |
| **C** | Decoupling | Toolkit survives GSD/Superpowers updates without rework. |
| **All** | Context protection | No agent window exceeds 250K tokens. |
| **All** | Quality over speed | Thoroughness matters more than artificial time limits. |

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

## 5. Stack Enforcement Architecture

### 5.1 Core Components

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
  stack-metrics.sh         -- aggregates audit artifacts into metrics.json (see Section 6.3)

Per project:
  stack-lock.json          -- which checks apply, at what version, approved exceptions

hooks/
  guard-phase-completion.sh  -- existing hook, unchanged. One gate for everything.

workflows/
  phase-closeout.md        -- updated: stack audit is Phase 1.5
```

### 5.2 Check Files (One Per Technology)

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

### 5.3 stack-lock.json (Per Project)

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

### 5.4 Three Audit Touchpoints

#### Planning -- "Check Before You Build"

**When:** During plan creation, before any code is written.
**How:** The planning agent loads relevant check files into its context. No separate audit agent needed. The planning agent has the right knowledge to write a compliant plan.
**Depth:** Lightweight. Agent reads plan + check files + Context7 docs for relevant technologies. Context7 results are always post-filtered against locked version (see Section 5.11).
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

#### Closeout -- "Final Gate Before Code Review"

**When:** Phase 1.5 of phase-closeout, before code review.
**How:**
1. Verify all execution steps logged a PASS
2. `stack-check.sh` on any post-step changes (fix commits, review changes)
3. SurrealDB live integration audit: full schema apply + seed + run every query pattern (the proven pattern from Bresco)
4. Write results to `.planning/` artifacts in structured JSON format (see Section 5.20)

**Depth:** Integration-level. Catches cross-file issues that per-step checks miss.
**Output:** Full PASS/FAIL report. Phase-closeout only continues if audit passes.
**Enforcement:** Existing `guard-phase-completion.sh` blocks phase completion. The audit is inside phase-closeout, so one gate enforces everything.

### 5.5 Agent Architecture

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

### 5.6 Three Audit Outcomes

| Outcome | Meaning | What happens |
|---------|---------|--------------|
| **PASS** | Code is compliant | Continue |
| **FAIL** | Code violates stack rules | Must fix before proceeding |
| **ACCEPT** | Scott reviewed, intentional deviation | Recorded in stack-lock.json exceptions. Future audits skip this check for this pattern. |

Without ACCEPT, Scott will bypass the whole audit to get past one intentional deviation.

### 5.7 Failure Report Format

Every FAIL includes:
- **What failed** -- the specific check
- **Why it's required** -- reference to schema definition or doc
- **Where to fix it** -- file path and line number
- **Suggested fix** -- corrected code (agent generates from Context7 context)

Two modes:
- **Standard** -- for Scott (concise, technical)
- **Explained** -- for Brett (plain English, step-by-step fix instructions, links failures to documentation). Detected from CLAUDE.md `report_mode: explained` field (primary) or git branch `brett/*` (fallback).

### 5.8 Degradation Tiers

System detects available resources at pre-flight and runs at the highest possible tier. Four tiers is the right level of granularity. "Full or bypass" creates a cliff where either everything works perfectly or nothing runs. The Reduced and Minimal tiers provide a safety net for spotty connections, Context7 outages, or MCP flakiness.

| Tier | What works | What's lost | Trigger |
|------|-----------|-------------|---------|
| **Full** | CLI + agents + MCP + Context7 | Nothing | All systems available |
| **Reduced** | CLI + single agent | Parallel dispatch, some Context7 | Context7 or MCP partially unavailable |
| **Minimal** | CLI static checks only | All agent-based checks | No MCP, no Context7 |
| **Bypass** | Nothing | All enforcement | Scott explicitly runs /scott:bypass with reason logged |

The system announces its tier: `Stack audit running in REDUCED mode (Context7 unavailable).`

**Dynamic degradation:** If an audit agent times out or crashes mid-run, the system degrades to the next tier for the remainder of that audit (not the whole session). See Section 5.5 for details.

### 5.9 Pre-Flight Checks

Before any audit runs:
1. Is SurrealDB running? (MCP connection test, if project uses it)
2. What server version? (Compare against stack-lock.json)
3. **What SDK version?** (Check `node_modules/surrealdb/package.json` against stack-lock.json. Server can match but SDK can be stale.)
4. Are required CLIs installed? (`which nuxi`, etc.)
5. Is Context7 reachable? **Not just a ping, but a test query.** Context7 might be reachable but rate-limited. A connectivity check returns 200 but subsequent calls fail.
6. Temp namespace is truly empty? (For SurrealDB live audit)

If any pre-flight fails, degrade to the appropriate tier with a clear message.

### 5.10 Parallel vs Sequential Execution

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

### 5.11 Version-Aware Doc Queries

Critical correctness issue: Context7 uses natural language matching for version queries, not structured API parameters. There is no `version=` parameter or guaranteed pinning mechanism.

**Default behavior (not fallback):** Every Context7 query follows three steps:
1. **Include locked version in the query text:** "SurrealDB v3 documentation for type::record()"
2. **Post-retrieval filtering:** Agent reviews returned docs and filters against the locked version in stack-lock.json
3. **Flag newer features:** If docs reference features newer than the locked version, the agent notes them as inapplicable

This three-step approach is the default path for all Context7 queries, not a fallback for when natural language matching fails. Natural language matching alone is not reliable enough for version accuracy.

### 5.12 Multi-Tenant Audit Isolation

For live DB audits: namespace naming uses `audit_${project}_${branch}_${timestamp}`. Cleanup always runs, even if the agent crashes mid-audit.

### 5.13 stack-lock.json Management

- **Version controlled** but doesn't trigger code review discussions
- **Created during project setup** (/scott:new-project or manually for existing projects). Auto-generated from `stack-detect.sh`, Scott just approves.
- **Updated when:** Scott approves a deviation, golden stack changes, or project upgrades
- **Drift detection:** `guard-npm-install.sh` (already exists) extended to compare against stack-lock
- **Golden stack changes:** `/scott:resume` checks `last_reviewed` date on check files. If 30+ days stale, nudges: "Stack checks last reviewed 45 days ago."

### 5.14 Audit Scope Boundary

**Hard rule:** The stack audit checks **version-specific correctness only**. "Is this code valid for the exact versions in stack-lock.json?"

NOT in scope: security, performance, code style, test coverage. Those are the code review's job.

### 5.15 First-Run Baseline

`/scott:stack-baseline` for existing projects:
1. Create stack-lock.json if it doesn't exist (auto-generated from `stack-detect.sh`)
2. Run full closeout-level audit against entire codebase (not just a phase diff)
3. Produce baseline report
4. Scott triages: fix now, fix later, or "intentional" (recorded as exception)

### 5.16 Audit Self-Testing

Test fixtures validate the audit system itself:
```
toolkit/checks/test-fixtures/
  surrealdb/good/    -- should all PASS
  surrealdb/bad/     -- should all FAIL with specific expected messages
  nuxt/good/
  nuxt/bad/
  degradation/       -- chaos test scenarios (see Section 5.21)
```

**Trigger:** A `PostToolUse` hook on check file edits runs the test fixtures automatically. Also run manually via `/scott:audit-selftest`.

### 5.17 Self-Pruning Checks

The learning loop (Section 6) tracks per-check metrics via `toolkit/checks/metrics.json`:
- `helpful_count` -- how often this check caught a real bug that was fixed
- `harmful_count` -- how often applying this check's fix caused a new problem
- `false_positive` rate -- how often this check fires on compliant code

Checks that consistently produce false positives or never catch anything get auto-flagged for removal during `/scott:stack-review`. Refinement of noisy checks is prioritized over adding new checks (boosting principle: focus on what's almost working).

**Relationship to overlap detection (Section 6.4):** Self-pruning and overlap detection are two views of the same mechanism. Self-pruning evaluates individual check performance. Overlap detection compares pairs of checks for redundancy. Both feed into the `/scott:stack-review` dashboard.

### 5.18 Silent on PASS, Loud on FAIL

When everything passes: `Stack audit: 23 checks passed`
When something fails: prominent display with full fix instructions.

Don't train Scott to ignore output by making success verbose.

### 5.19 Onboarding Support

stack-lock.json is self-documenting via `_readme` field. A new developer (Gary, future hires) can read the lock file and understand what's enforced without Scott explaining it.

### 5.20 Audit Artifact Format

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
- `duration_ms`, `tokens_used`: For cost tracking (consideration #6)
- `checks` array: Each entry has `check_id`, `result` (PASS/FAIL/ACCEPT), `file`, `line`, `fix_applied` (boolean), `false_positive` (Scott can mark during review), `fix_attempts` (number of commits touching the same file after FAIL before check passed, 0 if PASS)

The `fix_attempts` field directly measures suggested fix quality. One attempt = good suggestion, the fix worked on the first try. Three attempts = bad suggestion, the developer had to iterate. Unlike wall-clock time (which includes breaks, context switches, and coffee runs), attempt count is a clean signal for "does this check's suggested fix actually work?"

This format lets the learning loop compute: checks that always pass (removal candidates), checks that catch real bugs (high value), checks with high false-positive rates (refinement candidates), and checks with poor suggested fixes (high avg_fix_attempts, improvement candidates).

### 5.21 Degradation Stress Tests

Test fixtures that simulate degraded conditions to verify the 4 degradation tiers work as designed:

```
toolkit/checks/test-fixtures/degradation/
  context7-unavailable/    -- simulates Context7 down, expects Reduced tier
  mcp-timeout/             -- simulates MCP timeout, expects dynamic degradation
  surrealdb-down/          -- simulates DB unavailable, expects Minimal for DB checks
  all-external-down/       -- simulates everything down, expects Minimal tier
```

Each scenario defines the expected tier and verifies the system announces the degradation correctly. Run via `/scott:audit-selftest --chaos` or as part of the standard test fixture suite.

**Rationale (from BOPs Operational Entrainment):** "Test under stress." The degradation tiers are a core safety feature. If they don't work when Context7 goes down or MCP times out, the whole graceful degradation design is theoretical. These tests make it concrete.

---

## 6. Learning Loop (Topic A)

**Problem:** Lessons from each project (Bresco's lessons.md, Eleanor's lessons.md) stay siloed. Knowledge doesn't flow back to the toolkit automatically.

**Prior art:** This design draws from ACE (Stanford/SambaNova, 2025) which uses Generator/Reflector/Curator roles with delta edits to a playbook, and Roblox's production pipeline that doubled AI code acceptance by clustering feedback from rejected PRs into reusable patterns. Key differences: we add a human-approval gate (ACE auto-evolves, which is dangerous for a learning coder), and we aggregate across multiple projects (most systems are single-project).

### 6.1 Data Sources

| Source | What it contains | Where it lives | Format | Version controlled? |
|--------|-----------------|----------------|--------|---------------------|
| Audit artifacts | Per-check PASS/FAIL/ACCEPT results with metadata | `.planning/audits/*.json` per project | Structured JSON (Section 5.20) | Yes (per project) |
| Project lessons | Lessons from debug sessions and phase closeouts | `tasks/lessons.md` per project | Tagged free text (see 6.2) | Yes (per project) |
| Check metrics | Aggregated cost/benefit per check over time | `toolkit/checks/metrics.json` | Structured JSON (see 6.3) | **No. Gitignored.** Regenerated from audit artifacts by `stack-metrics.sh`. |

**Why metrics.json is gitignored:** It is a computed cache, not source data. The audit artifacts are the source of truth. If metrics.json is lost or corrupted, run `/scott:rebuild-metrics` (alias for `stack-metrics.sh --full-rebuild`) to regenerate it from all audit artifacts across all projects.

### 6.2 Stage 1: Collect

Audit artifacts are already produced in structured JSON by every audit run (Section 5.20). No new collection needed.

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

### 6.3 Stage 2: Aggregate

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
    },
    "surreal-no-db-create-bun": {
      "total_runs": 47,
      "pass": 47,
      "fail": 0,
      "accept": 0,
      "false_positives": 0,
      "fixes_applied": 0,
      "helpful_count": 0,
      "harmful_count": 0,
      "avg_fix_attempts": null,
      "value_score": "untested",
      "last_caught": null
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

**Rebuild command:** `/scott:rebuild-metrics` runs `stack-metrics.sh --full-rebuild`, which deletes metrics.json and regenerates from all audit artifacts. Use when metrics.json is missing, corrupted, or you want a clean slate.

### 6.4 Stage 3: Review

`/scott:stack-review` shows Scott a dashboard with five sections:

**1. System health** -- overall pass rate across all checks and all projects
- Displayed as a number (e.g., "Overall pass rate: 94%"). No automated thresholds yet. Scott develops intuition for what "normal" looks like over the first few months of data. Thresholds can be added later once a baseline emerges.

**2. New check candidates** -- `[stack]`-tagged lessons without matching checks
- Shows the lesson text, source project, date
- Suggests a check ID and pattern if derivable
- Scott approves (system generates the check entry) or skips

**3. Check health report** -- all checks ranked by value
- High-value checks (keep, possibly tighten)
- Noisy checks (refine pattern or remove)
- Untested checks (never caught anything in 90+ days, removal candidate)
- Harmful checks (fix caused problems, immediate attention)
- High-attempt checks (high avg_fix_attempts, suggested fix needs improvement)

**4. Refinement candidates** (prioritized over new additions)
- Checks with high false-positive rates
- Boosting principle: improving existing checks yields more value than adding new ones

**5. Overlap detection** -- manual review
- At Scott's scale (10-20 checks total), overlap is visible at a glance. The dashboard lists all checks grouped by technology. Scott can spot redundancy by reading the patterns side by side.
- No automated overlap algorithm for now. File-level overlap (two checks matching the same files) is too coarse a signal, and line-level overlap is complex to implement. Add an algorithm later if the check count grows past 30+.

Scott approves or rejects each recommendation. **No automatic promotion.** The system recommends, Scott decides.

### 6.5 Stage 4: Propagate

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

### 6.6 Timing

- **Collection:** Automatic (audit artifacts written during every audit, lessons tagged with Claude-suggested tags during phase-closeout)
- **Aggregation + Review:** On demand via `/scott:stack-review`. Recommended cadence: monthly, or after completing a major project milestone.
- **No scheduled automation.** The loop runs when Scott decides to run it.

### 6.7 Cold Start

New toolkit installations have zero metrics data. The system works fine with empty metrics. Value scores default to `untested`. The first few `/scott:stack-review` runs will mostly show "untested" checks and any `[stack]`-tagged lessons. Data accumulates naturally over weeks of use.

## 7. Decoupling (Topic C)

**Problem:** The toolkit hardcodes GSD commands and Superpowers skills by name in workflows, skills, and rules. If those tools rename commands, change APIs, or get replaced entirely, every reference in the toolkit breaks. Currently ~15 distinct external command references are scattered across ~10 files.

### 7.1 Approach: Static Config File

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
- `"skill"` -- check that the skill .md file exists on disk (e.g., `superpowers:requesting-code-review` resolves to a file)

### 7.2 How Files Reference Operations

Toolkit files (workflows, skills, rules) reference abstract operation names, not concrete commands. A shell helper resolves them:

```bash
# In a workflow file or hook:
COMMAND=$(toolkit-resolve plan_phase)
# Returns: "/gsd:plan-phase"
```

`toolkit-resolve` is a tiny shell function that reads `interfaces.json` and returns the command for a given operation name. If the operation isn't found, it returns an error with a helpful message: `"Unknown operation: plan_phase. Check toolkit/config/interfaces.json"`

For skill/workflow .md files (which Claude reads, not executes), the pattern is different. The skill references the abstract name, and Claude resolves it at runtime by reading `interfaces.json`:

```markdown
<!-- In a workflow .md file -->
After execution, run the **phase_closeout** operation.
```

**Resolution rule (added to toolkit CLAUDE.md):** Claude's toolkit CLAUDE.md includes the instruction: "When a workflow references an operation name (plan_phase, execute_phase, phase_closeout, etc.), resolve it by reading toolkit/config/interfaces.json and using the command value for that operation." This ensures resolution is explicit for every session, not dependent on individual workflow files including the instruction.

### 7.3 What Gets Decoupled

| Category | Operations | Provider |
|----------|-----------|----------|
| Project management | plan_phase, execute_phase, verify_work, phase_closeout | GSD + Toolkit |
| Development methodology | tdd, code_review, git_worktree, finish_branch, debug | Superpowers + Toolkit |
| Workflow entry points | resume, new_feature, new_project | Toolkit |

**Not decoupled:** Internal toolkit operations (hooks calling other hooks, CLI tools). These are tightly coupled by design and change together.

### 7.4 Migration Path

1. Create `interfaces.json` with all current mappings
2. Add the interfaces.json resolution rule to toolkit CLAUDE.md
3. Update toolkit files one at a time to use abstract references
4. Each file update is independently testable (does the resolved command still work?)
5. No big-bang migration. Files that haven't been updated yet still work with hardcoded references.

### 7.5 When a Provider Changes

**GSD renames a command** (e.g., `/gsd:plan-phase` becomes `/gsd:plan`):
1. Update one line in `interfaces.json`
2. All toolkit files that reference `plan_phase` automatically use the new command
3. No grep-and-replace across 10 files

**Superpowers replaces a skill** (e.g., `superpowers:requesting-code-review` becomes `superpowers:code-review-v2`):
1. Update one line in `interfaces.json`
2. Done

**GSD gets replaced entirely** (e.g., by a different project management tool):
1. Update all `"provider": "gsd"` entries in `interfaces.json`
2. All toolkit workflows continue to work with the new tool
3. The abstract operation names (plan_phase, execute_phase) stay the same

### 7.6 Provider Health Check

`stack-preflight.sh` (already exists for stack enforcement) is extended to verify that all commands in `interfaces.json` are resolvable. The `type` field on each operation tells the health check how to verify:
- `"command"`: check the command is registered
- `"skill"`: check the skill file exists on disk

If a command is missing: warn (not block). The toolkit degrades gracefully.

### 7.7 Scope Boundary

The interface layer handles **command name mapping only**. It does NOT handle:
- Argument format changes (if GSD changes its CLI args, you still need to update the calling code)
- Behavioral changes (if a command's output format changes, consuming code needs updating)
- Version negotiation (no "use v1 of this command if available, v2 otherwise")

These are explicitly out of scope. The 80/20 here is that command renames are the most common breaking change, and this layer handles them completely. Argument and behavior changes are rare and require manual attention regardless.

---

## 8. BOPs Alignment

| BOPs Principle | How This Design Applies It |
|---|---|
| EIB Protocol | Explicated the broken process, improved each step, then backgroundized via hooks + CLI |
| Value Stream Mapping | Removed 5 duplications in simplification pass |
| Hard Rules > Soft Guidelines | Guard hooks block, they don't warn. Learning loop recommends, doesn't auto-promote. |
| Worst Week Rule | No manual steps required. Hooks fire automatically. Learning loop runs on demand, not on a schedule. Claude suggests tags so Scott doesn't have to remember. |
| Error Logging | Audit artifacts (Section 5.20) capture all failures in structured JSON for the learning loop |
| Never Skip Diagnosis | Pre-flight check diagnoses system state before running audit (6 checks including SDK version) |
| Operational Entrainment | The system is drilled into every phase (planning, executing, closeout). Stress tests (Section 5.21) verify the system works under degraded conditions. |
| Reduce Coupling | Interface layer (Section 7) isolates toolkit from external tool command names |
| Explore/Exploit Balance | Learning loop refines existing checks (exploit) before adding new ones (explore). Boosting principle. |
| Lights Spreadsheet | System health calibration: overall pass rate displayed in stack-review dashboard (Section 6.4). No automated thresholds yet. |

---

## 9. All 53 Design Considerations

### Architecture-Defining

| # | Consideration | Resolution |
|---|---|---|
| 1 | Agent prompts hardcode knowledge | Thin prompts. Knowledge in Context7 + check files. |
| 24 | Context windows will grow | Configurable `max_context_budget`. Split by task type first, then technology, then scope. |
| 25 | CLIs becoming better than MCPs | Tool resolution hierarchy: CLI first, MCP if CLI can't, Context7 for docs, agent reasoning last. Check files have ordered tool list per tech. |
| 26 | AI models will improve at code | Checks are discrete removable units in check files. Disabling = remove from file. |
| 27 | GSD/Superpowers may change | Interface layer decouples toolkit from specific commands. Static config file. |
| 30 | stack-lock.json needs a formal schema | JSON Schema with required/optional fields, valid values, schema version for migration. |
| 31 | No inventory of what checks exist | Check registry: each technology's check file lists all checks explicitly with IDs. CLI runs static checks from registry. Agents run live checks from registry. |
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
| 3 | No incremental delivery path | 7-step delivery order (see Section 10). |
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
| 23 | Testing the audit system itself | Test fixtures: known-good and known-bad samples per technology. Auto-triggered on check file edits. Degradation stress tests (Section 5.21). |
| 28 | Toolkit needs its own requirements | `toolkit-requirements.json` validated by setup.sh. |
| 32 | Scott's cognitive load | Self-contained reports. No memory required. |
| 34 | Brett's learning path | Explained mode links failures to documentation. |
| 35 | Onboarding new developers | Self-documenting stack-lock with _readme field. |
| 36 | CLI discovery and health | Pre-flight verifies every CLI in check files. |

### Added from Cowork Research (v1)

| # | Consideration | Resolution |
|---|---|---|
| 38 | Audit agent timeout/crash leaves executor stuck | Agent timeout (default 120s) with automatic degradation to next tier. Closeout retries. |
| 39 | Execution-step live audit friction | Batch SurrealDB live checks every 3-5 DB-touching steps. Closeout is the safety net. |
| 40 | Technologies without CLIs, MCP, or Context7 | `validation_script` field in check files. Custom bash/node script for API health checks, version queries, config regex. Web search fallback for doc reference. |
| 41 | SDK version can diverge from server version | Pre-flight checks installed SDK version against stack-lock.json. |

### Added from Learning Loop + Decoupling Design

| # | Consideration | Resolution |
|---|---|---|
| 44 | Lessons stay siloed in projects | Learning loop aggregates `[stack]`-tagged lessons across all projects via `stack-metrics.sh` (Section 6.2-6.3) |
| 45 | Auto-evolution without human review is dangerous | Human-approval gate on all promotions. System recommends, Scott decides. (Section 6.4) |
| 46 | Refining existing checks vs adding new ones | Boosting principle: prioritize refinement of noisy checks over adding new checks (Section 6.4) |
| 47 | Toolkit hardcodes ~15 external command references across ~10 files | `interfaces.json` maps abstract operations to concrete commands. One-line updates. (Section 7) |

### Added from Cowork Research (v2)

| # | Consideration | Resolution |
|---|---|---|
| 48 | Lesson tagging depends on Scott remembering | Claude suggests tags based on lesson content during phase-closeout. Recognition > recall. (Section 6.2) |
| 49 | metrics.json has no defined lifecycle | Gitignored. Regenerated from audit artifacts. `/scott:rebuild-metrics` for full rebuild. (Section 6.1, 6.3) |
| 50 | interfaces.json resolution is implicit for .md files | Resolution rule added to toolkit CLAUDE.md. Explicit for every session. (Section 7.2) |

### Added from Claude Code Review + BOPs Audit

| # | Consideration | Resolution |
|---|---|---|
| 51 | time_to_fix_ms conflates system quality with human behavior | Replaced with `fix_attempts` (commit count). Clean signal for suggested fix quality. (Section 5.20) |
| 52 | Automated overlap detection is too coarse at current scale | Manual review for now (10-20 checks). Add algorithm when checks exceed 30+. (Section 6.4) |
| 53 | No system-level calibration of audit difficulty | Overall pass rate displayed in stack-review. No thresholds yet. (Section 6.4, BOPs Lights Spreadsheet) |

### Deferred to Future

| # | Consideration | Resolution |
|---|---|---|
| 5 | valid_from/valid_until on check entries | Add when multiple golden versions need simultaneous support. Currently one version per tech. |
| 6 | Token cost visibility | Report usage per audit run via audit artifacts. Build dashboard when needed. |
| 16 | Cross-technology failure attribution | Group related failures in result merger. Build when it burns us. |
| 18 | Audit versioning | `audit_version` field in artifacts. Build when learning loop needs it. |
| 42 | Evidence weighting for learning loop | Define weights after running the loop for a few months with real data. Rolling 90-day window is a natural first step. |
| 43 | Disk space pre-flight check | If disk is full, everything breaks. Not audit-specific. |

---

## 10. Incremental Delivery Order

Each step is independently useful:

| Step | What | Value alone |
|------|------|------------|
| 1 | Check files (surrealdb.json, nuxt.json, etc.) + stack-lock.json schema | Claude can read these for context even without automation |
| 2 | CLI tools (stack-detect.sh, stack-check.sh, stack-preflight.sh) | Standalone static analysis, zero tokens |
| 3 | Closeout audit in phase-closeout.md + live SurrealDB agent + degradation stress tests | The gate that catches the most bugs (proven pattern). Stress tests verify tiers work. |
| 4 | Guard hook integration (audit inside existing phase-closeout gate) | Enforcement. Can't skip. |
| 5 | Planning + execution audit integration | Earlier catches, incremental improvement |
| 6 | Learning loop (metrics.json + stack-review + lesson tagging) | Self-improving system |
| 7 | Decoupling (interfaces.json + toolkit-resolve + migration) | Toolkit survives GSD/Superpowers changes |

Steps 6 and 7 are independent of each other and can be done in either order. Consider shipping step 7 before step 6: decoupling protects against GSD/Superpowers renames that can happen at any time, while the learning loop needs months of accumulated data to show value.

---

## 11. Resolved Questions (formerly Open Questions)

All 10 questions from the Cowork research pass have been resolved and integrated into the design. Summary:

| # | Question | Resolution | Where in doc |
|---|---|---|---|
| 1 | Check file extensibility | `validation_script` field + `dependencies` field added | Section 5.2 |
| 2 | Version-aware Context7 queries | Three-step default: version in query, post-retrieval filter, flag newer features | Section 5.11 |
| 3 | Degradation tier complexity | Keep all 4 tiers. "Full or bypass" creates a cliff. | Section 5.8 |
| 4 | Interface layer: config vs dynamic | Static config file. Debuggable, version-controlled, greppable. | Section 7 |
| 5 | Audit artifact format | Structured JSON with fixed schema. Includes fix_attempts. | Section 5.20 |
| 6 | Missing pre-flight failure modes | Added: SDK version mismatch, Context7 rate limiting (test query not just ping) | Section 5.9 |
| 7 | Learning loop evidence weighting | Deferred until loop runs with real data. Rolling 90-day window as first step. | Section 6, #42 |
| 8 | Simpler alternative to stack-lock | No. But auto-generate 90% from stack-detect.sh, Scott just approves. | Section 5.3 |
| 9 | Technologies without CLIs/MCP/Context7 | `validation_script` field in check files. Web search fallback for docs. | Section 5.2 |
| 10 | Standalone vs integrated | Tightly integrated for now. Premature extraction kills momentum. Extract later if demand emerges. | N/A |

---

## 12. Changelog

### v2 to v3

| Change | Section | Reason |
|---|---|---|
| Claude-suggested lesson tagging during phase-closeout | 6.2 | Turns tagging from recall task (error-prone when tired) to recognition task (easy). Prevents stack lessons from getting lost. |
| metrics.json is gitignored, regenerated from audit artifacts | 6.1, 6.3 | Computed cache, not source data. Added `/scott:rebuild-metrics` command. |
| `discovered_projects` field in metrics.json | 6.3 | Shows which projects were scanned for transparency. |
| `stack-metrics.sh` discovers projects dynamically (narrowed scan) | 6.3 | Scans `~/Sites/` for directories with both stack-lock.json AND .planning/audits/. Ignores projects without audit history. |
| `fix_attempts` replaces `time_to_fix_ms` in audit artifacts | 5.20 | Wall-clock time conflates system quality with human behavior (breaks, coffee, context switches). Commit count directly measures suggested fix quality. One attempt = good suggestion. |
| `avg_fix_attempts` replaces `avg_time_to_fix_ms` in metrics.json | 6.3 | Aggregated view of fix quality per check. |
| "High-attempt checks" in stack-review health report | 6.4 | Checks with high helpful_count but high avg_fix_attempts need better suggested fixes. |
| Overlap detection simplified to manual review | 6.4 | File-level overlap (two checks matching same files) is too coarse. At 10-20 checks, overlap is visible at a glance. Add algorithm when checks exceed 30+. |
| System health calibration (overall pass rate) added to stack-review | 6.4 | BOPs Lights Spreadsheet: shows Scott whether the system is too easy or too strict. No automated thresholds yet. |
| Degradation stress tests added | 5.16, 5.21 | BOPs Operational Entrainment: "test under stress." Chaos test fixtures verify degradation tiers work under simulated failures. Added to Step 3 definition of done. |
| `type` field added to interfaces.json operations | 7.1 | Tells health check how to verify: `"command"` = check registration, `"skill"` = check file exists. |
| interfaces.json resolution rule added to toolkit CLAUDE.md | 7.2 | Makes decoupling explicit for every session. Claude always knows to resolve operation names via interfaces.json. |
| Migration path updated: step 2 adds CLAUDE.md rule | 7.4 | Ensures resolution works from the moment interfaces.json is created. |
| Cross-reference between self-pruning (5.17) and overlap detection (6.4) | 5.17, 6.4 | Two views of the same mechanism, now explicitly linked. |
| `stack-metrics.sh` added to Core Components listing | 5.1 | Was described in Section 6.3 but missing from the file tree. |
| BOPs Alignment table updated | 8 | Added Lights Spreadsheet, Operational Entrainment stress tests, Claude-suggested tags to Worst Week Rule. |
| 3 new design considerations (#51-53) | 9 | fix_attempts over time_to_fix, simplified overlap, system calibration. |
| Implementation order: ship step 7 before step 6 recommended | 10 | Decoupling protects against renames now. Learning loop needs months of data. |
| Step 3 includes degradation stress tests in definition of done | 10 | Tiers must be verified under simulated failures before the closeout audit is trusted. |

### v1 to v2

| Change | Section | Reason |
|---|---|---|
| Updated SurrealDB v3 behavior in Problem Statement | 1 | v3 throws errors for extra fields on SCHEMAFULL (no longer silent). |
| Added 3 static checks: `<future>`, `type::is::`, `type::from::` | 5.2 | SurrealDB v3 breaking changes not covered in v1 |
| Added `validation_script` tool type to check files | 5.2 | Covers DocuSeal, Vapi, Stripe |
| Added `dependencies` field to check files | 5.2 | Enables check ordering |
| stack-lock.json auto-generated from stack-detect.sh | 5.3 | Reduces creation friction |
| Batched execution-step live audits (every 3-5 steps) | 5.4, 5.10 | Prevents audit friction |
| Added agent timeout + dynamic degradation | 5.5, 5.8 | Prevents hung executor |
| Added token cost note for parallel agents | 5.5 | Parallel subagents multiply cost linearly |
| Explained mode: CLAUDE.md `report_mode` field as primary signal | 5.7 | More reliable than git branch naming |
| Added SDK version check to pre-flight | 5.9 | Server can match but SDK can be stale |
| Added Context7 test query (not just ping) to pre-flight | 5.9 | Catches rate limiting |
| Context7 post-retrieval filtering is now default, not fallback | 5.11 | Natural language matching alone not reliable |
| Added PostToolUse hook trigger for test fixtures | 5.16 | Auto-runs test fixtures on check file edits |
| Added Section 5.20: Audit Artifact Format | 5.20 | Structured JSON for learning loop |
| Resolved decoupling: static config file | 7 | Simple, debuggable, sufficient |
| Resolved all 10 open questions | 11 | Integrated into relevant sections |
| Added design considerations #38-41 | 9 | Agent timeout, batched execution, validation_script, SDK version |
| Updated hook primitives with current capabilities | 4 | 24 lifecycle events, 11 blocking, 4 hook types |
| Deferred: disk space pre-flight | 9 (#43) | Over-engineering |
| Deferred: valid_from/valid_until on checks | 9 (#5) | Premature |
| Deferred: evidence weighting specifics | 9 (#42) | Design loop first |
| Learning Loop designed (full Section 6) | 6 | 4-stage loop informed by ACE + Roblox |
| Decoupling designed (full Section 7) | 7 | interfaces.json with toolkit-resolve |
| Added helpful/harmful counters | 5.17, 6.3 | ACE-inspired data-driven decisions |
| Added boosting principle | 6.4 | Refine before adding |
| Added overlap detection | 6.4 | Prevents check bloat |
| Added provider health check | 7.6 | Verifies interfaces.json commands are resolvable |
| Added design considerations #42-47 | 9 | Evidence weighting, disk space, silos, auto-evolution, boosting, hardcoding |
| Updated delivery order: 7 steps | 10 | Added decoupling step |
