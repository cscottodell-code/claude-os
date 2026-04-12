# SurrealDB v3: Real-Time, Events & Audit

> Extracted from `surrealdb-v3-master-reference.md` (sections 3, 11, 12, 20).
> This file is self-contained. For the full reference, see the master file.

---

## DEFINE EVENT (Database-Level Automation)

Events fire automatically when data changes. Think of them like spreadsheet "on change" triggers, but for database tables.

### Syntax

```surql
DEFINE EVENT [IF NOT EXISTS | OVERWRITE] @name ON [TABLE] @table
  [ASYNC [RETRY 0-16] [MAXDEPTH 0-16]]
  [WHEN @condition]
  [THEN { @action }]
  [COMMENT @string];
```

### Variables Available in Events

| Variable | Description |
|---|---|
| `$event` | `"CREATE"`, `"UPDATE"`, or `"DELETE"` |
| `$before` | Record state before change (NONE on CREATE) |
| `$after` | Record state after change (NONE on DELETE) |
| `$value` | The current record value |
| `$input` | The input that triggered the event |
| `$auth` | Authenticated user (if record user triggered it) |

### Sync vs Async Events

**Without ASYNC:** Event runs in the same transaction. A slow webhook means a slow user request.

**With ASYNC:** Event fires after the transaction commits. Doesn't block the user.

```surql
-- Synchronous (blocks until done)
DEFINE EVENT sync_audit ON TABLE leads
  WHEN $event IN ['CREATE', 'UPDATE', 'DELETE']
  THEN fn::audit('leads', $event, $before, $after);

-- Async with retry (fires in background, retries 3x on failure)
DEFINE EVENT async_webhook ON TABLE leads ASYNC RETRY 3
  WHEN $event = 'CREATE'
  THEN {
    http::post('https://n8n.example.com/webhook/new-lead', {
      lead_id: $after.id, name: $after.name, source: $after.source
    });
  };
```

**When to use ASYNC:** Almost always for `http::post()` calls. The user shouldn't wait for a webhook to respond.

**When to use sync:** When the event's result affects the current transaction (e.g., creating an audit record that must exist before the response is sent).

### Conditional Events

```surql
-- Only when status changes
DEFINE EVENT status_change ON TABLE claims
  WHEN $before.status != $after.status
  THEN {
    http::post('https://n8n.example.com/webhook/claim-status', {
      claim_id: $after.id,
      old_status: $before.status,
      new_status: $after.status
    });
  };

-- Only on specific event types
DEFINE EVENT on_delete ON TABLE users
  WHEN $event = "DELETE"
  THEN {
    CREATE archive SET data = $before, deleted_at = time::now();
  };

-- Using $input for conditional triggering
DEFINE EVENT conditional ON TABLE person
  WHEN $input.log_event = true
  THEN {
    CREATE log SET at = time::now(), of = $input;
  };
```

### Webhook Patterns

```surql
-- Notify n8n when a new lead is created
DEFINE EVENT new_lead_webhook ON TABLE leads ASYNC RETRY 3
  WHEN $event = 'CREATE'
  THEN {
    http::post('https://n8n.example.com/webhook/new-lead', {
      event: 'lead.created',
      lead: $after
    });
  };

-- Notify on status transitions
DEFINE EVENT lead_status_webhook ON TABLE leads ASYNC RETRY 3
  WHEN $before.status != $after.status
  THEN {
    http::post('https://n8n.example.com/webhook/lead-status', {
      event: 'lead.status_changed',
      lead_id: $after.id,
      from: $before.status,
      to: $after.status,
      changed_at: time::now()
    });
  };
```

**Important:** `http::` functions require the `--allow-net` server flag. Non-2XX responses cause errors in v2.2+.

---

## Changefeeds (Audit Trail)

Changefeeds record every change to a table, including the before-state. Think of it like "track changes" in a document, but for your database.

### Setup

```surql
-- Keep 30 days of change history, including the before-state
DEFINE TABLE deals CHANGEFEED 30d INCLUDE ORIGINAL;
```

`INCLUDE ORIGINAL` stores the before-state, not just the after-state. Without it, you only see what changed TO, not what changed FROM.

### Replaying Changes

```surql
-- Replay changes since a specific time
SHOW CHANGES FOR TABLE deals SINCE d'2026-04-01T00:00:00Z' LIMIT 100;

-- Replay from a versionstamp (monotonically increasing across the database)
SHOW CHANGES FOR TABLE deals SINCE 0 LIMIT 10;
```

### What Changefeeds Return

