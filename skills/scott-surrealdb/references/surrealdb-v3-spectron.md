# SurrealDB v3: Spectron Agent Memory System

> Extracted from `surrealdb-v3-master-reference.md` (section 21) with expanded Spectron-specific content.
> This file is self-contained. For the full reference, see the master file.

**Status: ADOPTED** in Scott's stack (actively using for Eleanor, not just evaluating)

---

## What Is Spectron?

Spectron is SurrealDB's structured memory system for AI agents. It runs on top of SurrealDB, using the same tables, permissions, and transaction model. It replaces tools like Mem0 or custom memory implementations.

**Key differentiators from other memory systems:**
- Runs inside your existing SurrealDB instance (no extra infrastructure)
- Full ACID transactions on memory operations
- Graph relationships between memories (not just flat key-value)
- Bi-temporal versioning (when facts were true AND when they were recorded)
- Automatic relationship discovery between memories from different conversations
- Multi-agent support with shared memory and permissions

---

## The 5 Memory Types

| Memory Type | What It Stores | Lifespan | Example |
|---|---|---|---|
| **Working** | Current task context, active goals, recent messages | Session-scoped (ephemeral) | "User is asking about lead conversion rates" |
| **Semantic** | Facts, knowledge, learned information | Permanent | "Scott is Head of Sales at Advosy" |
| **Episodic** | Past events, interactions, outcomes | Permanent | "On 2026-03-15, we debugged a SurrealDB connection issue" |
| **Procedural** | How to do things, workflows, patterns | Permanent | "To deploy on Coolify: push to GitHub, Coolify auto-deploys" |
| **Preference** | User preferences, style, opinions | Permanent, updatable | "Scott prefers pnpm over npm" |

### How They Work Together

Think of it like human memory:
- **Working memory** is your notepad. You write things down while working, then throw the notepad away.
- **Semantic memory** is your knowledge base. "The sky is blue." Facts that are just true.
- **Episodic memory** is your diary. "Last Tuesday, we had a great debug session." Specific events.
- **Procedural memory** is your muscle memory. "To ride a bike, you balance, pedal, steer." How-to knowledge.
- **Preference memory** is your taste profile. "I like dark mode." Personal preferences.

---

## Schema for Each Memory Type

### Working Memory (Session-Scoped)

```surql
DEFINE TABLE working_memory SCHEMAFULL;
DEFINE FIELD agent_id ON working_memory TYPE string;
DEFINE FIELD session_id ON working_memory TYPE string;
DEFINE FIELD key ON working_memory TYPE string;
DEFINE FIELD value ON working_memory TYPE any;
DEFINE FIELD created_at ON working_memory TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD expires_at ON working_memory TYPE option<datetime>;

-- Index for fast session lookup
DEFINE INDEX wm_session ON working_memory FIELDS agent_id, session_id;

-- Auto-cleanup: delete expired working memory
DEFINE EVENT cleanup_working ON working_memory
  WHEN $event = 'CREATE' AND $after.expires_at IS NOT NONE
  THEN {
    -- Note: SurrealDB doesn't have scheduled deletion yet
    -- Use Trigger.dev cron to periodically clean expired entries
  };
```

**Usage pattern:**
```surql
-- Store current task context
CREATE working_memory SET
  agent_id = 'eleanor',
  session_id = $session,
  key = 'current_task',
  value = 'Helping Scott split SurrealDB reference files',
  expires_at = time::now() + 2h;

-- Retrieve current context
SELECT * FROM working_memory
  WHERE agent_id = 'eleanor' AND session_id = $session;

-- Clear session
DELETE FROM working_memory WHERE session_id = $session;
```

### Semantic Memory (Facts and Knowledge)

```surql
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
DEFINE INDEX sem_subject ON semantic_memory FIELDS subject;
DEFINE INDEX sem_predicate ON semantic_memory FIELDS predicate;
```

**Usage pattern (SPO triples):**
```surql
-- Store a fact
CREATE semantic_memory SET
  agent_id = 'eleanor',
  subject = 'Scott',
  predicate = 'works_at',
  object = 'Advosy',
  confidence = 1.0,
  source = 'CLAUDE.md';

-- Query facts about a subject
SELECT * FROM semantic_memory
  WHERE subject = 'Scott' AND valid_until IS NONE
  ORDER BY confidence DESC;

-- Update a fact (supersede, don't delete)
UPDATE semantic_memory
  SET valid_until = time::now()
  WHERE subject = 'Scott' AND predicate = 'role' AND valid_until IS NONE;

CREATE semantic_memory SET
  agent_id = 'eleanor',
  subject = 'Scott',
  predicate = 'role',
  object = 'VP of Sales',
  source = 'conversation_2026_04_15';
```

### Episodic Memory (Events and Interactions)

```surql
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
DEFINE INDEX epi_type ON episodic_memory FIELDS event_type;
DEFINE INDEX epi_time ON episodic_memory FIELDS occurred_at;
```

