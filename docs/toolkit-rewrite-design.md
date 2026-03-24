# Scott-Toolkit Rewrite: Full Design Document

**Date:** 2026-03-23
**Status:** Stack enforcement designed, learning loop and decoupling pending
**Purpose:** Comprehensive design for review in Claude Cowork before implementation

---

## 1. Problem Statement

The scott-toolkit has **knowledge** (skills, MEMORY.md, Context7 IDs) but **no enforcement**. Claude can forget, skip, or misapply stack-specific rules. Code-reading reviews can't catch runtime bugs.

Evidence from Bresco (2026-03-23):
- 2 code-reading review passes missed 3 real bugs (missing `tenant_id`, missing `delivery_address`, wrong schema load order)
- A live SurrealDB audit caught all 3 in minutes
- The same reviews produced 5 false positives from misunderstanding SurrealQL syntax
- Lesson: SCHEMAFULL tables silently reject records with missing required fields. Only live DB testing catches this.

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
| **Hooks** (shell scripts) | Can't be skipped. Fire automatically. | Can't do complex logic. No Claude context. | Gates, reminders, blocking actions |
| **Skills** (SKILL.md files) | Rich instructions. Claude follows them. | Opt-in. Can be forgotten. | Knowledge, step-by-step procedures |
| **Workflows** (workflow .md files) | Multi-phase orchestration. | Opt-in. Can be forgotten. | Multi-step processes with gates |
| **Subagents** | Isolated context (<250K each). Parallel execution. | Can't share state. Each needs full context. | Focused analysis, parallel checks |
| **CLI tools** (bash/node scripts) | Deterministic. Repeatable. No token cost. | No AI reasoning. | Static analysis, file detection, diffing |
| **MCP servers** (Context7, SurrealDB) | Live external data. Always current. | Network latency. Token cost. | Fresh docs, live DB testing |
| **Commands** (/gsd:*, /scott:*) | User-invocable entry points. | Depend on Claude following through. | Entry points that trigger the system |

**Tool resolution hierarchy:** CLI first, MCP if CLI can't do it, Context7 for doc lookups, Agent reasoning as last resort.

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
  stack-check.sh           -- runs ALL static checks (grep patterns from check files)
  stack-preflight.sh       -- verifies CLIs, MCP, DB available, determines degradation tier

Per project:
  stack-lock.json          -- which checks apply, at what version, approved exceptions

hooks/
  guard-phase-completion.sh  -- existing hook, unchanged. One gate for everything.

workflows/
  phase-closeout.md        -- updated: stack audit is Phase 1.5
