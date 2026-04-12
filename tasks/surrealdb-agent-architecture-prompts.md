# SurrealDB Agent Architecture: Action Prompts

Generated from the deep research report: `surrealdb-v3-agentic-architecture-2026-04-11.html`
Date: 2026-04-11

---

## Item 4: Finish Training Module (Brett Walkthrough)

**Status:** Do now
**Context:** Four Cowork outputs were generated from the research "Do Now" actions. The toolkit's reference files (`surrealdb-v3-ai-patterns.md`, `surrealdb-v3-spectron.md`, `surrealdb-v3-realtime.md`, `surrealdb-v3-vector-search.md`) are the source of truth. This training module should be a guided tour through those references, using the Cowork outputs as supplementary context.

**Prompt (paste into Claude Code):**

```
Build a training walkthrough for Brett on SurrealDB v3 for AI agents.

## What this is
A single markdown file at ~/Sites/Global/scott-toolkit/docs/training-surrealdb-agents.md that Brett can follow like a guided tour. He's a vibe coder who learns by doing. Structure it as a sequence of exercises, not a lecture.

## Source of truth (read these first)
1. ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md
2. ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-spectron.md
3. ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-realtime.md
4. ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-vector-search.md

## Structure
Break it into 5 sections. Each section follows this pattern:
- **What we're building** (1-2 sentences)
- **Why it matters** (connect to Advosy or Bresco use case)
- **The pattern** (point to the exact section in the reference file, with file path)
- **Try it** (a concrete SurrealQL exercise Brett can run against a local SurrealDB instance)
- **Check yourself** (expected output or a question to verify understanding)

## The 5 sections (in order)
1. **Vector Search Basics** - Embed and search. Source: surrealdb-v3-vector-search.md. Exercise: create a chunks table, insert 3 test records with fake embeddings, run a KNN query.
2. **Graph + Vector (the killer feature)** - Find similar items, then traverse relationships. Source: surrealdb-v3-ai-patterns.md, "Graph + Vector Traversal" section. Exercise: build a mini knowledge graph (entities + related_to relations), then run the "hop and search" pattern.
3. **Agent Memory with Spectron** - The 5 memory types. Source: surrealdb-v3-spectron.md + surrealdb-v3-ai-patterns.md "Spectron" section. Exercise: create one record of each memory type for a fake agent called "test-agent."
4. **Real-Time Agent Coordination** - LIVE SELECT as a message bus. Source: surrealdb-v3-realtime.md "Live Queries" section. Exercise: open two SurrealDB connections, subscribe to a table on one, insert on the other, see the push.
5. **Putting It Together** - A mini agent loop. Read context, reason (fake it with a comment), write results back. Exercise: write a SurrealQL transaction that reads from semantic_memory, "decides" (hardcoded), and writes to episodic_memory.

## Tone
Write like you're explaining to a smart colleague who knows spreadsheets but is learning databases. Use analogies to spreadsheets when they help. Be direct. No filler.

## Rules
- No em dashes. Ever.
- Reference exact file paths so Brett can open the source files in his editor.
- Every SurrealQL block should be copy-paste ready against SurrealDB v3.
- Keep it under 500 lines. This is a walkthrough, not a textbook.
```

---

## Item 5: Add Context Layer Loop to ai-patterns.md

**Status:** Do now
**Context:** The deep research's key architectural insight (Finding F1, Confidence 5/5): keeping the entire agent loop (read context via hybrid SurrealQL, reason with LLM, write results back atomically) inside one transactional system eliminates the glue code between separate databases. The existing `surrealdb-v3-ai-patterns.md` has the individual pieces (RAG, memory, graph+vector) but never shows them composed into the full loop.

**Prompt (paste into Claude Code):**

