# SurrealDB v3 Reference for AI Coding Assistants

Target stack: SurrealDB v3 server + JS SDK surrealdb@2.0.x (npm) + Nuxt 4 + TypeScript


## v2 to v3 Breaking Changes

| What changed | v2 syntax | v3 syntax | Notes |
|---|---|---|---|
| Computed values | `VALUE <future> { expr }` | `COMPUTED expr` | futures removed entirely |
| Record ID creation | `type::thing("table", "id")` | `type::record("table", "id")` | function call only, no method chaining |
| Metadata functions | `meta::id()`, `meta::tb()` | `record_id()`, `record_tb()` | meta module removed in v2, record module is current |
| Function syntax | `module::function()` | `module_function()` | both `::` and `_` work, underscore is canonical |
| UPDATE behavior | creates records if missing | returns `[]` if missing | use `UPSERT` for create-or-update |
| Auth definition | `DEFINE SCOPE`, `DEFINE TOKEN` | `DEFINE ACCESS` | unified access management |
| VERSION clause | valid on CREATE/INSERT | removed from CREATE/INSERT | VERSION only valid on SELECT (SurrealKV temporal queries) |
| Undefined tables (SELECT/DELETE) | returns `[]` | returns error | applies by default, not just STRICT mode |
| Undefined tables (CREATE/INSERT/UPSERT) | auto-creates table | auto-creates table | same as v2 unless database is STRICT |
| STRICT mode | instance-level `--strict` flag | per-database `DEFINE DATABASE mydb STRICT` | granular control per database |
| SCHEMAFULL extra fields | silently filtered | returns error | use destructuring `.{ field1, field2 }` to select defined fields |
| Method chaining | not available | `value.method()` | auto-resolves module from data type |


## SurrealQL v3 Operation Reference

### CREATE
```sql
-- SET syntax (good for inline expressions)
CREATE person:tobie SET
    name = 'Tobie',
    age = 30,
    signup = time_now();

-- CONTENT syntax (good for structured data from app code)
CREATE person:100 CONTENT {
    name: 'Tobie',
    age: 30
};

-- Return specific fields
CREATE person SET age = 46 RETURN age, id;

-- Dynamic ID
CREATE type::record("weather", $now) SET city = 'London';
```

### SELECT
```sql
SELECT * FROM person;
SELECT name, age FROM person WHERE age > 18;
SELECT *, name.uppercase() FROM person;  -- method chaining
```

### UPDATE (does NOT create missing records)
```sql
UPDATE person:tobie SET age = 31;
UPDATE person SET active = true WHERE signup < time_now() - 30d;
-- Returns [] if record doesn't exist
```

### UPSERT (creates if missing)
```sql
UPSERT person:tobie SET name = 'Tobie', age = 31;
UPSERT person:tobie CONTENT { name: 'Tobie', age: 31 };
```

### DELETE
```sql
DELETE person:tobie;
DELETE person WHERE active = false;
DELETE person:tobie RETURN BEFORE;
```

### RELATE (graph edges)
```sql
RELATE person:tobie->likes->post:123 SET at = time_now();
RELATE person:tobie->follows->person:jaime;

-- Traverse graph
SELECT ->likes->post FROM person:tobie;
SELECT <-follows<-person FROM person:jaime;
```

### LIVE SELECT (requires WebSocket connection)
```sql
LIVE SELECT * FROM person WHERE age > 18;
LIVE SELECT DIFF FROM person;
```

### RETURN clauses (work on CREATE, UPDATE, UPSERT, DELETE)
```sql
RETURN NONE
RETURN BEFORE
RETURN AFTER
RETURN DIFF
RETURN field1, field2
RETURN VALUE field1
```


## Schema Definition Reference