```

### 5.2 Check Files (One Per Technology)

Each check file is the single source of truth for validating one technology. Contains everything: version info, tool references, static grep patterns, live checks, and Context7 ID.

```json
{
  "technology": "surrealdb",
  "golden_version": "v3",
  "sdk": "surrealdb@2.0.1",
  "tools": [
    { "type": "cli", "command": "surreal validate", "for": "schema validation" },
    { "type": "mcp", "server": "surrealdb", "for": "live queries" },
    { "type": "context7", "id": "/surrealdb/docs.surrealdb.com", "for": "doc reference" }
  ],
  "checks": {
    "static": [
      { "id": "surreal-no-type-thing", "pattern": "type::thing\\(", "message": "Use type::record() in v3", "severity": "error" },
      { "id": "surreal-no-db-create-bun", "pattern": "db\\.create\\(", "condition": "bun_project", "message": "Use db.query() in Bun projects", "severity": "error" }
    ],
    "live": [
      { "id": "surreal-schema-apply", "description": "Apply all schemas in dependency order to temp namespace" },
      { "id": "surreal-seed-and-query", "description": "Seed realistic data and test every db.query() pattern from codebase" }
    ]
  }
}
```

Adding a new technology = add one check file. Modifying checks for one technology doesn't touch anything else.

### 5.3 stack-lock.json (Per Project)

Generated during project creation. Records approved stack for this project.

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

### 5.4 Three Audit Touchpoints

#### Planning -- "Check Before You Build"

**When:** During plan creation, before any code is written.
**How:** The planning agent loads relevant check files into its context. No separate audit agent needed. The planning agent has the right knowledge to write a compliant plan.
**Depth:** Lightweight. Agent reads plan + check files + Context7 docs for relevant technologies.
**Output:** PASS (plan is stack-compliant) or corrections before execution starts.
**Enforcement:** Plan can't be finalized with conflicts.

#### Executing -- "Check As You Build"

**When:** After each plan step completes.
**How:**
1. `stack-check.sh` runs static checks on changed files (CLI only, instant, zero tokens)
2. IF step added new SurrealDB queries or schemas: dispatch one live audit agent
3. Smart dispatch: CLI checks what files changed, cross-references stack-lock.json, only flags technologies that were touched

**Depth:** Medium. Scoped to changed files, not whole codebase.
**Output:** PASS = continue. FAIL = fix before next step.
**Enforcement:** Executor pauses on FAIL.

| Files changed | What runs |
|---|---|
| `*.surql`, `**/db/**`, files with `db.query` | CLI static + SurrealDB live agent |
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
4. Write results to `.planning/` artifacts

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

**Context window budget per agent:**

| Agent | Context sources | Estimated tokens |
|---|---|---|
| Planning audit | Plan text (~5K) + check files (~3K) + Context7 per tech (~30K each, 2-3 techs) | ~100K max |
| Execution step audit | Changed files (~10K) + one check file (~1K) + one tech's Context7 (~30K) | ~50K max |
| Closeout live audit | Phase diff (~20K) + Context7 (~30K) + check file (~1K) | ~60K max |

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
- **Explained** -- for Brett (plain English, step-by-step fix instructions). Detected from git branch (`brett/*`) or project CLAUDE.md.

### 5.8 Degradation Tiers

System detects available resources at pre-flight and runs at the highest possible tier:

| Tier | What works | What's lost | Trigger |
|------|-----------|-------------|---------|
| **Full** | CLI + agents + MCP + Context7 | Nothing | All systems available |
| **Reduced** | CLI + single agent | Parallel dispatch, some Context7 | Context7 or MCP partially unavailable |
| **Minimal** | CLI static checks only | All agent-based checks | No MCP, no Context7 |
| **Bypass** | Nothing | All enforcement | Scott explicitly runs /scott:bypass with reason logged |

The system announces its tier: `Stack audit running in REDUCED mode (Context7 unavailable).`

### 5.9 Pre-Flight Checks

Before any audit runs:
1. Is SurrealDB running? (MCP connection test, if project uses it)
2. What version? (Compare against stack-lock.json)
3. Are required CLIs installed? (`which nuxi`, etc.)
4. Is Context7 reachable?
5. Temp namespace is truly empty? (For SurrealDB live audit)

If any pre-flight fails, degrade to the appropriate tier with a clear message.

### 5.10 Parallel vs Sequential Execution

```
PLANNING:
  CLI: detect stack --> Agent: validate plan
  (Sequential. Agent needs CLI output.)

EXECUTING (per step):
  CLI: static checks --> IF needed: one agent per flagged technology
  (Sequential trigger, but if multiple techs flagged, agents run in parallel.)

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

Critical correctness issue: Context7 returns the *latest* docs. But stack-lock.json may pin an older version.

**Rule:** When the audit agent calls Context7, it must request docs for the *locked version*. If Context7 doesn't support version-specific queries, the agent must filter: "Checking against v4.3. Ignore anything marked 'new in v4.5'."

### 5.12 Multi-Tenant Audit Isolation

For live DB audits: namespace naming uses `audit_${project}_${branch}_${timestamp}`. Cleanup always runs, even if the agent crashes mid-audit.

### 5.13 stack-lock.json Management

- **Version controlled** but doesn't trigger code review discussions
- **Created during project setup** (/scott:new-project or manually for existing projects)
- **Updated when:** Scott approves a deviation, golden stack changes, or project upgrades
- **Drift detection:** `guard-npm-install.sh` (already exists) extended to compare against stack-lock
- **Golden stack changes:** `/scott:resume` checks `last_reviewed` date on check files. If 30+ days stale, nudges: "Stack checks last reviewed 45 days ago."

### 5.14 Audit Scope Boundary

**Hard rule:** The stack audit checks **version-specific correctness only**. "Is this code valid for the exact versions in stack-lock.json?"

NOT in scope: security, performance, code style, test coverage. Those are the code review's job.

### 5.15 First-Run Baseline

`/scott:stack-baseline` for existing projects:
1. Create stack-lock.json if it doesn't exist
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
```

Run when the audit system is updated.

### 5.17 Self-Pruning Checks

The learning loop (Topic A, not yet designed) tracks per-check metrics:
- How often does this check catch a real bug? (benefit)
- How often does it produce a false positive? (cost)

Checks that consistently produce false positives or never catch anything get auto-flagged for removal during `/scott:stack-review`.

### 5.18 Silent on PASS, Loud on FAIL

When everything passes: `Stack audit: 23 checks passed`
When something fails: prominent display with full fix instructions.

Don't train Scott to ignore output by making success verbose.

### 5.19 Onboarding Support

stack-lock.json is self-documenting via `_readme` field. A new developer (Gary, future hires) can read the lock file and understand what's enforced without Scott explaining it.

---

## 6. Learning Loop (Topic A -- NOT YET DESIGNED)

**Problem:** Lessons from each project (Bresco's lessons.md, Eleanor's lessons.md) stay siloed. Knowledge doesn't flow back to the toolkit automatically.

**Design needed for:**
- How audit artifacts feed back into check files
- How project lessons propagate to the golden stack
- How the check cost/benefit tracking works
- What format artifacts need to be in for the learning loop to parse them

## 7. Decoupling (Topic C -- NOT YET DESIGNED)

**Problem:** The toolkit hardcodes GSD commands and Superpowers skills by name. If those tools change APIs or commands, the toolkit breaks.

**Preliminary concept:** Interface layer in toolkit config that maps abstract operations to concrete tool commands. When GSD renames a command, update one config line.

```json
{
  "interfaces": {
    "plan_phase": "/gsd:plan-phase",
    "execute_phase": "/gsd:execute-phase",
    "code_review": "superpowers:requesting-code-review",
    "tdd": "superpowers:test-driven-development"
  }
}
```

**Full design pending.**

---

## 8. BOPs Alignment

| BOPs Principle | How This Design Applies It |
|---|---|
| EIB Protocol | Explicated the broken process, improved each step, then backgroundized via hooks + CLI |
| Value Stream Mapping | Removed 5 duplications in simplification pass |
| Hard Rules > Soft Guidelines | Guard hooks block, they don't warn |
| Worst Week Rule | No manual steps required. Hooks fire automatically. |
| Error Logging | Audit artifacts capture all failures for the learning loop |
| Never Skip Diagnosis | Pre-flight check diagnoses system state before running audit |
| Operational Entrainment | The system is drilled into every phase (planning, executing, closeout) |

---

## 9. All 38 Design Considerations

### Architecture-Defining

| # | Consideration | Resolution |
|---|---|---|
| 1 | Agent prompts hardcode knowledge | Thin prompts. Knowledge in Context7 + check files. |
| 24 | Context windows will grow | Configurable `max_context_budget`. Split by task type first, then technology, then scope. |
| 25 | CLIs becoming better than MCPs | Tool resolution hierarchy: CLI first, MCP if CLI can't, Context7 for docs, agent reasoning last. Check files have ordered tool list per tech. |
| 26 | AI models will improve at code | Checks are discrete removable units in check files. Disabling = remove from file. |
| 27 | GSD/Superpowers may change | Interface layer decouples toolkit from specific commands. |
| 30 | stack-lock.json needs a formal schema | JSON Schema with required/optional fields, valid values, schema version for migration. |
| 31 | No inventory of what checks exist | Check registry: each technology's check file lists all checks explicitly with IDs. CLI runs static checks from registry. Agents run live checks from registry. |
| 37 | Manifest doing too much | Eliminated manifest. One check file per technology is the single source of truth. |

### Critical for Daily Use

| # | Consideration | Resolution |
|---|---|---|
| 2 | No failure fallbacks | Degradation tiers: Full, Reduced, Minimal, Bypass. |
| 4 | Audit scope creep | Hard rule: version-specific correctness only. |
| 11 | No "accept" outcome | Three outcomes: PASS, FAIL, ACCEPT. Exceptions recorded in stack-lock. |
| 14 | Context7 returns wrong version docs | Agent must request locked version docs. Filter if version-specific queries unsupported. |
| 15 | Local DB state could corrupt results | Pre-flight checks: version match, empty namespace, connectivity. |
| 19 | Audit fatigue | Silent on PASS, loud on FAIL. |
| 29 | No system-wide degradation plan | Four degradation tiers with automatic detection. |
| 33 | "One more thing" trap | Check cost/benefit tracking. Auto-flag low-value checks for removal. |

### Important, Addable Incrementally

| # | Consideration | Resolution |
|---|---|---|
| 3 | No incremental delivery path | 6-step delivery order (see Section 10). |
| 7 | Non-code stack not covered | `services` section in stack-lock.json. |
| 8 | Multi-tenant audit isolation | Namespace: `audit_${project}_${branch}_${timestamp}`. Guaranteed cleanup. |
| 9 | stack-lock clutters PRs | Auto-committed, no review trigger. |
| 10 | Audit says WHAT not WHY | Every FAIL includes: what, why, where, suggested fix. |
| 12 | Brett can't interpret failures | Explained mode detected from git branch or CLAUDE.md. |
| 13 | No performance budget | Targets defined. Audit reports own duration. Quality over speed. |
| 17 | Monorepo path ambiguity | `paths` section in stack-lock.json. |
| 20 | Golden stack gets stale | Staleness nudge in /scott:resume (30+ days). |
| 21 | New project friction | Two tiers: full projects (approval flow) vs experiments (auto-generated). |
| 22 | Stack drift across projects | `/scott:stack-review` dashboard: golden vs all projects at a glance. |
| 23 | Testing the audit system itself | Test fixtures: known-good and known-bad samples per technology. |
| 28 | Toolkit needs its own requirements | `toolkit-requirements.json` validated by setup.sh. |
| 32 | Scott's cognitive load | Self-contained reports. No memory required. |
| 34 | Brett's learning path | Explained mode links failures to documentation. |
| 35 | Onboarding new developers | Self-documenting stack-lock with _readme field. |
| 36 | CLI discovery and health | Pre-flight verifies every CLI in check files. |

### Deferred to Future

| # | Consideration | Resolution |
|---|---|---|
| 6 | Token cost visibility | Report usage per audit run. Build when needed. |
| 16 | Cross-technology failure attribution | Group related failures in result merger. Build when it burns us. |
| 18 | Audit versioning | `audit_version` field in artifacts. Build when learning loop needs it. |

---

## 10. Incremental Delivery Order

Each step is independently useful:

| Step | What | Value alone |
|------|------|------------|
| 1 | Check files (surrealdb.json, nuxt.json, etc.) + stack-lock.json schema | Claude can read these for context even without automation |
| 2 | CLI tools (stack-detect.sh, stack-check.sh, stack-preflight.sh) | Standalone static analysis, zero tokens |
| 3 | Closeout audit in phase-closeout.md + live SurrealDB agent | The gate that catches the most bugs (proven pattern) |
| 4 | Guard hook integration (audit inside existing phase-closeout gate) | Enforcement. Can't skip. |
| 5 | Planning + execution audit integration | Earlier catches, incremental improvement |
| 6 | Learning loop integration | Self-improving system |

---

## 11. Open Questions for Cowork Review

1. Is the check file format extensible enough for technologies we haven't anticipated?
2. Are there better patterns for version-aware Context7 queries?
3. Is the degradation tier model too complex? Could we simplify to "full or bypass"?
4. Should the interface layer (decoupling from GSD/Superpowers) use a config file or a more dynamic resolution mechanism?
5. What's the right format for audit artifacts so the learning loop can parse them effectively?
6. Are we missing any failure modes in the pre-flight checks?
7. How should the learning loop weight evidence from different projects? (Bresco bug = higher signal than a personal experiment)
8. Is there a simpler alternative to stack-lock.json that achieves the same enforcement?
9. How do we handle technologies that don't have CLIs, MCP servers, OR Context7 entries?
10. Should the audit system be extracted as a standalone tool that others could use, or kept tightly integrated with scott-toolkit?
