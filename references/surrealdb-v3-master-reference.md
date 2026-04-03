# SurrealDB v3 Master Reference: SurrealDB-First Architecture

> Generated 2026-04-02 from exhaustive research across 6 parallel agents.
> This is the definitive reference for building SurrealDB-centered applications.

## What SurrealDB v3 Replaces

| Capability | Traditional Tool | SurrealDB v3 Feature |
|---|---|---|
| Relational data | Postgres, MySQL | `DEFINE TABLE SCHEMAFULL` + typed fields |
| Graph relationships | Neo4j, Dgraph | `RELATE` + `->/<-` traversal |
| Vector search | Pinecone, Weaviate | `HNSW` indexes + `<\|K,EF\|>` operator |
| Real-time subscriptions | Pusher, Socket.io | `LIVE SELECT` + JS SDK `db.live()` |
| Outbound HTTP/webhooks | App-layer code, Zapier | `http::post()` in `DEFINE EVENT` |
| REST API endpoints | Express, Hono, FastAPI | `DEFINE API` (built-in HTTP) |
| Stored procedures | PL/pgSQL, Prisma middleware | `DEFINE FUNCTION fn::name()` |
| Auth + row-level security | Auth0 + RLS policies | `DEFINE ACCESS` + table `PERMISSIONS` |
| Audit trail | Custom logging | `CHANGEFEED` |
| Materialized views | Manual refresh jobs | `DEFINE TABLE ... AS SELECT` (computed tables) |
| Full-text search | Elasticsearch, Meilisearch | `DEFINE INDEX ... FULLTEXT ANALYZER` |
| Foreign keys + cascades | Postgres FK constraints | `REFERENCE ON DELETE CASCADE/REJECT/UNSET` |

---

## 1. DEFINE FUNCTION (Server-Side Logic)

Custom reusable logic that runs inside the database. Like named formulas in a spreadsheet.

### Syntax

```surql
DEFINE FUNCTION [IF NOT EXISTS | OVERWRITE] fn::name($param: type, ...) -> return_type {
  -- body
}
[PERMISSIONS NONE | FULL | WHERE @condition];
```

### Type Safety and Error Handling

```surql
-- Typed params and return type (errors if wrong type passed)
DEFINE FUNCTION fn::combine($one: number, $two: number) -> number {
  $one + $two
};

-- Accepts any but expects number return (errors on type mismatch)
DEFINE FUNCTION fn::combine_any($one: any, $two: any) -> number {
  $one + $two
};
-- fn::combine_any("one", "two") -> Error: Expected `number` but found `'onetwo'`
```

### Permissions

```surql
-- Anyone can call (default)
DEFINE FUNCTION fn::public_fn() { ... } PERMISSIONS FULL;

-- Only system users (root/ns/db) can call
DEFINE FUNCTION fn::admin_only() { ... } PERMISSIONS NONE;

-- Conditional (record users matching condition)
DEFINE FUNCTION fn::manager_fn() { ... } PERMISSIONS WHERE $auth.role = 'manager';
```

### Custom Middleware Functions (for DEFINE API)

Middleware must accept `$req: object` and `$next: function` as first two params:

```surql
DEFINE FUNCTION fn::log_request($req: object, $next: function) -> object {
  LET $res = $next($req);
  -- Log the request
  CREATE api_log SET path = $req.path, method = $req.method, at = time_now();
  RETURN $res;
};

DEFINE FUNCTION fn::auth_check($req: object, $next: function) -> object {
  IF $auth == NONE {
    RETURN { status: 401, body: { error: 'Unauthorized' } };
  };
  $next($req)
};
```

### Calling from JS SDK

```typescript
// db.run() for simple function calls
const rate = await db.run<number>('fn::commission_rate', [35000]);

// db.query() for complex logic using functions
const [results] = await db.query<[Sale[]]>(
  'SELECT *, fn::commission_rate(revenue) AS commission FROM sales'
);
```

---

## 2. DEFINE API (Built-In REST Endpoints)

SurrealDB can serve HTTP endpoints directly. No Express/Hono needed for CRUD.

### Syntax

```surql
DEFINE API [OVERWRITE | IF NOT EXISTS] @path
  [FOR get, post, put, patch, delete, options, head]
  [MIDDLEWARE @function, ..]
  [THEN { @response }]
  [PERMISSIONS NONE | FULL | @expression];
```

### URL Structure

```
http(s)://<host>:<port>/api/<namespace>/<database>/<endpoint_path>
```

### The $request Object

| Field | Type | Description |
|---|---|---|
| `$request.body` | any | Parsed request body |
| `$request.headers` | object | HTTP headers |
| `$request.params` | object | Path parameters (`:id` segments) |
| `$request.query` | object | Query string parameters |
| `$request.method` | string | HTTP method used |
| `$request.context` | object | Context from middleware |

### Path Parameters

```surql
-- :param matches ONE segment
DEFINE API "/users/:id" FOR get
  MIDDLEWARE api::res::body("json")
  THEN {
    SELECT * FROM type::record("users", $request.params.id)
  };

-- *param matches REMAINING segments
DEFINE API "/files/*path" FOR get
  THEN {
    RETURN { body: { path: $request.params.path } };
  };
```

### Response Object

```surql
{
  status: 200,              -- HTTP status code (100-599)
  body: { ... },            -- Any SurrealDB value
  headers: { ... },         -- String key-value pairs
  context: { ... }          -- Internal (not sent to HTTP clients)
}
```

### Built-In Middleware

| Function | Purpose | Example |
|---|---|---|
| `api::res::body(strategy)` | Response serialization | `api::res::body("json")` |
| `api::req::body(strategy)` | Request parsing | `api::req::body("json")` |
| `api::res::headers(obj)` | Set response headers | `api::res::headers({ 'X-Custom': 'val' })` |
| `api::res::header(k, v)` | Set single header | `api::res::header("X-Custom", "val")` |
| `api::res::status(code)` | Override status code | `api::res::status(200)` |
| `api::timeout(duration)` | Request timeout | `api::timeout(5s)` |
| `api::invoke(path, opts)` | Call endpoint internally | `api::invoke("/users")` |

