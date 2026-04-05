# SurrealQL Complete Language Reference

Last updated: 2026-04-02
Source: SurrealDB v3 official documentation via Context7

---

## 1. Control Flow

### IF / ELSE

Modern block syntax (curly braces, no THEN keyword):

```surql
IF @condition { @expression; .. }
   [ ELSE IF @condition { @expression; .. } ] ...
   [ ELSE { @expression; .. } ]
```

Examples:

```surql
-- Simple IF
IF $age >= 18 {
    RETURN "adult"
};

-- IF / ELSE
IF $score > 90 {
    "A grade"
} ELSE IF $score > 80 {
    "B grade"
} ELSE {
    "Below B"
};

-- IF with THROW
LET $badly_formatted_datetime = "2024-04TT08:08:08Z";
IF !type::is_datetime($badly_formatted_datetime) {
    THROW "Whoops, that isn't a real datetime"
};
```

### FOR Loops

```surql
FOR @item IN @iterable {
    @block
};
```

Iterates over arrays, query results, or ranges:

```surql
-- Array iteration
FOR $name IN ['Tobie', 'Jaime'] {
    CREATE type::record('person', $name) CONTENT {
        name: $name
    };
};

-- Range iteration
FOR $year IN 0..=2024 {
    CREATE historical_events SET
        for_year = $year,
        events = "To be added";
};

-- Query result iteration
FOR $person IN (SELECT VALUE id FROM person WHERE age >= 18) {
    UPDATE $person SET can_vote = true;
};
```

**Scope limitation:** Variables declared outside a FOR loop are readable inside it, but cannot be modified. Use `array::fold()` or `array::reduce()` for accumulation patterns.

**BREAK / CONTINUE:** Both exist and work in FOR loops (live-tested on v3.0.2):

```surql
-- BREAK: exit loop entirely
FOR $item IN [1, 2, 3, 4, 5] {
    IF $item = 3 { BREAK; };
    CREATE test SET val = $item;
};
-- Creates records for 1 and 2 only

-- CONTINUE: skip to next iteration
FOR $item IN [1, 2, 3, 4, 5] {
    IF $item = 3 { CONTINUE; };
    CREATE test SET val = $item;
};
-- Creates records for 1, 2, 4, 5 (skips 3)
```

### THROW

Aborts query execution and returns an error. Any value can be thrown (string, object, array, query result):

```surql
THROW "Insufficient funds";
THROW { code: 403, message: "Access denied" };
THROW SELECT * FROM event;  -- throws query results as error
```

Transaction cancellation pattern:

```surql
BEGIN TRANSACTION;
LET $transfer_amount = 150;
CREATE account:one SET dollars = 100;
CREATE account:two SET dollars = 100;
UPDATE account:one SET dollars -= $transfer_amount;
UPDATE account:two SET dollars += $transfer_amount;
IF account:one.dollars < 0 {
    THROW "Insufficient funds, transaction cancelled"
};
COMMIT TRANSACTION;
```

### TRY / CATCH

**Does NOT exist in SurrealQL (live-tested on v3.0.2: parse error).** Error handling is done via:
- THROW to raise errors (inside DEFINE FUNCTION with IF/ELSE guards)
- IF/ELSE for conditional guards before operations
- ASSERT on field definitions for validation
- Transaction rollback (CANCEL) for atomic failure

Note: Some SDK documentation shows TRY/CATCH examples, but the SurrealQL parser rejects the syntax as of v3.0.2.

### RETURN

Returns a value and breaks execution within its scope (function, IF block, transaction):

```surql
RETURN 123;
RETURN "I am a string!";
RETURN { prop: "value" };
RETURN SELECT * FROM person;
```

In transactions, controls what gets output:

```surql
BEGIN TRANSACTION;
LET $firstname = "John";
LET $person = CREATE ONLY person CONTENT { name: $firstname };
RETURN $person.id;  -- only this value is returned
COMMIT TRANSACTION;
```

In functions, halts further execution:

```surql
DEFINE FUNCTION fn::person::create($firstname: string, $lastname: string) {
    LET $person = CREATE person CONTENT { first: $firstname, last: $lastname };
    RETURN $person.id;    -- stops here
    CREATE person SET ...;  -- never executes
};
```

