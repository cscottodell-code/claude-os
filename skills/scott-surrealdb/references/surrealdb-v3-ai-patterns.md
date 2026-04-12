# SurrealDB v3: AI Patterns & Agent Architecture

> Extracted from `surrealdb-v3-master-reference.md` (sections 7, 21, and related) with expanded AI-specific patterns.
> This file is self-contained. For the full reference, see the master file.

---

## Why SurrealDB for AI

SurrealDB is uniquely suited for AI applications because it combines capabilities that normally require 3-4 separate tools:

| AI Need | Traditional Stack | SurrealDB |
|---|---|---|
| Vector similarity | Pinecone/Weaviate | HNSW indexes |
| Knowledge graph | Neo4j | RELATE + graph traversal |
| Structured data | Postgres | SCHEMAFULL tables |
| Real-time updates | Redis pub/sub | LIVE SELECT |
| Agent memory | Mem0/custom | Spectron |

The killer advantage: **graph + vector in one query**. No other database does this natively.

---

## RAG (Retrieval-Augmented Generation) Schema

### Basic RAG Knowledge Base

```surql
-- Documents table
DEFINE TABLE document SCHEMAFULL;
DEFINE FIELD title ON document TYPE string;
DEFINE FIELD url ON document TYPE option<string>;
DEFINE FIELD ingested_at ON document TYPE datetime DEFAULT time::now() READONLY;

-- Chunks table (the actual searchable units)
DEFINE TABLE chunk SCHEMAFULL;
DEFINE FIELD content ON chunk TYPE string;
DEFINE FIELD document ON chunk TYPE record<document>;
DEFINE FIELD chunk_index ON chunk TYPE int;
DEFINE FIELD embedding ON chunk TYPE array;
DEFINE FIELD token_count ON chunk TYPE int;
DEFINE FIELD metadata ON chunk TYPE object FLEXIBLE;

DEFINE INDEX chunk_vec ON chunk FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;

-- Relation: document has chunks
DEFINE TABLE has_chunk TYPE RELATION IN document OUT chunk ENFORCED;
```

### RAG with Source Tracking

```surql
-- Query with source attribution
LET $results = SELECT
  content,
  document.title AS source_title,
  document.url AS source_url,
  vector::distance::knn() AS dist
FROM chunk
WHERE embedding <|5, 40|> $query_vec
ORDER BY dist ASC;

RETURN $results;
```

### Multi-Modal RAG (text + structured data)

```surql
-- Combine vector search with graph traversal
-- "Find relevant docs AND related entities"
LET $chunks = SELECT *, vector::distance::knn() AS dist
  FROM chunk WHERE embedding <|5, 40|> $query_vec ORDER BY dist ASC;

LET $related = SELECT ->mentions->entity.* FROM $chunks;

RETURN { chunks: $chunks, entities: $related };
```

### Hybrid RAG: Two Query Strategies

The Multi-Modal and Hop-and-Search examples above are both instances of a broader pattern: combining graph traversal with vector search. The question is which one you start with. Pick the strategy based on what you know at query time.

| Question | Use Entity-First | Use Similarity-First |
|---|---|---|
| Do I know the entity? | Yes | No |
| Is my query structured? | Yes | No, it's natural language |
| Am I exploring or retrieving? | Retrieving | Exploring |
| Example | "Get all docs about [X]" | "How do we handle [situation]?" |

#### Pattern 1: Entity-First (Graph to Vector)

**When to use:** You know WHAT you're looking for (a specific entity, relationship, or structured attribute), but need to find RELATED unstructured content.

**Example:** "What do we know about Advosy's lead conversion process?" Start from the entity "Advosy" + relationship "lead_conversion", traverse graph, THEN vector-search for related chunks.

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

RETURN { entity: $entity, graph_context: $related, vector_enriched: $enriched };
```

#### Pattern 2: Similarity-First (Vector to Graph)

**When to use:** You DON'T know what entity you need. You have a vague question or natural language query, and want to discover structure.

**Example:** "How should we handle homeowners who say they need to think about it?" Vector search finds relevant chunks, THEN graph traversal discovers the entities and relationships those chunks connect to.

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
  id, name, type, mention_count,
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

---

## Agent Memory Patterns

### Conversation History

```surql
DEFINE TABLE conversation SCHEMAFULL;
DEFINE FIELD agent_id ON conversation TYPE string;
DEFINE FIELD user_id ON conversation TYPE string;
DEFINE FIELD started_at ON conversation TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD summary ON conversation TYPE option<string>;