### DEFINE TABLE
```sql
-- Schemaless (default)
DEFINE TABLE person SCHEMALESS;

-- Schemafull (strict field enforcement)
DEFINE TABLE person SCHEMAFULL;

-- With permissions
DEFINE TABLE person SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR create WHERE $auth.role = 'admin'
        FOR update WHERE $auth.id = id
        FOR delete NONE;

-- Computed table (like a view)
DEFINE TABLE person_count AS
    SELECT count() AS total, active
    FROM person
    GROUP BY active;
```

### DEFINE FIELD
```sql
-- Basic typed field
DEFINE FIELD name ON person TYPE string;
DEFINE FIELD age ON person TYPE int;
DEFINE FIELD email ON person TYPE string ASSERT string_is::email($value);

-- Optional field
DEFINE FIELD nickname ON person TYPE option<string>;

-- With default value
DEFINE FIELD created ON person TYPE datetime VALUE time_now();

-- Computed field (replaces futures)
DEFINE FIELD full_name ON person COMPUTED name.first + ' ' + name.last;

-- Record link
DEFINE FIELD company ON person TYPE record<company>;
DEFINE FIELD friends ON person TYPE option<array<record<person>>>;

-- Record reference (bidirectional tracking, v2.2+)
DEFINE FIELD comics ON person TYPE option<array<record<comic_book>>> REFERENCE;
-- Query incoming references with <~ syntax
DEFINE FIELD owners ON comic_book COMPUTED <~person;
```

### DEFINE INDEX
```sql
-- Unique index
DEFINE INDEX email_idx ON person FIELDS email UNIQUE;

-- Composite index
DEFINE INDEX name_idx ON person FIELDS name.first, name.last;

-- Full-text search index
DEFINE ANALYZER simple_analyzer TOKENIZERS blank, class FILTERS lowercase;
DEFINE INDEX content_search ON post FIELDS content FULLTEXT ANALYZER simple_analyzer;
```

### DEFINE ACCESS (replaces SCOPE and TOKEN)
```sql
DEFINE ACCESS account ON DATABASE TYPE RECORD
    SIGNUP ( CREATE user SET email = $email, pass = crypto::argon2::generate($pass) )
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass) )
    DURATION FOR TOKEN 15m, FOR SESSION 12h;
```

### DEFINE EVENT
```sql
DEFINE EVENT log_update ON person WHEN $before != $after THEN {
    CREATE log SET
        table = 'person',
        record = $after.id,
        changed_at = time_now(),
        before = $before,
        after = $after;
};
```

### STRICT Database
```sql
-- All resources must be defined before use (CREATE on undefined table errors)
DEFINE DATABASE mydb STRICT;
```


## JS SDK Reference (surrealdb@2.0.x npm)

### Connection
```typescript
import Surreal from 'surrealdb';

const db = new Surreal({
    codecOptions: { useNativeDates: true }
});

await db.connect('ws://localhost:8000', {
    namespace: 'my_ns',
    database: 'my_db',
    authentication: { username: 'root', password: 'root' },
    reconnect: { attempts: 10, retryDelay: 1000 }
});
```

### Authentication (db.signin)
```typescript
// Root
await db.signin({ username: 'root', password: 'pass' });

// Namespace
await db.signin({ namespace: 'ns', username: 'user', password: 'pass' });

// Database
await db.signin({ namespace: 'ns', database: 'db', username: 'user', password: 'pass' });

// Record Access (v2+ replacement for scopes)
await db.signin({
    namespace: 'ns',
    database: 'db',
    access: 'account',
    variables: { email: 'user@example.com', pass: '123456' }
});
```

### Queries
```typescript
// Standard query with parameters
const results = await db.query('SELECT * FROM person WHERE age > $min', { min: 18 });

// CRUD methods
const users = await db.select('users');
const created = await db.create('person', { name: 'Tobie', age: 30 });
```

### Live Queries (WebSocket required)
```typescript
import { Table } from 'surrealdb';

// Basic: iterate all updates
const sub = await db.live(new Table('users'));
for await (const update of sub) {
    console.log(update.action);  // CREATE | UPDATE | DELETE
    console.log(update.result);  // full record
}

// Filter to specific fields
const sub2 = await db.live(new Table('users')).fields('name', 'email');

// Single field value
const sub3 = await db.live(new Table('users')).value('status');
```