Body strategies: `"json"`, `"cbor"`, `"plain"`, `"bytes"`, `"native"`, `"auto"`

### Global Config (CORS, Shared Middleware)

```surql
DEFINE CONFIG API
  MIDDLEWARE
    api::timeout(10s),
    api::res::headers({ 'Access-Control-Allow-Origin': '*' });
```

Individual endpoint middleware overrides (not merges with) global config.

### Full CRUD Example

```surql
-- Global CORS
DEFINE CONFIG API MIDDLEWARE api::res::headers({ 'Access-Control-Allow-Origin': '*' });

-- List + Create
DEFINE API "/leads"
  FOR get MIDDLEWARE api::res::body("json") THEN {
    { status: 200, body: SELECT * FROM leads ORDER BY created_at DESC LIMIT 50 }
  }
  FOR post MIDDLEWARE api::req::body("json"), api::res::body("json") THEN {
    LET $lead = CREATE leads CONTENT $request.body;
    { status: 201, body: $lead }
  };

-- Get + Update + Delete
DEFINE API "/leads/:id"
  FOR get MIDDLEWARE api::res::body("json") THEN {
    { status: 200, body: SELECT * FROM type::record("leads", $request.params.id) }
  }
  FOR put MIDDLEWARE api::req::body("json"), api::res::body("json") THEN {
    { status: 200, body: UPDATE type::record("leads", $request.params.id) CONTENT $request.body }
  }
  FOR delete THEN {
    DELETE type::record("leads", $request.params.id);
    { status: 204 }
  };
```

### JS SDK .api() Method

```typescript
type LeadApi = {
  '/leads': {
    get: [void, Lead[]];
    post: [CreateLeadInput, Lead];
  };
  [K: `/leads/${string}`]: {
    get: [void, Lead];
    put: [UpdateLeadInput, Lead];
    delete: [void, void];
  };
};

const api = db.api<LeadApi>();
const leads = await api.get('/leads').value();
const created = await api.post('/leads', { name: 'Jane', source: 'website' }).value();
const one = await api.get('/leads/abc123').value();
```

### Auth in API Endpoints

`$auth`, `$token`, `$session` are all available inside DEFINE API handlers. Auth comes from the HTTP `Authorization` header.

```surql
DEFINE API "/my-profile" FOR get
  PERMISSIONS $auth != NONE
  MIDDLEWARE api::res::body("json")
  THEN {
    SELECT * FROM $auth.id
  };
```

### Gotchas

- Without `api::req::body()`, `$request.body` may be raw bytes
- `api::invoke()` body must be cast: `body: <bytes>'{"key": "val"}'`
- `:param` matches ONE segment; `*param` matches remainder
- `context` field is internal only, not sent to HTTP clients
- Individual middleware overrides global config, doesn't merge

---

## 3. DEFINE EVENT (Database-Level Automation)

### Syntax

```surql
DEFINE EVENT [IF NOT EXISTS | OVERWRITE] @name ON [TABLE] @table
  [ASYNC [RETRY 0-16] [MAXDEPTH 0-16]]
  [WHEN @condition]
  [THEN { @action }]
  [COMMENT @string];
```

### Variables Available

| Variable | Description |
|---|---|
| `$event` | `"CREATE"`, `"UPDATE"`, or `"DELETE"` |
| `$before` | Record state before change (NONE on CREATE) |
| `$after` | Record state after change (NONE on DELETE) |
| `$value` | The current record value |
| `$input` | The input that triggered the event |
| `$auth` | Authenticated user (if record user triggered it) |

### ASYNC Events (v3)

Without `ASYNC`: event runs in the same transaction. Slow webhook = slow user request.
With `ASYNC`: event fires after transaction commits. Doesn't block the user.

```surql
-- Synchronous (blocks until webhook responds)
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
    CREATE archive SET data = $before, deleted_at = time_now();
  };

-- Using $input for conditional triggering
DEFINE EVENT conditional ON TABLE person
  WHEN $input.log_event = true
  THEN {
    CREATE log SET at = time_now(), of = $input;
  };
```

---

## 4. Authentication & Permissions

### Authentication Hierarchy

| Level | Defined with | Bypasses table permissions? |
|---|---|---|
| Root | CLI `--user`/`--pass` | YES |
| Namespace | `DEFINE USER ... ON NAMESPACE` | YES |
| Database | `DEFINE USER ... ON DATABASE` | YES |
| Record | `DEFINE ACCESS ... TYPE RECORD` | NO (subject to PERMISSIONS) |

### DEFINE ACCESS - Three Types

**TYPE RECORD (end-user auth):**
```surql
DEFINE ACCESS user ON DATABASE TYPE RECORD
  SIGNUP ( CREATE user SET email = $email, pass = crypto::argon2::generate($pass) )
  SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass) )
  WITH REFRESH
  DURATION FOR GRANT 15d, FOR TOKEN 1m, FOR SESSION 12h;
```

**TYPE JWT (external identity providers):**
```surql
-- JWKS (auto-rotating keys from Auth0, Firebase, Clerk, etc.)
DEFINE ACCESS external ON DATABASE TYPE JWT
  URL "https://your-provider.com/.well-known/jwks.json"
  AUTHENTICATE {
    IF $token.iss != "expected-issuer" { THROW "Invalid issuer" };
  };

-- Symmetric key
DEFINE ACCESS api ON DATABASE TYPE JWT
  ALGORITHM HS512 KEY "your-shared-secret"
  DURATION FOR SESSION 2h;

-- Asymmetric key (RSA)
DEFINE ACCESS api ON DATABASE TYPE JWT
  ALGORITHM RS256 KEY "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----";
```

**TYPE BEARER (API keys):**
```surql
-- Define bearer access for system users
DEFINE ACCESS api ON DATABASE TYPE BEARER FOR USER DURATION FOR GRANT 10d;

-- Generate a key
ACCESS api GRANT FOR USER automation;
-- Returns: { grant: { id: "W9gi", key: "surreal-bearer-W9gi-WFmLP..." } }

-- Revoke a key
ACCESS api REVOKE GRANT grant_id;
```