In IF blocks, breaks only the IF scope:

```surql
IF $num % 2 == 0 {
    RETURN $num;  -- breaks IF block only
};
RETURN $num + 1;  -- still executes if IF was false
```

In variable assignments:

```surql
LET $id = {
    IF $id { RETURN type::record('table', $id); };
    RETURN table:rand();
};
$id;  -- still executes after the LET block
```

### SLEEP

Pauses execution for a specified duration:

```surql
SLEEP 1s;
SLEEP 100ms;
SLEEP 500ms;
```

Non-blocking to background operations (e.g., concurrent index builds continue). Use cases: testing, throttling, security (slowing brute-force attempts).

---

## 2. Variable System

### LET Statements

Define named parameters with `$` prefix:

```surql
LET $suffix = "Morgan Hitchcock";
CREATE person SET name = "Tobie " + $suffix;

-- Store query results
LET $avg_price = (
    SELECT math::mean(price) AS avg_price FROM product GROUP ALL
).avg_price;

SELECT name FROM product WHERE price > $avg_price;
```

### Reserved / System Variables

| Variable | Context | Description |
|----------|---------|-------------|
| `$this` | Subqueries, field definitions | Current record being processed |
| `$parent` | Subqueries | Parent query's current record |
| `$before` | Events, UPDATE | Record state before mutation |
| `$after` | Events, UPDATE | Record state after mutation |
| `$event` | DEFINE EVENT | Event type: `"CREATE"`, `"UPDATE"`, or `"DELETE"` |
| `$input` | Field VALUE clause, ON DUPLICATE KEY UPDATE | The initially inputted value before modifications |
| `$value` | DEFINE FIELD (VALUE/ASSERT) | Current field value |
| `$auth` | Access-controlled queries | Authenticated user record (protected, cannot overwrite) |
| `$token` | Access-controlled queries | JWT token claims (protected) |
| `$session` | Any query | Current session metadata (protected) |
| `$access` | Access-controlled queries | Access method details (protected) |

### $parent in Subqueries

```surql
SELECT *, (SELECT * FROM events WHERE host == $parent.id) AS hosted_events FROM user;
```

### $input in ON DUPLICATE KEY UPDATE

```surql
INSERT INTO city (id, population, at_year) VALUES ("Calgary", 1665000, 2024)
ON DUPLICATE KEY UPDATE
    population = $input.population,
    at_year = $input.at_year;
```

### $input in Field Definitions

```surql
CREATE city:london SET population = 8900000, year = 2019, historical_data = [];

INSERT INTO city [{ id: "london", population: 9600000, year: 2023 }]
ON DUPLICATE KEY UPDATE
    historical_data += { year: year, population: population },
    population = $input.population,
    year = $input.year;
```

### Variable Scoping Rules

- Parameters defined with LET are scoped to the current query/transaction
- `$auth`, `$token`, `$session`, `$access` are protected and cannot be overwritten
- FOR loop variables are scoped to the loop body
- Closure parameters are scoped to the closure body
- Subquery variables do not leak to parent scope
- `$parent` only available one level deep in subqueries

---

## 3. Advanced Query Patterns

### Subqueries (SELECT inside SELECT)

```surql
-- As a computed field
SELECT *, (SELECT * FROM events WHERE type = 'activity' LIMIT 5) AS history FROM user;

-- Using $parent
SELECT *, (SELECT * FROM events WHERE host == $parent.id) AS hosted_events FROM user;

-- In LET for reuse
LET $avg_price = (SELECT math::mean(price) AS avg_price FROM product GROUP ALL).avg_price;
SELECT name FROM product WHERE price > $avg_price;
```

### Closures / Lambdas

Syntax: `|@parameters| @expression`

```surql
-- Basic closure
LET $greet = |$name| "Hello, " + $name + "!";

-- Typed parameters and return type
LET $greet = |$name: string| -> string { "Hello, " + $name + "!" };
LET $to_upper = |$text: string| -> string { string::uppercase($text) };

-- Multi-parameter
LET $concat = |$a: string, $b: string| $a + $b;

-- Multi-line block with curly braces
["1", "2", "3"].map(|$val| {
    LET $num = <number>$val;
    LET $is_even = IF $num % 2 = 0 { true } ELSE { false };
    { value: $num, is_even: $is_even }
});

-- No parameters (thunk)
INSERT INTO person ((<array>0..=1000).map(|| {id: rand::ulid()}));

-- With index parameter (second arg)
[": first", ": second", ": third"].map(|$item, $index| <string>$index + $item);
```