### Connection Lifecycle
```typescript
// Event listeners
db.subscribe('connecting', () => { /* reconnecting */ });
db.subscribe('connected', (version) => { /* server version */ });
db.subscribe('error', (err) => { /* connection error */ });

// Status
db.isConnected;  // boolean
db.status;       // string

// Isolated session (different ns/db)
const session = await db.newSession();
await session.use({ namespace: 'other_ns', database: 'other_db' });
```


## Function Rename Map

| v2 name (::) | v3 canonical (_) | Method chaining | Notes |
|---|---|---|---|
| `type::thing()` | `type_record()` | no | creates record ID from table + id |
| `type::is::record()` | `type_is_record()` | `val.is_record()` | checks if value is a record |
| `meta::id()` | `record_id()` | `record_id.id()` | extracts ID from record pointer |
| `meta::tb()` | `record_tb()` | `record_id.tb()` | extracts table from record pointer |
| `record::exists()` | `record_exists()` | `record_id.exists()` | checks if record exists in DB |
| `record::is_edge()` | `record_is_edge()` | `record_id.is_edge()` | checks if value is a graph edge |
| `string::join()` | `string_join()` | `" ".join(a, b)` | joins strings with separator |
| `string::uppercase()` | `string_uppercase()` | `name.uppercase()` | method chaining drops module prefix |
| `string::is::alphanum()` | `string_is_alphanum()` | `val.is_alphanum()` | |
| `time::now()` | `time_now()` | no | returns current datetime |
| `crypto::argon2::generate()` | `crypto_argon2_generate()` | no | password hashing |
| `crypto::argon2::compare()` | `crypto_argon2_compare()` | no | password verification |

Method chaining rule: SurrealDB auto-resolves the module from the data type. `name.uppercase()` is equivalent to `string_uppercase(name)`. The module prefix is dropped in method syntax.


## Gotchas and Guardrails

- **UPDATE does not create.** It returns `[]` silently if the record is missing. Use `UPSERT` when you need create-or-update behavior.
- **COMPUTED fields cannot be nested.** `DEFINE FIELD name.full` is invalid. Flatten to `full_name`.
- **COMPUTED fields cannot use DEFAULT.** They are mutually exclusive.
- **COMPUTED fields cannot target the `id` field.**
- **Live queries require WebSocket.** Use `ws://` or `wss://`, not `http://`. HTTP connections silently fail to stream.
- **type_record() has no method chaining.** It creates record IDs from nothing, so there's no value to chain on.
- **SCHEMAFULL rejects extra fields in v3.** In v2 they were silently dropped. Use destructuring `{ name, age }.{ name }` to filter.
- **Querying undefined tables errors by default** for SELECT and DELETE. CREATE/INSERT/UPSERT still auto-create unless the database is STRICT.
- **DEFINE ACCESS replaces DEFINE SCOPE and DEFINE TOKEN.** Old syntax is deprecated.
- **Both `::` and `_` function syntax work.** Underscore is canonical v3 but double-colon is not removed.
- **Record references use `<~` for reverse lookups.** Define with `REFERENCE` keyword, query with `<~table` syntax.
- **JS SDK returns RecordId objects, not strings.** Use `String(id)` before comparing or calling `.replace()`.
- **JS null is not SurrealQL NONE.** Omit `option<>` fields entirely instead of passing null.
- **Array field indexes break exact match queries** in v2.6.0. Don't index array fields. (Verify if fixed in v3.)
- **Cannot ALTER ASSERT constraints.** Must REMOVE FIELD then re-DEFINE it. No in-place alteration.
- **Array ASSERT validation is unreliable** for complex nested arrays. Validate at the application layer instead.
- **Use `RETURN NONE` for bulk operations.** Without it, CREATE returns every record, wasting memory on large inserts.


