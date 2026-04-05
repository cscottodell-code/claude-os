# SurrealDB v3: Troubleshooting Guide

> Companion to `surrealdb-v3-master-reference.md`.
> Format: Error pattern, probable cause, fix, and which reference to read next.

---

## Function Errors

### `time_now()` -- parse error / function not found

**Error:** `Parse error: unexpected token 'time_now'` or similar

**Cause:** SurrealQL uses double-colon namespace syntax (`::`) for all built-in functions. There is no `time_now()` function.

**Fix:**
```surql
-- Wrong
SELECT time_now() FROM leads;

-- Correct
SELECT time::now() FROM leads;
```

**Reference:** `surrealdb-v3-functions-map.md` (v2-to-v3 rename map)

---

### `math::round()` with 2 arguments -- unexpected argument

**Error:** `Expected 1 argument but got 2` or similar

**Cause:** `math::round()` takes only 1 argument and rounds to the nearest integer. For decimal-place rounding, use `math::fixed()`.

**Fix:**
```surql
-- Wrong (round to 2 decimal places)
SELECT math::round(revenue * 0.08, 2) FROM deals;

-- Correct
SELECT math::fixed(revenue * 0.08, 2) FROM deals;
```

**Reference:** `surrealdb-v3-functions-map.md`

---

### `type::thing()` -- function not found

**Error:** `Function 'type::thing' not found` or similar

**Cause:** `type::thing()` was renamed to `type::record()` in v3.

**Fix:**
```surql
-- Wrong (v2 syntax)
SELECT * FROM type::thing("users", $id);

-- Correct (v3 syntax)
SELECT * FROM type::record("users", $id);
```

**Reference:** `surrealdb-v3-functions-map.md` (v2-to-v3 rename map)

---

### `TRY { } CATCH { }` -- parse error

**Error:** `Parse error` on TRY keyword

**Cause:** SurrealQL does not have TRY/CATCH syntax. This was confirmed as a parse error on v3.0.2.

**Fix:** Use IF/ELSE guards with THROW for error handling:
```surql
-- Wrong
TRY {
  UPDATE user:123 SET balance -= 100;
} CATCH {
  THROW 'Insufficient funds';
};

-- Correct
IF (SELECT balance FROM user:123)[0].balance < 100 {
  THROW 'Insufficient funds';
};
UPDATE user:123 SET balance -= 100;
```

**Reference:** `surrealdb-v3-master-reference.md` (section 17)

---

## Query Result Errors

### UPDATE returns `[]` (empty array)

**Error:** UPDATE statement returns an empty array instead of the updated record.

**Cause 1:** The record doesn't exist. UPDATE only modifies existing records.

**Cause 2:** Table PERMISSIONS block the current user from seeing the result.

**Cause 3:** Using `RETURN NONE` (intentionally suppressing output).

**Fix:**
```surql
-- Check if the record exists first
SELECT * FROM user:123;

-- Use UPSERT if you want create-or-update behavior
UPSERT user:123 SET name = 'Scott', status = 'active';

-- Check permissions
INFO FOR TABLE user;
```

**Reference:** `surrealdb-v3-master-reference.md` (sections 4, 10)

---

### SELECT returns records with RecordId objects instead of strings

**Error:** ID field shows `RecordId { table: "users", id: "123" }` instead of `"users:123"`

**Cause:** The JS SDK returns RecordId objects, not strings. This is by design.

**Fix:**
```typescript
// Wrong
if (record.id === 'users:123') { ... }

// Correct
if (String(record.id) === 'users:123') { ... }

// Or use RecordId for comparison
import { RecordId } from 'surrealdb';
if (record.id.equals(new RecordId('users', '123'))) { ... }
```

**Reference:** MEMORY.md (SurrealDB WASM SDK Gotchas)

---

## Connection Errors

### `ConnectionError: WebSocket connection failed`

**Error:** Cannot connect to SurrealDB server via WebSocket.

**Probable causes:**
1. Server not running
2. Wrong host/port
3. Firewall blocking the port
4. Using `http://` instead of `ws://` (or vice versa)