**Key limitation:** Closures are read-only. They cannot modify database resources. Use FOR loops for write operations.

**v3 change:** Closures can no longer be stored as record fields. `CREATE record SET closure = |$a| $a + 1` throws an error.

**Variable capture:** Closures can capture variables from outer scope.

### Array Functional Methods

#### .map()

```surql
[1, 2, 3].map(|$v| $v * 2);                    -- [2, 4, 6]
[1, 2, 3].map(|$num| $num + 1.1);              -- [2.1, 3.1, 4.1]
[1, 2, 3].map(|$num: int| -> int { $num * 2 }); -- typed version
```

#### .filter()

```surql
-- By closure
[{importance: 10}, {importance: 0}, {importance: 5}]
    .filter(|$v| $v.importance > 5);

-- By value
array::filter([1, 2, 1, 3, 3, 4], 1);  -- [1, 1]

-- Truthiness filtering (remove NONE, 0, "", etc.)
[1, 2, 3, NONE, 0, "", {}, []].filter(|$v| $v);  -- [1, 2, 3]
```

#### .fold()

Reduces with an initial value:

```surql
[10, 12, 10, 15].fold(100, |$a, $b| $a - $b);  -- 53

-- With index
"no whitespace".split(" ").fold("", |$one, $two, $index|
    IF $index = 0 { $one + $two } ELSE { $one + "_" + $two }
);

-- String reversal
"forwards".split('').fold("", |$one, $two| $two + $one);
```

#### .reduce()

Like fold but first element is the initial value:

```surql
[10, 20, 30, 40].reduce(|$a, $b| $a + $b);  -- 100
(<array>1..=3).reduce(|$one, $two| $one + $two);  -- 6
```

#### .find()

Returns first match or NONE:

```surql
['a', 'b', 'c'].find('b');              -- 'b'
[1, 2, 5].find(|$num| $num >= 3);       -- 5
[1, 2, 3].find(4);                       -- NONE
```

#### .any() / .some()

Check if any element matches (aliases for each other, also `array::includes`):

```surql
[1, 2, "SurrealDB"].any(|$var| $var.is_string());  -- true
["same", "same?", "Dude, same!"].any("same");       -- true
["", 0, NONE, NULL, [], {}].any();                    -- false
[1, 2, 3].some(|$num| $num > 2);                     -- true
```

#### .all() / .every()

Check if all elements match (aliases for each other):

```surql
[1, 2, 3].all(|$num| $num > 0);          -- true
["same", "same", "same"].all("same");     -- true
[1, 2, 3, NONE].all();                    -- false
[1, 2, 3].every(|$num| $num > 0);        -- true
```

#### .chain()

Applies a transformation to the entire value (not individual items):

```surql
"Two".replace("Two", "2").chain(|$num| <number>$num * 1000);
```

### Chaining Functional Operations

```surql
(<array> 1..=100)
    .map(|$v| $v * 10)
    .map(|$v| { original: $v, square_root: math::sqrt($v) })
    .filter(|$obj| $obj.square_root IN 11..12);
```

### Conditional / Ternary Expressions

SurrealQL does not have a traditional ternary operator (`? :`). Use IF/ELSE as an expression instead:

```surql
-- IF/ELSE as expression (returns a value)
SELECT
    IF age >= 18 { "adult" } ELSE { "minor" } AS category
FROM person;

-- Boolean expression as field
SELECT rating >= 4 AS positive FROM review;
SELECT age >= 18 AS is_adult FROM person;
```

### MERGE Operations

Used with UPDATE and UPSERT to partially update records:

```surql
-- MERGE only updates specified fields, leaving others intact
UPDATE person:tobie MERGE {
    settings: { marketing: true, newsletter: false }
};

UPSERT person:tobie MERGE {
    name: "Tobie",
    email: "tobie@surrealdb.com"
};
```

### PATCH Operations (JSON Patch)

Apply RFC 6902 JSON Patch operations:

```surql
UPSERT person:tobie PATCH [
    { op: "replace", path: "/name", value: "Tobie updated" },
    { op: "add", path: "/tags", value: ["admin"] }
];
```

### Transactions (BEGIN / COMMIT / CANCEL)

```surql
-- Basic transaction
BEGIN TRANSACTION;
CREATE account:one SET dollars = 100;
CREATE account:two SET dollars = 100;
UPDATE account:one SET dollars -= 50;
UPDATE account:two SET dollars += 50;
COMMIT TRANSACTION;

-- Transaction with conditional cancel via THROW
BEGIN TRANSACTION;
UPDATE account:one SET dollars -= 150;
UPDATE account:two SET dollars += 150;
IF account:one.dollars < 0 {
    THROW "Insufficient funds"
};
COMMIT TRANSACTION;

-- CANCEL explicitly rolls back
BEGIN TRANSACTION;
CREATE temp_data SET value = "test";
CANCEL TRANSACTION;  -- nothing persists

-- RETURN controls transaction output
BEGIN TRANSACTION;
LET $person = CREATE ONLY person CONTENT { name: "John" };
RETURN $person.id;
COMMIT TRANSACTION;
```

The `TRANSACTION` keyword is optional after BEGIN, COMMIT, and CANCEL.

Each individual SurrealQL statement runs in its own implicit transaction by default. BEGIN/COMMIT wraps multiple statements into one atomic unit.

Early exits from transactions:
1. An error during execution (auto-rollback)
2. A THROW statement (cancels with error)
3. A RETURN statement (commits with custom output)

---

## 4. Data Manipulation

### INSERT with ON DUPLICATE KEY UPDATE

```surql
-- Basic insert
INSERT INTO person { id: "tobie", name: "Tobie", surname: "Hitchcock" };

-- Bulk insert
INSERT INTO person [
    { id: "jaime", name: "Jaime", surname: "Hitchcock" },
    { id: "tobie", name: "Tobie", surname: "Hitchcock" }
];

-- With ON DUPLICATE KEY UPDATE
INSERT INTO city (id, population, at_year) VALUES ("Calgary", 1665000, 2024)
ON DUPLICATE KEY UPDATE
    population = $input.population,
    at_year = $input.at_year;

-- RETURN NONE for silent inserts
INSERT INTO company {
    name: 'SurrealDB',
    founded: "2021-09-10"
} RETURN NONE;

-- INSERT with IGNORE (skip duplicates silently)
INSERT IGNORE INTO person { id: "tobie", name: "Tobie" };
```

### UPSERT Patterns

```surql
-- Basic UPSERT with SET
UPSERT person SET name = 'Billy';
UPSERT person SET name = 'Bobby' WHERE name = 'Billy';

-- UPSERT with CONTENT (full record)
UPSERT person:tobie CONTENT {
    name: "Tobie",
    email: "tobie@surrealdb.com"
};

-- UPSERT with MERGE (partial update)
UPSERT person:tobie MERGE {
    settings: { marketing: true }
};

-- UPSERT with PATCH (JSON Patch)
UPSERT person:tobie PATCH [
    { op: "add", path: "/tags", value: ["admin"] }
];

-- UPSERT with RETURN
UPSERT person:tobie SET name = "Tobie" RETURN BEFORE;
UPSERT person:tobie SET name = "Tobie" RETURN AFTER;
UPSERT person:tobie SET name = "Tobie" RETURN DIFF;
UPSERT person:tobie SET name = "Tobie" RETURN NONE;
UPSERT person:tobie SET name = "Tobie" RETURN name, email;

-- UPSERT with TIMEOUT
UPSERT person SET name = "Tobie" TIMEOUT 5s;

-- UPSERT with unique index (avoids table scan)
DEFINE INDEX unique_email ON person FIELDS email UNIQUE;
UPSERT person SET name = "Tobie", email = "t@s.com" WHERE email = "t@s.com";

-- Type inference with +=
UPSERT person:tobie SET tags += "developer";  -- SurrealDB infers array type
```

### RETURN Clause Variants

Available on INSERT, CREATE, UPDATE, UPSERT, DELETE:

```surql
RETURN NONE         -- return nothing
RETURN BEFORE       -- record state before mutation
RETURN AFTER        -- record state after mutation (default)
RETURN DIFF         -- JSON diff of changes
RETURN name, email  -- specific fields only
RETURN VALUE name   -- just the value, not wrapped in object
```

### Record Ranges

```surql
-- Select range of records
SELECT * FROM person:1..1000;
SELECT * FROM person:aaa..zzz;

-- Create mock records with range syntax (v3)
CREATE |person:1..=10|;     -- creates person:1 through person:10
CREATE |person:1..11|;      -- equivalent (exclusive end)

-- Use ranges in WHERE
SELECT * FROM person WHERE age IN 18..=65;

-- Date ranges
SELECT * FROM event WHERE date IN d"2024-01-01"..=d"2024-12-31";

-- Character ranges
'g' IN 'a'..'z';  -- true

-- Cast range to array
<array> 1..3;     -- [1, 2]
<array> 1..=3;    -- [1, 2, 3]
```

Range syntax options:
- `0..10` -- includes 0, excludes 10
- `0..=10` -- includes both 0 and 10
- `0>..10` -- excludes 0, includes up to but not 10
- `0>..=10` -- excludes 0, includes 10
- `0..` -- from 0 onward (open-ended)
- `..100` -- up to 100
- `..` -- unbounded

### Compound Record IDs

```surql
-- Define complex ID types
DEFINE FIELD id ON TABLE log TYPE [record, "info" | "warn" | "error", datetime];

-- Create with compound ID
CREATE log:[user:one, "info", time::now()] SET message = "Database started";

-- Access compound ID parts
-- $record.id is an array, access with index:
-- $record.id[0] -> the record part
-- $record.id[1] -> the string literal part
-- $record.id[2] -> the datetime part
```

---

## 5. String Interpolation / Template Syntax

**SurrealQL does NOT have string interpolation/template syntax** like JavaScript's backtick strings.

String construction is done via concatenation or functions:

```surql
-- Concatenation with +
"Hello, " + $name + "!";

-- string::join()
string::join(" ", "Jaime", $suffix);

-- string::concat()
string::concat("Hello ", $name);
```

String prefixes for type literals (these are NOT interpolation):
- `r"person:tobie"` -- record ID string
- `d"2025-01-01T00:00:00Z"` -- datetime literal
- `u"550e8400-e29b-41d4-a716-446655440000"` -- UUID literal
- `b"..."` -- byte literal
- `f"..."` -- file path literal

---

## 6. Duration Literals

Nine supported units:

| Unit | Suffix | Example |
|------|--------|---------|
| Nanoseconds | `ns` | `500ns` |
| Microseconds | `us` or `µs` | `100us` |
| Milliseconds | `ms` | `250ms` |
| Seconds | `s` | `30s` |
| Minutes | `m` | `15m` |
| Hours | `h` | `2h` |
| Days | `d` | `7d` |
| Weeks | `w` | `2w` |
| Years | `y` | `1y` |

Compound durations (combine multiple units):

```surql
1h30m          -- 1 hour 30 minutes
2d6h           -- 2 days 6 hours
1y40w20h       -- 1 year, 40 weeks, 20 hours
1d1d12h12h     -- normalizes to 3d
```

Arithmetic:

```surql
d'1970-01-01' + 1d          -- d'1970-01-02T00:00:00Z'
d"2025-07-03T07:18:52Z" + 2w  -- adds 2 weeks
1d * 5.5                     -- 5d12h
1d / 24                      -- 1h
```

Method chaining:

```surql
2d6h.mins();                           -- convert to minutes
duration::from_millis(98734234).mins(); -- convert ms to minutes
```

Cast from string:

```surql
<duration>"1d12h"  -- duration literal
```

Zero duration is valid (`0ns`, `0d`), but negative durations are not.

---

## 7. Datetime Literals

Use the `d` prefix with RFC 3339 formatted strings:

```surql
d"2025-11-28T11:41:20Z"               -- basic with timezone
d"2025-11-28T11:41:20.262Z"           -- with milliseconds
d"2025-11-28T11:41:20.262+04:00"      -- with positive offset
d"2025-11-28T11:41:20.262-04:00"      -- with negative offset
d"2025-11-28"                          -- date-only (rare, prefer cast)
```

Cast from string:

```surql
<datetime>"2024-04-03"    -- d'2024-04-03T00:00:00Z'
<datetime>"2025-07-03T07:18:52.841147Z"
```

Timezone handling: all datetimes stored as UTC internally.

Component modification via chaining:

```surql
d'1970-01-01T00:00:00Z'.set_year(1914).set_month(6).set_day(28);
```

SurrealDB maintains nanosecond precision.

---

## 8. Regex Support

Create regex via cast syntax:

```surql
<regex>"gr(a|e)y"
```

Matching with `=` operator:

```surql
<regex>"a|b" = "a";                              -- true
<regex>"col(o|ou)r" = "colour";                  -- true
<regex>"((?i)col(o|ou)r|couleur)" = "COULEUR";   -- true (case-insensitive)
```

Function-based matching:

```surql
string::matches("grey", "gr(a|e)y");             -- true
string::matches("Cat", "[HC]at");                 -- true

-- Using regex type
LET $regex = <regex>"gr(a|e)y";
string::matches("grey", $regex);                  -- true
```

The `=~` operator is available for regex matching in WHERE clauses.

---

## 9. Cast Syntax (Type Casting)

| Cast | Description |
|------|-------------|
| `<array>` | Cast to array |
| `<array<T>>` | Cast to typed array |
| `<bool>` | Cast to boolean |
| `<datetime>` | Cast to datetime |
| `<decimal>` | Cast to 128-bit decimal |
| `<duration>` | Cast to duration |
| `<float>` | Cast to float |
| `<int>` | Cast to integer |
| `<number>` | Cast to number (decimal representation) |
| `<record>` | Cast to record ID |
| `<record<table>>` | Cast to typed record ID |
| `<regex>` | Cast to regular expression |
| `<set>` | Cast to set (unique values) |
| `<string>` | Cast to string |
| `<uuid>` | Cast to UUID |

Examples:

```surql
<int>53                    -- 53
<string>true               -- 'true'
<bool>"true"               -- true
<float>"3.14"              -- 3.14f
<datetime>"2025-06-07"     -- d'2025-06-07T00:00:00Z'
<array>1..=3               -- [1, 2, 3]
<duration>"1d12h"          -- 1d12h
<number>$val               -- numeric
<string>$parent.id         -- string cast of record ID (useful in subqueries)
<regex>"gr(a|e)y"          -- regex type
```

**Casts vs. Affixes:** Casts convert between types. Affixes (`d""`, `r""`, `u""`) instruct the parser to treat input as a specific type from the start.

---

## 10. Nullish Coalescing (??) and Truthy Coalescing (?:)

```surql
-- ?? returns right side if left is NULL/NONE
$name ?? "Anonymous";
$user.email ?? "no-email@example.com";

-- ?: returns right side if left is falsy (NULL, NONE, false, 0, "", [], {})
$name ?: "Anonymous";
```

The difference: `??` only checks for NULL/NONE. `?:` checks for any falsy value.

---

## 11. Optional Chaining

SurrealQL handles missing/null fields gracefully by default. Accessing a non-existent nested field returns NONE rather than throwing an error:

```surql
-- If address doesn't exist, returns NONE (no error)
SELECT address.city FROM person;

-- Nested access is safe
SELECT address.coordinates[0] AS latitude FROM person;
```

This means optional chaining (`?.`) as seen in JavaScript is not needed. SurrealQL's field access is inherently null-safe.

---

## 12. ASSERT (Field Validation)

Used in DEFINE FIELD to enforce constraints:

```surql
-- Basic assertion
DEFINE FIELD email ON TABLE user TYPE string
    ASSERT string::is_email($value);

-- Assertion with custom error via THROW
DEFINE FIELD num ON data TYPE int ASSERT {
    IF $input % 2 = 0 {
        RETURN true
    } ELSE {
        THROW "Tried to make a " + <string>$this + " but `num` field requires an even number"
    }
};

-- Range assertion
DEFINE FIELD age ON TABLE person TYPE int
    ASSERT $value >= 0 AND $value <= 150;

-- Enum-style assertion
DEFINE FIELD status ON TABLE order TYPE string
    ASSERT $value IN ["pending", "shipped", "delivered"];
```