Each entry contains:
- The versionstamp (ordering)
- The operation type (CREATE, UPDATE, DELETE)
- The record data after the change
- The record data before the change (if `INCLUDE ORIGINAL`)

### Use Cases

| Use Case | Pattern |
|---|---|
| Audit trail | `CHANGEFEED 365d INCLUDE ORIGINAL` on sensitive tables |
| CDC (Change Data Capture) | Consumer reads `SHOW CHANGES` from last versionstamp |
| Debugging | Replay changes to see what happened |
| Compliance | Immutable history of all data changes |
| Sync to external systems | Poll changefeeds to sync data to Elasticsearch, analytics, etc. |

---

## Live Queries (Real-Time Subscriptions)

Live queries push changes to connected clients in real time. Like a spreadsheet that updates when someone else edits it.

### SurrealQL Syntax

```surql
-- Subscribe to all new leads
LIVE SELECT * FROM leads WHERE status = 'new';

-- Subscribe to changes only (diff mode)
LIVE SELECT DIFF FROM deals;
```

### JS SDK

```typescript
// Async iterator (preferred pattern)
const sub = await db.live<Lead>(new Table('leads'));
for await (const { action, value } of sub) {
  if (action === 'CREATE') showNotification(value.name);
}

// With filtering
const hot = await db.live<Lead>(new Table('leads')).where(eq('priority', 'hot'));

// Diff mode (only changes, not full records)
const diffs = await db.live<Lead>(new Table('leads')).diff();

// Specific fields only
const names = await db.live<Lead>(new Table('leads')).fields('name', 'status');

// Kill subscription
await sub.kill();
```

### Integration with Pinia (Nuxt Pattern)

```typescript
// In a Pinia store
export const useLeadsStore = defineStore('leads', () => {
  const leads = ref<Lead[]>([]);
  let subscription: LiveSubscription | null = null;

  async function startLive() {
    // Initial load
    const [initial] = await db.query<[Lead[]]>('SELECT * FROM leads ORDER BY created_at DESC');
    leads.value = initial;

    // Live updates
    subscription = await db.live<Lead>(new Table('leads'));
    for await (const { action, value } of subscription) {
      if (action === 'CREATE') leads.value.unshift(value);
      if (action === 'UPDATE') {
        const idx = leads.value.findIndex(l => l.id === value.id);
        if (idx >= 0) leads.value[idx] = value;
      }
      if (action === 'DELETE') {
        leads.value = leads.value.filter(l => l.id !== value.id);
      }
    }
  }

  async function stopLive() {
    await subscription?.kill();
    subscription = null;
  }

  return { leads, startLive, stopLive };
});
```

### Live Queries on Computed Tables

Computed tables (materialized views) support live queries:

```surql
-- Computed table
DEFINE TABLE monthly_revenue TYPE NORMAL AS
  SELECT count() AS total_sales, math::sum(amount) AS revenue, rep_id
  FROM sale GROUP BY rep_id;

-- Live query on the computed table
LIVE SELECT * FROM monthly_revenue;
-- Fires whenever the underlying `sale` table changes
```

### Agent-to-Agent Coordination with LIVE SELECT

In a multi-agent system, agents need to coordinate: Agent A produces output that Agent B consumes. Traditionally this requires a message broker (Kafka, Redis Pub/Sub, RabbitMQ) as middleware. With SurrealDB, Agent B just runs `LIVE SELECT * FROM agent_a_output WHERE status = 'ready'` and gets pushed updates whenever Agent A writes new results. The database IS the message bus. No extra infrastructure.

#### Agent Task Queue

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

#### Reactive Pipeline (TypeScript)

Three agents form a pipeline: extract > map relationships > update knowledge graph. Each agent subscribes to the previous agent's output table.

```typescript
import Surreal, { Table } from 'surrealdb';

// Agent A: Entity Extractor
// Writes extraction results, then Agent B picks them up automatically
async function agentA(db: Surreal) {
  // ... runs extraction logic, writes results:
  await db.create(new Table('extracted_entities'), {
    document_id: 'doc:abc',
    entities: [{ name: 'Acme Corp', type: 'company' }],
    status: 'ready',
  });
}

// Agent B: Relationship Mapper
// Subscribes to extracted_entities, maps relationships, writes to entity_relationships
async function agentB(db: Surreal) {
  const sub = await db.live<ExtractedEntity>(new Table('extracted_entities'));
  for await (const { action, value } of sub) {
    if (action === 'CREATE' && value.status === 'ready') {
      const relationships = await mapRelationships(value.entities);
      await db.create(new Table('entity_relationships'), {
        source_id: value.id,
        relationships,
        status: 'ready',
      });
    }
  }
}

// Agent C: Knowledge Graph Builder
// Subscribes to entity_relationships, updates the graph
async function agentC(db: Surreal) {
  const sub = await db.live<EntityRelationship>(new Table('entity_relationships'));
  for await (const { action, value } of sub) {
    if (action === 'CREATE' && value.status === 'ready') {
      for (const rel of value.relationships) {
        // Note: RELATE requires a literal table name — variables can't be used
        // as the relation table. Use a fixed relation table for all edge types,
        // with a 'type' field to distinguish them.
        await db.query(
          'RELATE $from->related_to->$to SET type = $rel_type, confidence = $conf',
          { from: rel.from, rel_type: rel.type, to: rel.to, conf: rel.confidence }
        );
      }
    }
  }
}
```

