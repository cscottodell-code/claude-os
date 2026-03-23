# Retrospective Index

## Metadata
- Last updated: 2026-03-22
- Version: 1.0

<!--
This file summarizes key lessons from all retrospectives so Claude Code can
quickly scan institutional knowledge. Updated by the retro workflow.

FORMAT: Each entry includes the project name, date, and the most important
lessons (not all lessons — just the ones worth remembering across projects).
-->

## How This Works

After every retro, the key lessons are added here as a summary entry.
Claude Code reads this file to avoid repeating past mistakes across projects.

## Retros

### 2026-03 — Bresco Phases 1-6 (Pre-Pilot)
- **Lesson:** Run code review at the end of EVERY phase, not just when reminded. Skipping it let 9 Critical issues accumulate. Make it a workflow gate, not a honor-system rule.
- **Lesson:** SurrealDB v3 SCHEMAFULL tables silently drop undefined fields. Every code review must do field-by-field schema/code comparison. Grep-level audits miss this.
- **Lesson:** One review pass is never enough for production code. First pass catches patterns, second pass catches schema alignment and business logic edge cases.
- **Lesson:** "Tests pass" does not mean "code is correct." Tests verify mock behavior. Schema compliance, race conditions, and timezone bugs require end-to-end user story walkthroughs.
- **Pattern:** Webhook cascade (idempotency + records + fire-and-forget enrollment + notification) reusable for any webhook.
- **Pattern:** SurrealDB computed tables (`TYPE NORMAL AS SELECT`) for derived metrics. No crons, no caches, always fresh.
- **Pattern:** Content-based mock routing (`q.includes('table_name')`) survives refactors. Positional mocks break.
- **Pattern:** AI call caching (TTL + score-delta) prevents AI spam in polling endpoints.
- **Toolkit update:** Proposed adding mandatory code review step to execute-phase workflow and SurrealDB schema audit checklist to code-reviewer template.

### 2026-03 — Eleanor M1 Foundation
- **Lesson:** Verify API key model access before committing to a model in the architecture. Sonnet 404s burned time mid-build.
- **Lesson:** Check SurrealDB version-specific syntax (v2 vs v3) before writing queries. Several breaking changes hit mid-story.
- **Lesson:** Always strip markdown code fences from LLM JSON output. Models don't reliably return raw JSON.
- **Pattern:** Task type registry (model + prompt + fallback per task type) worked well for multi-model AI routing. Reuse for any multi-model app.
- **Pattern:** Intent classifier + format directives cleanly separates detection from response formatting.
- **Pattern:** StringRecordId from SDK instead of type::record() in parameterized SurrealDB queries.

### 2026-03 — Eleanor M4 Phase 1 (Hono on Bun)
- **Lesson:** When migrating runtimes (Node to Bun), research must ask "do SDK methods behave differently under the target runtime?" The SurrealDB SDK's `db.create()` and `db.update().merge()` fail under Bun's WebSocket transport but work under Node's WASM transport. All agent layers (researcher, planner, checker, executor) missed this.
- **Lesson:** Mocked tests can't catch transport-layer issues. Migration phases need at least one integration test per route group hitting a real DB instance.
- **Lesson:** Human checkpoints in migration plans catch real bugs that automated tests miss. Don't skip them.
- **Pattern:** Hono RPC type chain (`.route()` + `export type AppType`) for end-to-end type safety API to frontend.
- **Pattern:** `type::record($param)` in `db.query()` for all SurrealDB writes under Bun runtime.
- **Pattern:** Zod-aware error envelope with `@hono/zod-validator` custom hook for field-level validation errors.
- **Toolkit update:** Added Bun runtime section to scott-surrealdb skill. Error-002 and success-005 logged.

### 2026-03 — Eleanor M2 Intelligence
- **Lesson:** Commit all work at the end of each story. Letting changes accumulate across sessions makes commit history messy and risks losing work.
- **Lesson:** Update CLAUDE.md status after each story/milestone. Stale status wastes orientation time in new sessions.
- **Lesson:** Prefer existing schema fields over new tables when possible. Using `messages.cost` was simpler than a separate `api_costs` table.
- **Pattern:** 3-stage context pipeline (gather > rank > assemble) with parallel gatherers implementing a common interface. Each stage independently testable and extensible.
- **Pattern:** Cost threshold with exemptions and daily dedup via unique date index on warnings table.
- **Pattern:** Re-export file for backward compatibility when refactoring monolithic files into modules.

<!--
EXAMPLE ENTRY (for reference):

### 2026-03 — Claimsforce Tracker
- **Lesson:** Always define all SurrealDB tables in schema.surql before querying.
  v3 throws errors on non-existing tables (unlike v2 which returned empty arrays).
- **Lesson:** Put "ssr: false" in CLAUDE.md constraints, not just nuxt.config.ts.
  Claude Code reads CLAUDE.md first and may not check config files.
- **Pattern:** The adapter pattern (useDatabase + adapters/) worked well for
  dual-target apps. Use it again for any app that needs both web and desktop.
- **Toolkit update:** Added v3 table error handling to surrealdb-v3.md skill.
-->