```
Add a "Context Layer Loop" section to ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md

## What to add
A new section called "## The Context Layer Loop" placed AFTER the "Graph + Vector Traversal" section and BEFORE the "Spectron" section. This is the architectural pattern that ties everything else in the file together.

## The pattern
The context layer loop is the core agent execution cycle when SurrealDB is your single backend:

1. **Read context** - One SurrealQL query that combines vector search + graph traversal + memory lookup. This replaces 3 separate database calls in a traditional stack.
2. **Reason** - Pass the assembled context to the LLM. This step happens outside SurrealDB.
3. **Write results** - Atomically write back: the agent's response, any new entities extracted, updated memory, and relationship edges. All in one transaction.

## What to include
1. A brief explanation (3-4 sentences) of why this matters: one transactional system means no stale reads, no orphaned writes, no glue code syncing Pinecone + Neo4j + Postgres.
2. A concrete SurrealQL example showing the full loop as a transaction:
   - BEGIN TRANSACTION
   - Read: vector search on chunks + graph hop to related entities + fetch working memory for the session
   - (comment: LLM reasoning happens here, outside the DB)
   - Write: CREATE message, CREATE/UPDATE entities from LLM extraction, RELATE new entity connections, UPDATE working_memory
   - COMMIT TRANSACTION
3. A comparison table: "Traditional Stack vs Context Layer" showing the same agent loop split across 3-4 tools vs unified in SurrealDB.
4. A callout: "This pattern works because SurrealDB combines document, graph, and vector in one engine. If you need to split the read and write across different databases, the atomicity guarantee breaks."

## Rules
- Match the existing file's formatting conventions (read the file first)
- Use the same schema names already defined in the file (chunk, entity, related_to, semantic_memory, working_memory, etc.)
- No em dashes
- Keep it concise. This section should be ~60-80 lines.
```

---

## Item 6: Add Hybrid RAG Query Recipes

**Status:** Do now
**Context:** The deep research (Finding F4, Confidence 4/5) identified two specific Knowledge Graph RAG patterns that are more powerful than basic vector search: "entity-first" (start from graph, enrich with vectors) and "similarity-first" (start from vectors, expand with graph). The existing file has a basic "Multi-Modal RAG" example and the "Hop and Search" pattern, but doesn't frame them as the two canonical hybrid strategies with clear when-to-use guidance.

**Prompt (paste into Claude Code):**

```
Add hybrid RAG query recipes to ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md

## What to add
A new subsection under the existing "## RAG (Retrieval-Augmented Generation) Schema" section called "### Hybrid RAG: Two Query Strategies". Place it AFTER the existing "Multi-Modal RAG" subsection.

## The two patterns

### Pattern 1: Entity-First (Graph to Vector)
**When to use:** You know WHAT you're looking for (a specific entity, relationship, or structured attribute), but need to find RELATED unstructured content.
**Example use case:** "What do we know about Advosy's lead conversion process?" - Start from the entity "Advosy" + relationship "lead_conversion", traverse graph, THEN vector-search for related chunks.

SurrealQL recipe:
```surql
-- Entity-First: Start from known entity, expand via graph, enrich with vectors
LET $entity = SELECT * FROM entity WHERE name = $entity_name LIMIT 1;

-- Traverse graph: what's connected to this entity?
LET $related = SELECT
  ->related_to->entity.{ id, name, type } AS neighbors,
  <-mentions<-chunk.{ id, content } AS direct_chunks
FROM $entity;

-- Enrich: find more chunks similar to the direct chunks' embeddings
LET $enriched = SELECT id, content, vector::distance::knn() AS dist
FROM chunk
WHERE embedding <|5, 40|> $query_vec
AND id NOT IN $related.direct_chunks.id
ORDER BY dist ASC;

RETURN {
  entity: $entity,
  graph_context: $related,
  vector_enriched: $enriched
};
```

### Pattern 2: Similarity-First (Vector to Graph)
**When to use:** You DON'T know what entity you need. You have a vague question or natural language query, and want to discover structure.
**Example use case:** "How should we handle homeowners who say they need to think about it?" - Vector search finds relevant chunks, THEN graph traversal discovers the entities and relationships those chunks connect to.

SurrealQL recipe:
```surql
-- Similarity-First: Start from vector search, discover structure via graph
LET $similar = SELECT id, content, vector::distance::knn() AS dist
FROM chunk
WHERE embedding <|5, 40|> $query_vec
ORDER BY dist ASC;

-- Discover: what entities do these chunks mention?
LET $discovered = SELECT
  ->mentions->entity.{ id, name, type, mention_count } AS entities
FROM $similar;

-- Expand: traverse from discovered entities to find more context
LET $expanded = SELECT
  id, name, type,
  ->related_to->entity.{ name, type } AS connections,
  <-mentions<-chunk.content AS all_chunks
FROM $discovered.entities
ORDER BY mention_count DESC
LIMIT 5;