Algorithms supported: HS256/384/512, RS256/384/512, ES256/384/512, PS256/384/512, EdDSA

### Duration Types

| Duration | Controls | Typical value |
|---|---|---|
| `FOR GRANT` | Bearer key / refresh token lifetime | 15d |
| `FOR TOKEN` | JWT access token validity | 1m-15m |
| `FOR SESSION` | Server-side session after token expires | 12h |

### AUTHENTICATE Clause (Custom Validation)

Runs after standard JWT verification. Can THROW errors or RETURN a different user.

```surql
DEFINE ACCESS user ON DATABASE TYPE RECORD
  WITH JWT ALGORITHM HS512 KEY 'secret'
  AUTHENTICATE {
    IF $auth.id { RETURN $auth.id };        -- Normal signin
    IF $token.email {                        -- External JWT fallback
      RETURN SELECT * FROM user WHERE email = $token.email;
    };
  };
```

### The $auth, $token, $session Variables

**$auth** = the authenticated user's full record (all fields from their DB record).
Only populated for record-level users.

**$token** = JWT claims:
```json
{ "AC": "user", "DB": "test", "ID": "user:123", "NS": "test",
  "exp": 1723118226, "iat": 1723114626, "iss": "SurrealDB" }
```

**$session** = connection info:
```json
{ "ac": "user", "db": "test", "id": "client-id", "ip": "127.0.0.1",
  "ns": "test", "or": "http://example.com", "rd": "user:123" }
```

### Table-Level Permissions

Only apply to record users. System users bypass all permissions.

```surql
DEFINE TABLE leads SCHEMAFULL
  PERMISSIONS
    FOR select WHERE $auth AND (assigned_to = $auth.id OR $auth.role = 'admin')
    FOR create WHERE $auth
    FOR update WHERE assigned_to = $auth.id OR $auth.role = 'admin'
    FOR delete WHERE $auth.role = 'admin';
```

### Field-Level Permissions

```surql
-- Auto-set and make read-only
DEFINE FIELD created_by ON TABLE leads VALUE $auth READONLY;

-- Hide sensitive fields from non-admins
DEFINE FIELD ssn ON TABLE users TYPE string
  PERMISSIONS
    FOR select WHERE $auth.role = 'admin'
    FOR create, update WHERE $auth.role = 'admin';
```

### Multi-Tenant Pattern

```surql
-- Each tenant gets their own namespace (total isolation)
USE NS tenant_acme DB main;
DEFINE ACCESS user ON DATABASE TYPE RECORD SIGNUP (...) SIGNIN (...);

USE NS tenant_globex DB main;
DEFINE ACCESS user ON DATABASE TYPE RECORD SIGNUP (...) SIGNIN (...);
```

### JS SDK Auth Flow

```typescript
// Record user signup
const tokens = await db.signup({
  namespace: 'main', database: 'main', access: 'user',
  variables: { email: 'scott@example.com', password: 'pass123' }
});

// Record user signin
const tokens = await db.signin({
  namespace: 'main', database: 'main', access: 'user',
  variables: { email: 'scott@example.com', password: 'pass123' }
});

// System user signin
await db.signin({ username: 'root', password: 'root' });

// Token refresh
const newTokens = await db.authenticate({
  access: tokens.access, refresh: tokens.refresh
});

// Logout
await db.invalidate();
```

---

## 5. Graph Relationships

### RELATE + Typed Relations

```surql
-- Untyped (any record on either side)
DEFINE TABLE likes TYPE RELATION;

-- Typed (constrained to specific tables)
DEFINE TABLE assigned_to TYPE RELATION IN sales_rep OUT territory;

-- Union types
DEFINE TABLE likes TYPE RELATION IN person OUT blog_post | book;

-- ENFORCED (both records MUST exist first)
DEFINE TABLE assigned_to TYPE RELATION IN sales_rep OUT territory ENFORCED;
```

### Traversal

```surql
-- Forward
SELECT ->assigned_to->territory.* FROM sales_rep:scott;

-- Backward
SELECT <-assigned_to<-sales_rep.* FROM territory:phoenix;

-- Shorthand (no SELECT needed)
sales_rep:scott->assigned_to->territory;

-- With destructuring
sales_rep:scott.{ name, territories: ->assigned_to->territory.{ name, region } };

-- Filtered at the edge
SELECT ->(assigned_to WHERE since > d'2025-01-01')->territory.* FROM sales_rep:scott;

-- Recursive traversal with depth
SELECT @.{1..5}.{ id, next: ->to->* } FROM city:start;
```

### Record References (Bidirectional Links)

```surql
-- Forward reference
DEFINE FIELD deals ON sales_rep TYPE option<array<record<deal>>> REFERENCE;

-- Auto-computed reverse lookup
DEFINE FIELD owner ON deal COMPUTED <~sales_rep;

-- Filtered reverse lookup
DEFINE FIELD owned_by ON deal COMPUTED <~(sales_rep FIELD deals);

-- ON DELETE behaviors
DEFINE FIELD author ON comment TYPE record<user> REFERENCE ON DELETE CASCADE;
DEFINE FIELD company ON employee TYPE record<company> REFERENCE ON DELETE REJECT;
DEFINE FIELD tags ON post TYPE option<array<record<tag>>> REFERENCE ON DELETE UNSET;

-- Custom ON DELETE logic
DEFINE FIELD comments ON user TYPE option<array<record<comment>>>
  REFERENCE ON DELETE THEN {
    UPDATE $this SET deleted_comments += $reference, comments -= $reference;
  };
```

### JS SDK Graph Operations

```typescript
const relation = await db.relate(
  new RecordId('sales_rep', 'scott'),
  new Table('assigned_to'),
  new RecordId('territory', 'phoenix'),
  { since: new Date(), role: 'primary' }
);

// Bulk relations
const bulk = await db.relate(
  [new RecordId('author', 'tobie')],
  new Table('writes'),
  [new RecordId('article', 'a1'), new RecordId('article', 'a2')],
  { role: 'contributor' }
);
```

---

## 6. Computed Tables (Materialized Views)

