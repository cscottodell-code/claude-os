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
**Deep reference:** `~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-reference.md`
**Master reference:** `~/Sites/Global/scott-toolkit/references/surrealdb-v3-master-reference.md` (DEFINE API, auth, permissions, full-text search, HNSW, events, functions catalog, SurrealQL language, JS SDK 2.0 complete API)
**Functions catalog:** `~/Sites/Global/scott-toolkit/references/surrealdb-v3-functions-catalog.md` (325+ built-in functions)
**Language reference:** `~/Sites/Global/scott-toolkit/references/surrealql-language-reference.md` (control flow, closures, operators, types, transactions)
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

### JS SDK 2.0 Connection (Eleanor pattern)
```typescript
import { Surreal, RecordId } from 'surrealdb';

const db = new Surreal({
  codecOptions: {
    useNativeDates: true,     // Dates come back as Date objects, not strings
    valueDecodeVisitor(value) {
      if (value instanceof RecordId) return String(value)  // IDs come back as strings
      return value
    },
  },
});

await db.connect('ws://localhost:8000', {
  namespace: 'my_ns', database: 'my_db',
  reconnect: { attempts: 10, retryDelay: 1000 },
  renewAccess: true,
  authentication: () => ({ username: 'root', password: 'root' }),
});
```

### JS SDK 2.0 Query Patterns (use these, not older patterns)
```typescript
// Type-safe queries (NOT `as any[]`)
const [people] = await db.query<[Person[]]>('SELECT * FROM people');

// surql template tag (NOT StringRecordId)
import { surql } from 'surrealdb';
await db.query(surql`SELECT * FROM messages WHERE conversation = ${convId}`);

// Query builder for updates — Node/Nuxt only (fails under Bun, see Bun section)
await db.update(`people:${slug}`).merge({ name, relationship, updated_at: new Date() });

// Bun-safe update (works everywhere)
await db.query(`UPDATE type::record($id) SET name = $name, updated_at = time::now()`,
  { id: `people:${slug}`, name });

// Live queries
import { Table } from 'surrealdb';
const live = await db.live(new Table('messages'));
live.subscribe((action, result) => { /* CREATE | UPDATE | DELETE */ });
```

### n8n Connection
```
HTTP Request node → POST http://localhost:8000/sql
Headers: Accept: application/json, NS: n8n, DB: workflows
Auth: Basic (root/root for local dev)
Body: SELECT * FROM contacts WHERE status = "new" LIMIT 10;
```

## Bun Runtime: SDK Method Restrictions (CRITICAL)

**`db.create()` and `db.update().merge()` FAIL under Bun.** The Bun-native SDK transport (pure WebSocket) does not auto-coerce strings to RecordId objects like the Node/WASM transport does. SurrealDB v3's strict typing rejects string values where `record<table>` is expected.

**This affects:** Eleanor's Hono API, any future Bun+SurrealDB project.
**This does NOT affect:** Nuxt/Node projects (d2d-payroll, spotio-cf, life-os, advosy-sales).

```typescript
// FAILS under Bun:
await db.create('messages', { conversation: convId, role: 'user', content: msg })
await db.create('people:scott', { name: 'Scott' })
await db.update('people:scott').merge({ nickname: 'Scotty' })

// WORKS under Bun — use db.query() with type::record():
await db.query(`CREATE messages SET conversation = type::record($conv), role = $role, content = $content`,
  { conv: convId, role: 'user', content: msg })

await db.query(`CREATE type::record($id) SET name = $name`,
  { id: 'people:scott', name: 'Scott' })

await db.query(`UPDATE type::record($id) SET nickname = $nick`,
  { id: 'people:scott', nick: 'Scotty' })
```

**SELECT queries with string params still work** for WHERE comparison (the DB compares, not coerces):
```typescript
// This is fine under Bun:
await db.query<[Msg[]]>('SELECT * FROM messages WHERE conversation = $conv', { conv: convId })
```