RETURN {
  similar_chunks: $similar,
  discovered_entities: $discovered,
  expanded_context: $expanded
};
```

## Also add a decision table
| Question | Use Entity-First | Use Similarity-First |
|---|---|---|
| Do I know the entity? | Yes | No |
| Is my query structured? | Yes | No, it's natural language |
| Am I exploring or retrieving? | Retrieving | Exploring |
| Example | "Get all docs about [X]" | "How do we handle [situation]?" |

## Rules
- Use the existing schema names from the file (chunk, entity, related_to, mentions)
- Match the file's formatting conventions
- No em dashes
- The existing "Multi-Modal RAG" and "Hop and Search" examples stay as-is. This new subsection frames them as part of a bigger picture.
- Keep it under 80 lines total.
```

---

## Item 7: Add Live Query Coordination Pattern

**Status:** Do now
**Context:** The deep research (Finding F3, Confidence 4/5) identified LIVE SELECT as a lightweight replacement for Kafka/Redis Pub/Sub in multi-agent systems. The existing `surrealdb-v3-realtime.md` covers LIVE SELECT for UI updates (Pinia store pattern) but doesn't cover the agent-to-agent coordination use case. This is the pattern where agents subscribe to each other's output tables, creating a reactive workflow without a separate message broker.

**Prompt (paste into Claude Code):**

```
Add an agent coordination section to ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-realtime.md

## What to add
A new section called "## Agent-to-Agent Coordination with LIVE SELECT" placed AFTER the existing "Live Queries on Computed Tables" subsection and BEFORE the "Important Notes" subsection.

## The pattern
Instead of running a separate message broker (Kafka, Redis Pub/Sub, RabbitMQ) to coordinate multiple agents, use LIVE SELECT on shared SurrealDB tables. Each agent subscribes to the tables it cares about and reacts to changes.

## What to include

### 1. The architecture explanation (3-4 sentences)
In a multi-agent system, agents need to coordinate: Agent A produces output that Agent B consumes. Traditionally this requires a message broker as middleware. With SurrealDB, Agent B just runs `LIVE SELECT * FROM agent_a_output WHERE status = 'ready'` and gets pushed updates. The database IS the message bus. No extra infrastructure.

### 2. Agent task queue pattern
```surql
-- Shared task table
DEFINE TABLE agent_task SCHEMAFULL;
DEFINE FIELD task_type ON agent_task TYPE string;
DEFINE FIELD payload ON agent_task TYPE object FLEXIBLE;
DEFINE FIELD status ON agent_task TYPE string DEFAULT 'pending'
  ASSERT $value IN ['pending', 'claimed', 'processing', 'done', 'failed'];
DEFINE FIELD assigned_to ON agent_task TYPE option<string>;
DEFINE FIELD created_at ON agent_task TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD completed_at ON agent_task TYPE option<datetime>;

-- Agent subscribes to pending tasks of its type
-- LIVE SELECT * FROM agent_task WHERE task_type = 'extract_entities' AND status = 'pending';

-- Agent claims a task (atomic update prevents double-claiming)
UPDATE agent_task:$task_id SET
  status = 'claimed',
  assigned_to = $agent_id
WHERE status = 'pending';
```

### 3. Reactive pipeline pattern (TypeScript)
Show two agents in TypeScript using the JS SDK:
- Agent A: writes extraction results to a `extracted_entities` table
- Agent B: has a LIVE SELECT on `extracted_entities`, picks up new records, runs relationship mapping, writes to `entity_relationships`
- Agent C: has a LIVE SELECT on `entity_relationships`, picks up new records, updates the knowledge graph

Use the async iterator pattern from the existing Pinia example but adapted for a Node.js agent (no Vue, just plain TypeScript).

### 4. TABLE and FIELD events for reactive workflows
Show how DEFINE EVENT can trigger agent workflows:
```surql
-- When a new document is ingested, auto-trigger the chunking agent
DEFINE EVENT trigger_chunking ON TABLE document ASYNC
  WHEN $event = 'CREATE'
  THEN {
    CREATE agent_task SET
      task_type = 'chunk_document',
      payload = { document_id: $after.id, title: $after.title },
      status = 'pending';
  };

-- When chunks are created, auto-trigger the embedding agent
DEFINE EVENT trigger_embedding ON TABLE chunk ASYNC
  WHEN $event = 'CREATE'
  THEN {
    CREATE agent_task SET
      task_type = 'embed_chunk',
      payload = { chunk_id: $after.id, content: $after.content },
      status = 'pending';
  };
