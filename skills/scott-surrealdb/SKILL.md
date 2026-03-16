---
name: scott:surrealdb
description: |
  SurrealQL syntax, schema design patterns, and query optimization for SurrealDB.
  Use whenever the user writes SurrealQL, designs a database schema, asks about
  SurrealDB features, or connects SurrealDB to n8n. Also use when asking about
  record links, events, indexes, or query optimization.
user_invocable: true
invocation_hint: /scott:surrealdb - SurrealDB query patterns, schema design, and connection setup
---

# SurrealDB Quick Reference

**Version:** SurrealDB v3 server + JS SDK surrealdb@2.0.x (npm)
**Deep reference:** `~/Sites/Global/scott-toolkit/references/surrealdb-v3-reference.md`
**Context7 library:** `/surrealdb/docs.surrealdb.com`

## Project Versions (don't mix these up)

| Project | DB | SDK | Notes |
|---|---|---|---|
| eleanor, advosy-sales | v3 | JS SDK 2.0.1 | Current standard |
| automation-business | v3 | JS SDK 2.0.1 | Fresh-per-request pattern |
| d2d-payroll, spotio-cf | v2 | WASM 1.3.2 | Locked, migrating to advosy-sales |
| life-os | v2 | WASM 1.3.2 | NEVER upgrade |

## v3 Critical Changes (memorize these)

| v2 | v3 |
|---|---|
| `file://path` | `surrealkv://path` |
| `type::thing()` | `type::record()` |
| `DEFINE SCOPE` | `DEFINE ACCESS` |
| `<future> { expr }` | `COMPUTED expr` |
| `UPDATE` creates if missing | `UPDATE` returns `[]`, use `UPSERT` |
| `module::function()` | `module_function()` (both work) |
| `ws://host:8000/rpc` | `ws://host:8000` |

## Essential Patterns

### CREATE (two syntaxes, same result)
```surql
-- SET: good for expressions
CREATE person:1 SET name = 'Tobie', signup = time_now();

-- CONTENT: good for structured data
CREATE person:1 CONTENT { name: 'Tobie', age: 30 };
```

### UPSERT (replaces UPDATE-as-create)
```surql
UPSERT contacts:john SET name = 'John', updated_at = time_now();
```

### Graph
```surql
RELATE person:tobie->likes->post:123 SET at = time_now();
SELECT ->likes->post FROM person:tobie;
SELECT <-follows<-person FROM person:jaime;
```

### Events (trigger n8n webhooks)
```surql
DEFINE EVENT on_status_change ON TABLE claim
  WHEN $before.status != $after.status THEN {
    RETURN http::post('https://n8n.example.com/webhook/xyz', {
      claim_id: $after.id, old: $before.status, new: $after.status
    });
  };
```

### DEFINE ACCESS (replaces SCOPE)
```surql
DEFINE ACCESS account ON DATABASE TYPE RECORD
  SIGNUP ( CREATE user SET email = $email, pass = crypto::argon2::generate($pass) )
  SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass) )
  DURATION FOR TOKEN 15m, FOR SESSION 12h;
```

### JS SDK 2.0 Connection
```typescript
import Surreal from 'surrealdb';
import { Table } from 'surrealdb';

const db = new Surreal();
await db.connect('ws://localhost:8000', {
  namespace: 'my_ns', database: 'my_db',
  authentication: { username: 'root', password: 'root' },
  reconnect: { attempts: 10, retryDelay: 1000 }
});

// Table class required (no plain strings)
await db.select(new Table('users'));
```

### n8n Connection
```
HTTP Request node → POST http://localhost:8000/sql
Headers: Accept: application/json, NS: n8n, DB: workflows
Auth: Basic (root/root for local dev)
Body: SELECT * FROM contacts WHERE status = "new" LIMIT 10;
```

## Gotchas (top 5)

1. **JS SDK returns RecordId objects** not strings. Use `String(id)` before comparing.
2. **JS null is not SurrealQL NONE.** Omit `option<>` fields entirely.
3. **COMPUTED fields cannot be nested.** No `name.full`, flatten to `full_name`.
4. **Live queries require `ws://`** not `http://`. HTTP silently fails.
5. **UPDATE returns `[]`** if record missing. Use UPSERT for create-or-update.

## When to Read the Full Reference

Read `~/Sites/Global/scott-toolkit/references/surrealdb-v3-reference.md` when you need:
- Vector search / HNSW index setup
- AI agent memory schemas
- Graph + vector combo queries
- JS SDK 2.0 query builder, expressions API, streaming
- Changefeed / audit trail patterns
- Time-series modeling
- Connection pattern decision tree
- Embedded/edge deployment options
- Full function rename map
