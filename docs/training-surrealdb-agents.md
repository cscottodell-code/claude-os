# SurrealDB Agent Training Walkthrough for Brett

Welcome to SurrealDB for AI agents. You're learning a database that handles vectors, graphs, and real-time updates in one engine. Think of it like a spreadsheet that knows geometry, remembers relationships, and tells you when something changes.

This walkthrough is hands-on. Each section has a SurrealQL exercise you can run against a local SurrealDB instance.

---

## 1. Vector Search Basics

### What we're building

You'll embed text as vectors and find similar items using KNN (k-nearest neighbors) search. This is how search engines find relevant documents or how recommendation systems say "users who liked this also liked that."

### Why it matters

For Advosy or Bresco, you might search a knowledge base of sales strategies, past calls, or customer preferences. Instead of keyword matching ("does this field contain the word 'conversion'?"), you search by meaning ("find strategies similar to this situation").

### The pattern

See **HNSW Indexes** and **KNN Search Syntax** sections in ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-vector-search.md.

HNSW is the index type (Hierarchical Navigable Small World). SurrealDB v3 uses HNSW, not MTREE. The KNN search uses the `<|K, EF|>` operator where K is how many results you want and EF is how thoroughly to search.

**Note on dimensions:** Real embeddings from OpenAI are 1536 numbers long. For these exercises we use 36-number fake vectors so the code is readable. In production, you'd set `DIMENSION 1536`.

### Try it

Copy this into your SurrealDB shell:
```surql
DEFINE TABLE chunks SCHEMAFULL;
DEFINE FIELD content ON chunks TYPE string;
DEFINE FIELD embedding ON chunks TYPE array;

DEFINE INDEX chunks_vec ON chunks FIELDS embedding
  HNSW DIMENSION 36 TYPE F32 DIST COSINE;

INSERT INTO chunks [
  {
    id: 'chunk:1',
    content: 'Scott is Head of Sales at Advosy, managing lead conversion and team strategy.',
    embedding: [0.1, 0.2, 0.3, 0.4, 0.15, 0.25, 0.35, 0.45, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.15, 0.25, 0.35, 0.45, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41]
  },
  {
    id: 'chunk:2',
    content: 'Lead scoring requires analyzing engagement metrics and email opens.',
    embedding: [0.11, 0.21, 0.31, 0.41, 0.14, 0.24, 0.34, 0.44, 0.13, 0.23, 0.33, 0.43, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41, 0.1, 0.2, 0.3, 0.4, 0.15, 0.25, 0.35, 0.45, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41]
  },
  {
    id: 'chunk:3',
    content: 'Database performance matters when you have millions of records and real-time queries.',
    embedding: [0.05, 0.15, 0.25, 0.35, 0.14, 0.24, 0.34, 0.44, 0.13, 0.23, 0.33, 0.43, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41, 0.1, 0.2, 0.3, 0.4, 0.15, 0.25, 0.35, 0.45, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41]
  }
];

LET $query_vec = [0.12, 0.22, 0.32, 0.42, 0.15, 0.25, 0.35, 0.45, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.15, 0.25, 0.35, 0.45, 0.12, 0.22, 0.32, 0.42, 0.11, 0.21, 0.31, 0.41];

SELECT content, vector::distance::knn() AS dist
FROM chunks
WHERE embedding <|2, 40|> $query_vec
ORDER BY dist ASC;
```

### Check yourself

You should get 2 results (K=2). The first result's `dist` value should be smaller (more similar). The embedding vectors in the example are fake for demo purposes, but in real use they'd come from an LLM like OpenAI.

---

## 2. Graph + Vector (The Killer Feature)

### What we're building

You'll create entities, relate them with edges, then search for similar items AND their neighbors in one query. This combines what a search engine does (find similar docs) with what a social network does (find connections).

### Why it matters

For Advosy, imagine a scenario: "Find sales strategies similar to this one AND show me what campaigns have used those strategies." A traditional stack requires two separate queries in two databases. SurrealDB does this in one.