## Performance Patterns

### Pre-computed Boolean Fields (fastest WHERE)
Instead of computing in the WHERE clause, pre-compute a boolean field:
```sql
DEFINE FIELD data_length ON person VALUE random_data.len();
DEFINE FIELD is_short ON person VALUE random_data.len() < 10;

-- Slowest: function call + compare in WHERE
SELECT * FROM person WHERE random_data.len() < 10;
-- Faster: compare pre-computed number
SELECT * FROM person WHERE data_length < 10;
-- Fastest: check pre-computed boolean
SELECT * FROM person WHERE is_short;
-- Instant: direct record access (no table scan)
SELECT * FROM person:one;
```

### Compound ID Ranges (partitioned queries)
Encode category into the record ID, then query by range instead of WHERE:
```sql
-- Create records with compound IDs: [category, unique_id]
CREATE player:['mage', rand::id()] SET class = 'mage';
CREATE player:['barbarian', rand::id()] SET class = 'barbarian';

-- Range query (skips table scan, much faster as table grows)
SELECT * FROM player:['mage', NONE]..['mage', ..];
-- vs WHERE (requires full table scan)
SELECT * FROM player WHERE class = 'mage';
```
Use compound IDs for any data naturally partitioned by category, location, or time.

### Time-Series with Compound IDs + Event Alerts
```sql
-- Sensor reading with [sensor_ref, timestamp] as compound ID
CREATE reading:[sensor:one, time_now()] SET pressure = 600;

-- Event that aggregates recent readings and generates alerts
DEFINE EVENT alert_from_create ON reading WHEN $event = 'CREATE' THEN {
    LET $source = $after.id[0];
    LET $time = $after.id[1];
    -- Average pressure over last 15 minutes via range query
    LET $avg = math::mean(
        SELECT VALUE pressure FROM reading:[$source, $time - 15m]..[$source, $time]
    );
    LET $drop = $avg - $after.pressure;
    IF $drop > 15 {
        CREATE alert SET
            equipment = $source,
            severity = 'high',
            message = 'Pressure drop: ' + <string>$drop + ' PSI',
            triggered_at = time_now();
    };
};
```
This pattern combines compound ID ranges, event triggers, and in-query aggregation. Applicable to IoT, monitoring, claim status tracking, or any time-series alerting.


## JS SDK 2.0 Features (February 2026)

The JS SDK v2.0 is a major rewrite. These features go beyond what's in the basic SDK reference above.

### Table Class Required
Plain strings no longer accepted as table names. Use the `Table` class:
```typescript
import { Table } from 'surrealdb';

const usersTable = new Table('users');
await db.select(usersTable);
// NOT: await db.select('users');  // no longer works
```

### Query Builder Pattern
Chainable helpers for filtering, limiting, and fetching:
```typescript
// Select with field filtering and fetch
const record = await db.select(id)
    .fields('age', 'firstname', 'lastname')
    .fetch('company');

// Update with merge (replaces second argument)
await db.update(record).merge({ hello: 'world' });

// Update methods: .content(), .merge(), .replace(), .patch()
```

### Query Method Overhaul
```typescript
// Type-safe query with generics
const [user] = await db.query<[User]>('SELECT * FROM user:foo');

// Collect specific result indexes from multi-statement queries
const [foo, bar] = await db.query('LET $foo = ...; SELECT * FROM $foo; SELECT * FROM $bar')
    .collect<[User, Product]>(2, 3);

// JSON output
const [products] = await db.query<[Product[]]>('SELECT * FROM product').json();

// Response objects (includes metadata)
const responses = await db.query<[Product[]]>('SELECT * FROM product').responses();

// Streaming responses (only way to get query stats)
const stream = db.query('SELECT * FROM foo').stream();
for await (const frame of stream) {
    if (frame.isValue<Foo>()) { /* frame.value typed as Foo */ }
    else if (frame.isDone()) { /* frame.stats available */ }
    else if (frame.isError()) { /* frame.error */ }
}
```