```

### 5. Comparison table
| Feature | Kafka/Redis Pub/Sub | SurrealDB LIVE SELECT |
|---|---|---|
| Extra infrastructure | Yes (broker cluster) | No (same DB) |
| Message persistence | Kafka yes, Redis no | Yes (it's a table) |
| Query filtering | Limited | Full SurrealQL WHERE |
| ACID with data | No (separate system) | Yes (same transaction) |
| Scale limit | Very high | Moderate (hundreds of subscriptions, not thousands) |
| Best for | High-throughput event streaming | Agent coordination, reactive workflows |

### 6. Callout
"Use this pattern when you have fewer than ~50 agents coordinating around shared data. For high-throughput event streaming (thousands of events/sec), a dedicated broker is still the right call. For agent coordination where the data and the messages live in the same place, LIVE SELECT eliminates an entire infrastructure layer."

## Rules
- Match the existing file's formatting (read it first)
- Use the JS SDK patterns already in the file (async iterator, Table import from surrealdb)
- No em dashes
- Keep it under 120 lines
- The existing LIVE SELECT content stays as-is. This new section is specifically about the agent coordination use case.
```

---

## Item 8: Evaluate Agno Integration (SAVE FOR LATER)

**Status:** Save for later
**Context:** The deep research (Finding F6, Confidence 4/5) found that Agno has a native SurrealDB memory provider inside Agent OS. This could be an alternative to the current Spectron-based approach. Needs evaluation before committing.
**When to run:** After items 4-7 are done and you've had time to use the patterns in a real project.

**Prompt (save, don't run yet):**

```
Evaluate whether Agno's native SurrealDB memory provider is a better fit than our current Spectron approach for agent memory.

## Context
We currently use Spectron (SurrealDB's agent memory layer) with 5 memory types: working, semantic, episodic, procedural, preference. Schemas are in:
~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md
~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-spectron.md

Agno (https://github.com/agno-agi/agno) is a multi-model agent framework that has a native SurrealDB memory provider inside its "Agent OS" layer.

## What I need
1. Research Agno's SurrealDB memory provider: what memory types does it support? How does its schema compare to our Spectron schemas?
2. Compare features side by side:
   | Feature | Spectron (current) | Agno Memory |
   |---|---|---|
   | Memory types | 5 (working, semantic, episodic, procedural, preference) | ? |
   | Bi-temporal versioning | Yes | ? |
   | Autonomous connection discovery | Yes | ? |
   | Multi-agent shared memory | Yes | ? |
   | Framework lock-in | None (raw SurrealQL) | Agno framework |
3. Recommendation: stick with Spectron, switch to Agno, or hybrid (use Agno's framework with our schemas)?
4. If hybrid is recommended, show what the integration would look like in TypeScript.

## Output
Write findings to ~/Sites/Global/scott-toolkit/docs/agno-vs-spectron-evaluation.md
```

---

## Item 9: Benchmark Agent Workloads (SAVE FOR LATER)

**Status:** Save for later
**Context:** The deep research flagged maturity risks (Finding F7, Confidence 4/5) and unverified performance claims (Finding F8, Confidence 3/5). Before building production agent systems, we should verify that SurrealDB v3 can actually handle the patterns we're designing.
**When to run:** Before deploying any agent system to production (Advosy or Bresco).

**Prompt (save, don't run yet):**

```
Benchmark SurrealDB v3 agent workload patterns against our actual use cases.

## Prerequisites
- SurrealDB v3 running locally (start-surreal.sh in the toolkit)
- Enough test data to be meaningful (1000+ records per table)

## What to test

### Test 1: Hybrid RAG Query Performance
Using the entity-first and similarity-first patterns from:
~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md

Generate 1000 chunk records with random 1536-dim embeddings, 100 entities with relationships. Time:
- Pure vector search (KNN only)
- Entity-first hybrid (graph then vector)
- Similarity-first hybrid (vector then graph)
- Full context layer loop (read + write in one transaction)

### Test 2: Live Query Scalability
Using the agent coordination patterns from:
~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-realtime.md

Open N simultaneous LIVE SELECT subscriptions (N = 5, 10, 25, 50). Measure:
- Time to receive push notification after INSERT
- Memory usage per subscription
- Any dropped notifications under load

### Test 3: Concurrent Agent Writes
Simulate 5 agents writing to shared memory tables simultaneously:
- Each agent writes 100 records in rapid succession
- Check for transaction conflicts
- Measure throughput (records/sec)

## Output
1. A benchmark results table with timing data
2. Pass/fail assessment for each pattern at Advosy scale (~10 reps, ~1000 leads)
3. Any issues or bottlenecks discovered
4. Write results to ~/Sites/Global/scott-toolkit/docs/surrealdb-agent-benchmarks.md
```