Auto-updating summary tables. Like pivot tables that refresh themselves.

```surql
-- Source table (DROP = don't store individual records)
DEFINE TABLE sale DROP;

-- Auto-aggregated view
DEFINE TABLE monthly_revenue TYPE NORMAL AS
  SELECT
    count() AS total_sales,
    math::sum(amount) AS revenue,
    math::mean(amount) AS avg_deal_size,
    rep_id,
    time::month(closed_at) AS month
  FROM sale
  GROUP BY rep_id, month;

-- Query like any table
SELECT * FROM monthly_revenue WHERE rep_id = sales_rep:scott;

-- Even live query it
LIVE SELECT * FROM monthly_revenue;
```

**Limitations:**
- Updates only trigger from changes to the FROM table
- Initial population on large datasets can be heavy
- Use `DROP` on source if you only need the aggregate

---

## 7. Vector Search (HNSW Indexes)

### Setup

```surql
DEFINE TABLE knowledge SCHEMAFULL;
DEFINE FIELD content ON knowledge TYPE string;
DEFINE FIELD embedding ON knowledge TYPE array;

DEFINE INDEX knowledge_vec ON knowledge FIELDS embedding
  HNSW DIMENSION 1536 TYPE F32 DIST COSINE;
```

### Parameters

| Param | Required | Default | Description |
|---|---|---|---|
| `DIMENSION` | Yes | - | Must match embedding size (1536 for OpenAI, 1024 for Cohere, etc.) |
| `TYPE` | No | F64 | Storage: F32, F64, I16, I32, I64 (F32 recommended for embeddings) |
| `DIST` | No | EUCLIDEAN | COSINE (text), EUCLIDEAN (spatial), MANHATTAN |
| `EFC` | No | 150 | Build exploration factor (higher = better index, slower build) |
| `M` | No | 12 | Max connections per node (higher = better accuracy, more memory) |

### Search Syntax

```surql
-- <|K, EF|> operator: K = results, EF = search breadth
SELECT content, vector::distance::knn() AS dist
FROM knowledge
WHERE embedding <|5, 40|> $query_vector
ORDER BY dist ASC;

-- Alternative syntax
SELECT *, vector::similarity::cosine(embedding, $search_vec) AS similarity
FROM knowledge
WHERE embedding <~5:COSINE:>$search_vec;
```

### Graph + Vector Combo (Killer Feature)

```surql
LET $last = (SELECT ->purchased->product FROM customer:scott ORDER BY at DESC LIMIT 1)[0];

SELECT *, vector::similarity::cosine($last.embedding, embedding) AS similarity
FROM product
WHERE embedding <|5, 40|> $last.embedding
ORDER BY similarity DESC;
```

MTREE indexes are removed in v3. Use HNSW for all vector work.

---

## 8. Full-Text Search

### Setup

```surql
DEFINE ANALYZER search_analyzer TOKENIZERS blank, class
  FILTERS lowercase, snowball(english);

DEFINE INDEX name_search ON product FIELDS name
  FULLTEXT ANALYZER search_analyzer BM25 HIGHLIGHTS;
```

### Tokenizers

| Tokenizer | Splits on |
|---|---|
| `blank` | Whitespace |
| `class` | Character type changes (letter/number) |
| `camel` | Uppercase transitions (camelCase) |
| `punct` | Punctuation |

### Filters

| Filter | Does |
|---|---|
| `lowercase` | Case folding |
| `ascii` | Normalize accented characters |
| `snowball(lang)` | Stemming (english, spanish, french, etc.) |
| `edgengram(min, max)` | Prefix matching ("hel" matches "hello") |
| `ngram(min, max)` | Substring matching |
| `uppercase` | All caps |

### Searching

```surql
-- Basic match
SELECT * FROM product WHERE name @@ "widget";

-- Numbered references (for scoring/highlighting)
SELECT
  search::score(0) + search::score(1) AS relevance,
  search::highlight("<b>", "</b>", 0) AS name_match
FROM product
WHERE name @0@ "widget" OR description @1@ "widget"
ORDER BY relevance DESC;

-- search::offsets(ref) - byte positions of matches
-- search::analyze(analyzer, text) - preview tokenization
```

### Custom Analyzer Function

```surql
DEFINE FUNCTION fn::normalize($input: string) -> string {
  $input.lowercase().replace('&', 'and')
};
DEFINE ANALYZER custom FUNCTION fn::normalize TOKENIZERS blank FILTERS snowball(english);
```

---

## 9. Indexing & Performance

### Index Types

| Type | Syntax | Use |
|---|---|---|
| Standard | `DEFINE INDEX ... FIELDS x` | Speed up WHERE clauses |
| Unique | `... FIELDS x UNIQUE` | Enforce uniqueness |
| Composite | `... FIELDS x, y` | Multi-field lookups |
| Full-text | `... FIELDS x FULLTEXT ANALYZER a` | Text search |
| HNSW | `... FIELDS x HNSW DIMENSION n` | Vector similarity |
| Count | `... FIELDS x COUNT` | Count occurrences |

Additional flags: `CONCURRENTLY` (background build), `DEFER` (build later)

### EXPLAIN (Query Analysis)

```surql
SELECT * FROM leads WHERE email = 'scott@example.com' EXPLAIN;
SELECT * FROM leads WHERE email = 'scott@example.com' EXPLAIN FULL;
```

### Pre-Computed Fields: VALUE vs COMPUTED

| Feature | `VALUE` | `COMPUTED` |
|---|---|---|
| When calculated | On CREATE/UPDATE (stored on disk) | On every SELECT (dynamic) |
| Speed | Fast reads | Slower reads |
| Freshness | May be stale | Always current |

```surql
-- VALUE: stored, recalculated on write
DEFINE FIELD deal_size ON deals VALUE
  IF amount >= 50000 THEN 'enterprise'
  ELSE IF amount >= 10000 THEN 'mid-market'
  ELSE 'smb';

-- COMPUTED: dynamic, recalculated on read
DEFINE FIELD full_name ON person COMPUTED first_name + ' ' + last_name;
```

### Compound ID Ranges (Skip Table Scans)