### Expressions API
Build dynamic, parameter-safe expressions:
```typescript
import { eq, or, and, between, inside, raw, surql } from 'surrealdb';

// With query builder
await db.select(userTable).where(eq('active', true));

// With surql template tag
await db.query(surql`SELECT * FROM user WHERE ${eq('active', checkActive)}`);

// Complex expressions
const result = expr(
    or(
        eq('foo', 'bar'),
        and(
            inside('hello', ['hello']),
            between('number', 1, 10)
        )
    )
);
```

### Redesigned Live Query API
```typescript
const live = await db.live(new Table('users'));

// Callback pattern (record ID as third arg)
live.subscribe((action, result, record) => {
    // action: CREATE | UPDATE | DELETE
});

// Async iterator pattern
for await (const { action, value } of live) { ... }

// Kill the subscription
live.kill();

// Create from existing LIVE SELECT id
const [id] = await db.query('LIVE SELECT * FROM users');
const live2 = await db.liveOf(id);
```

### Automatic Token Refreshing
```typescript
await db.connect('ws://localhost:8000', {
    namespace: 'test',
    database: 'test',
    renewAccess: true, // default true
    authentication: () => ({
        username: 'foo',
        password: 'bar',
    })
});
// SDK auto-renews tokens on expiry or reconnect
```

### Multi-Session Support
```typescript
// Create isolated session
const session = await db.newSession();
await session.signin({ ... });
await session.closeSession();

// Fork session (clone ns, db, vars, auth state)
const forked = await session.forkSession();

// Auto-cleanup with await using
await using session2 = await db.newSession();
// JavaScript closes session at end of scope
```

### Internal State Access
```typescript
db.namespace;      // current namespace
db.database;       // current database
db.params;         // connection parameters
db.accessToken;    // current access token
db.refreshToken;   // current refresh token
```

### Value Encode/Decode Visitors
```typescript
const db = new Surreal({
    codecOptions: {
        valueDecodeVisitor(value) {
            if (value instanceof RecordId) {
                return new RecordId('transformed', 'id');
            }
            return value;
        }
    }
});
```

### Diagnostics API (development only)
```typescript
import { applyDiagnostics, createRemoteEngines } from 'surrealdb';

new Surreal({
    driverOptions: {
        engines: applyDiagnostics(createRemoteEngines(), (event) => {
            console.log(event.type, event.key, event.phase);
        })
    }
});
```

### WASM and Node.js Engines
```typescript
// WASM (browser, supports Web Workers)
import { createWasmEngines } from '@surrealdb/wasm';
const db = new Surreal({
    engines: { ...createRemoteEngines(), ...createWasmEngines() }
});

// Node.js (also Bun & Deno)
import { createNodeEngines } from '@surrealdb/node';
const db = new Surreal({
    engines: { ...createRemoteEngines(), ...createNodeEngines() }
});
```


## AI & Agent Patterns

SurrealDB v3 replaces 3-4 separate services for AI agent workloads by combining structured data, vector search, graph relationships, and real-time events in one database.

### Vector Search (HNSW Index)
```sql
-- Define table and embedding field
DEFINE TABLE ai_docs SCHEMALESS;
DEFINE FIELD text ON ai_docs TYPE string;
DEFINE FIELD embedding ON ai_docs TYPE array;

-- Create HNSW index (replaces MTREE from v2)
DEFINE INDEX ai_docs_vec ON ai_docs FIELDS embedding
    HNSW DIMENSION 1536 DIST COSINE;

-- Query: find k nearest neighbors
-- <|k, ef|> operator: k = results, ef = search breadth
SELECT text, vector::distance::knn() AS dist
FROM ai_docs
WHERE embedding <|8, 40|> $query_vector
ORDER BY dist ASC;
```