DEFINE TABLE message SCHEMAFULL;
DEFINE FIELD conversation ON message TYPE record<conversation>;
DEFINE FIELD role ON message TYPE string ASSERT $value IN ['user', 'assistant', 'system', 'tool'];
DEFINE FIELD content ON message TYPE string;
DEFINE FIELD embedding ON message TYPE option<array>;
DEFINE FIELD token_count ON message TYPE int;
DEFINE FIELD created_at ON message TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD metadata ON message TYPE object FLEXIBLE;

DEFINE INDEX msg_embedding ON message FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;

-- Quick lookup by conversation
DEFINE INDEX msg_conv ON message FIELDS conversation;
```

### Long-Term Memory (Entity Extraction)

```surql
DEFINE TABLE entity SCHEMAFULL;
DEFINE FIELD name ON entity TYPE string;
DEFINE FIELD type ON entity TYPE string ASSERT $value IN ['person', 'company', 'concept', 'preference', 'fact'];
DEFINE FIELD embedding ON entity TYPE option<array>;
DEFINE FIELD first_seen ON entity TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD last_referenced ON entity TYPE datetime VALUE time::now();
DEFINE FIELD mention_count ON entity TYPE int DEFAULT 1;

DEFINE INDEX entity_vec ON entity FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;

-- Relationships between entities
DEFINE TABLE related_to TYPE RELATION IN entity OUT entity;
DEFINE FIELD relationship ON related_to TYPE string;
DEFINE FIELD confidence ON related_to TYPE float;
DEFINE FIELD discovered_at ON related_to TYPE datetime DEFAULT time::now() READONLY;
```

---

## Graph + Vector Traversal

This is the pattern that makes SurrealDB special for AI. Instead of just finding "similar documents," you can traverse the knowledge graph to find contextually relevant information.

```surql
-- Step 1: Find relevant entities via vector similarity
LET $relevant = SELECT id, name FROM entity
  WHERE embedding <|3, 40|> $query_vec
  ORDER BY vector::distance::knn() ASC;

-- Step 2: Traverse graph to find connected knowledge
LET $context = SELECT
  <-mentions<-chunk.content AS source_chunks,
  ->related_to->entity.{ name, type } AS related_entities
FROM $relevant;

-- Step 3: Get additional chunks related to connected entities
LET $expanded = SELECT content FROM chunk
  WHERE ->mentions->entity IN $relevant.->related_to->entity
  LIMIT 10;

RETURN { direct: $relevant, context: $context, expanded: $expanded };
```

### Pattern: "Hop and Search"

```surql
-- Find similar items, then traverse their relationships
LET $similar = SELECT id FROM product
  WHERE embedding <|5, 40|> $query_vec;

-- Hop to related products via purchase history
LET $also_bought = SELECT ->purchased_with->product.* FROM $similar;

-- Combine with vector similarity for ranking
SELECT *, vector::similarity::cosine(embedding, $query_vec) AS relevance
FROM $also_bought
ORDER BY relevance DESC
LIMIT 10;
```

---

## The Context Layer Loop

The context layer loop is the core execution cycle for any agent backed by SurrealDB. It ties together the vector search, graph traversal, and memory patterns above into a single, repeatable workflow. Because SurrealDB handles documents, graphs, and vectors in one engine, the entire read-reason-write cycle can run inside a single transaction. That means no stale reads between your vector store and your graph database, no orphaned writes when one system succeeds and another fails, and no glue code trying to keep Pinecone, Neo4j, and Postgres in sync.

The loop has three steps:

1. **Read context** - One SurrealQL query combines vector search + graph traversal + memory lookup. This replaces 3 separate database calls in a traditional stack.
2. **Reason** - Pass the assembled context to the LLM. This step happens outside SurrealDB.
3. **Write results** - Atomically write back the agent's response, any new entities extracted, updated memory, and relationship edges. All in one transaction.

### Full Loop as a Transaction

```surql
BEGIN TRANSACTION;