**Usage pattern:**
```surql
-- Record a debug session
CREATE episodic_memory SET
  agent_id = 'eleanor',
  event_type = 'debug_session',
  description = 'Helped Scott debug SurrealDB Bun SDK string coercion issue',
  participants = ['scott', 'eleanor'],
  outcome = 'Resolved: use db.query() + type::record() instead of db.create() with strings',
  occurred_at = time::now(),
  importance = 0.8;

-- Recall similar past events
SELECT * FROM episodic_memory
  WHERE embedding <|3, 40|> $current_query_vec
  ORDER BY vector::distance::knn() ASC;

-- Recent high-importance events
SELECT * FROM episodic_memory
  WHERE importance >= 0.7
  ORDER BY occurred_at DESC
  LIMIT 10;
```

### Procedural Memory (How-To Knowledge)

```surql
DEFINE TABLE procedural_memory SCHEMAFULL;
DEFINE FIELD agent_id ON procedural_memory TYPE string;
DEFINE FIELD task_name ON procedural_memory TYPE string;
DEFINE FIELD steps ON procedural_memory TYPE array<string>;
DEFINE FIELD preconditions ON procedural_memory TYPE option<array<string>>;
DEFINE FIELD success_rate ON procedural_memory TYPE float DEFAULT 1.0;
DEFINE FIELD last_used ON procedural_memory TYPE datetime VALUE time::now();
DEFINE FIELD times_used ON procedural_memory TYPE int DEFAULT 1;
DEFINE FIELD embedding ON procedural_memory TYPE option<array>;

DEFINE INDEX proc_vec ON procedural_memory FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
DEFINE INDEX proc_task ON procedural_memory FIELDS task_name;
```

**Usage pattern:**
```surql
-- Store a procedure
CREATE procedural_memory SET
  agent_id = 'eleanor',
  task_name = 'Deploy to Coolify',
  steps = [
    'Push changes to GitHub',
    'Coolify detects push via webhook',
    'Coolify builds and deploys automatically',
    'Check deployment logs in Coolify dashboard'
  ],
  preconditions = ['GitHub repo linked to Coolify', 'Coolify webhook configured'];

-- Find relevant procedures
SELECT * FROM procedural_memory
  WHERE embedding <|3, 40|> $task_embedding_vec
  ORDER BY vector::distance::knn() ASC;

-- Track usage (success_rate adjusts over time)
UPDATE procedural_memory
  SET times_used += 1, success_rate = (success_rate * (times_used - 1) + 1.0) / times_used
  WHERE task_name = 'Deploy to Coolify';
```

### Preference Memory (User Preferences)

```surql
DEFINE TABLE preference_memory SCHEMAFULL;
DEFINE FIELD agent_id ON preference_memory TYPE string;
DEFINE FIELD user_id ON preference_memory TYPE string;
DEFINE FIELD category ON preference_memory TYPE string;
DEFINE FIELD preference ON preference_memory TYPE string;
DEFINE FIELD strength ON preference_memory TYPE float DEFAULT 0.8;
DEFINE FIELD evidence ON preference_memory TYPE option<array<string>>;
DEFINE FIELD updated_at ON preference_memory TYPE datetime VALUE time::now();

DEFINE INDEX pref_user ON preference_memory FIELDS user_id, category;
```

**Usage pattern:**
```surql
-- Store a preference
CREATE preference_memory SET
  agent_id = 'eleanor',
  user_id = 'scott',
  category = 'coding',
  preference = 'Uses pnpm over npm',
  strength = 0.95,
  evidence = ['Mentioned in 12 sessions', 'Configured in CLAUDE.md'];

-- Get all preferences for a user
SELECT * FROM preference_memory
  WHERE user_id = 'scott'
  ORDER BY strength DESC;

-- Get preferences by category
SELECT * FROM preference_memory
  WHERE user_id = 'scott' AND category = 'communication'
  ORDER BY strength DESC;

-- Strengthen a preference (more evidence)
UPDATE preference_memory
  SET strength = math::min(1.0, strength + 0.05),
      evidence += 'Confirmed preference in session 2026-04-02'
  WHERE user_id = 'scott' AND preference = 'Uses pnpm over npm';
```

---

## Bi-Temporal Versioning

Spectron tracks two time dimensions for every fact:

1. **Valid time** (`valid_from` / `valid_until`): When the fact was actually true in the real world
2. **Transaction time** (`recorded_at`): When the fact was recorded in the system

This enables temporal reasoning that most memory systems can't do.

### Examples

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

-- "Show the full history of what we've known about this"
SELECT * FROM semantic_memory
WHERE subject = 'Advosy'
ORDER BY valid_from ASC;
```

### Why This Matters for AI Agents

- **Correction handling:** When a fact is wrong, you don't delete it. You mark its valid_until and create a new record. The agent can see its own mistakes.
- **Time-travel queries:** "What did the agent believe at time T?" is answerable.
- **Confidence decay:** Facts with older valid_from and no recent reinforcement can be weighted lower.

---

## Autonomous Connection Discovery

Spectron finds relationships between entities from separate conversations automatically. If you mention "Advosy" in one conversation and "home services" in another, Spectron connects them.

### How It Works

```surql
-- Step 1: Find unconnected memories that have embeddings
LET $unconnected = SELECT * FROM semantic_memory
  WHERE ->related_to->semantic_memory IS NONE
  AND embedding IS NOT NONE;