### The pattern

See **Graph + Vector Traversal** section in ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md.

The pattern is:
1. Find similar entities with vector search (`WHERE embedding <|K, EF|>`)
2. Traverse relationships with graph syntax (`->relationship->table`)
3. Combine both in one query

### Try it
```surql
DEFINE TABLE entity SCHEMAFULL;
DEFINE FIELD name ON entity TYPE string;
DEFINE FIELD type ON entity TYPE string;
DEFINE FIELD embedding ON entity TYPE array;

DEFINE INDEX entity_vec ON entity FIELDS embedding
  HNSW DIMENSION 36 TYPE F32 DIST COSINE;

DEFINE TABLE related_to TYPE RELATION IN entity OUT entity ENFORCED;

CREATE entity:lead_qual SET
  name = 'Lead Qualification Strategy',
  type = 'strategy',
  embedding = [0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4];

CREATE entity:cold_call SET
  name = 'Cold Calling Playbook',
  type = 'strategy',
  embedding = [0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41, 0.11, 0.21, 0.31, 0.41];

CREATE entity:campaign_a SET
  name = 'Campaign Q2 2026',
  type = 'campaign',
  embedding = [0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4, 0.1, 0.2, 0.3, 0.4];

RELATE entity:lead_qual->related_to->entity:campaign_a SET confidence = 0.9;
RELATE entity:cold_call->related_to->entity:campaign_a SET confidence = 0.7;

LET $query = [0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40, 0.10, 0.20, 0.30, 0.40];

SELECT name, type, vector::distance::knn() AS dist, ->related_to->entity.name AS related_campaigns
FROM entity
WHERE embedding <|2, 40|> $query AND type = 'strategy'
ORDER BY dist ASC;
```

### Check yourself
The result should show "Lead Qualification Strategy" with a `related_campaigns` array containing "Campaign Q2 2026" and a `dist` value near 0. You've combined vector similarity with graph traversal.

---

## 3. Agent Memory with Spectron

### What we're building

You'll create the 5 memory types that AI agents use: working (temporary), semantic (facts), episodic (events), procedural (how-to), and preference (opinions). This is agent brainpower. Without these, an agent forgets everything between conversations.

### Why it matters

For Bresco or Advosy, your agent needs to remember: "This customer prefers email over calls" (preference), "We closed this deal last month" (episodic), "Here's how we handle objections" (procedural), "This rep is new" (semantic), and "We're currently discussing ROI" (working).

### The pattern

See **The 5 Memory Types** in ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-spectron.md and **Agent Memory Patterns** in ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md.

Spectron gives you structured memory tables. Each memory type has a specific purpose and lifespan.

### Try it