### RAG (Retrieval Augmented Generation)
```sql
-- Store documents with embeddings
CREATE ai_docs SET
    text = $chunk_text,
    source = $source_url,
    embedding = $embedding_vector;

-- Retrieve context for LLM prompt
SELECT text, source, vector::distance::knn() AS dist
FROM ai_docs
WHERE embedding <|5, 40|> $question_embedding
ORDER BY dist ASC;
```

### Agent Memory Schema
```sql
-- Conversation history
DEFINE TABLE conversation SCHEMAFULL;
DEFINE FIELD agent_id ON conversation TYPE string;
DEFINE FIELD role ON conversation TYPE string;  -- user | assistant | tool
DEFINE FIELD content ON conversation TYPE string;
DEFINE FIELD embedding ON conversation TYPE option<array>;
DEFINE FIELD created ON conversation TYPE datetime VALUE time_now();
DEFINE INDEX conv_vec ON conversation FIELDS embedding HNSW DIMENSION 1536 DIST COSINE;

-- Entity memory (extracted from conversations)
DEFINE TABLE entity SCHEMAFULL;
DEFINE FIELD name ON entity TYPE string;
DEFINE FIELD type ON entity TYPE string;
DEFINE FIELD properties ON entity TYPE object;
DEFINE FIELD embedding ON entity TYPE option<array>;

-- Link entities to conversations
RELATE conversation:abc->mentions->entity:xyz;

-- Recall: find relevant past context
SELECT *, ->mentions->entity AS entities
FROM conversation
WHERE embedding <|5, 40|> $query_vec
ORDER BY vector::distance::knn() ASC;
```

### Graph + Vector Combo Queries
The killer feature: combine graph traversal with vector similarity in one query.
```sql
-- Find products similar to a user's last purchase (from official docs)
LET $last_purchase = user:one->purchased.at.last();
LET $last_product = (
    user:one->purchased[WHERE at = $last_purchase]->product
)[0];

-- Get similar products by vector similarity
(
    SELECT id, vector,
        vector::similarity::cosine($last_product.vector, vector) AS similarity
    FROM product
    ORDER BY similarity DESC
    LIMIT 3
)[1..];

-- Find document siblings via shared tags + semantic similarity
SELECT VALUE (
    SELECT *,
        vector::similarity::cosine(embedding, $parent.embedding) AS similarity
    FROM array::distinct(->tagged_with->$tag<-tagged_with<-document)
) AS siblings
FROM ONLY $record
FETCH siblings;
```

### Knowledge Graph for AI
```sql
-- Create entities with document data
CREATE person:einstein CONTENT {
    name: 'Albert Einstein',
    biography: { birth: '1879-03-14', nationality: 'Swiss' },
    tags: ['physics', 'relativity', 'nobel laureate']
};

-- Connect with typed edges
RELATE person:einstein->won->award:nobel_prize SET year = 1921;

-- Multi-hop traversal
SELECT ->won->award.* FROM person:einstein;
SELECT <-won<-person.* FROM award WHERE category = 'Chemistry';

-- Recursive traversal with depth and destructuring
SELECT @.{1..5}.{
    id,
    next_roads: ->to.*,
    next_cities: ->to->city
} FROM city;
```

### Framework Integrations
SurrealDB has official integrations with:
- **LangChain** (Python) - SurrealDBVectorStore + SurrealDBGraph
- **CrewAI** - SurrealStorage for entity and short-term memory
- **Pydantic AI** - vector search tool with HNSW
- **Google ADK** - SurrealRetriever tool
- **LlamaIndex** - vector store backend
- **Dynamiq** - document writer/retriever nodes
- **CAMEL, SmolAgents** - lightweight agent memory


## Real-time Patterns

