# Retrospective: Eleanor M2 Intelligence
**Date:** 2026-03-13
**Project:** Eleanor
**Milestone:** M2 Intelligence (Stories 2.1-2.6)
**Duration:** ~1 week (Mar 7 - Mar 13, 2026)

## 1. What Was Built
Eleanor's intelligence layer across 6 stories and 68 commits, growing from 0 to 227 tests:

- **2.1 System Prompt Architecture** - Prompts as TypeScript files with shared personality fragment, prompt composer, migrated all inline prompts to `server/utils/prompts/`
- **2.2 Register All Task Types** - Expanded from 2 to 19 task types (9 Claude + 10 Gemini), prompt files for each, fallback configuration per type
- **2.3 Context Gatherers** - Modular gather stage with 6 parallel gatherers (conversation history, summaries, people, agreements, tasks, cross-conversation), common interface for future extensibility
- **2.4 Context Ranker & Assembler** - 3-weight scoring (relevance 0.5, recency 0.3, source priority 0.2), section-labeled output, 30k token budget enforcement, pipeline timing with 500ms warning
- **2.5 Context Compression** - Summarize old conversations via Gemini, context_summaries table, auto-triggers after AI response, upsert to avoid duplicates
- **2.6 Cost Tracking & Fallback** - Per-request token logging (input/output), $3 warning/$5 pause thresholds, 404-specific Haiku fallback, coaching/decision exempt from pause

- **Time spent:** ~1 week across multiple sessions
- **Deployment target:** Desktop (Tauri 2) + PWA
- **Milestones completed:** M2 Intelligence

---

## 2. What Went Well

- **Test-first development paid off.** Starting M2 with vitest setup (Story 2.1) meant every subsequent story had a testing foundation. Grew from 0 to 227 tests across 6 stories with no regressions.
- **Modular context pipeline architecture.** The 3-stage gather/rank/assemble pattern made each stage independently testable and extensible. Adding new gatherers for M3 will be trivial (just implement the interface).
- **TDD with red-green-refactor.** Writing tests first (especially for Stories 2.5 and 2.6) caught design issues early. The cost tracker tests defined the API before implementation, leading to cleaner interfaces.
- **Code review skill caught real issues.** Story 2.5 was simplified after code review. The review process added quality without adding much time.
- **Story scoping was right-sized.** Each story was completable in a single session. No story sprawled or required major mid-story pivots.
- **Cost tracking used existing schema.** Decision to use existing `messages.cost` field instead of a separate `api_costs` table avoided unnecessary complexity. Added `input_tokens`/`output_tokens` for detail without a new table.

**Skills/templates that helped most:**
- `superpowers:test-driven-development` - enforced test-first discipline across all stories
- `superpowers:requesting-code-review` - caught simplification opportunities in Stories 2.5 and 2.6
- BMAD story-based workflow - kept scope tight and deliverables clear

---

## 3. What Went Wrong

- **Stories 2.3 and 2.4 weren't committed promptly.** The modular context engine (21 files, 1625 lines) sat uncommitted across sessions while Stories 2.5 and 2.6 were built on top. This made the final commit archaeology messier than it needed to be.
- **CLAUDE.md fell behind.** The project CLAUDE.md still says "No test framework configured yet" and "Next: M2 Intelligence" even though M2 is complete with 227 tests. Status sections weren't updated as stories completed.
- **Sonnet access still unresolved.** Carried forward from M1. The Haiku workaround works but limits response quality for coaching and decision tasks, which are Eleanor's highest-value features.

**Biggest time sink:** Uncommitted work from 2.3/2.4 requiring post-hoc commit organization
**Root cause:** No habit of committing at the end of each story/session

---

## 4. Lessons Learned

- Next time, commit all work at the end of each story instead of letting changes accumulate across sessions, because uncommitted work makes it harder to track what changed when, and risks losing work.
- Next time, update CLAUDE.md status section after completing each story instead of leaving it stale, because CLAUDE.md is the first thing read in a new session and stale info wastes orientation time.
- Next time, use existing schema fields before creating new tables instead of defaulting to new infrastructure, because the `messages.cost` approach in Story 2.6 was simpler and more maintainable than the originally planned `api_costs` table.

---

## 5. Toolkit Updates Needed

| Action | File | Change Needed | Reason |
|--------|------|--------------|--------|
| UPDATE | `workflows/retro.md` or CLAUDE.md behavior rules | Add "commit at end of each story" as a standard practice | Prevents the 2.3/2.4 uncommitted work accumulation problem |
| UPDATE | `rules/claude-behavior.md` | Add "update CLAUDE.md status after completing each story/milestone" to Progress Tracking section | Prevents stale project status across sessions |

---

## 6. Patterns Discovered

### Code Patterns

- **Gatherer interface pattern:** Each context gatherer implements `gather(query, conversationId): Promise<ContextChunk[]>`. New data sources just implement the interface and register in the pipeline. Zero changes to existing code.

```typescript
// Adding a new gatherer for M3:
export const emailGatherer: ContextGatherer = {
  sourceType: 'email',
  gather: async (query, conversationId) => {
    // search emails, return ContextChunk[]
  }
}
```

- **Cost threshold with exemptions:** Track daily costs, warn at $3, pause at $5, but exempt high-value task types. Uses a `cost_warnings` table with unique date index for once-per-day dedup.

```typescript
const EXEMPT_TYPES = ['coaching_response', 'decision_support']
if (dailyCost > PAUSE_THRESHOLD && !EXEMPT_TYPES.includes(taskType)) {
  return { status: 'paused', reason: 'Daily cost limit reached' }
}
```

### Architecture Patterns

- **3-stage context pipeline (Gather > Rank > Assemble):** Separates concerns cleanly. Gatherers are parallel and independent. Ranker applies a consistent scoring formula. Assembler handles token budgeting and formatting. Each stage is independently testable.
- **Re-export for backward compatibility:** When refactoring a monolithic file into a module, keep the original file as a re-export to avoid breaking Nuxt auto-imports.

### SurrealQL Patterns

- **Unique date index for dedup:** `DEFINE INDEX idx_cost_warnings_date ON cost_warnings FIELDS date UNIQUE` ensures only one warning record per day, using UPSERT to update if it already exists.
