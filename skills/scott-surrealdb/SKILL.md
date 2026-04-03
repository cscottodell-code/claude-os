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

**Version:** SurrealDB v3.0.2 server (latest: v3.0.5) + JS SDK surrealdb@2.0.x (npm)
**Verified:** 2026-04-03 via live testing on v3.0.2. All examples confirmed working.
**Master reference:** `~/Sites/Global/scott-toolkit/references/surrealdb-v3-master-reference.md` (DEFINE API, auth, permissions, full-text search, HNSW, events, functions catalog, SurrealQL language, JS SDK 2.0 complete API, Spectron, real-time best practices)
**Functions catalog:** `~/Sites/Global/scott-toolkit/references/surrealdb-v3-functions-catalog.md` (325+ built-in functions)
**Language reference:** `~/Sites/Global/scott-toolkit/references/surrealql-language-reference.md` (control flow, closures, operators, types, transactions)
**Deep reference:** `~/Sites/Global/scott-toolkit/skills/scott-surrealdb/references/surrealdb-v3-reference.md`
**Context7 library:** `/surrealdb/docs.surrealdb.com`

## MANDATORY: No General Knowledge for SurrealQL

**NEVER write SurrealQL from general SQL knowledge or LLM training data.** SurrealQL looks like SQL but diverges in critical ways that will silently produce wrong results or hard errors. Before writing ANY query, schema definition, or SDK call:

1. **Check the traps list below first** (covers the most common mistakes)
2. **Look up syntax in Context7** (`/surrealdb/docs.surrealdb.com`) or the reference files listed above
3. **Verify against a live SurrealDB instance** using MCP tools before committing

If you cannot verify a syntax pattern against Context7 or the reference files, do NOT guess. Ask Scott or flag it as unverified.

## CRITICAL: Known Traps (live-tested, will cause errors if ignored)
- `time_now()` DOES NOT EXIST -- use `time::now()`
- `math::round(val, 2)` DOES NOT WORK -- use `math::fixed(val, 2)`
- `TRY/CATCH` DOES NOT EXIST -- use IF/ELSE + THROW
- `DEFAULT ALWAYS` does NOT override explicit values -- use `VALUE` for auto-timestamps
- BREAK and CONTINUE DO work in FOR loops
- `$input` IS available in DEFINE EVENT handlers
- DEFINE API works WITHOUT experimental flags on v3.0.2
- `type::is::record()` RENAMED -- use `type::is_record()` (underscore, not double colon). Same for all type checks: `type::is_string()`, `type::is_number()`, `type::is_bool()`, `type::is_array()`, `type::is_object()`, `type::is_datetime()`, `type::is_none()`

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
| `type::is::record()` | `type::is_record()` (underscore) |
| `ws://host:8000/rpc` | `ws://host:8000` |

## Essential Patterns

### CREATE (two syntaxes, same result)
```surql
-- SET: good for expressions
CREATE person:1 SET name = 'Tobie', signup = time::now();

-- CONTENT: good for structured data
CREATE person:1 CONTENT { name: 'Tobie', age: 30 };
```

### UPSERT (replaces UPDATE-as-create)
```surql
UPSERT contacts:john SET name = 'John', updated_at = time::now();
```

### Graph
```surql
RELATE person:tobie->likes->post:123 SET at = time::now();
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

## Verification Workflow (MCP first, curl for edge cases)

**Default: Use MCP tools for 85% of verification.**
- `mcp__surrealdb__query` — test SurrealQL directly (fastest, structured results, stateful)
- `mcp__surrealdb__create/select/update/delete/relate` — CRUD operations
- `mcp__surrealdb__use_namespace/use_database` — switch context without re-specifying

**Switch to curl when:**
- You need exact HTTP status codes or response headers
- You're testing authentication or CORS behavior
- You need network timing data (`curl -w`)
- MCP error is unclear and might be HTTP-layer

## Architecture Decisions (settled, do not revisit)

**DEFINE API vs Nuxt Routes:** Use Nuxt API routes as the default for all public-facing endpoints. DEFINE API only for internal read-only metrics behind Coolify's private network. Reason: Nuxt handles validation (Zod), external services (email, webhooks), error control, and is more learnable. DEFINE API can't call external APIs, send emails, upload files, or do rate limiting.

**Array Record IDs for time-series:** Use compound IDs like `metric:['rep_alice', '2026-04-02']` for time-series data (sales metrics, activity logs) where you need range queries. Use auto-generated IDs for batch data (payroll). Only deploy on v3 JS SDK projects (eleanor, advosy-sales). Don't retrofit into v2 WASM projects.

**Spectron (ADOPTED):** SurrealDB's official AI agent memory layer. 5 memory types: working, semantic, episodic, procedural, preference. Runs on same SurrealDB instance. Use for Eleanor's persistent memory. See `~/Sites/Global/scott-toolkit/references/surrealdb-v3-spectron.md` for schemas and patterns.

## Deep References (read on-demand, not auto-loaded)

| Need | File |
|------|------|
| Vector search / HNSW | `references/surrealdb-v3-vector-search.md` |
| AI/RAG/agent patterns + Spectron | `references/surrealdb-v3-ai-patterns.md` |
| Events, changefeeds, live queries | `references/surrealdb-v3-realtime.md` |
| Function rename map (v2→v3) | `references/surrealdb-v3-functions-map.md` |
| Troubleshooting errors | `references/surrealdb-v3-troubleshooting.md` |
| Full architectural reference | `references/surrealdb-v3-reference.md` |
| Complete master reference | `~/Sites/Global/scott-toolkit/references/surrealdb-v3-master-reference.md` |
| SurrealQL language spec | `~/Sites/Global/scott-toolkit/references/surrealql-language-reference.md` |
| Context7 JS SDK | `/surrealdb/surrealdb.js` (87 snippets) |
| Context7 SurrealQL | `/surrealdb/docs.surrealdb.com` (8588 snippets) |
| Eleanor-specific patterns | Eleanor's CLAUDE.md + tasks/lessons.md |
