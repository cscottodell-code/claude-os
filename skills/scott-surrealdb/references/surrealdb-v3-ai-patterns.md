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

## Spectron: Agent Memory System

**Full reference:** `surrealdb-v3-spectron.md` (schemas, bi-temporal versioning, connection discovery, multi-agent permissions, Eleanor integration)

Spectron provides 5 memory types (working, semantic, episodic, procedural, preference) that run on the same SurrealDB instance. The Context Layer Loop above uses `working_memory` and `semantic_memory` from Spectron. See the dedicated file for all schemas and patterns.

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