### Events with HTTP Callbacks (trigger n8n webhooks)
```sql
-- Notify external service on record creation
DEFINE FUNCTION fn::notify_admin($record: any) {
    RETURN http::post('https://n8n.example.com/webhook/xyz', $record);
};

DEFINE EVENT notify_new_person ON TABLE person
    WHEN $event = 'CREATE'
    THEN {
        LET $record = $after;
        SELECT fn::notify_admin($record);
    };

-- Anomaly detection with threshold
DEFINE EVENT high_temp_alert ON TABLE sensor_readings
    WHEN $event = 'CREATE' AND $after.temperature_celsius > 30
    THEN {
        RETURN http::post('https://n8n.example.com/webhook/alert', {
            sensor: $after.id[1],
            value: $after.temperature_celsius
        });
    };
```
Note: http::post requires enabling network capabilities at server startup.

### Changefeeds (audit trail / event replay)
```sql
-- Enable changefeed on a table (retained for 3 days)
DEFINE TABLE reading CHANGEFEED 3d;
-- With original record state
DEFINE TABLE reading CHANGEFEED 3d INCLUDE ORIGINAL;

-- Replay changes since a timestamp
SHOW CHANGES FOR TABLE reading SINCE d'2023-09-07T01:23:52Z' LIMIT 10;

-- Replay changes since a version number
SHOW CHANGES FOR TABLE reading SINCE 0 LIMIT 10;
```

### Time-Series Modeling
```sql
-- Compound ID with location + sensor + timestamp
CREATE sensor_readings:[location:MainHall, sensor:Temp01, time_now()] CONTENT {
    temperature_celsius: 22.5
};

-- Pre-computed daily aggregation view
DEFINE TABLE daily_readings AS
    SELECT id[0] AS location,
        time::day(id[2]) AS day,
        math::mean(temperature_celsius) AS avg_temp
    FROM sensor_readings
    GROUP BY id[0], time::day(id[2]);

-- Live query the view for real-time dashboards
LIVE SELECT * FROM daily_readings;
```

### Typed Relations (ENFORCED)
```sql
-- Define relation table with type constraints
DEFINE TABLE likes TYPE RELATION IN person OUT blog_post | book;

-- ENFORCED: both records must exist before RELATE succeeds
DEFINE TABLE likes TYPE RELATION IN person OUT person ENFORCED;
```

### Audit Event Pattern (from automation-business)
```sql
DEFINE EVENT table_audit ON TABLE person
    WHEN $event IN ['CREATE', 'UPDATE', 'DELETE']
    THEN (
        CREATE audit_log SET
            table_name = 'person',
            record_id = $value.id,
            action = $event,
            user_id = $auth.id ?? 'system',
            before_data = $before ?? {},
            after_data = $after ?? {},
            timestamp = time_now()
    );
```


## Graph Traversal Patterns

### Direct Traversal from Record IDs (no SELECT needed)
```sql
-- Shorthand (equivalent to SELECT VALUE)
comment:one<-wrote<-user;
user:mcuserson->likes->cat;

-- With destructuring
user:mcuserson.{ name, cats: ->likes->cat };
```

### Traversal with Filtering
```sql
-- Filter at the edge
SELECT name,
    ->(wrote WHERE written_at = 'Athens')->book.{ name, id } AS books
FROM person;

-- Filter at the target
SELECT ->won->award.* FROM person:marie;
SELECT <-won<-person.* FROM award WHERE category = 'Chemistry';
```

### Record Ranges (faster than WHERE)
```sql
-- Numeric ID range
SELECT * FROM person:1..1000;

-- Time-based range with compound IDs
SELECT * FROM temperature:['London', NONE]..=['London', time_now()];
SELECT * FROM temperature:['London', '2022-08-29T08:03:39']..['London', '2022-08-29T08:09:31'];
```


## Embedded & Edge (Future Capabilities)

SurrealDB runs the same engine embedded in apps, at the edge, or in the cloud. Relevant for Eleanor (Tauri) and future IoT/mobile projects.

