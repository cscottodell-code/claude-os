# Retrospective: Bresco

## Metadata
- Last updated: 2026-03-22
- Version: 1.0
- Project: Bresco
- Milestone: v1.0 Phases 1-6 (pre-pilot)

---

## 1. Project Summary

- **What was built:** Bresco, a chat-first fractional COO platform for small roofing businesses. Full-stack across 6 phases: multi-tenant SurrealDB with namespace isolation, Hono API with 17 route files (11,400 lines), auth with task-based assignment, Stripe billing with minute metering, CRM pipeline with graph relationships, sequence engine with approval graduation, crew scheduling with cascading dispatch, material ordering, Pulse health score with 4 weighted vitals, exception engine with escalating SMS, insurance claim lifecycle with Xactimate PDF parsing and supplement identification, AI Receptionist via Vapi, daily check-in crons, TV Mode SSE, and full Nuxt 4 PWA frontend with 30+ chat-inline components.
- **Time spent:** ~3 days (Phases 1-6, including planning, research, execution, and two full code review passes)
- **Deployment target:** Web (PWA, mobile-first)
- **Milestones completed:** v1.0 Phases 1-6 (Phase 7 Polish remaining)

---

## 2. What Went Well

- **Build velocity was exceptional.** 27 plans across 6 phases executed in roughly 3 days. The parallel wave structure (Scott backend, Brett frontend) kept both tracks moving without blocking.
- **Human/AI involvement balance was right.** Scott made design decisions via discuss-phase, Claude executed via GSD. The handoff points (context capture, plan verification, code review) kept the human in control without bottlenecking.
- **GSD pipeline proved itself again.** The discuss-plan-execute-verify chain produced working code on first try for most plans. Success #002 pattern confirmed: front-loading decisions in discuss-phase means planning and execution run without questions.
- **Parallel executor agents saved significant time.** Wave 2 and Wave 3 plans ran two agents simultaneously via worktree isolation. Total wall-clock time was roughly half what sequential execution would have taken.

**Skills/templates that helped most:**
- `gsd:discuss-phase` captured 28 locked decisions for Phase 5 that downstream agents followed without re-asking
- `gsd:execute-phase` with worktree isolation enabled safe parallel execution
- `superpowers:requesting-code-review` caught 21+ real production-breaking issues across two passes

---

## 3. What Went Wrong

- **Post-phase code review was skipped until Scott reminded.** CLAUDE.md explicitly requires `superpowers:requesting-code-review` after every phase. Phase 5 completed execution and verification without it. Only when Scott asked "Aren't you supposed to use superpowers to check code?" did the review happen. By then, 9 Critical issues had accumulated.
- **First code review pass was shallow.** The SurrealDB audit checked surface patterns (db.query() usage, no v2 methods) but didn't do field-by-field schema/code alignment. The owner_notification table had 7 wrong fields, tenant_settings was missing fields, and 3 SCHEMAFULL tables were silently dropping `updated_at`. These are the hardest bugs to find because SurrealDB v3 fails silently.
- **No end-to-end user story walkthrough.** The first-pass reviewers checked code quality and patterns but didn't simulate real usage. The opt-out race condition, insurance re-enrollment bug, and UTC timezone bugs only surfaced in Pass 2 when the agent was explicitly told to "walk through each user story end-to-end."
- **lessons.md was never updated.** 113 decisions were captured in STATE.md but the tasks/lessons.md file stayed empty. The CLAUDE.md rule to "capture lessons after any debug session" was not followed.

**Biggest time sink:** The two-pass code review cycle (Pass 1 + fix + Pass 2 + fix) took longer than it should have. A thorough single pass would have been faster than two inadequate ones.
**Root cause:** The first-pass review agents weren't given deep enough instructions. "Check SurrealDB compliance" is too vague. "Read each SCHEMAFULL table, grep every field the code writes, confirm they match" is what was needed.

---

## 4. Lessons Learned

- Next time, run `superpowers:requesting-code-review` with the SurrealDB adherence prompt at the end of EVERY phase automatically, instead of waiting to be reminded, because skipping it on Phase 5 let 9 Critical issues accumulate that should have been caught incrementally.
- Next time, always include a schema-vs-code field-by-field comparison in every SurrealDB review, instead of surface-level pattern checks, because SCHEMAFULL tables silently drop undefined fields in v3 and grep-level audits miss this.
- Next time, always do a second verification pass after fixing review findings, instead of declaring victory after tests pass, because tests only verify mock behavior and don't catch schema alignment, business logic edge cases, or end-to-end user story gaps.
- Next time, include an "end-to-end user story walkthrough" review agent from the start, instead of only adding it in Pass 2, because logic bugs like the opt-out race condition and insurance re-enrollment only surface when you trace a real user journey from trigger to completion.
- Next time, use scott-toolkit workflows, GSD, and Superpowers as a unified system, instead of treating them as separate tools, because they're designed to reinforce each other and skipping any piece creates gaps the others can't catch.
- Next time, update tasks/lessons.md after every correction and debug session, instead of letting it stay empty, because institutional memory prevents repeating mistakes across sessions.

---

## 5. Toolkit Updates Needed