Available variables in ASSERT context:
- `$value` -- the current field value
- `$input` -- the originally inputted value (before VALUE clause modifications)
- `$this` -- the entire record being created/updated

---

## 13. Type Unions

Use `|` to allow multiple types for a field:

```surql
-- Simple type union
DEFINE FIELD content ON TABLE message TYPE string | int;

-- Literal type unions
DEFINE FIELD error_msg ON TABLE log TYPE
    { code: 200, message: string } |
    { code: 404, message: string };

-- Geometry type unions
DEFINE FIELD area ON TABLE restaurant
    TYPE geometry<polygon|multipolygon|collection>;

-- Option type (nullable)
DEFINE FIELD nickname ON TABLE user TYPE option<string>;

-- String literal unions (enums)
DEFINE FIELD id ON TABLE log TYPE [record, "info" | "warn" | "error", datetime];
```

---

## 14. Geometry Types

Seven GeoJSON-based types:

| Type | Description | Example |
|------|-------------|---------|
| `geometry<point>` | Lon/lat point | `(-0.118092, 51.509865)` |
| `geometry<line>` | Connected path | LineString GeoJSON |
| `geometry<polygon>` | Closed area | Polygon GeoJSON |
| `geometry<multipoint>` | Multiple points | MultiPoint GeoJSON |
| `geometry<multiline>` | Multiple lines | MultiLineString GeoJSON |
| `geometry<multipolygon>` | Multiple polygons | MultiPolygon GeoJSON |
| `geometry<collection>` | Mixed types | GeometryCollection GeoJSON |
| `geometry<feature>` | Any geometry type | Any of the above |

Field definitions:

```surql
DEFINE FIELD location ON TABLE restaurant TYPE geometry<point>;
DEFINE FIELD area ON TABLE restaurant TYPE geometry<feature>;
DEFINE FIELD area ON TABLE restaurant TYPE geometry<polygon|multipolygon|collection>;
```

All geometry follows GeoJSON format: **longitude before latitude** in coordinates.

Geometry operators:
- `OUTSIDE` -- geometry is outside another
- `INTERSECTS` -- geometries intersect

---

## 15. DEFINE EVENT (Triggers)

```surql
DEFINE EVENT @name ON TABLE @table
    WHEN @condition
    THEN ( @expression );
```

Available variables in events:
- `$event` -- `"CREATE"`, `"UPDATE"`, or `"DELETE"`
- `$before` -- record state before mutation (UPDATE, DELETE)
- `$after` -- record state after mutation (CREATE, UPDATE)

```surql
-- CREATE trigger
DEFINE EVENT publish_post ON TABLE post
    WHEN $event = "CREATE"
    THEN (
        UPDATE post SET status = "PUBLISHED" WHERE id = $after.post_id
    );

-- UPDATE trigger
DEFINE EVENT user_updated ON TABLE user
    WHEN $event = "UPDATE"
    THEN (
        CREATE notification SET
            message = "User updated",
            user_id = $after.id,
            created_at = time::now()
    );

-- DELETE trigger
DEFINE EVENT user_deleted ON TABLE user
    WHEN $event = "DELETE"
    THEN (
        CREATE notification SET
            message = "User deleted",
            user_id = $before.id,
            created_at = time::now()
    );

-- Multi-event trigger
DEFINE EVENT user_event ON TABLE user
    WHEN $event = "CREATE" OR $event = "UPDATE" OR $event = "DELETE"
    THEN (
        CREATE log SET
            table = "user",
            event = $event,
            happened_at = time::now()
    );
```

---

## 16. Complete Operator Reference

### Arithmetic
| Op | Description |
|----|-------------|
| `+` | Addition |
| `-` | Subtraction |
| `*` or `x` | Multiplication |
| `/` or `÷` | Division |
| `**` | Exponentiation |

### Comparison
| Op | Alias | Description |
|----|-------|-------------|
| `=` | `IS` | Equal (loose) |
| `!=` | `IS NOT` | Not equal |
| `==` | | Exact equality (type-sensitive) |
| `<` | | Less than |
| `<=` | | Less than or equal |
| `>` | | Greater than |
| `>=` | | Greater than or equal |

### Logical
| Op | Alias | Description |
|----|-------|-------------|
| `&&` | `AND` | Both truthy |
| `\|\|` | `OR` | Either truthy |
| `!` | | Negation |
| `!!` | | Convert to boolean |