```surql
CREATE lead:['inbound', rand::id()] SET name = 'Jane';
SELECT * FROM lead:['inbound', NONE]..['inbound', ..];  -- Range scan, not table scan
```

### Performance Rules

1. `RETURN NONE` on bulk operations (avoids serializing results)
2. Pre-compute booleans for common WHERE conditions
3. Use compound IDs for partitioned data
4. Send multiple statements in one request (reduces round trips)
5. Use `EXPLAIN` to verify indexes are being used
6. `REBUILD INDEX` after heavy write loads on HNSW indexes

---

## 10. Schema Features

### SCHEMAFULL vs SCHEMALESS

```surql
DEFINE TABLE user SCHEMAFULL;    -- Only defined fields allowed
DEFINE TABLE logs SCHEMALESS;    -- Any fields (default)
```

### STRICT Mode

```surql
DEFINE DATABASE mydb STRICT;    -- All tables must be defined before use
```

### Field Features

```surql
-- Default value
DEFINE FIELD status ON leads TYPE string DEFAULT 'new';

-- DEFAULT ALWAYS (overrides even if value provided)
DEFINE FIELD updated_at ON leads TYPE datetime DEFAULT ALWAYS time_now();

-- READONLY (set once, never changed)
DEFINE FIELD created_at ON leads TYPE datetime DEFAULT time_now() READONLY;

-- FLEXIBLE (allow any subfields within a SCHEMAFULL table)
DEFINE FIELD metadata ON leads TYPE object FLEXIBLE;

-- ASSERT (validation)
DEFINE FIELD email ON users TYPE string ASSERT string::is_email($value);
DEFINE FIELD age ON users TYPE int ASSERT $value >= 0 AND $value <= 150;
DEFINE FIELD status ON leads TYPE string ASSERT $value IN ['new', 'contacted', 'qualified', 'won', 'lost'];
```

### ALTER Statements

```surql
ALTER TABLE user SCHEMAFULL;
ALTER FIELD name ON user READONLY;
ALTER FIELD name ON user DROP READONLY;
ALTER INDEX my_index ON table PREPARE REMOVE;  -- Stage removal, test impact
```

### All Supported Types

`string`, `int`, `float`, `number`, `bool`, `datetime`, `duration`, `decimal`, `uuid`, `record<table>`, `object`, `array<T>`, `set<T>`, `option<T>`, `geometry`, `bytes`, `null`, `any`

Type unions: `string | int | null`

### INFO FOR (Introspection)

```surql
INFO FOR ROOT;
INFO FOR NS;
INFO FOR DB;
INFO FOR TABLE leads;
INFO FOR INDEX email_idx ON leads;
```

---

## 11. Changefeeds (Audit Trail)

```surql
DEFINE TABLE deals CHANGEFEED 30d INCLUDE ORIGINAL;

-- Replay changes since a timestamp
SHOW CHANGES FOR TABLE deals SINCE d'2026-04-01T00:00:00Z' LIMIT 100;

-- Replay from a versionstamp
SHOW CHANGES FOR TABLE deals SINCE 0 LIMIT 10;
```

`INCLUDE ORIGINAL` stores the before-state, not just the after-state.
Versionstamps are monotonically increasing across the entire database.

---

## 12. Real-Time (Live Queries)

```surql
LIVE SELECT * FROM leads WHERE status = 'new';
LIVE SELECT DIFF FROM deals;
```

### JS SDK

```typescript
// Async iterator (preferred)
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

---

## 13. SurrealQL Language Features

### Control Flow

```surql
-- IF/ELSE (no THEN keyword)
IF $age >= 18 { 'adult' } ELSE IF $age >= 13 { 'teen' } ELSE { 'child' };

-- FOR loop
FOR $item IN (SELECT * FROM products) {
  UPDATE $item.id SET processed = true;
};

-- THROW (custom errors)
IF $auth == NONE { THROW 'Authentication required' };

-- RETURN
RETURN { status: 'ok', count: count() };
```

No TRY/CATCH exists. No BREAK/CONTINUE.

### Transactions

```surql
BEGIN TRANSACTION;
CREATE account:one SET balance = 100;
CREATE account:two SET balance = 200;
COMMIT TRANSACTION;  -- or CANCEL TRANSACTION to rollback
```

Serializable isolation (strictest level). All operations atomic.

### Closures / Lambdas

```surql
-- Array operations with closures
$items.map(|$item| $item.price * $item.quantity);
$items.filter(|$item| $item.active);
$items.fold(0, |$sum, $item| $sum + $item.value);
$items.find(|$item| $item.name = 'Widget');
$items.any(|$item| $item.priority = 'high');
$items.all(|$item| $item.status = 'active');

-- Typed params and return type
$items.map(|$item: object| -> number { $item.price * $item.qty });
```

### Destructuring

```surql
-- Select specific fields
SELECT obj.{ name, email } FROM users;

-- Nested
SELECT address.{ city, state.{ code } } FROM users;

-- Aliasing (colon, not AS)
RETURN $town.{ location, num_people: population };

-- With expressions
person:one.{ name, name_length: name.len(), accessed_at: time_now() };

-- Graph traversal + destructuring
SELECT @.{ name, territories: ->assigned_to->territory.{ name, region } } FROM sales_rep;
```

### Method Chaining

```surql
-- String methods (drops string:: prefix)
"hello world".uppercase();                           -- "HELLO WORLD"
"check".replace("ck", "que").uppercase().concat("!"); -- "CHEQUE!"

-- Array methods
[3,1,2].sort().distinct();
[[1,2],[3,4]].flatten();

-- .chain() for custom logic
'SurrealDB'.chain(|$n| $n + ' 3.0');  -- "SurrealDB 3.0"
```

### Operators

| Operator | Purpose | Example |
|---|---|---|
| `??` | Nullish coalescing | `$name ?? 'Unknown'` |
| `?:` | Truthy coalescing | `$name ?: 'Fallback'` |
| `CONTAINS` | Array/string contains | `tags CONTAINS 'js'` |
| `INSIDE` | Value in array | `'js' INSIDE tags` |
| `@@` | Full-text match | `body @@ 'search term'` |
| `<\|K,EF\|>` | Vector KNN | `embedding <\|5,40\|> $vec` |

### Literals

```surql
-- Durations: ns, us, ms, s, m, h, d, w, y
1h30m                    -- compound duration
time_now() - 7d          -- datetime arithmetic

