# Briefing: SurrealDB Agent Architecture Updates

Paste this into a Claude Code session to bring it up to speed on recent toolkit changes and the broader strategy.

---

## Prompt

```
I just made several updates to the SurrealDB skill in ~/Sites/Global/scott-toolkit/. Before we do anything else, read the changed files and understand the broader context. Then confirm what you see.

## What changed (April 2026)

Four files were added or modified in `skills/scott-surrealdb/references/`:

1. **surrealdb-v3-ai-patterns.md** (MODIFIED) — Two new sections added:
   - "The Context Layer Loop" — the core read-reason-write agent execution cycle where SurrealDB is the single transactional backend. Includes a full BEGIN/COMMIT transaction example and a comparison table (traditional multi-DB stack vs context layer).
   - "Hybrid RAG: Two Query Strategies" — entity-first (graph to vector) and similarity-first (vector to graph) recipes with SurrealQL examples and a decision table for when to use each.

2. **surrealdb-v3-realtime.md** (MODIFIED) — New section added:
   - "Agent-to-Agent Coordination with LIVE SELECT" — using LIVE SELECT as a lightweight message bus between agents instead of Kafka/Redis. Includes an agent task queue schema, a reactive pipeline pattern in TypeScript, TABLE/FIELD event triggers for chaining agent workflows, and a comparison table (Kafka vs LIVE SELECT).

3. **docs/training-surrealdb-agents.md** (NEW) — A 5-section hands-on walkthrough for Brett covering vector search basics, graph+vector, Spectron memory types, live query coordination, and a mini agent loop exercise. References the toolkit's reference files directly.

Read all four files now:
- ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md
- ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-realtime.md
- ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-spectron.md
- ~/Sites/Global/scott-toolkit/docs/training-surrealdb-agents.md

## The bigger picture: what we're building

SurrealDB v3 is the "context layer" for all AI agents across my projects (Advosy, Bresco, Personal/Eleanor). The core idea, backed by deep research:

**One database replaces 3-4 tools.** Instead of Pinecone (vectors) + Neo4j (graph) + Postgres (structured data) + Redis (real-time), SurrealDB handles all four natively. This matters for agents because the entire agent loop — read context, reason with an LLM, write results — stays in one transactional system. No stale reads, no orphaned writes, no glue code.

**Three architectural patterns are now documented in the toolkit:**
1. **Context Layer Loop** (ai-patterns.md) — the core agent cycle. Every agent we build should follow this pattern.
2. **Hybrid RAG** (ai-patterns.md) — two query strategies (entity-first, similarity-first) that combine graph traversal with vector search. Use entity-first when you know what you're looking for, similarity-first when exploring.
3. **LIVE SELECT coordination** (realtime.md) — agents subscribe to each other's output tables instead of needing a message broker. Good for up to ~50 agents. Beyond that, use a dedicated broker.

**Spectron** (spectron.md) provides the 5 memory types: working, semantic, episodic, procedural, preference. Eleanor already uses this. Any new agent should use the same schemas.

## What's coming next (not yet, just awareness)

Two items are saved for later in `tasks/surrealdb-agent-architecture-prompts.md`:
- **Item 8:** Evaluate Agno's native SurrealDB memory provider vs our Spectron approach
- **Item 9:** Benchmark the hybrid RAG and live query patterns under realistic load before deploying to production

## What I need from you

After reading the files, give me:
1. A one-line summary of each new/changed section you found
2. Any issues you spot (inconsistencies between files, schema mismatches, patterns that reference tables not defined elsewhere)
3. Whether the training doc (for Brett) correctly references the patterns in the reference files
```