**Fix:**
```bash
# Check if server is running
curl http://localhost:8000/health

# Start the server
surreal start surrealkv://data.db --bind 0.0.0.0:8000 --user root --pass root

# In code, use ws:// for WebSocket
await db.connect('ws://localhost:8000');

# For HTTP-only (no live queries, no transactions)
await db.connect('http://localhost:8000');
```

---

### `ConnectionError: reconnect failed after N attempts`

**Error:** SDK gave up trying to reconnect.

**Cause:** Server went down or network issue persisted longer than the reconnect window.

**Fix:**
```typescript
// Configure reconnection
await db.connect('ws://localhost:8000', {
  reconnect: {
    enabled: true,
    maxAttempts: 10,      // increase if needed
    initialDelay: 1000,   // ms before first retry
    maxDelay: 30000       // max ms between retries (exponential backoff)
  }
});
```

---

### `Connection refused` on Coolify/Docker

**Error:** Cannot connect from app container to SurrealDB container.

**Cause:** Containers are on different Docker networks, or using `localhost` instead of the container/service name.

**Fix:**
```bash
# Use the Coolify service name, not localhost
# In Coolify, the service name is usually the app name
ws://surrealdb:8000

# Or use the internal Docker network IP
# Check with: docker inspect <container_id> | grep IPAddress
```

---

## Authentication Errors

### `Not enough permissions` or `IAM error`

**Error:** Query returns error about insufficient permissions.

**Cause:** You're authenticated as a record user, and the table PERMISSIONS block the operation.

**Fix:**
```surql
-- Check current auth level
SELECT $auth, $token, $session;

-- Check table permissions
INFO FOR TABLE leads;

-- If testing, authenticate as root to bypass permissions
-- In JS SDK:
await db.signin({ username: 'root', password: 'root' });
```

---

### `Invalid token` or `Token expired`

**Error:** Authentication fails with token-related error.

**Cause:** JWT token has expired. Default token duration is very short (1m for some configurations).

**Fix:**
```typescript
// Use token refresh
const newTokens = await db.authenticate({
  access: tokens.access,
  refresh: tokens.refresh
});

// Or configure longer token durations
// DEFINE ACCESS user ON DATABASE TYPE RECORD
//   DURATION FOR TOKEN 15m, FOR SESSION 12h;
```

---

### `Access method not found`

**Error:** Signin/signup fails because the access method doesn't exist.

**Cause:** The DEFINE ACCESS statement hasn't been run, or you're connecting to the wrong namespace/database.

**Fix:**
```surql
-- Check what access methods exist
INFO FOR DB;

-- Make sure you're on the right namespace/database
USE NS main DB main;
INFO FOR DB;
```

---

## Type Mismatch Errors

### `Expected 'number' but found 'string'`

**Error:** Type mismatch when inserting or querying.

**Cause:** SCHEMAFULL table enforces types strictly. You passed a string where a number was expected.

**Fix:**
```surql
-- Check the field type
INFO FOR TABLE leads;

-- Cast if needed
UPDATE leads SET amount = <number>$input_amount;

-- Or use the correct type in JS SDK
await db.create(new Table('leads')).content({
  amount: Number(inputAmount)  // ensure it's a number
});
```

---

### `Expected 'datetime' but found 'string'`

**Error:** Passing a string where a datetime is expected.

**Fix:**
```surql
-- In SurrealQL, use d'' prefix for datetime literals
UPDATE leads SET closed_at = d'2026-04-02T00:00:00Z';

-- Or cast
UPDATE leads SET closed_at = <datetime>$date_string;
```

```typescript
// In JS SDK, use Date objects
await db.update(id).merge({ closed_at: new Date() });
```

---

### `Cannot perform operation on NONE`

**Error:** Trying to operate on a field that doesn't exist or is NONE.

**Cause:** The field is `option<T>` and currently NONE, or the record doesn't have that field.

**Fix:**
```surql
-- Guard with IF or ?? operator
LET $name = $record.name ?? 'Unknown';

-- Or check before using
IF $record.email IS NOT NONE {
  -- safe to use $record.email
};
```

---

## Bun Runtime Errors (JS SDK)