### Coalescing
| Op | Description |
|----|-------------|
| `??` | Null coalescing (NULL/NONE check) |
| `?:` | Truthy coalescing (falsy check) |

### Containment
| Op | Symbol | Description |
|----|--------|-------------|
| `IN` / `INSIDE` | `∈` | Value is in array/set |
| `NOT IN` / `NOTINSIDE` | `∉` | Value not in array/set |
| `CONTAINS` | `∋` | Array/set contains value |
| `CONTAINSNOT` | `∌` | Does not contain |
| `CONTAINSALL` | `⊇` | Contains all values |
| `CONTAINSANY` | `⊃` | Contains any value |
| `CONTAINSNONE` | `⊅` | Contains none |
| `ALLINSIDE` | `⊆` | All values in target |
| `ANYINSIDE` | `⊂` | Any value in target |
| `NONEINSIDE` | `⊄` | No values in target |

### Array/Set Matching
| Op | Description |
|----|-------------|
| `?=` | Any value equals |
| `*=` | All values equal |

### Search
| Op | Description |
|----|-------------|
| `@@` | Full-text search match |
| `@[ref]@` | Full-text search with scoring reference |
| `<\|K,METRIC\|>` | K-Nearest Neighbors vector search |

### Geometry
| Op | Description |
|----|-------------|
| `OUTSIDE` | Geometry outside another |
| `INTERSECTS` | Geometry intersects another |

---

## 17. Advanced SELECT Patterns

```surql
-- Nested field access
SELECT address.city FROM person;
SELECT address.coordinates[0] AS latitude FROM person;

-- Restructure objects
SELECT address.{city, country} FROM person;

-- Select all nested array values
SELECT address.*.coordinates AS coordinates FROM person;

-- Filtered nested arrays
SELECT address[WHERE active = true] FROM person;

-- Graph traversal
SELECT ->likes->friend.name AS friends FROM person:tobie;
SELECT * FROM person WHERE ->(reacted_to WHERE type='celebrate')->post;

-- Manual object structure
SELECT { weekly: false, monthly: true } AS `marketing settings` FROM user;

-- Math in SELECT
SELECT ((celsius * 1.8) + 32) AS fahrenheit FROM temperature;

-- Boolean expression as field
SELECT rating >= 4 AS positive FROM review;

-- ONLY returns object instead of array
SELECT * FROM ONLY person:tobie;

-- VALUE returns flat array
SELECT VALUE name FROM person;

-- GROUP BY with aggregation
SELECT category, count() AS total, math::sum(price) AS revenue
FROM products GROUP BY category;

-- FETCH to resolve record links
SELECT *, ->purchased->product.* AS products FROM customer FETCH products;
```

---

## 18. Quick Reference: What Does NOT Exist in SurrealQL (verified v3.0.2)

| Feature | Status | Alternative |
|---------|--------|-------------|
| TRY/CATCH | Does not exist (parse error) | IF/ELSE guards, THROW, transaction rollback |
| Ternary `? :` | Does not exist | IF/ELSE as expression |
| String interpolation `${}` | Does not exist | `+` concatenation, `string::join()`, `string::concat()` |
| `time_now()` | Does not exist | `time::now()` (double-colon namespace required) |
| `math::round(val, places)` | round() takes 1 arg only | `math::fixed(val, places)` for decimal rounding |
| Optional chaining `?.` | Not needed | Field access is null-safe by default |
| Stored closures | Removed in v3 | Compute at query time |
| `type::thing()` | v2 only | `type::record()` in v3 |

**These DO exist (commonly assumed missing):**

| Feature | Status | Notes |
|---------|--------|-------|
| BREAK / CONTINUE | Exist, live-tested | Work in FOR loops |
| `$input` in events | Exists, live-tested | The input data that triggered the event |
| `??` nullish coalescing | Exists | Returns right side only if left is NULL/NONE |
| `?:` truthy coalescing | Exists | Returns right side if left is falsy (0, "", [], {}) |
| DEFINE API | Exists, works without flags | Built-in REST endpoints |
| Destructuring `obj.{ a, b }` | Exists, live-tested | Select specific fields from objects |
