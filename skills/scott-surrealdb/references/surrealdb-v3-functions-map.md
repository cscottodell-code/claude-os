# SurrealDB v3: Function Reference & v2-to-v3 Rename Map

> Extracted from `surrealdb-v3-master-reference.md` (sections 1, 14, 17) with added migration details.
> This file is self-contained. For the full reference, see the master file.
> For the complete 325+ function catalog, see `surrealdb-v3-functions-catalog.md`.

---

## v2 to v3 Function Renames

These functions were renamed or removed between v2 and v3. If you're migrating from v2, update these.

| v2 Syntax | v3 Syntax | Notes |
|---|---|---|
| `type::thing("table", $id)` | `type::record("table", $id)` | Most common migration issue |
| `time_now()` | `time::now()` | Was never valid, but commonly attempted |
| `math::round($val, $places)` | `math::fixed($val, $places)` | `round()` takes 1 arg (nearest int), `fixed()` takes 2 (decimal places) |
| MTREE index | HNSW index | MTREE completely removed in v3 |
| `count(SELECT ...)` | `(SELECT count() FROM ...).count` or `array::len()` | Count syntax changed |

### Commonly Confused (NOT Renamed, Just Misremembered)

| Wrong | Correct | Why It's Wrong |
|---|---|---|
| `time_now()` | `time::now()` | SurrealQL uses `::` namespace separator, not `_` |
| `math::round(val, 2)` | `math::fixed(val, 2)` | `round()` rounds to nearest integer only |
| `string::email($val)` | `string::is_email($val)` | Validation functions use `is_` prefix |
| `${}` template strings | `+` or `string::concat()` | SurrealQL doesn't have template syntax |

---

## Function Families Index (23 Families, 325+ Functions)

### Most Useful for Business Apps

| Family | Key Functions | Example |
|---|---|---|
| `string::` | `trim`, `uppercase`, `lowercase`, `slug`, `split`, `join`, `replace`, `contains`, `starts_with`, `len`, `is_email` | `string::slug("My Product")` returns `my-product` |
| `array::` | `distinct`, `sort`, `flatten`, `filter`, `map`, `fold`, `group`, `len`, `sum`, `push`, `pop` | `$items.map(\|$i\| $i.price).sum()` |
| `math::` | `sum`, `mean`, `median`, `min`, `max`, `round`, `fixed`, `ceil`, `floor`, `abs`, `sqrt` | `math::fixed(revenue * 0.08, 2)` |
| `time::` | `now`, `format`, `day`, `month`, `year`, `hour`, `floor`, `from::unix` | `time::format(time::now(), "%Y-%m-%d")` |
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

**Note:** `http::` functions require `--allow-net` server flag. Non-2XX responses cause errors in v2.2+.

---

## DEFINE FUNCTION (Server-Side Logic)

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
  CREATE api_log SET path = $req.path, method = $req.method, at = time::now();
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

## Built-In API Middleware Functions

These are provided by SurrealDB for use with `DEFINE API`:

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

---

## What Does NOT Exist (Function-Related)

**These do NOT exist (commonly assumed present):**
- `time_now()` -- use `time::now()` (double-colon namespace required)
- `math::round(val, places)` -- round() takes 1 arg. Use `math::fixed(val, places)` for decimal rounding
- `TRY { ... } CATCH { ... }` -- parse error on v3.0.2. Use IF/ELSE guards + THROW instead
- `${}` template syntax -- use `+` operator or `string::concat()` (both handle mixed types)

**These DO exist (commonly assumed missing):**
- `BREAK` / `CONTINUE` -- loop control in FOR loops (live-tested, confirmed)
- `$input` in events -- the input data that triggered the event (live-tested, confirmed)
- String concatenation -- `+` operator and `string::concat()` (auto-stringifies non-strings)
- `surql` template tag -- JS SDK parameterized queries (`import { surql } from 'surrealdb'`)