#### TABLE Events for Auto-Triggering Agents

Use DEFINE EVENT to automatically create tasks when data changes. No polling needed.

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

#### Comparison: Message Broker vs LIVE SELECT

| Feature | Kafka/Redis Pub/Sub | SurrealDB LIVE SELECT |
|---|---|---|
| Extra infrastructure | Yes (broker cluster) | No (same DB) |
| Message persistence | Kafka yes, Redis no | Yes (it's a table) |
| Query filtering | Limited | Full SurrealQL WHERE |
| ACID with data | No (separate system) | Yes (same transaction) |
| Scale limit | Very high | Moderate (hundreds of subscriptions, not thousands) |
| Best for | High-throughput event streaming | Agent coordination, reactive workflows |

> **When to use this pattern:** Use LIVE SELECT coordination when you have fewer than ~50 agents coordinating around shared data. For high-throughput event streaming (thousands of events/sec), a dedicated broker is still the right call. For agent coordination where the data and the messages live in the same place, LIVE SELECT eliminates an entire infrastructure layer.

### Important Notes

- Live queries require **WebSocket** connection (not HTTP)
- Live queries respect table `PERMISSIONS` (record users only see what they're allowed to)
- Each live query is a persistent server-side subscription (don't create thousands)
- Kill subscriptions when the component unmounts to avoid leaks

---

## Real-Time Best Practices

### Array-Based Record IDs (100x Faster for Time-Series)

Instead of WHERE clauses, embed the partition key in the record ID:

```surql
-- Create with array ID
CREATE kpi_event:[$rep_id, time::now()] SET type = 'DK', source = 'spotio';

-- Record range query (100x faster than WHERE + index)
SELECT * FROM kpi_event:[$rep_id, d'2026-03-01T00:00:00Z']..=[$rep_id, d'2026-03-31T23:59:59Z'];
```

### Computed Table Views with Predictable IDs

```surql
DEFINE TABLE monthly_kpi AS
  SELECT rep, time::month(created_at) AS month, count() AS total, math::sum(amount) AS revenue
  FROM kpi_event GROUP BY rep, month;

-- Instant lookup by predictable ID (no query needed)
SELECT * FROM monthly_kpi:['scott', 3];
```

### Use VALUE, Not DEFAULT ALWAYS, for Auto-Timestamps

```surql
-- VALUE recalculates on every CREATE/UPDATE (live-tested on v3.0.2)
DEFINE FIELD updated_at ON leads TYPE datetime VALUE time::now();

-- DEFAULT ALWAYS does NOT override explicit values on v3.0.2
-- Use VALUE instead for reliable auto-updating timestamps
```

---

## Combining Events + Changefeeds + Live Queries

These three features serve different purposes and work well together:

| Feature | Trigger | Use For |
|---|---|---|
| **DEFINE EVENT** | Data change | Webhooks, side effects, notifications |
| **CHANGEFEED** | Data change | Audit trail, CDC, compliance, replay |
| **LIVE SELECT** | Data change | Real-time UI updates, dashboards |

### Example: Full Audit + Notification Pipeline

```surql
-- 1. Changefeed for audit trail
DEFINE TABLE deals CHANGEFEED 365d INCLUDE ORIGINAL;

-- 2. Event for webhook notification (async, doesn't block)
DEFINE EVENT deal_closed ON TABLE deals ASYNC RETRY 3
  WHEN $before.stage != 'closed_won' AND $after.stage = 'closed_won'
  THEN {
    http::post('https://n8n.example.com/webhook/deal-won', {
      deal_id: $after.id,
      amount: $after.amount,
      rep: $after.assigned_to,
      closed_at: time::now()
    });
  };

-- 3. Live query for real-time dashboard (client-side)
-- LIVE SELECT * FROM deals WHERE stage = 'closed_won';
```