| Action | File | Change Needed | Reason |
|--------|------|--------------|--------|
| UPDATE | `~/.claude/get-shit-done/workflows/execute-phase.md` | Add mandatory code review step after `verify_phase_goal` and before `update_roadmap`. Include the SurrealDB adherence prompt as a template. | Code review was skipped because it was a CLAUDE.md rule, not a workflow gate. Making it a workflow step ensures it can't be bypassed. |
| UPDATE | `~/.claude/skills/superpowers/requesting-code-review/code-reviewer.md` | Add a "SurrealDB Schema Audit" section to the review checklist: "For each SCHEMAFULL table, grep all fields written by code. Confirm every field exists in schema. Report any field written but not defined." | First-pass reviewers checked patterns but not field-level alignment. This checklist item forces the deep comparison. |
| UPDATE | `~/.claude/skills/superpowers/requesting-code-review/code-reviewer.md` | Add an "End-to-End User Story" section: "Walk through 3-5 critical user journeys from trigger to completion. Check for race conditions, cascade failures, and timezone handling." | Business logic bugs only surfaced when agents were explicitly told to trace user stories. |
| UPDATE | `~/.claude/rules/claude-behavior.md` | Add to Verification section: "After code review fixes, run a second verification pass before declaring complete. One pass is never enough for production code." | Two-pass pattern proved necessary but wasn't codified. |
| UPDATE | `~/.claude/rules/claude-behavior.md` | Add to Context Engineering section: "Update tasks/lessons.md after EVERY phase, not just debug sessions. Empty lessons.md at end of build is a failure mode." | lessons.md stayed empty through 6 phases. |

---

## 6. Patterns Discovered

### Code Patterns

- **Webhook cascade pattern:** Validate payload, idempotency check via `processed_webhook` table, create records, fire-and-forget sequence enrollment, send notification. Used identically for DocuSeal, Vapi, and insurance approval. Reusable for any webhook integration.
  ```typescript
  // 1. Idempotency guard
  const [existing] = await systemDb.query('SELECT * FROM processed_webhook WHERE webhook_id = $id', { id });
  if (existing?.length) return c.json({ status: 'already_processed' });
  await systemDb.query('CREATE processed_webhook CONTENT $data', { data: { webhook_id: id, ... } });
  // 2. Business logic (create records, update pipeline)
  // 3. Fire-and-forget side effects
  enrollContact(db, contactId, 'sequence_type', tenantId).catch(() => {});
  ```

- **assertSafeId shared utility:** Centralized SurrealQL injection prevention for record ID interpolation.
  ```typescript
  export function assertSafeId(id: string): string {
    const bare = id.includes(':') ? id.split(':').pop()! : id;
    if (!/^[a-zA-Z0-9_-]+$/.test(bare)) throw new Error(`Unsafe ID: ${id}`);
    return bare;
  }
  ```

- **Content-based mock routing:** Position-independent test mocks that survive refactors.
  ```typescript
  mockDbQuery.mockImplementation(async (query: unknown) => {
    const q = String(query);
    if (q.includes('vital_pipeline_velocity')) return [[{ total_leads: 10 }]];
    if (q.includes('health_score_history')) return [[{ avg: 75 }]];
    return [[]];
  });
  ```

- **jose-wrapper for ESM mocking:** Thin local wrapper around pure-ESM packages enables bun:test mock.module interception.

- **Fire-and-forget with silent catch:** Non-critical side effects that shouldn't block the primary operation.
  ```typescript
  enrollContact(db, contactId, type, tenantId).catch(() => {});
  ```

### Architecture Patterns

- **SurrealDB computed tables for derived metrics:** `TYPE NORMAL AS SELECT` creates read-only aggregation views. No cron jobs, no stale caches, always fresh data. Used for all 4 health score vitals.

- **Namespace-per-tenant isolation:** Each tenant gets a SurrealDB namespace. LRU connection pool (max 50) with pending-connections dedup Map prevents concurrent-request races.

- **Schema application at signup:** All `.surql` files applied atomically during tenant creation. Schemas are the contract between code and database. When schemas are incomplete, data is silently lost.

- **AI call caching for SSE:** Module-level headline cache with TTL + score-delta threshold prevents thousands of wasteful AI calls when TV Mode polls every 10 seconds.

### SurrealQL Patterns

- **Graph traversal for entity relationships:**
  ```surql
  SELECT ->converted_to->customer->has_job->job FROM lead:${id}
  ```

- **Computed table vitals:**
  ```surql
  DEFINE TABLE IF NOT EXISTS vital_pipeline_velocity TYPE NORMAL AS
    SELECT count() AS total_leads, count(updated_at > time::now() - 7d AND stage NOT IN ['new']) AS moved_in_7d
    FROM lead WHERE stage NOT IN ['closed', 'lost'] GROUP ALL;
  ```

- **RELATE with interpolated IDs (v3 requirement):**
  ```surql
  RELATE customer:${bareCustomerId}->has_claim->claim:${bareClaimId}
    SET created_at = time::now()
  ```
  $param binding does not work in record ID positions for RELATE in SurrealDB v3.

- **Idempotency via processed_webhook:**
  ```surql
  SELECT * FROM processed_webhook WHERE webhook_id = $id LIMIT 1
  ```
  Stored in system namespace, shared across tenants.
