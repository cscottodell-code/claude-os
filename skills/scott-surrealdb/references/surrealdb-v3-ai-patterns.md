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