-- Datetimes
d'2026-04-02T00:00:00Z'

-- Casts
<string>123              -- "123"
<int>"42"                -- 42
<float>100               -- 100.0
<datetime>"2026-01-01"   -- datetime value
<record<user>>"user:123" -- record ID
```

---

## 14. Built-In Functions (325+ total)

23 function families. Full catalog in `references/surrealdb-v3-functions-catalog.md`.

### Most Useful for Business Apps

| Family | Key Functions | Example |
|---|---|---|
| `string::` | `trim`, `uppercase`, `lowercase`, `slug`, `split`, `join`, `replace`, `contains`, `starts_with`, `len`, `is_email` | `string::slug("My Product")` -> `my-product` |
| `array::` | `distinct`, `sort`, `flatten`, `filter`, `map`, `fold`, `group`, `len`, `sum`, `push`, `pop` | `$items.map(\|$i\| $i.price).sum()` |
| `math::` | `sum`, `mean`, `median`, `min`, `max`, `round`, `ceil`, `floor`, `abs`, `sqrt` | `math::round(revenue * 0.08, 2)` |
| `time::` | `now`, `format`, `day`, `month`, `year`, `hour`, `floor`, `from::unix` | `time::format(time_now(), "%Y-%m-%d")` |
| `crypto::` | `argon2::generate/compare`, `bcrypt::*`, `sha256`, `md5` | Password hashing in DEFINE ACCESS |
| `http::` | `get`, `post`, `put`, `patch`, `delete`, `head` | Webhook triggers in DEFINE EVENT |
| `type::` | `record`, `string`, `number`, `bool`, `is_*` (23 type checkers) | `type::record("users", $id)` |
| `rand::` | `uuid::v4`, `uuid::v7`, `id`, `int`, `float`, `string`, `bool`, `enum` | `rand::uuid::v7()` for sortable IDs |
| `vector::` | `distance::cosine/euclidean/manhattan`, `similarity::cosine`, `normalize`, `magnitude` | Vector search scoring |
| `search::` | `score`, `highlight`, `offsets`, `analyze` | Full-text search scoring |
| `object::` | `keys`, `values`, `entries`, `len`, `from_entries` | `object::keys($record)` |
| `parse::` | `email::host/user`, `url::domain/path/query/scheme` | `parse::email::host($email)` |
| `geo::` | `distance`, `bearing`, `area`, `centroid`, `hash::encode/decode` | Geographic calculations |
| `encoding::` | `base64::encode/decode` | Data encoding |
| `session::` | `ac`, `db`, `id`, `ip`, `ns`, `origin`, `rd`, `token` | `session::ip()` for request IP |
| `duration::` | `days`, `hours`, `mins`, `secs`, `from::days/hours/mins/secs` | Duration arithmetic |

Note: `http::` functions require `--allow-net` server flag. Non-2XX responses cause errors in v2.2+.

---

## 15. JS SDK 2.0 Complete API

### Connection

```typescript
import { Surreal, Table, RecordId, RecordIdRange, BoundIncluded, BoundExcluded } from 'surrealdb';

const db = new Surreal();
await db.connect('ws://localhost:8000', {
  reconnect: { enabled: true, maxAttempts: 10, initialDelay: 1000, maxDelay: 30000 }
});
await db.use({ namespace: 'main', database: 'main' });
```

### CRUD

```typescript
// Select
const all = await db.select<Lead>(new Table('leads'));
const one = await db.select<Lead>(new RecordId('leads', 'abc'));
const partial = await db.select<Lead>(new Table('leads')).fields('name', 'status');

// Create (Table = auto ID, RecordId = specific ID)
const created = await db.create<Lead>(new Table('leads')).content({ name: 'Jane' });
const specific = await db.create<Lead>(new RecordId('leads', 'jane')).content({ name: 'Jane' });

// Insert (bulk)
const many = await db.insert<Lead>(new Table('leads'), [
  { name: 'Jane' }, { name: 'Bob' }
]);

// Update strategies
await db.update<Lead>(id).content({ name: 'Jane', status: 'active' });  // Replace all
await db.update<Lead>(id).merge({ status: 'contacted' });                // Partial
await db.update<Lead>(id).patch([{ op: 'replace', path: '/status', value: 'won' }]);

// Upsert
await db.upsert<Lead>(new RecordId('leads', 'jane')).merge({ last_contact: new Date() });

// Delete
await db.delete<Lead>(new RecordId('leads', 'jane'));
```

### Queries

```typescript
// Type-safe with .collect<>()
const [leads] = await db
  .query('SELECT * FROM leads WHERE status = $s', { s: 'new' })
  .collect<[Lead[]]>();

// Multi-statement tuple types
const [created, all] = await db
  .query('CREATE leads CONTENT $data; SELECT * FROM leads;', { data: newLead })
  .collect<[Lead, Lead[]]>();

// With metadata
const [response] = await db.query('SELECT * FROM leads').responses<[Lead[]]>();
if (response.success) { /* response.result, response.stats */ }

// Streaming (large datasets)
const stream = db.query('SELECT * FROM audit_log').stream<AuditEntry>();
for await (const frame of stream) {
  if (frame.isValue()) process(frame.value);
  if (frame.isDone()) console.log(frame.stats);
}

// JSON output (strips SurrealDB types)
const json = await db.query('SELECT * FROM leads').json().collect<[Lead[]]>();
```

### Expression Builders

```typescript
import { eq, ne, gt, gte, lt, lte, and, or, not, between, contains, matches, knn, raw } from 'surrealdb';

// Use with .where()
const filtered = await db.select<Lead>(new Table('leads')).where(
  and(eq('status', 'active'), gte('revenue', 10000))
);