-- Step 2: For each, find semantically similar memories
FOR $mem IN $unconnected {
  LET $similar = SELECT id, embedding FROM semantic_memory
    WHERE id != $mem.id
    AND embedding <|3, 40|> $mem.embedding
    ORDER BY vector::distance::knn() ASC;

  -- Step 3: Create relationship edges for strong matches
  FOR $match IN $similar {
    LET $sim = vector::similarity::cosine($mem.embedding, $match.embedding);
    IF $sim > 0.85 {
      RELATE $mem.id->related_to->$match.id
        SET confidence = $sim,
            discovered_at = time::now(),
            relationship = 'semantically_similar';
    };
  };
};
```

### Running Discovery

This process should run periodically (e.g., via Trigger.dev cron job) rather than on every memory write, since it's computationally expensive.

```typescript
// Trigger.dev task
export const discoverConnections = task({
  id: 'spectron-discover-connections',
  run: async () => {
    await db.query(`
      -- Run the discovery query above
    `);
  },
});

// Schedule: every 6 hours
export const connectionDiscoverySchedule = schedules.task({
  id: 'spectron-discovery-schedule',
  task: discoverConnections,
  cron: '0 */6 * * *',
});
```

---

## Multi-Agent Shared Memory

Multiple agents can share the same memory store with full ACID guarantees.

### Permission Model

```surql
-- All agents can read all long-term memory
-- Each agent can only write to its own memories
-- Admins can manage everything

DEFINE TABLE semantic_memory SCHEMAFULL
  PERMISSIONS
    FOR select WHERE true
    FOR create WHERE $auth.agent_id = agent_id
    FOR update WHERE $auth.agent_id = agent_id
    FOR delete WHERE $auth.role = 'admin';

DEFINE TABLE working_memory SCHEMAFULL
  PERMISSIONS
    FOR select WHERE $auth.agent_id = agent_id  -- working memory is private
    FOR create WHERE $auth.agent_id = agent_id
    FOR update WHERE $auth.agent_id = agent_id
    FOR delete WHERE $auth.agent_id = agent_id;
```

### Cross-Agent Knowledge Sharing

```surql
-- Agent A discovers a fact
CREATE semantic_memory SET
  agent_id = 'research_agent',
  subject = 'SurrealDB v3',
  predicate = 'supports',
  object = 'HNSW vector indexes',
  source = 'documentation_crawl';

-- Agent B queries shared knowledge
SELECT * FROM semantic_memory
  WHERE subject CONTAINS 'SurrealDB'
  ORDER BY confidence DESC;

-- Agent B can see who discovered what
SELECT agent_id, subject, predicate, object, recorded_at
  FROM semantic_memory
  WHERE subject = 'SurrealDB v3'
  ORDER BY recorded_at ASC;
```

---

## Integration with Eleanor

Eleanor is Scott's AI assistant project. Spectron serves as Eleanor's persistent memory system.

### Eleanor's Memory Architecture

```
Eleanor (Tauri + Nuxt)
  |
  | JS SDK 2.0
  v
SurrealDB v3 (Spectron tables)
  |- working_memory   (current session context)
  |- semantic_memory   (facts about Scott, projects, preferences)
  |- episodic_memory   (past interactions, debug sessions, decisions)
  |- procedural_memory (how to deploy, how to debug, workflows)
  |- preference_memory (Scott's coding style, communication preferences)
```

### Eleanor-Specific Patterns

```surql
-- Eleanor loads context at session start
LET $preferences = SELECT * FROM preference_memory
  WHERE agent_id = 'eleanor' AND user_id = 'scott'
  ORDER BY strength DESC;

LET $recent_episodes = SELECT * FROM episodic_memory
  WHERE agent_id = 'eleanor'
  AND occurred_at > time::now() - 7d
  ORDER BY importance DESC
  LIMIT 10;

LET $relevant_procedures = SELECT * FROM procedural_memory
  WHERE agent_id = 'eleanor'
  AND embedding <|3, 40|> $session_context_vec
  ORDER BY vector::distance::knn() ASC;

-- Combine into session context
RETURN {
  preferences: $preferences,
  recent_events: $recent_episodes,
  relevant_procedures: $relevant_procedures
};
```

---

## Companion Files

- `surrealdb-v3-master-reference.md` - Complete reference (this file was extracted from it)
- `surrealdb-v3-vector-search.md` - HNSW indexes, KNN search, embedding patterns
- `surrealdb-v3-ai-patterns.md` - RAG schemas, agent memory patterns, framework integrations
- `surrealdb-v3-realtime.md` - Events, changefeeds, live queries
- `../../docs/training-surrealdb-agents.md` - Hands-on walkthrough (vectors, graph, memory, live queries, agent loop)