-- STEP 1: READ CONTEXT
-- Vector search on chunks for relevant knowledge
LET $chunks = SELECT id, content, vector::distance::knn() AS dist
  FROM chunk
  WHERE embedding <|5, 40|> $query_vec
  ORDER BY dist ASC;

-- Graph hop to entities mentioned in those chunks
LET $entities = SELECT ->mentions->entity.{ id, name, type } AS entities
  FROM $chunks;

-- Fetch working memory for this session
LET $memory = SELECT key, value FROM working_memory
  WHERE session_id = $session_id
  AND agent_id = $agent_id;

-- (LLM reasoning happens here, outside the database.
--  The application sends $chunks, $entities, and $memory to the LLM,
--  then uses the LLM's response in the write step below.)

-- STEP 3: WRITE RESULTS
-- Save the agent's response
CREATE message SET
  conversation = $conversation_id,
  role = 'assistant',
  content = $llm_response,
  token_count = $response_tokens,
  created_at = time::now();

-- Create or update entities the LLM extracted
LET $new_entity = CREATE entity SET
  name = $extracted_name,
  type = $extracted_type,
  embedding = $entity_embedding,
  mention_count = 1;

-- Connect the new entity to existing ones
RELATE $new_entity->related_to->$existing_entity_id SET
  relationship = $relationship_label,
  confidence = $confidence_score,
  discovered_at = time::now();

-- Update working memory with current task state
UPDATE working_memory SET value = $updated_value
  WHERE session_id = $session_id
  AND agent_id = $agent_id
  AND key = 'current_context';

COMMIT TRANSACTION;
```

### Traditional Stack vs Context Layer

| Step | Traditional Stack | Context Layer (SurrealDB) |
|---|---|---|
| Vector search | Call Pinecone API | `SELECT ... WHERE embedding <\|5, 40\|> $vec` |
| Graph traversal | Call Neo4j API | `->mentions->entity` in the same query |
| Memory lookup | Query Postgres / Redis | `SELECT FROM working_memory` in the same query |
| Write response | INSERT into Postgres | `CREATE message` in the same transaction |
| Store entities | INSERT into Neo4j | `CREATE entity` in the same transaction |
| Link relationships | CREATE in Neo4j | `RELATE` in the same transaction |
| Sync guarantee | Hope nothing fails mid-way | ACID transaction, all or nothing |

> **Why this works:** This pattern works because SurrealDB combines document, graph, and vector in one engine. If you need to split the read and write across different databases, the atomicity guarantee breaks. One failed write leaves your knowledge graph out of sync with your memory store, and you are stuck writing reconciliation logic instead of agent logic.

---

## Spectron: SurrealDB's Agent Memory System

**Status: ADOPTED in Scott's stack** (actively using, not just watching)

Spectron is SurrealDB's structured memory system for AI agents. It runs on top of SurrealDB and provides 5 memory types, knowledge graphs, and temporal reasoning.

### The 5 Memory Types

| Memory Type | What It Stores | Example | Persistence |
|---|---|---|---|
| **Working** | Current task context, active goals, recent messages | "User is asking about lead conversion rates" | Session-scoped |
| **Semantic** | Facts, knowledge, learned information | "Scott is Head of Sales at Advosy" | Permanent |
| **Episodic** | Past events, interactions, outcomes | "On 2026-03-15, we debugged a SurrealDB connection issue" | Permanent |
| **Procedural** | How to do things, workflows, patterns | "To deploy on Coolify: push to GitHub, Coolify auto-deploys" | Permanent |
| **Preference** | User preferences, style, opinions | "Scott prefers pnpm over npm" | Permanent, updatable |

### Schema for Each Memory Type

```surql
-- Working Memory (session-scoped, ephemeral)
DEFINE TABLE working_memory SCHEMAFULL;
DEFINE FIELD agent_id ON working_memory TYPE string;
DEFINE FIELD session_id ON working_memory TYPE string;
DEFINE FIELD key ON working_memory TYPE string;
DEFINE FIELD value ON working_memory TYPE any;
DEFINE FIELD created_at ON working_memory TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD expires_at ON working_memory TYPE option<datetime>;

-- Semantic Memory (facts and knowledge)
DEFINE TABLE semantic_memory SCHEMAFULL;
DEFINE FIELD agent_id ON semantic_memory TYPE string;
DEFINE FIELD subject ON semantic_memory TYPE string;
DEFINE FIELD predicate ON semantic_memory TYPE string;
DEFINE FIELD object ON semantic_memory TYPE string;
DEFINE FIELD confidence ON semantic_memory TYPE float DEFAULT 1.0;
DEFINE FIELD source ON semantic_memory TYPE option<string>;
DEFINE FIELD embedding ON semantic_memory TYPE option<array>;
DEFINE FIELD valid_from ON semantic_memory TYPE datetime DEFAULT time::now();
DEFINE FIELD valid_until ON semantic_memory TYPE option<datetime>;
DEFINE FIELD recorded_at ON semantic_memory TYPE datetime DEFAULT time::now() READONLY;

DEFINE INDEX sem_vec ON semantic_memory FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;

-- Episodic Memory (events and interactions)
DEFINE TABLE episodic_memory SCHEMAFULL;
DEFINE FIELD agent_id ON episodic_memory TYPE string;
DEFINE FIELD event_type ON episodic_memory TYPE string;
DEFINE FIELD description ON episodic_memory TYPE string;
DEFINE FIELD participants ON episodic_memory TYPE array<string>;
DEFINE FIELD outcome ON episodic_memory TYPE option<string>;
DEFINE FIELD embedding ON episodic_memory TYPE option<array>;
DEFINE FIELD occurred_at ON episodic_memory TYPE datetime;
DEFINE FIELD recorded_at ON episodic_memory TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD importance ON episodic_memory TYPE float DEFAULT 0.5;

DEFINE INDEX epi_vec ON episodic_memory FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;

-- Procedural Memory (how-to knowledge)
DEFINE TABLE procedural_memory SCHEMAFULL;
DEFINE FIELD agent_id ON procedural_memory TYPE string;
DEFINE FIELD task_name ON procedural_memory TYPE string;
DEFINE FIELD steps ON procedural_memory TYPE array<string>;
DEFINE FIELD preconditions ON procedural_memory TYPE option<array<string>>;
DEFINE FIELD success_rate ON procedural_memory TYPE float DEFAULT 1.0;
DEFINE FIELD last_used ON procedural_memory TYPE datetime VALUE time::now();
DEFINE FIELD embedding ON procedural_memory TYPE option<array>;

DEFINE INDEX proc_vec ON procedural_memory FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;

-- Preference Memory (user preferences)
DEFINE TABLE preference_memory SCHEMAFULL;
DEFINE FIELD agent_id ON preference_memory TYPE string;
DEFINE FIELD user_id ON preference_memory TYPE string;
DEFINE FIELD category ON preference_memory TYPE string;
DEFINE FIELD preference ON preference_memory TYPE string;
DEFINE FIELD strength ON preference_memory TYPE float DEFAULT 0.8;
DEFINE FIELD evidence ON preference_memory TYPE option<array<string>>;
DEFINE FIELD updated_at ON preference_memory TYPE datetime VALUE time::now();
```

### Bi-Temporal Versioning

Spectron tracks two time dimensions for every fact:
1. **Valid time** (`valid_from` / `valid_until`): When the fact was actually true in the real world
2. **Transaction time** (`recorded_at`): When the fact was recorded in the system

This enables temporal reasoning:

```surql
-- "What did we know about Scott's role as of March 2026?"
SELECT * FROM semantic_memory
WHERE subject = 'Scott'
AND predicate = 'role'
AND valid_from <= d'2026-03-15T00:00:00Z'
AND (valid_until IS NONE OR valid_until > d'2026-03-15T00:00:00Z')
ORDER BY recorded_at DESC
LIMIT 1;

-- "What facts have been superseded?" (corrections/updates)
SELECT * FROM semantic_memory
WHERE subject = 'Scott'
AND predicate = 'role'
AND valid_until IS NOT NONE
ORDER BY valid_from DESC;
```

### Autonomous Connection Discovery

Spectron finds relationships between entities from separate conversations automatically. This means if you mention "Advosy" in one conversation and "home services" in another, Spectron can connect them.

```surql
-- The system discovers connections by:
-- 1. Embedding all memories
-- 2. Finding semantically similar memories across conversations
-- 3. Creating relationship edges automatically

-- Manual trigger for connection discovery
LET $unconnected = SELECT * FROM semantic_memory
  WHERE ->related_to->semantic_memory IS NONE
  AND embedding IS NOT NONE;

FOR $mem IN $unconnected {
  LET $similar = SELECT id FROM semantic_memory
    WHERE id != $mem.id
    AND embedding <|3, 40|> $mem.embedding
    ORDER BY vector::distance::knn() ASC;

  FOR $match IN $similar {
    RELATE $mem.id->related_to->$match.id
      SET confidence = vector::similarity::cosine($mem.embedding, $match.embedding),
          discovered_at = time::now(),
          relationship = 'semantically_similar';
  };
};
```

### Multi-Agent Shared Memory

Multiple agents can share the same memory store with ACID guarantees:

```surql
-- Each agent has its own working memory but shares long-term memory
-- Agent A writes a fact
CREATE semantic_memory SET
  agent_id = 'eleanor',
  subject = 'Project Status',
  predicate = 'current_phase',
  object = 'Milestone 2',
  source = 'gsd_session_2026_04_01';

-- Agent B queries shared memory
SELECT * FROM semantic_memory
WHERE subject = 'Project Status'
AND (agent_id = 'research_agent' OR agent_id = 'eleanor')
ORDER BY recorded_at DESC;

-- Permissions ensure agents only write to their own memories
DEFINE TABLE semantic_memory SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true  -- all agents can read
    FOR create, update WHERE $auth.agent_id = agent_id  -- only own memories
    FOR delete WHERE $auth.role = 'admin';
```

### Integration with Eleanor (Scott's AI Assistant)

Eleanor uses Spectron for persistent memory across sessions:

```surql
-- Eleanor's preference memory for Scott
CREATE preference_memory SET
  agent_id = 'eleanor',
  user_id = 'scott',
  category = 'coding',
  preference = 'Uses pnpm over npm',
  strength = 0.95,
  evidence = ['Mentioned in 12 sessions', 'Configured in CLAUDE.md'];

-- Eleanor's episodic memory of past interactions
CREATE episodic_memory SET
  agent_id = 'eleanor',
  event_type = 'debug_session',
  description = 'Helped Scott debug SurrealDB Bun SDK string coercion issue',
  participants = ['scott', 'eleanor'],
  outcome = 'Resolved: use db.query() + type::record() instead of db.create() with strings',
  occurred_at = d'2026-03-20T14:30:00Z',
  importance = 0.8;

-- Eleanor recalls relevant past interactions
LET $context = SELECT * FROM episodic_memory
  WHERE agent_id = 'eleanor'
  AND embedding <|3, 40|> $current_query_vec
  ORDER BY vector::distance::knn() ASC;
```

---

## Framework Integrations

### LangChain

SurrealDB has official LangChain integration for:
- Vector store (HNSW-backed)
- Document loader
- Memory backend

### CrewAI

Use SurrealDB as the shared memory layer for CrewAI agent teams:
- Each crew member writes to shared semantic memory
- Graph relationships track which agent discovered what
- LIVE SELECT enables real-time coordination between agents

### Other Frameworks

Official integrations exist for: LlamaIndex, AutoGen, Agno, SmolAgents

Data pipeline integrations: Airbyte, Dagster, Fivetran, n8n

---

## Decision: When to Use SurrealDB for AI vs. Dedicated Tools

| Scenario | Use SurrealDB | Use Dedicated Tool |
|---|---|---|
| Small-to-medium RAG (< 10M vectors) | Yes, HNSW | No |
| Billions of vectors | No | Pinecone, Weaviate |
| Agent memory | Yes, Spectron | No |
| Knowledge graph + vector | Yes (unique strength) | No single tool does this |
| Real-time AI updates | Yes, LIVE SELECT | No |
| Managed vector pipelines | No | Pinecone, Weaviate |
| Simple embeddings search only | Either works | Pinecone if managed preferred |

---

## Companion Files

- `surrealdb-v3-master-reference.md` - Complete reference (this file was extracted from it)
- `surrealdb-v3-vector-search.md` - HNSW indexes, KNN search, embedding patterns
- `surrealdb-v3-spectron.md` - Spectron memory system (5 types, bi-temporal, multi-agent)
- `surrealdb-v3-realtime.md` - Events, changefeeds, live queries, agent coordination
- `../../docs/training-surrealdb-agents.md` - Hands-on walkthrough for all patterns above
