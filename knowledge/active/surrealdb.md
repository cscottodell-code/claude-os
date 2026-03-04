# SurrealDB

## Metadata
- Last updated: 2026-03-03
- Version: 2.0
- Applies to: SurrealDB v3.0.0 (Scott's stack currently runs v2.6.0)
- Changelog:
  - v2.0: Consolidated from surrealdb-v3.md + surrealql.md into single reference
  - v1.0: Initial skills (separate files)

## Overview

SurrealDB is the single database layer in Scott's stack. It handles queries, authentication,
real-time subscriptions, and permissions -- all from one place. SurrealQL is its query language,
which looks like SQL but supports multi-model data (documents, graphs, vectors).

v3 is a major release with breaking changes from v2: COMPUTED fields (replacing futures),
record references, DEFINE API custom endpoints, and stable GraphQL support.

## Key Concepts

- **Tables:** Like spreadsheet sheets. Each table holds records of the same type.
- **Records:** Individual items in a table. Each has a unique ID like `user:abc123`.
- **Record IDs:** Format is `table:id`. SurrealDB auto-generates IDs unless you specify one.
- **Fields:** Properties on a record (like columns in a spreadsheet).
- **Graph edges:** Relationships between records. A record can "point to" another record.
- **Namespaces and databases:** Organization layers. Think folders -> subfolders -> tables.
- **COMPUTED fields (v3):** Formula columns — calculated on-the-fly every read, not stored. Replace v2 futures.
- **Record References (v3):** Automatic bidirectional links between tables. Like lookup columns in a spreadsheet.
- **Reverse references (<~ syntax, v3):** Query "which records point TO this record?" — like a reverse VLOOKUP.
- **DEFINE API (v3):** Custom HTTP endpoints written in SurrealQL. Useful for n8n webhooks.
- **LIVE SELECT:** Real-time subscriptions. WebSocket only, single-node only.
- **SECURITY DEFINER:** Admin override for specific operations.
- **Auth system:** Native signup, signin, tokens, sessions, and row-level permissions.

## SurrealQL Reference

### CRUD Operations

```sql
-- CREATE (auto ID)
CREATE user SET name = 'Scott', email = 'scott@example.com';

-- CREATE (specific ID)
CREATE user:scott SET name = 'Scott', email = 'scott@example.com';

-- CREATE (with variable binding from SDK)
CREATE user SET name = $name, email = $email, created_at = time::now();

-- SELECT
SELECT * FROM user;                              -- all records
SELECT * FROM user:scott;                        -- by ID
SELECT * FROM user WHERE age > 18;               -- filtered
SELECT name, email FROM user;                    -- specific fields
SELECT count() FROM user GROUP ALL;              -- count

-- UPDATE
UPDATE user:scott SET name = 'Scott O';          -- replace fields
UPDATE user:scott MERGE { name: 'Scott O' };     -- merge (keep other fields)
UPDATE user SET verified = true WHERE email CONTAINS '@advosy.com';
UPDATE user:scott SET login_count += 1;          -- increment

-- DELETE
DELETE user:scott;                               -- by ID
DELETE user WHERE last_login < time::now() - 1y; -- conditional

-- UPSERT
UPSERT user:scott SET name = 'Scott', updated_at = time::now();
```

### Graph Traversal

```sql
-- Create edges
RELATE user:scott->wrote->post:first_post SET created_at = time::now();
RELATE user:scott->follows->user:jane;
RELATE user:scott->rated->movie:inception SET score = 9, review = 'Amazing';

-- Traverse
SELECT ->wrote->post FROM user:scott;            -- outgoing (->)
SELECT <-wrote<-user FROM post:first_post;       -- incoming (<-)
SELECT <->follows<->user FROM user:scott;        -- bidirectional (<->)
SELECT ->follows->user->follows->user FROM user:scott;  -- multi-hop
SELECT ->follows->user.name FROM user:scott;     -- field access
SELECT ->rated->movie WHERE ->rated.score > 8 FROM user:scott;  -- filtered
```

| Symbol | Direction | Meaning |
|--------|-----------|---------|
| `->` | Outgoing | "From this record to..." |
| `<-` | Incoming | "...points to this record" |
| `<->` | Both | "Connected in either direction" |

### Schema Definition

```sql
-- Schemaless (prototyping) vs Schemafull (production)
DEFINE TABLE claim SCHEMALESS;
DEFINE TABLE claim SCHEMAFULL;

-- With permissions
DEFINE TABLE claim SCHEMALESS PERMISSIONS
    FOR select WHERE user = $auth.id
    FOR create, update WHERE user = $auth.id
    FOR delete NONE;

-- Field types
DEFINE FIELD name ON claim TYPE string;                         -- required
DEFINE FIELD notes ON claim TYPE option<string>;                -- optional
DEFINE FIELD status ON claim TYPE string DEFAULT 'new';         -- with default
DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value);  -- validated
DEFINE FIELD status ON claim TYPE string ASSERT $value IN ['new', 'in_progress', 'complete'];
DEFINE FIELD author ON post TYPE record<user>;                  -- record link
DEFINE FIELD tags ON post TYPE array<record<tag>>;              -- array of links

-- Nested objects
DEFINE FIELD address ON user TYPE object;
DEFINE FIELD address.street ON user TYPE string;
DEFINE FIELD address.city ON user TYPE string;

-- Auto-timestamps
DEFINE FIELD created_at ON claim TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON claim TYPE datetime VALUE time::now();
```

### Indexes

```sql
DEFINE INDEX idx_email ON user FIELDS email UNIQUE;
DEFINE INDEX idx_status_date ON claim FIELDS status, created_at;         -- composite
DEFINE INDEX idx_search ON post FIELDS title, body SEARCH ANALYZER snowball BM25;  -- full-text
DEFINE INDEX idx_embedding ON document FIELDS embedding HNSW DIMENSION 1536;       -- vector

-- Full-text search
SELECT * FROM post WHERE title @@ 'SurrealDB tutorial';
SELECT *, search::score(1) AS relevance FROM post WHERE title @1@ 'SurrealDB' ORDER BY relevance DESC;

-- Vector search
SELECT * FROM document WHERE embedding <|10,COSINE|> $query_vector;
```

### Common Query Patterns

```sql
-- Pagination
SELECT * FROM post ORDER BY created_at DESC LIMIT 20 START 0;

-- With total count
LET $total = (SELECT count() FROM post GROUP ALL)[0].count;
LET $items = SELECT * FROM post ORDER BY created_at DESC LIMIT $limit START $offset;
RETURN { total: $total, items: $items };

-- Aggregation
SELECT status, count() AS total FROM claim GROUP BY status;
SELECT count() AS total, math::sum(amount) AS total_amount, math::mean(amount) AS avg FROM claim GROUP ALL;

-- Subqueries (note: use <string>$parent.id in v3)
SELECT *, (SELECT count() FROM post WHERE author = <string>$parent.id GROUP ALL)[0].count AS post_count FROM user;

-- Transactions
BEGIN TRANSACTION;
    LET $from = (UPDATE account:scott SET balance -= $amount);
    LET $to = (UPDATE account:jane SET balance += $amount);
    IF $from.balance < 0 { CANCEL TRANSACTION; };
COMMIT TRANSACTION;
```

## v3 Features

### COMPUTED Fields

Replace v2 futures. Calculated on every read, not stored on disk.

```sql
-- v2 (broken in v3): DEFINE FIELD age ON person VALUE <future> { ... };
-- v3:
DEFINE FIELD full_name ON person COMPUTED string::concat(first_name, ' ', last_name);
DEFINE FIELD age ON user COMPUTED time::year(time::now()) - time::year(born);
DEFINE FIELD is_adult ON user COMPUTED age >= 18;
DEFINE FIELD post_count ON user COMPUTED count(->wrote->post);
```

**Rules:** Top-level only. Cannot combine with VALUE or DEFAULT. Cannot index. Cannot define on `id`.

### Record References

```sql
DEFINE FIELD comics ON person TYPE option<array<record<comic_book>>> REFERENCE;
DEFINE FIELD author ON book TYPE record<person> REFERENCE ON DELETE CASCADE;

-- ON DELETE options: IGNORE | UNSET | CASCADE | REJECT | THEN (custom logic)

-- Reverse references (query "who points to me?")
SELECT *, <~person AS owners FROM comic_book;
DEFINE FIELD posts ON user COMPUTED <~post;
DEFINE FIELD authored_posts ON user COMPUTED <~(post FIELD author);
```

### DEFINE API (experimental)

```sql
DEFINE API "/users/:id" FOR get THEN {
    LET $user = SELECT * FROM type::record('user', $id);
    RETURN { status: 200, body: $user };
};

DEFINE API "/users" FOR post THEN {
    LET $data = $request.body;
    LET $new_user = CREATE user SET name = $data.name, email = $data.email;
    RETURN { status: 201, body: $new_user };
};
```

Use `--deny-arbitrary-query` server flag to lock down to only defined API endpoints.

### Authentication

```sql
DEFINE ACCESS account ON DATABASE TYPE RECORD
    SIGNUP (CREATE user SET email = $email, pass = crypto::argon2::generate($pass))
    SIGNIN (SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass))
    DURATION FOR TOKEN 15m, FOR SESSION 12h;

-- JWT for external services (n8n)
DEFINE ACCESS api_access ON DATABASE TYPE JWT ALGORITHM HS512 KEY 'your-secret-key' DURATION FOR TOKEN 1h;

-- Row-level permissions
DEFINE TABLE notes PERMISSIONS
    FOR select WHERE created_by = $auth.id
    FOR create WHERE $auth.id IS NOT NONE
    FOR update, delete WHERE created_by = $auth.id;

-- Field-level permissions
DEFINE FIELD salary ON employee PERMISSIONS
    FOR select WHERE $auth.role = 'admin'
    FOR update WHERE $auth.role = 'admin';

-- SECURITY DEFINER (elevated permissions for specific functions)
DEFINE FUNCTION fn::get_team_stats($team_id: string) {
    RETURN SELECT count() FROM team_member WHERE team = type::record('team', $team_id) GROUP ALL;
} SECURITY DEFINER;
```

### LIVE SELECT

```sql
LIVE SELECT * FROM claim;                          -- all changes
LIVE SELECT * FROM claim WHERE status = 'new';     -- filtered
LIVE SELECT DIFF FROM claim;                       -- patches only
LIVE SELECT * FROM claim FETCH assigned_to;        -- with related records
KILL $live_query_id;                               -- stop subscription
```

**Requirements:** WebSocket connection only (`ws://`/`wss://`). Single-node only.

## Integration Points

| Integration | Connection | Notes |
|-------------|-----------|-------|
| **Nuxt** (WASM SDK or WebSocket) | `wss://` | LIVE SELECT feeds Vue reactive state. Use `useDatabase()` composable. |
| **Tauri** (embedded Rust crate) | `surrealdb = "3"` with `kv-surrealkv` | Set thread stack to 10 MiB. Disable Tauri logging for SurrealDB. |
| **n8n** (webhooks) | `http://` | Use DEFINE API + JWT access. `--deny-arbitrary-query` for security. |
| **GraphQL** | Stable in v3 | Direct SurrealQL is simpler for Nuxt + SurrealDB stack. |

## Common Gotchas

1. **v3: Futures removed** — Replace `<future>` with COMPUTED fields.
2. **v3: LET required** — `$val = 10` broken. Use `LET $val = 10;`
3. **v3: Non-existing tables error** — Always DEFINE TABLE before querying. No more silent `[]`.
4. **v3: type::thing -> type::record** — Function renamed. `rand::guid()` -> `rand::id()`.
5. **v3: Optional chaining** — `$val?` is now `$val.?` (dot before question mark).
6. **v3: SEARCH ANALYZER -> FULLTEXT ANALYZER** in index definitions.
7. **v3: MTREE -> HNSW** for vector indexes.
8. **v3: Similarity operators removed** — Use function calls instead.
9. **v3: COMPUTED restrictions** — Top-level only, exclusive (no VALUE/DEFAULT combo).
10. **SDK: RecordId objects** — JS SDK returns RecordId, not strings. Always `String()` before comparing.
11. **SDK: JS null != NONE** — Omit optional fields entirely instead of passing `null`.
12. **SDK: CREATE SET > INSERT INTO** — More reliable variable binding in WASM SDK.
13. **SCHEMAFULL rejects extras** — Only DEFINE'd fields accepted on schemafull tables.
14. **Subquery parent ID** — Use `<string>$parent.id` in subqueries to avoid RecordId issues.

## Resources
- [SurrealDB v3 docs](https://surrealdb.com/docs)
- [SurrealQL reference](https://surrealdb.com/docs/surrealql)
- [Function reference](https://surrealdb.com/docs/surrealql/functions)
- [v3 migration guide](https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x)
- [WASM SDK (JavaScript)](https://github.com/surrealdb/surrealdb.js)
- [Rust SDK](https://docs.rs/surrealdb/latest/surrealdb/)
- Scott's v2 WASM patterns: `~/.claude/skills/scott-surrealdb-patterns/SKILL.md`
- Context7 library ID: `/surrealdb/docs.surrealdb.com`