### Rust Embedded
```rust
use surrealdb::{engine::local::{File, Mem}, Surreal};

// In-memory (ephemeral)
let db = Surreal::new::<Mem>(()).await?;

// File-backed (persistent)
let db = Surreal::new::<File>("/var/lib/myapp/edge.db").await?;
```

### WASM in Web Workers
```typescript
import { createWasmWorkerEngines } from '@surrealdb/wasm';
import WorkerAgent from '@surrealdb/wasm/worker?worker';

const db = new Surreal({
    engines: {
        ...createRemoteEngines(),
        ...createWasmWorkerEngines({
            createWorker: () => new WorkerAgent()
        })
    }
});
```

### Edge Capabilities
- Same SurrealQL syntax everywhere (cloud, server, embedded, browser)
- Flexible schema (no rigid migrations for evolving AI data)
- Device-level permissions with DEFINE ACCESS
- Offline-first with IndexedDB persistence (WASM SDK)


## Surrealism: Custom Extensions (Future)

Surrealism is a Rust framework for building custom SurrealDB extensions. Relevant when Scott's Rust skills mature.

- Custom functions callable from SurrealQL
- Server-side logic without HTTP round trips
- Performance-critical processing in Rust executed at query time
- Documentation: surrealdb.com/blog/how-to-use-surrealism-to-build-your-own-custom-surrealdb-extensions


## Connection Pattern Decision Tree

Choose based on your project's architecture:

| Pattern | When to use | Projects using it |
|---|---|---|
| **Singleton** | Single DB scope per process, no per-request multi-tenancy | eleanor, d2d-payroll, spotio-cf |
| **Fresh per request** | Multi-tenant, namespace switching per request | automation-business |
| **Browser WASM** | PWA, offline-first, single-user client-side | life-os |

### Singleton (eleanor pattern)
```typescript
import Surreal from 'surrealdb';

let db: Surreal | null = null;

export async function getDb(): Promise<Surreal> {
    if (db) return db;
    db = new Surreal();
    await db.connect('ws://localhost:8000', {
        namespace: config.surrealNamespace,
        database: config.surrealDatabase,
        authentication: { username: config.surrealUser, password: config.surrealPass }
    });
    return db;
}
```

### Fresh Per Request (automation-business pattern)
```typescript
import Surreal from 'surrealdb';

export async function withDb<T>(
    namespace: string,
    database: string,
    fn: (db: Surreal) => Promise<T>
): Promise<T> {
    const db = new Surreal();
    try {
        await db.connect('ws://localhost:8000', {
            namespace, database,
            authentication: { username: 'root', password: 'root' }
        });
        return await fn(db);
    } finally {
        await db.close();
    }
}
```


## Project Version Matrix

| Project | DB Version | SDK | Pattern | Status |
|---|---|---|---|---|
| eleanor | v3 | JS SDK 2.0.1 | Singleton | Active build |
| automation-business | v3 | JS SDK 2.0.1 | Fresh per request | Active SaaS |
| advosy-sales | v3 | JS SDK 2.0.1 | TBD | Active |
| d2d-payroll | v2 | WASM 1.3.2 | Singleton | Locked, migrating to advosy-sales |
| spotio-cf | v2 | WASM 1.3.2 | Singleton | Locked, migrating to advosy-sales |
| life-os | v2 | WASM 1.3.2 | Browser WASM | NEVER upgrade |


## Infrastructure

### Local Development
```bash
# Start script: ~/Sites/Global/scott-toolkit/start-surreal.sh
# Uses surrealkv:// storage engine (v3)
# Binds to 0.0.0.0:8000
# Data dir: ~/Sites/surreal-data/
```

### Hetzner Production
```bash
# Server: ubuntu-2gb-hil-1 (5.78.128.41)
# Storage: surrealkv:/var/lib/surrealdb/data.db  (NOT file://)
# Port: 8000/tcp (UFW + Hetzner firewall)
# Systemd service: auto-restart on reboot
# Credentials: user 'bresco', password in ~/.claude/credentials.md
```