// Complex
const complex = await db.live<Deal>(new Table('deals')).where(
  and(
    or(eq('stage', 'negotiation'), eq('stage', 'closing')),
    between('value', 25000, 100000),
    not(eq('status', 'lost'))
  )
);
```

### Sessions (Multi-Tenant)

```typescript
const tenant = await db.newSession();
await tenant.use({ namespace: 'tenant_acme', database: 'crm' });
await tenant.signin({ username: 'admin', password: 'pass' });
// Independent scope, auth, variables
await tenant.closeSession();
```

### Variables

```typescript
await db.set('app_name', 'MyApp');
await db.unset('app_name');
console.log(db.parameters);  // all current variables
```

### Import/Export

```typescript
const data = await db.export();
const filtered = await db.export({ tables: ['leads', 'deals'] });
await db.import('CREATE leads CONTENT { name: "Imported" };');
```

### Engine Options

| Package | Protocol | Use |
|---|---|---|
| Built-in | `ws://`, `wss://` | Remote server (default) |
| `@surrealdb/wasm` | `mem://`, `indxdb://` | Browser embedded |
| `@surrealdb/node` | `mem://`, `rocksdb://`, `surrealkv://` | Node/Bun embedded |

---

## 16. Decision Framework: Where Does This Logic Live?

### "Can SurrealDB handle this?"

| Need | SurrealDB Feature | When to use Nuxt instead |
|---|---|---|
| Simple CRUD API | `DEFINE API` | Never for simple CRUD |
| Business calculations | `DEFINE FUNCTION fn::` | Never for pure data logic |
| Data validation | `ASSERT` on fields | Complex multi-field validation across tables |
| Webhooks/notifications | `DEFINE EVENT` + `http::post()` | Need complex orchestration |
| Auth + permissions | `DEFINE ACCESS` + `PERMISSIONS` | External OAuth (use JWT type) |
| Real-time updates | `LIVE SELECT` + `db.live()` | Never for data subscriptions |
| Full-text search | `FULLTEXT ANALYZER` | Never for text search |
| Audit trail | `CHANGEFEED` | Never for change tracking |
| Aggregated dashboards | `DEFINE TABLE ... AS SELECT` | Never for data aggregation |
| File uploads | N/A | Always use Nuxt (Blob storage) |
| External API calls | `http::` functions | Complex multi-step API flows |
| Email/SMS sending | `http::post()` to n8n webhook | Direct SMTP/Twilio integration |
| PDF generation | N/A | Always use Nuxt |
| SSR/page rendering | N/A | Always use Nuxt |
| Complex multi-step workflows | N/A | Use Trigger.dev or Nuxt API routes |

### Architecture

```
Nuxt 4 (thin UI layer)
  - Page rendering, routing, SSR
  - Complex multi-step business flows
  - External service integrations (Stripe, email)
  - File uploads/downloads
  |
  | JS SDK 2.0 (WebSocket)
  v
SurrealDB v3 (the brain)
  - ALL data logic (DEFINE FUNCTION)
  - ALL CRUD endpoints (DEFINE API)
  - ALL auth + permissions (DEFINE ACCESS)
  - ALL data validation (ASSERT, TYPE)
  - ALL real-time (LIVE SELECT)
  - ALL search (FULLTEXT, HNSW)
  - ALL relationships (RELATE, REFERENCE)
  - ALL audit (CHANGEFEED)
  - ALL aggregation (computed tables)
  |
  | http::post() in DEFINE EVENT
  v
Trigger.dev (background jobs + orchestration)
  - Email sequences, Slack/Telegram notifications
  - CRM sync, complex multi-service orchestration
  - Scheduled jobs, retries, durable execution
  - TypeScript-native (same language as rest of stack)
```

---

## 17. What Does NOT Exist in SurrealQL

| Missing | Workaround |
|---|---|
| Scheduled/cron jobs | Trigger.dev scheduled tasks or Nuxt cron calling `db.run('fn::job_name')` |
| Email/SMS sending | Trigger.dev task or `http::post()` to webhook via ASYNC events |
| `${}` template syntax in SurrealQL | Use `+` operator or `string::concat()` (both handle mixed types) |

**These DO exist (commonly assumed missing):**
- `TRY { ... } CATCH { ... }` -- error handling inside DEFINE FUNCTION
- `BREAK` / `CONTINUE` -- loop control in FOR loops
- `DEFINE BUCKET` -- native file/blob storage with memory or filesystem backends
- `file::put()` / `file::get()` -- upload and retrieve files from buckets
- `surql` template tag -- JS SDK parameterized queries (`import { surql } from 'surrealdb'`)
- String concatenation -- `+` operator and `string::concat()` (auto-stringifies non-strings)
- Optional chaining -- not needed, SurrealDB field access is null-safe by default
- `DEFINE CONFIG GRAPHQL` -- exists but limited to table/function exposure control

---

## 18. Server Configuration & Capabilities

### Capability System (deny-by-default)

SurrealDB uses a security sandbox. Most capabilities are off unless explicitly allowed.

```bash
# Production lockdown: only allow what you need
surreal start surrealkv://data.db \
  --deny-all \
  --allow-funcs "array, string, math, time, crypto::argon2, http::post" \
  --allow-net "n8n.example.com:443, api.stripe.com:443" \
  --allow-experimental files
```

Key flags: `--allow-all`, `--deny-all`, `--allow-funcs [list]`, `--allow-net [host:port|CIDR]`,
`--allow-guests`, `--allow-scripting`, `--allow-experimental [surrealism|files]`

Deny always overrides allow: `--allow-all --deny-funcs "http"` allows everything except http:: functions.

### DEFINE BUCKET (Experimental, requires `--allow-experimental files`)

```surql
DEFINE BUCKET uploads BACKEND "file:/var/lib/surrealdb/files"
  PERMISSIONS WHERE $auth != NONE;

-- File operations via pointer syntax
f"uploads:/avatar.jpg".put($file_data);
f"uploads:/avatar.jpg".get();        -- returns bytes, cast with <string> for text
f"uploads:/avatar.jpg".exists();     -- bool
f"uploads:/avatar.jpg".delete();
f"uploads:/avatar.jpg".copy("backup.jpg");
f"uploads:/avatar.jpg".rename("photo.jpg");

-- List with pagination
file::list("uploads", { prefix: "docs/", limit: 10 });
-- Returns: [{ file, size, updated }]
```