### `db.create()` / `db.update().merge()` fails with string values under Bun

**Error:** Operations that work in Node.js fail silently or throw errors under Bun.

**Cause:** String coercion behaves differently in Bun's runtime. The SurrealDB JS SDK's internal serialization doesn't handle this correctly.

**Fix:** Use `db.query()` with `type::record()` instead of the builder methods:

```typescript
// Wrong (fails under Bun)
await db.create(new RecordId('users', 'scott')).content({ name: 'Scott' });

// Correct (works under Bun)
await db.query(
  'CREATE type::record("users", $id) CONTENT $data',
  { id: 'scott', data: { name: 'Scott' } }
);

// Wrong (fails under Bun)
await db.update(new RecordId('users', 'scott')).merge({ status: 'active' });

// Correct (works under Bun)
await db.query(
  'UPDATE type::record("users", $id) MERGE $data',
  { id: 'scott', data: { status: 'active' } }
);
```

**Reference:** MEMORY.md (SurrealDB SDK Bun Runtime Gotcha)

---

## Index Errors

### Vector search returns no results

**Error:** KNN query returns empty array.

**Probable causes:**
1. HNSW index DIMENSION doesn't match your embedding size
2. Embeddings not stored as arrays
3. Index needs rebuilding after bulk inserts

**Fix:**
```surql
-- Check index definition
INFO FOR INDEX knowledge_vec ON knowledge;

-- Verify embedding data
SELECT array::len(embedding) FROM knowledge LIMIT 1;

-- Rebuild index after bulk inserts
REBUILD INDEX knowledge_vec ON knowledge;
```

---

### MTREE index error

**Error:** `MTREE` not recognized or index type not found.

**Cause:** MTREE indexes were completely removed in v3. All vector work uses HNSW.

**Fix:**
```surql
-- Wrong (v2)
DEFINE INDEX my_vec ON knowledge FIELDS embedding MTREE DIMENSION 1536;

-- Correct (v3)
DEFINE INDEX my_vec ON knowledge FIELDS embedding HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
```

**Reference:** `surrealdb-v3-vector-search.md`

---

## Server Configuration Errors

### `http::post()` fails -- "Function not allowed"

**Error:** `http::post` function is not allowed by the server capability configuration.

**Cause:** The server was started without `--allow-net` or with `--deny-funcs "http"`.

**Fix:**
```bash
# Allow specific hosts
surreal start surrealkv://data.db \
  --allow-funcs "http::post" \
  --allow-net "n8n.example.com:443,api.stripe.com:443"

# Or allow all network access (less secure)
surreal start surrealkv://data.db --allow-net
```

---

### `DEFINE BUCKET` fails -- "Experimental feature not enabled"

**Error:** DEFINE BUCKET returns an error about experimental features.

**Cause:** File/bucket storage is experimental and requires explicit opt-in.

**Fix:**
```bash
surreal start surrealkv://data.db --allow-experimental files
```

Also requires the `SURREAL_BUCKET_FOLDER_ALLOWLIST` environment variable for file backends.

---

## Debugging Checklist

When something isn't working, check these in order:

1. **Is the server running?** `curl http://localhost:8000/health`
2. **Am I on the right namespace/database?** `SELECT $session;`
3. **Am I authenticated correctly?** `SELECT $auth;`
4. **Does the table exist?** `INFO FOR DB;`
5. **Do I have permissions?** `INFO FOR TABLE my_table;`
6. **Is the syntax correct?** Test in Surrealist or via MCP first
7. **Is the type correct?** Check with `INFO FOR TABLE` and verify field types
8. **Is the server configured correctly?** Check `--allow-net`, `--allow-funcs`, etc.

---

## Companion Files

- `surrealdb-v3-master-reference.md` - Complete reference
- `surrealdb-v3-functions-map.md` - Function renames and categories
- `surrealdb-v3-vector-search.md` - HNSW indexes, KNN search
- `surrealdb-v3-realtime.md` - Events, changefeeds, live queries
- `surrealdb-v3-ai-patterns.md` - RAG, agent memory, Spectron
- `surrealdb-v3-spectron.md` - Spectron deep dive