**Rule:** In Bun projects, use `db.query()` for all CREATE/UPDATE operations. Reserve `db.create()`/`db.update().merge()` for Node/Nuxt projects only. `db.query<[Type[]]>()` with generics works everywhere.

## Gotchas (top 6)

1. **RecordId auto-decoded in Eleanor/advosy-sales.** db.ts has a `valueDecodeVisitor`. NEVER write `String(id)` or `.replace('table:', '')`. For other projects without the visitor, use `String(id)`.
2. **JS null is not SurrealQL NONE.** Omit `option<>` fields entirely.
3. **COMPUTED fields cannot be nested.** No `name.full`, flatten to `full_name`.
4. **Live queries require `ws://`** not `http://`. HTTP silently fails.
5. **UPDATE returns `[]`** if record missing. Use UPSERT for create-or-update.
6. **db.create()/db.update().merge() fail under Bun.** See "Bun Runtime" section above.

## Anti-Patterns (NEVER do these in Eleanor or advosy-sales)

| Anti-Pattern | Use Instead |
|---|---|
| `as any[]` on query results | `db.query<[Type[]]>(...)` with generics |
| `new StringRecordId(String(id))` | `surql` template tag |
| `new Date(row.created_at)` | Already a Date (useNativeDates) |
| Manual SET clause builders | `db.update(id).merge(data)` (Node only) or `db.query('UPDATE type::record($id) SET ...', {id, ...})` (Bun-safe) |
| `string::lowercase(name)` in SurrealQL | `name.lowercase()` method chaining |
| `SELECT * FROM table` when only 2 fields needed | `SELECT *.{ field1, field2 } FROM table` |
| Multiple sequential queries for one record + relations | Graph traversal or multi-statement with LET |

## SurrealDB MCP Server (live testing)

The SurrealDB MCP server is available in Claude Code sessions. Use it to **test queries before writing code**:
- `mcp__surrealdb__connect_endpoint` — connect to Eleanor's DB or a test instance
- `mcp__surrealdb__query` — run SurrealQL directly (test COMPUTED fields, EVENTs, indexes, new syntax)
- `mcp__surrealdb__create`, `select`, `update`, `delete`, `relate` — CRUD operations

**When to use it:**
- Before writing a new migration: test the SurrealQL against the real server
- When debugging a query error: run it directly instead of guessing
- When adopting a new v3 feature: verify the syntax works with the actual server version
- When validating mini-PRD examples: test them before implementing

## When to Read the Full Reference

Read `~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-reference.md` when you need:
- Vector search / HNSW index setup
- AI agent memory schemas
- Graph + vector combo queries
- JS SDK 2.0 query builder, expressions API, streaming
- Changefeed / audit trail patterns
- Time-series modeling
- Connection pattern decision tree
- Embedded/edge deployment options
- Full function rename map

## Context7 Libraries (live docs, always current)

Use Context7 to verify syntax before writing SurrealDB code:
- **JS SDK:** `/surrealdb/surrealdb.js` (87 snippets, query builder, live queries, type-safe patterns)
- **SurrealQL:** `/surrealdb/docs.surrealdb.com` (8588 snippets, COMPUTED, HNSW, events, destructuring, graph)

Query these when:
- You're unsure about SDK 2.0 method signatures
- You need the exact syntax for a v3 feature (HNSW dimensions, CHANGEFEED duration, ENFORCED relations)
- The local reference file doesn't cover a specific feature
- You want to verify current best practices haven't changed

## Eleanor-Specific Patterns

Eleanor's db.ts is pre-configured. When working on Eleanor:
- Read the project's CLAUDE.md "SurrealDB Patterns" section (loaded every session)
- Read `tasks/lessons.md` for the JS SDK 2.0 AVOID/PREFER examples
- Read `docs/mini-prd-bops-power-laws.md` Section 6 for the full v3 optimization roadmap