Backends: `"memory"` (dev), `"file:/path"` (persistent). No S3 yet.
Requires `SURREAL_BUCKET_FOLDER_ALLOWLIST` env var for file backends.

### Storage Backends

| Backend | Command | Use |
|---|---|---|
| Memory | `surreal start memory` | Dev/testing |
| SurrealKV | `surreal start surrealkv://data.db` | Production single-node |
| SurrealKV + versioning | `surreal start "surrealkv://data.db?versioned=true"` | Temporal queries |
| TiKV | `surreal start tikv://127.0.0.1:2379` | Multi-node HA clusters |

### Clustering via TiKV

SurrealDB nodes are stateless. TiKV handles storage, replication (Raft consensus), and failover.
Deployment guides exist for EKS, GKE, AKS. Typically 3+ TiKV replicas for fault tolerance.

### Observability

```bash
# OpenTelemetry (metrics + traces)
SURREAL_TELEMETRY_PROVIDER=otlp \
OTEL_EXPORTER_OTLP_ENDPOINT="http://collector:4317" \
surreal start ...

# Multi-destination logging
surreal start \
  --log info \
  --log-format json \
  --log-file-enabled --log-file-path logs/ --log-file-rotation daily \
  --log-socket "logstash:5044"
```

### Backup & Restore

```bash
# Full export
surreal export --conn http://localhost:8000 --user root --pass root --ns main --db main backup.surql

# Selective export
surreal export --conn http://localhost:8000 --user root --pass root --ns main --db main \
  --tables users,leads --records true --functions true backup.surql

# Import
surreal import --conn http://localhost:8000 --user root --pass root --ns main --db main backup.surql

# Import at startup
surreal start surrealkv://data.db --import-file seed.surql
```

### WebSocket vs HTTP

| Feature | WebSocket | HTTP |
|---|---|---|
| Live queries | Yes | No |
| Transactions | Yes | No |
| Session persistence | Yes | Per-request |
| Best for | SDKs, real-time apps | curl, webhooks, simple integrations |

### Connection Limits / Rate Limiting

Not configurable in SurrealDB itself. Handle at reverse proxy (Nginx/Caddy) or load balancer.

### DEFINE CONFIG types

Three types: `DEFINE CONFIG API` (global middleware), `DEFINE CONFIG GRAPHQL` (schema exposure), `DEFINE CONFIG DEFAULT` (default ns/db).

```surql
DEFINE CONFIG DEFAULT NAMESPACE main DATABASE main;
```

---

## 19. Stack Impact Analysis

### What SurrealDB replaces in your Nuxt 4 + Pinia + Zod stack

| Tool | Replacement % | Keep For | Drop When |
|---|---|---|---|
| **Nuxt API routes** | 30% | External APIs (Stripe, email), SSR, complex business logic | Pure data CRUD |
| **Nuxt auth middleware** | 60% | Route guards, OAuth redirect flows, UI auth state | Data-level authorization |
| **Pinia** | 40% | UI state, optimistic updates, offline, cross-component state | Server-synced data (use live queries) |
| **Zod** | 20% | Client validation, TypeScript types, form UX, transforms | Never drop Zod |
| **Cron aggregation jobs** | 80% | Time-triggered cleanup, external notifications | Summary/dashboard tables |
| **Pinecone/Weaviate** | 70% | Billions of vectors, managed pipelines | Small-to-medium RAG |
| **Meilisearch/Algolia** | 30% | Typo tolerance, facets, search-as-you-type | Basic keyword search |
| **Trigger.dev** | Replaces n8n | TypeScript background jobs, retries, durable execution, scheduling | Decision: Trigger.dev over n8n for code-first workflows |
| **Prisma/Drizzle** | 60% | Schema-driven TypeScript autocomplete, migrations | Query building, live queries |
| **External audit logs** | 50% | Compliance, tamper-proof, long retention | Dev debugging, short-term audit |
| **GraphQL layer** | 50% | Custom resolvers, federation, Apollo cache | Auto-generated CRUD API |
| **External file storage** | 20% (experimental) | CDN, large files, image processing, signed URLs | Small files with unified permissions |

### The Optimal Pattern: SurrealDB-First, Not SurrealDB-Only

```
Nuxt 4 (thinner than before)
  - Page rendering + SSR
  - Route guards (redirect if no token)
  - OAuth flows (Google, GitHub)
  - External service calls (Stripe, Resend)
  - File upload handling (until DEFINE BUCKET matures)
  - Zod validation (client + API input)
  - Pinia for UI-only state (sidebar, modals, form drafts)

SurrealDB v3 (the brain)
  - ALL data CRUD (DEFINE API)
  - ALL authorization (PERMISSIONS)
  - ALL auth (DEFINE ACCESS with JWT/RECORD/BEARER)
  - ALL data validation (ASSERT + TYPE)
  - ALL real-time (LIVE SELECT -> feeds Pinia stores)
  - ALL search (FULLTEXT for basic, HNSW for semantic)
  - ALL aggregation (computed tables)
  - ALL audit (CHANGEFEED)
  - ALL graph relationships (RELATE + REFERENCE)
  - ALL server-side functions (DEFINE FUNCTION)
  - File storage for small files (DEFINE BUCKET, experimental)

Trigger.dev (background jobs + orchestration)
  - Multi-step workflows (TypeScript-native, durable execution)
  - Scheduled jobs (cron syntax, calling db.run('fn::job'))
  - Retries with configurable backoff
  - AI agent workflows with checkpoints
  - Replaces n8n for code-first workflows
  - Coolify template available (self-host) or cloud ($10-50/mo)
  - Apache 2.0 license
```

## Companion Files

- `references/surrealdb-v3-functions-catalog.md` - Complete 325+ function catalog
- `references/surrealql-language-reference.md` - Full SurrealQL language features
- `references/surrealdb-v3-reference.md` - Original quick reference (still valid)
- `skills/scott-surrealdb/SKILL.md` - Session-loaded quick reference
