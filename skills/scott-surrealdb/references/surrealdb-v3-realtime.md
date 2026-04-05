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