```surql
DEFINE TABLE semantic_memory SCHEMAFULL;
DEFINE FIELD agent_id ON semantic_memory TYPE string;
DEFINE FIELD subject ON semantic_memory TYPE string;
DEFINE FIELD predicate ON semantic_memory TYPE string;
DEFINE FIELD object ON semantic_memory TYPE string;
DEFINE FIELD confidence ON semantic_memory TYPE float DEFAULT 1.0;
DEFINE TABLE episodic_memory SCHEMAFULL;
DEFINE FIELD agent_id ON episodic_memory TYPE string;
DEFINE FIELD event_type ON episodic_memory TYPE string;
DEFINE FIELD description ON episodic_memory TYPE string;
DEFINE FIELD occurred_at ON episodic_memory TYPE datetime;
DEFINE FIELD importance ON episodic_memory TYPE float DEFAULT 0.5;

DEFINE TABLE procedural_memory SCHEMAFULL;
DEFINE FIELD agent_id ON procedural_memory TYPE string;
DEFINE FIELD task_name ON procedural_memory TYPE string;
DEFINE FIELD steps ON procedural_memory TYPE array<string>;

DEFINE TABLE preference_memory SCHEMAFULL;
DEFINE FIELD agent_id ON preference_memory TYPE string;
DEFINE FIELD user_id ON preference_memory TYPE string;
DEFINE FIELD preference ON preference_memory TYPE string;
DEFINE FIELD strength ON preference_memory TYPE float DEFAULT 0.8;

DEFINE TABLE working_memory SCHEMAFULL;
DEFINE FIELD agent_id ON working_memory TYPE string;
DEFINE FIELD session_id ON working_memory TYPE string;
DEFINE FIELD key ON working_memory TYPE string;
DEFINE FIELD value ON working_memory TYPE any;

CREATE semantic_memory SET
  agent_id = 'test-agent',
  subject = 'Scott',
  predicate = 'works_at',
  object = 'Advosy',
  confidence = 1.0;

CREATE episodic_memory SET
  agent_id = 'test-agent',
  event_type = 'meeting',
  description = 'Discussed Q2 strategy with Brett',
  occurred_at = time::now(),
  importance = 0.8;

CREATE procedural_memory SET
  agent_id = 'test-agent',
  task_name = 'Deploy to Production',
  steps = ['Push to GitHub', 'Coolify detects and deploys', 'Check logs'];

CREATE preference_memory SET
  agent_id = 'test-agent',
  user_id = 'scott',
  preference = 'Uses pnpm over npm',
  strength = 0.95;

CREATE working_memory SET
  agent_id = 'test-agent',
  session_id = 'session-001',
  key = 'current_task',
  value = 'Learning SurrealDB';

-- SurrealQL has no UNION keyword. Query each table separately.
SELECT * FROM semantic_memory WHERE agent_id = 'test-agent';
SELECT * FROM episodic_memory WHERE agent_id = 'test-agent';
SELECT * FROM procedural_memory WHERE agent_id = 'test-agent';
SELECT * FROM preference_memory WHERE agent_id = 'test-agent';
SELECT * FROM working_memory WHERE agent_id = 'test-agent';
```

### Check yourself

You should see 5 separate result sets, one for each memory type. All have `agent_id = 'test-agent'`. This is the foundation of an agent's persistent memory.

---

## 4. Real-Time Agent Coordination

### What we're building

You'll subscribe to a table with LIVE SELECT. When someone inserts data in one connection, your subscription sees it instantly. No polling. This is how one agent tells another agent "I have work for you."

### Why it matters

Imagine two agents: one extracts entities from documents, another trains a classifier on those entities. The second agent shouldn't repeatedly query "is there new data yet?" That's wasteful. Instead, it subscribes. When the first agent finishes extraction, the second agent wakes up automatically.

### The pattern

See **Live Queries (Real-Time Subscriptions)** in ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-realtime.md, specifically the section on **Agent-to-Agent Coordination with LIVE SELECT**.

LIVE SELECT creates a persistent connection. When data changes, the change pushes to all subscribers.

### Try it
This exercise requires two SurrealDB connections. You can simulate this in your terminal by opening two shells.

**Connection 1 (Subscriber):**

```surql
DEFINE TABLE agent_output SCHEMAFULL;
DEFINE FIELD agent_id ON agent_output TYPE string;
DEFINE FIELD result ON agent_output TYPE string;
DEFINE FIELD created_at ON agent_output TYPE datetime DEFAULT time::now();

LIVE SELECT * FROM agent_output WHERE agent_id = 'agent_a';
```

