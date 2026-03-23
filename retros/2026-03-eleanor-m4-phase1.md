# Retrospective: Eleanor M4 Phase 1 — Hono on Bun
**Date:** 2026-03-22
**Project:** Eleanor
**Milestone:** M4 Stack Migration, Phase 1 (Hono on Bun)
**Duration:** 1 session (~4 hours)

## 1. What Was Built
Migrated Eleanor's entire API from Nuxt Nitro to Hono running on Bun:

- **Plan 01-01:** Hono scaffold (config, db, error middleware, CORS, health/migrate routes, dev scripts)
- **Plan 01-02:** 20 CRUD routes (People, Tasks, Projects, Agreements) with Zod validation
- **Plan 01-03:** 5 chat/conversation routes + relocated all server utils (AI router, context pipeline, prompts)
- **Plan 01-04:** Frontend switch to Hono RPC client, deleted all Nitro routes and old server utils

Also completed: BMAD-to-GSD migration, stale artifact cleanup, first full GSD pipeline run.

- **Commits:** 22
- **New tests:** 49 (health, CRUD, chat, conversations)
- **Routes migrated:** 27
- **Files deleted:** 122 (old Nitro routes + server utils)

**Status:** Near-complete. Bun SDK coercion bug discovered during browser testing. Chat route partially fixed, CRUD routes still need the same fix (~8 call sites).

---

## 2. What Went Well

- **Full GSD pipeline validated.** First end-to-end run: discuss > research > plan > verify > execute with parallel Wave 2 agents. The 14 decisions from discuss-phase flowed cleanly through all downstream agents.
- **Parallel execution saved time.** Wave 2 ran CRUD and chat agents simultaneously on non-overlapping files. Merge conflicts were minimal and mechanical (both extended api/index.ts).
- **Human checkpoint caught a real bug.** All 188 automated tests passed, but the Plan 04 checkpoint prompted browser testing which revealed the Bun SDK coercion issue. Validates that checkpoints aren't bureaucracy.
- **Pre-existing structure doc accelerated planning.** The Epic 4.1 structure doc (written in a prior session) gave the planner a head start with the 4-plan breakdown already decided.
- **Error envelope decision (D-01/D-02) was the right call.** Zod-aware field-level validation errors will pay off in later milestones when forms get complex.

---

## 3. What Went Wrong

- **Bun SDK coercion bug missed by entire agent chain.** Researcher, planner, plan-checker, and executors all used `db.create(string)` / `db.update(string).merge()` patterns that work under Node but fail under Bun. Four layers of agents, zero caught it. (See error-002 for full analysis.)
- **Mocked tests can't catch transport-layer issues.** The dual-testing strategy (D-08) was sound in principle but all new tests mock the DB. No integration test hits a real SurrealDB instance, so the string-vs-RecordId coercion difference was invisible.
- **Research didn't ask the right question.** The researcher investigated Hono patterns, Bun.env, and vitest compat, but never asked "do SurrealDB SDK methods behave differently under Bun?"

---

## 4. Lessons Learned

- **Next time, when migrating runtimes (Node to Bun, CJS to ESM), the research prompt must ask "do any SDK methods behave differently under the target runtime?"** Runtime transport differences are invisible at the API level.
- **Next time, for migration phases, include at least one integration test per route group that hits a real DB.** Mocked tests verify logic but miss transport-layer issues.
- **The scott-surrealdb skill now documents the Bun restriction.** Future planners will see it automatically.

---

## 5. Toolkit Updates Needed

| File | Change | Why |
|------|--------|-----|
| `skills/scott-surrealdb/SKILL.md` | Add Bun runtime section | DONE this session |
| `errors/error-002.md` | Capture multi-layer failure | DONE this session |
| `successes/success-005.md` | Capture pipeline validation | DONE this session |
| `memory/feedback_surrealdb_bun_coercion.md` | Cross-project memory | DONE this session |
| GSD research prompt | Add "SDK runtime compatibility" as standard question for migration phases | TODO — would prevent this class of bug |

---

## 6. Patterns Discovered

- **Hono RPC type chain:** Chain `.route()` calls and `export type AppType = typeof routes` for end-to-end type safety from API to frontend composables.
- **Zod-aware error envelope with custom validationHook:** `@hono/zod-validator`'s third argument produces field-level error details matching the D-02 envelope.
- **`type::record()` for all Bun SDK writes:** Use `db.query('CREATE/UPDATE type::record($id) SET ...')` instead of `db.create()`/`db.update().merge()` when running under Bun.
- **Concurrently dev scripts:** Single `pnpm dev` command runs both Hono (3100) and Nuxt (3200) with kill-others-on-fail.

---

*Retro completed: 2026-03-22*
*Error logs: error-002 | Success logs: success-005*