Leave this connection open (it's listening).

**Connection 2 (Producer):**

```surql
INSERT INTO agent_output {
  agent_id: 'agent_a',
  result: 'Extraction complete'
};

INSERT INTO agent_output {
  agent_id: 'agent_a',
  result: 'Training started'
};
```
### Check yourself

In Connection 1, you should see two LIVE notifications arrive as you insert into Connection 2. The subscription didn't need to poll.

---

## 5. Putting It Together: A Mini Agent Loop

### What we're building

A single SurrealQL transaction that reads context (semantic memory), makes a decision (hardcoded for demo), and writes results back (episodic memory). This is the full read-reason-write cycle.

### Why it matters

This is how agents work: gather information, pass it to an LLM for reasoning (outside SurrealDB), then write back what the LLM decided. Because it's all in one transaction, you never have stale reads or orphaned writes.

### The pattern

See **The Context Layer Loop** in ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md, specifically the **Full Loop as a Transaction** example.

The three steps:
1. READ: Fetch context from semantic and episodic memory
2. REASON: Pass to LLM (simulated here)
3. WRITE: Save the response and update memory

### Try it

```surql
-- Ensure tables exist (run these before the transaction)
DEFINE TABLE IF NOT EXISTS semantic_memory SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS agent_id ON semantic_memory TYPE string;
DEFINE FIELD IF NOT EXISTS subject ON semantic_memory TYPE string;
DEFINE FIELD IF NOT EXISTS predicate ON semantic_memory TYPE string;
DEFINE FIELD IF NOT EXISTS object ON semantic_memory TYPE string;

DEFINE TABLE IF NOT EXISTS episodic_memory SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS agent_id ON episodic_memory TYPE string;
DEFINE FIELD IF NOT EXISTS event_type ON episodic_memory TYPE string;
DEFINE FIELD IF NOT EXISTS description ON episodic_memory TYPE string;
DEFINE FIELD IF NOT EXISTS occurred_at ON episodic_memory TYPE datetime;

-- Now run the agent loop as a transaction
BEGIN TRANSACTION;

-- STEP 1: READ CONTEXT
LET $context = SELECT subject, predicate, object
  FROM semantic_memory
  WHERE agent_id = 'test-agent'
  LIMIT 3;

-- STEP 2: REASON (simulated, normally goes to LLM)
LET $decision = 'Proceed with lead qualification';

-- STEP 3: WRITE RESULTS
CREATE episodic_memory SET
  agent_id = 'test-agent',
  event_type = 'decision',
  description = $decision,
  occurred_at = time::now();

COMMIT TRANSACTION;

-- Verify the write
SELECT * FROM episodic_memory WHERE agent_id = 'test-agent' ORDER BY occurred_at DESC LIMIT 1;
```

**Note:** The DEFINE statements run outside the transaction because schema definitions and data operations don't mix well in a single transaction. In production, your schema is defined once at setup time. The transaction wraps only the read-reason-write cycle.

### Check yourself

You should see one new episodic_memory record with the description 'Proceed with lead qualification'. The entire transaction committed atomically, so the read and write are guaranteed consistent.

---

## Next Steps

You've now learned:

1. Vector search for semantic similarity
2. Combining vectors with graph traversal
3. Five types of agent memory
4. Real-time subscriptions between agents
5. The full agent loop in one transaction

Each of these is covered in depth in the reference files. Open them alongside SurrealDB and start building. The best way to learn is by experimenting with your own data.

### Reference File Paths

- Vector search: ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-vector-search.md
- Graph + vector patterns: ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-ai-patterns.md
- Spectron memory: ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-spectron.md
- Real-time queries: ~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-realtime.md

---

## Key SurrealDB v3 Syntax to Remember

- **HNSW indexes** (not MTREE): `HNSW DIMENSION <size> TYPE F32 DIST COSINE` (1536 for OpenAI, 36 in our exercises)
- **KNN search**: `WHERE embedding <|K, EF|> $vector`
- **Cosine similarity**: `vector::similarity::cosine(vec1, vec2)`
- **Graph traversal**: `->relationship->table` and `<-relationship<-table`
- **LIVE SELECT**: Real-time subscriptions push changes to clients
- **RELATE**: Create relationship edges between records
- **SPECTRON**: 5 memory types (working, semantic, episodic, procedural, preference)
- **Transactions**: `BEGIN TRANSACTION; ... COMMIT TRANSACTION;`

The database knows about meaning, relationships, and time. Use it.