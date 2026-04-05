# SurrealDB v3 -- Complete Built-in Functions Catalog

Last updated: 2026-04-02
Source: SurrealDB official docs (docs.surrealdb.com)

> **Method chaining:** Since v2.0, most functions support method chaining syntax.
> Example: `"hello".uppercase().concat("!")` instead of `string::concat(string::uppercase("hello"), "!")`

---

## Table of Contents

1. [string:: functions](#1-string-functions)
2. [array:: functions](#2-array-functions)
3. [math:: functions](#3-math-functions)
4. [time:: functions](#4-time-functions)
5. [crypto:: functions](#5-crypto-functions)
6. [http:: functions](#6-http-functions)
7. [type:: functions](#7-type-functions)
8. [rand:: functions](#8-rand-functions)
9. [parse:: functions](#9-parse-functions)
10. [encoding:: functions](#10-encoding-functions)
11. [geo:: functions](#11-geo-functions)
12. [object:: functions](#12-object-functions)
13. [record:: functions](#13-record-functions)
14. [value:: functions](#14-value-functions)
15. [vector:: functions](#15-vector-functions)
16. [search:: functions](#16-search-functions)
17. [session:: functions](#17-session-functions)
18. [sleep() function](#18-sleep-function)
19. [count() function](#19-count-function)
20. [duration:: functions](#20-duration-functions)
21. [bytes:: functions](#21-bytes-functions)
22. [meta:: functions](#22-meta-functions)
23. [not() function](#23-not-function)

---

## 1. string:: Functions

### Core Manipulation

| Function | Signature | Returns | Description |
|---|---|---|---|
| `string::capitalize` | `(string) -> string` | string | Capitalizes each word |
| `string::concat` | `(string, ...) -> string` | string | Concatenates multiple strings |
| `string::contains` | `(string, sub) -> bool` | bool | Checks if string contains substring |
| `string::ends_with` | `(string, sub) -> bool` | bool | Checks if string ends with substring |
| `string::join` | `(separator, ...values) -> string` | string | Joins values with separator |
| `string::len` | `(string) -> int` | int | Returns string length |
| `string::lowercase` | `(string) -> string` | string | Converts to lowercase |
| `string::matches` | `(string, regex) -> bool` | bool | Checks if string matches regex pattern |
| `string::repeat` | `(string, count) -> string` | string | Repeats string N times |
| `string::replace` | `(string, search, replace) -> string` | string | Replaces occurrences of a substring |
| `string::reverse` | `(string) -> string` | string | Reverses a string |
| `string::slice` | `(string, start, end?) -> string` | string | Extracts a substring by index |
| `string::slug` | `(string) -> string` | string | Converts to URL-safe slug |
| `string::split` | `(string, separator) -> array` | array | Splits string into array |
| `string::starts_with` | `(string, sub) -> bool` | bool | Checks if string starts with substring |
| `string::trim` | `(string) -> string` | string | Removes leading/trailing whitespace |
| `string::trim_start` | `(string) -> string` | string | Removes leading whitespace |
| `string::trim_end` | `(string) -> string` | string | Removes trailing whitespace |
| `string::uppercase` | `(string) -> string` | string | Converts to uppercase |
| `string::words` | `(string) -> array` | array | Splits string into array of words |

**Examples:**
```surql
-- Core manipulation
RETURN string::capitalize("hello world");       -- "Hello World"
RETURN string::concat("hello", " ", "world");   -- "hello world"
RETURN string::contains("hello", "ell");        -- true
RETURN string::join(", ", "a", "b", "c");       -- "a, b, c"
RETURN string::len("hello");                    -- 5
RETURN string::lowercase("HELLO");              -- "hello"
RETURN string::repeat("ha", 3);                 -- "hahaha"
RETURN string::replace("hello", "l", "r");      -- "herro"
RETURN string::reverse("hello");                -- "olleh"
RETURN string::slice("hello world", 0, 5);      -- "hello"
RETURN string::slug("Hello World!");            -- "hello-world"
RETURN string::split("a,b,c", ",");             -- ["a", "b", "c"]
RETURN string::trim("  hello  ");               -- "hello"
RETURN string::uppercase("hello");              -- "HELLO"
RETURN string::words("hello world");            -- ["hello", "world"]

-- Method chaining
RETURN "hello world".uppercase().replace("WORLD", "SCOTT"); -- "HELLO SCOTT"
```

### string::is_* Validation Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `string::is_alpha` | `(value) -> bool` | bool | Only alphabetic characters |
| `string::is_ascii` | `(value) -> bool` | bool | Only ASCII characters |
| `string::is_datetime` | `(string, format) -> bool` | bool | Matches datetime format |
| `string::is_domain` | `(value) -> bool` | bool | Valid domain name |
| `string::is_email` | `(value) -> bool` | bool | Valid email address |
| `string::is_hexadecimal` | `(value) -> bool` | bool | Valid hexadecimal string |
| `string::is_ip` | `(value) -> bool` | bool | Valid IP address (v4 or v6) |
| `string::is_ipv4` | `(value) -> bool` | bool | Valid IPv4 address |
| `string::is_ipv6` | `(value) -> bool` | bool | Valid IPv6 address |
| `string::is_latitude` | `(value) -> bool` | bool | Valid latitude value |
| `string::is_longitude` | `(value) -> bool` | bool | Valid longitude value |
| `string::is_numeric` | `(value) -> bool` | bool | Only numeric characters |
| `string::is_record` | `(value) -> bool` | bool | Valid Record ID format |
| `string::is_semver` | `(value) -> bool` | bool | Valid semver version |
| `string::is_ulid` | `(value) -> bool` | bool | Valid ULID |
| `string::is_url` | `(value) -> bool` | bool | Valid URL |
| `string::is_uuid` | `(value) -> bool` | bool | Valid UUID |

**Examples:**
```surql
RETURN string::is_email("scott@example.com");   -- true
RETURN string::is_url("https://example.com");   -- true
RETURN string::is_uuid("550e8400-e29b-41d4-a716-446655440000"); -- true
RETURN string::is_numeric("12345");             -- true
RETURN string::is_ip("192.168.1.1");            -- true
RETURN string::is_datetime("2026-04-02", "%Y-%m-%d"); -- true
```

### string::similarity:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `string::similarity::fuzzy` | `(string, string) -> number` | number | Fuzzy similarity score |
| `string::similarity::jaro` | `(string, string) -> number` | number | Jaro similarity (0-1) |
| `string::similarity::smithwaterman` | `(string, string) -> number` | number | Smith-Waterman alignment score |

### string::distance:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `string::distance::hamming` | `(string, string) -> number` | number | Hamming distance (same-length strings) |
| `string::distance::levenshtein` | `(string, string) -> number` | number | Levenshtein edit distance |

**Examples:**
```surql
RETURN string::similarity::jaro("hello", "hallo");         -- ~0.87
RETURN string::distance::levenshtein("kitten", "sitting"); -- 3
```

### string::html:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `string::html::encode` | `(string) -> string` | string | HTML-encodes special characters |
| `string::html::sanitize` | `(string) -> string` | string | Removes dangerous HTML tags |

**Examples:**
```surql
RETURN string::html::encode("<b>bold</b>");    -- "&lt;b&gt;bold&lt;/b&gt;"
RETURN string::html::sanitize("<script>alert('xss')</script><b>safe</b>"); -- "<b>safe</b>"
```

### string::semver:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `string::semver::compare` | `(v1, v2) -> number` | number | Compares two semver strings (-1, 0, 1) |
| `string::semver::major` | `(version) -> number` | number | Extracts major version |
| `string::semver::minor` | `(version) -> number` | number | Extracts minor version |
| `string::semver::patch` | `(version) -> number` | number | Extracts patch version |
| `string::semver::inc::major` | `(version) -> string` | string | Increments major version |
| `string::semver::inc::minor` | `(version) -> string` | string | Increments minor version |
| `string::semver::inc::patch` | `(version) -> string` | string | Increments patch version |
| `string::semver::set::major` | `(version, num) -> string` | string | Sets major version |
| `string::semver::set::minor` | `(version, num) -> string` | string | Sets minor version |
| `string::semver::set::patch` | `(version, num) -> string` | string | Sets patch version |

**Examples:**
```surql
RETURN string::semver::major("3.2.1");         -- 3
RETURN string::semver::inc::patch("3.2.1");    -- "3.2.2"
RETURN string::semver::compare("1.0.0", "2.0.0"); -- -1
```

---

## 2. array:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `array::add` | `(array, value) -> array` | array | Adds item if it doesn't exist (set-like) |
| `array::all` | `(array) -> bool` | bool | True if all values are truthy |
| `array::any` | `(array) -> bool` | bool | True if any value is truthy |
| `array::append` | `(array, value) -> array` | array | Appends item to end (always adds) |
| `array::at` | `(array, index) -> any` | any | Value at index (negative = from end) |
| `array::boolean_and` | `(array, array) -> array` | array | Bitwise AND on two arrays |
| `array::boolean_not` | `(array) -> array` | array | Bitwise NOT on array |
| `array::boolean_or` | `(array, array) -> array` | array | Bitwise OR on two arrays |
| `array::boolean_xor` | `(array, array) -> array` | array | Bitwise XOR on two arrays |
| `array::clump` | `(array, size) -> array` | array | Splits into chunks of N size |
| `array::combine` | `(array, array) -> array` | array | Cartesian product of two arrays |
| `array::complement` | `(array, array) -> array` | array | Items in first not in second |
| `array::concat` | `(array, array) -> array` | array | Merges two arrays |
| `array::difference` | `(array, array) -> array` | array | Symmetric difference |
| `array::distinct` | `(array) -> array` | array | Unique items only |
| `array::fill` | `(array, value?, start?, end?) -> array` | array | Fills array with value |
| `array::filter` | `(array, closure) -> array` | array | Filters by closure |
| `array::filter_index` | `(array, value) -> array` | array | Returns indices of matching value |
| `array::find` | `(array, closure) -> any` | any | First item matching closure |
| `array::find_index` | `(array, value) -> int` | int | Index of first matching value |
| `array::first` | `(array) -> any` | any | Returns first element |
| `array::flatten` | `(array) -> array` | array | Flattens nested arrays one level |
| `array::fold` | `(array, initial, closure) -> any` | any | Reduces array to single value |
| `array::group` | `(array) -> array` | array | Flattens and deduplicates |
| `array::insert` | `(array, value, index) -> array` | array | Inserts at index |
| `array::intersect` | `(array, array) -> array` | array | Common items between arrays |
| `array::is_empty` | `(array) -> bool` | bool | True if array has no items |
| `array::join` | `(array, separator) -> string` | string | Joins array into string |
| `array::last` | `(array) -> any` | any | Returns last element |
| `array::len` | `(array) -> int` | int | Number of items |
| `array::logical_and` | `(array, array) -> array` | array | Element-wise logical AND |
| `array::logical_or` | `(array, array) -> array` | array | Element-wise logical OR |
| `array::logical_xor` | `(array, array) -> array` | array | Element-wise logical XOR |
| `array::map` | `(array, closure) -> array` | array | Transforms each item |
| `array::matches` | `(array, value) -> array` | array | Boolean array of matches |
| `array::max` | `(array) -> any` | any | Maximum value |
| `array::min` | `(array) -> any` | any | Minimum value |
| `array::pop` | `(array) -> any` | any | Removes and returns last item |
| `array::prepend` | `(array, value) -> array` | array | Adds item to start |
| `array::push` | `(array, value) -> array` | array | Adds item to end (alias of append) |
| `array::range` | `(start, end) -> array` | array | Generates integer range |
| `array::remove` | `(array, index) -> array` | array | Removes item at index |
| `array::repeat` | `(value, count) -> array` | array | Creates array of repeated values |
| `array::reverse` | `(array) -> array` | array | Reverses order |
| `array::shuffle` | `(array) -> array` | array | Randomly reorders |
| `array::slice` | `(array, start, len?) -> array` | array | Extracts a portion |
| `array::sort` | `(array) -> array` | array | Sorts ascending |
| `array::sort::asc` | `(array) -> array` | array | Sorts ascending (explicit) |
| `array::sort::desc` | `(array) -> array` | array | Sorts descending |
| `array::swap` | `(array, i, j) -> array` | array | Swaps two elements |
| `array::transpose` | `(array) -> array` | array | Transposes 2D array (rows to columns) |
| `array::union` | `(array, array) -> array` | array | Merged unique items from both |
| `array::unique` | `(array) -> array` | array | Alias for distinct |
| `array::windows` | `(array, size) -> array` | array | Sliding window of N size |

**Examples:**
```surql
RETURN array::add([1, 2, 3], 2);           -- [1, 2, 3] (already exists)
RETURN array::add([1, 2, 3], 4);           -- [1, 2, 3, 4]
RETURN array::append([1, 2], 2);           -- [1, 2, 2] (always appends)
RETURN array::at([10, 20, 30], -1);        -- 30
RETURN array::clump([1,2,3,4,5], 2);       -- [[1,2],[3,4],[5]]
RETURN array::combine([1,2], ["a","b"]);   -- [[1,"a"],[1,"b"],[2,"a"],[2,"b"]]
RETURN array::complement([1,2,3,4], [2,4]); -- [1, 3]
RETURN array::distinct([1,1,2,2,3]);       -- [1, 2, 3]
RETURN array::flatten([[1,2],[3,[4]]]);     -- [1, 2, 3, [4]]
RETURN array::intersect([1,2,3], [2,3,4]); -- [2, 3]
RETURN array::join(["a","b","c"], "-");     -- "a-b-c"
RETURN array::len([1, 2, 3]);              -- 3
RETURN array::slice([1,2,3,4,5], 1, 3);   -- [2, 3, 4]
RETURN array::sort::desc([3, 1, 2]);       -- [3, 2, 1]
RETURN array::transpose([[1,2],[3,4]]);    -- [[1,3],[2,4]]
RETURN array::windows([1,2,3,4], 2);       -- [[1,2],[2,3],[3,4]]

-- Closures
RETURN array::filter([1,2,3,4,5], |$v| $v > 3);  -- [4, 5]
RETURN array::map([1,2,3], |$v| $v * 2);          -- [2, 4, 6]
RETURN array::fold([1,2,3], 0, |$acc, $v| $acc + $v); -- 6
RETURN array::find([1,2,3,4], |$v| $v > 2);       -- 3
```

---

## 3. math:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `math::abs` | `(number) -> number` | number | Absolute value |
| `math::acos` | `(number) -> number` | number | Arc cosine |
| `math::acot` | `(number) -> number` | number | Arc cotangent |
| `math::asin` | `(number) -> number` | number | Arc sine |
| `math::atan` | `(number) -> number` | number | Arc tangent |
| `math::ceil` | `(number) -> int` | int | Rounds up to nearest integer |
| `math::clamp` | `(number, min, max) -> number` | number | Clamps value to range |
| `math::cos` | `(number) -> number` | number | Cosine |
| `math::cot` | `(number) -> number` | number | Cotangent |
| `math::deg2rad` | `(number) -> number` | number | Degrees to radians |
| `math::e` | `() -> float` | float | Euler's number (2.718...) |
| `math::fixed` | `(number, precision) -> number` | number | Rounds to N decimal places |
| `math::floor` | `(number) -> int` | int | Rounds down to nearest integer |
| `math::inf` | `() -> float` | float | Positive infinity |
| `math::interquartile` | `(array) -> number` | number | Interquartile range |
| `math::lerp` | `(a, b, t) -> number` | number | Linear interpolation |
| `math::ln` | `(number) -> number` | number | Natural logarithm |
| `math::log` | `(number, base) -> number` | number | Logarithm with specified base |
| `math::log10` | `(number) -> number` | number | Base-10 logarithm |
| `math::log2` | `(number) -> number` | number | Base-2 logarithm |
| `math::max` | `(array) -> number` | number | Maximum value in array |
| `math::mean` | `(array) -> number` | number | Arithmetic mean (average) |
| `math::median` | `(array) -> number` | number | Middle value |
| `math::min` | `(array) -> number` | number | Minimum value in array |
| `math::midhinge` | `(array) -> number` | number | Average of Q1 and Q3 |
| `math::mode` | `(array) -> number` | number | Most frequent value |
| `math::nearestrank` | `(array, percentile) -> number` | number | Value at percentile |
| `math::neg_inf` | `() -> float` | float | Negative infinity |
| `math::percentile` | `(array, percentile) -> number` | number | Value at percentile (interpolated) |
| `math::pi` | `() -> float` | float | Pi (3.14159...) |
| `math::pow` | `(base, exponent) -> number` | number | Power / exponentiation |
| `math::product` | `(array) -> number` | number | Product of all values |
| `math::rad2deg` | `(number) -> number` | number | Radians to degrees |
| `math::round` | `(number) -> int` | int | Rounds to nearest integer |
| `math::sign` | `(number) -> number` | number | Sign (-1, 0, or 1) |
| `math::sin` | `(number) -> number` | number | Sine |
| `math::spread` | `(array) -> number` | number | Difference between max and min |
| `math::sqrt` | `(number) -> number` | number | Square root |
| `math::stddev` | `(array) -> number` | number | Standard deviation |
| `math::sum` | `(array) -> number` | number | Sum of all values |
| `math::tan` | `(number) -> number` | number | Tangent |
| `math::tau` | `() -> float` | float | Tau (2 * Pi) |
| `math::top` | `(array, count) -> array` | array | Top N values |
| `math::bottom` | `(array, count) -> array` | array | Bottom N values |
| `math::trimean` | `(array) -> number` | number | Trimean (weighted median) |
| `math::variance` | `(array) -> number` | number | Statistical variance |

**Examples:**
```surql
RETURN math::abs(-42);                    -- 42
RETURN math::ceil(3.14);                  -- 4
RETURN math::clamp(15, 0, 10);            -- 10
RETURN math::floor(3.99);                 -- 3
RETURN math::fixed(3.14159, 2);           -- 3.14
RETURN math::max([1, 5, 3]);              -- 5
RETURN math::mean([1, 2, 3, 4, 5]);       -- 3
RETURN math::median([1, 2, 3, 4, 5]);     -- 3
RETURN math::pow(2, 10);                  -- 1024
RETURN math::round(3.5);                  -- 4
RETURN math::sqrt(144);                   -- 12
RETURN math::sum([10, 20, 30]);           -- 60
RETURN math::stddev([2, 4, 4, 4, 5, 5, 7, 9]); -- ~2.0
RETURN math::lerp(0, 100, 0.5);           -- 50
RETURN math::top([5,3,8,1,9], 3);         -- [9, 8, 5]
```

---

## 4. time:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `time::ceil` | `(datetime, duration) -> datetime` | datetime | Rounds up to duration boundary |
| `time::day` | `(datetime?) -> int` | int | Day of month (1-31) |
| `time::floor` | `(datetime, duration) -> datetime` | datetime | Rounds down to duration boundary |
| `time::format` | `(datetime, format) -> string` | string | Formats datetime as string |
| `time::group` | `(datetime, unit) -> datetime` | datetime | Groups datetime by unit |
| `time::hour` | `(datetime?) -> int` | int | Hour (0-23) |
| `time::max` | `(array) -> datetime` | datetime | Latest datetime in array |
| `time::min` | `(array) -> datetime` | datetime | Earliest datetime in array |
| `time::minute` | `(datetime?) -> int` | int | Minute (0-59) |
| `time::month` | `(datetime?) -> int` | int | Month (1-12) |
| `time::nano` | `(datetime?) -> int` | int | Nanosecond component |
| `time::micros` | `(datetime?) -> int` | int | Microsecond component |
| `time::millis` | `(datetime?) -> int` | int | Millisecond component |
| `time::now` | `() -> datetime` | datetime | Current datetime |
| `time::round` | `(datetime, duration) -> datetime` | datetime | Rounds to nearest duration boundary |
| `time::second` | `(datetime?) -> int` | int | Second (0-59) |
| `time::timezone` | `() -> string` | string | Current timezone |
| `time::unix` | `(datetime?) -> int` | int | Unix timestamp (seconds) |
| `time::wday` | `(datetime?) -> int` | int | Day of week (1=Monday, 7=Sunday) |
| `time::week` | `(datetime?) -> int` | int | Week of year |
| `time::yday` | `(datetime?) -> int` | int | Day of year (1-366) |
| `time::year` | `(datetime?) -> int` | int | Year |

### time::from:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `time::from::micros` | `(int) -> datetime` | datetime | Datetime from microseconds since epoch |
| `time::from::millis` | `(int) -> datetime` | datetime | Datetime from milliseconds since epoch |
| `time::from::nanos` | `(int) -> datetime` | datetime | Datetime from nanoseconds since epoch |
| `time::from::secs` | `(int) -> datetime` | datetime | Datetime from seconds since epoch |
| `time::from::unix` | `(int) -> datetime` | datetime | Alias for time::from::secs |

**Examples:**
```surql
RETURN time::now();                               -- d'2026-04-02T12:00:00Z'
RETURN time::day(d'2026-04-02T00:00:00Z');        -- 2
RETURN time::month(d'2026-04-02T00:00:00Z');      -- 4
RETURN time::year(d'2026-04-02T00:00:00Z');       -- 2026
RETURN time::wday(d'2026-04-02T00:00:00Z');       -- 4 (Thursday)
RETURN time::format(time::now(), "%Y-%m-%d");     -- "2026-04-02"
RETURN time::floor(d'2026-04-02T14:35:00Z', 1h); -- d'2026-04-02T14:00:00Z'
RETURN time::from::millis(1712000000000);         -- datetime from epoch millis
RETURN time::unix(time::now());                   -- unix seconds
RETURN time::group(d'2026-04-02T14:35:00Z', "month"); -- d'2026-04-01T00:00:00Z'
```

---

## 5. crypto:: Functions

### Hashing Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `crypto::blake3` | `(string) -> string` | string | BLAKE3 hash |
| `crypto::joaat` | `(string) -> number` | number | Jenkins one-at-a-time hash |
| `crypto::md5` | `(string) -> string` | string | MD5 hash (not for passwords!) |
| `crypto::sha1` | `(string) -> string` | string | SHA-1 hash |
| `crypto::sha256` | `(string) -> string` | string | SHA-256 hash |
| `crypto::sha512` | `(string) -> string` | string | SHA-512 hash |

### Password Hashing Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `crypto::argon2::compare` | `(hash, password) -> bool` | bool | Verifies argon2 hash |
| `crypto::argon2::generate` | `(password) -> string` | string | Generates argon2 hash |
| `crypto::bcrypt::compare` | `(hash, password) -> bool` | bool | Verifies bcrypt hash |
| `crypto::bcrypt::generate` | `(password) -> string` | string | Generates bcrypt hash |
| `crypto::pbkdf2::compare` | `(hash, password) -> bool` | bool | Verifies PBKDF2 hash |
| `crypto::pbkdf2::generate` | `(password) -> string` | string | Generates PBKDF2 hash |
| `crypto::scrypt::compare` | `(hash, password) -> bool` | bool | Verifies scrypt hash |
| `crypto::scrypt::generate` | `(password) -> string` | string | Generates scrypt hash |

**Examples:**
```surql
RETURN crypto::sha256("hello");                    -- "2cf24dba5fb0a30..."
RETURN crypto::blake3("hello");                    -- "ea8f163..."
RETURN crypto::md5("hello");                       -- "5d41402abc4b2a76..."

-- Password hashing (use argon2 or bcrypt for production)
LET $hash = crypto::argon2::generate("my_password");
RETURN crypto::argon2::compare($hash, "my_password");   -- true
RETURN crypto::argon2::compare($hash, "wrong_password"); -- false

LET $bhash = crypto::bcrypt::generate("my_password");
RETURN crypto::bcrypt::compare($bhash, "my_password");   -- true
```

---

## 6. http:: Functions

> **Note:** HTTP functions are disabled by default. Enable with `--allow-net` flag on server start.

| Function | Signature | Returns | Description |
|---|---|---|---|
| `http::get` | `(url, headers?) -> any` | any | HTTP GET request |
| `http::head` | `(url, headers?) -> any` | any | HTTP HEAD request |
| `http::post` | `(url, body?, headers?) -> any` | any | HTTP POST request |
| `http::put` | `(url, body?, headers?) -> any` | any | HTTP PUT request |
| `http::patch` | `(url, body?, headers?) -> any` | any | HTTP PATCH request |
| `http::delete` | `(url, headers?) -> any` | any | HTTP DELETE request |

**Parameters:**
- `url` (string) - The URL to request
- `body` (object, optional) - Request body (POST, PUT, PATCH)
- `headers` (object, optional) - Custom headers as key-value pairs

**Examples:**
```surql
-- Simple GET
RETURN http::get("https://api.example.com/users");

-- GET with headers
RETURN http::get("https://api.example.com/users", {
    "Authorization": "Bearer my_token",
    "Accept": "application/json"
});

-- POST with body and headers
RETURN http::post("https://api.example.com/users", {
    name: "Scott",
    email: "scott@example.com"
}, {
    "Content-Type": "application/json",
    "Authorization": "Bearer my_token"
});

-- PUT
RETURN http::put("https://api.example.com/users/1", {
    name: "Scott Updated"
});

-- DELETE
RETURN http::delete("https://api.example.com/users/1");
```

---

## 7. type:: Functions

### Conversion Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `type::bool` | `(value) -> bool` | bool | Converts to boolean |
| `type::bytes` | `(value) -> bytes` | bytes | Converts to bytes |
| `type::datetime` | `(value) -> datetime` | datetime | Converts to datetime |
| `type::decimal` | `(value) -> decimal` | decimal | Converts to decimal |
| `type::duration` | `(value) -> duration` | duration | Converts to duration |
| `type::field` | `(string) -> field` | field | Converts to field name |
| `type::fields` | `(array) -> array<field>` | array | Converts array to field names |
| `type::float` | `(value) -> float` | float | Converts to 64-bit float |
| `type::int` | `(value) -> int` | int | Converts to 64-bit integer |
| `type::number` | `(value) -> number` | number | Converts to number |
| `type::point` | `(lon, lat) -> point` | point | Creates a geospatial point |
| `type::range` | `(value) -> range` | range | Converts to range type |
| `type::record` | `(table, id) -> record` | record | Creates a Record ID |
| `type::regex` | `(string) -> regex` | regex | Converts to regex |
| `type::string` | `(value) -> string` | string | Converts to string |
| `type::table` | `(string) -> table` | table | Converts to table name |
| `type::uuid` | `(value?) -> uuid` | uuid | Converts to UUID or generates one |

### Type Checking Functions (type::is_*)

| Function | Signature | Returns | Description |
|---|---|---|---|
| `type::is_array` | `(value) -> bool` | bool | Is an array |
| `type::is_bool` | `(value) -> bool` | bool | Is a boolean |
| `type::is_bytes` | `(value) -> bool` | bool | Is bytes |
| `type::is_collection` | `(value) -> bool` | bool | Is a collection |
| `type::is_datetime` | `(value) -> bool` | bool | Is a datetime |
| `type::is_decimal` | `(value) -> bool` | bool | Is a decimal |
| `type::is_duration` | `(value) -> bool` | bool | Is a duration |
| `type::is_float` | `(value) -> bool` | bool | Is a float |
| `type::is_geometry` | `(value) -> bool` | bool | Is a geometry type |
| `type::is_int` | `(value) -> bool` | bool | Is an integer |
| `type::is_line` | `(value) -> bool` | bool | Is a line geometry |
| `type::is_none` | `(value) -> bool` | bool | Is NONE |
| `type::is_null` | `(value) -> bool` | bool | Is NULL |
| `type::is_multiline` | `(value) -> bool` | bool | Is a multiline geometry |
| `type::is_multipoint` | `(value) -> bool` | bool | Is a multipoint geometry |
| `type::is_multipolygon` | `(value) -> bool` | bool | Is a multipolygon geometry |
| `type::is_number` | `(value) -> bool` | bool | Is a number |
| `type::is_object` | `(value) -> bool` | bool | Is an object |
| `type::is_point` | `(value) -> bool` | bool | Is a point geometry |
| `type::is_polygon` | `(value) -> bool` | bool | Is a polygon geometry |
| `type::is_record` | `(value, table?) -> bool` | bool | Is a record (optionally of specific table) |
| `type::is_string` | `(value) -> bool` | bool | Is a string |
| `type::is_uuid` | `(value) -> bool` | bool | Is a UUID |

**Examples:**
```surql
-- Conversion
RETURN type::bool("true");                  -- true
RETURN type::int("42");                     -- 42
RETURN type::float("3.14");                 -- 3.14
RETURN type::string(12345);                 -- "12345"
RETURN type::datetime("2026-04-02");        -- d'2026-04-02T00:00:00Z'
RETURN type::record("user", 123);           -- user:123
RETURN type::point(-111.926, 33.494);       -- geospatial point (Phoenix, AZ)

-- Type checking
RETURN type::is_string("hello");            -- true
RETURN type::is_int(42);                    -- true
RETURN type::is_record(user:123);           -- true
RETURN type::is_record(user:123, "user");   -- true
RETURN type::is_record(user:123, "post");   -- false
RETURN type::is_none(NONE);                 -- true
RETURN type::is_null(NULL);                 -- true
```

> **v3 migration note:** `type::thing()` was renamed to `type::record()` in v3.

---

## 8. rand:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `rand` | `() -> float` | float | Random float between 0 and 1 |
| `rand::bool` | `() -> bool` | bool | Random boolean |
| `rand::duration` | `(min?, max?) -> duration` | duration | Random duration |
| `rand::enum` | `(...values) -> any` | any | Picks random value from arguments |
| `rand::float` | `(min?, max?) -> float` | float | Random float (optional range) |
| `rand::guid` | `(len?) -> string` | string | Random GUID-like string |
| `rand::id` | `() -> string` | string | Random ID string |
| `rand::int` | `(min?, max?) -> int` | int | Random integer (optional range) |
| `rand::string` | `(len?) -> string` | string | Random alphanumeric string |
| `rand::time` | `(min?, max?) -> datetime` | datetime | Random datetime (optional range) |
| `rand::ulid` | `() -> ulid` | ulid | Random ULID |
| `rand::uuid` | `() -> uuid` | uuid | Random UUID (v7 by default) |
| `rand::uuid::v4` | `() -> uuid` | uuid | Random UUID v4 |
| `rand::uuid::v7` | `() -> uuid` | uuid | Random UUID v7 (time-ordered) |

**Examples:**
```surql
RETURN rand();                              -- 0.7483920...
RETURN rand::bool();                        -- true
RETURN rand::enum("red", "green", "blue");  -- "green"
RETURN rand::float(1.0, 100.0);             -- 42.384...
RETURN rand::int(1, 100);                   -- 73
RETURN rand::string(16);                    -- "a8f3bc91d2e74..."
RETURN rand::uuid();                        -- u"01903a5e-..."
RETURN rand::uuid::v4();                    -- u"550e8400-..."
RETURN rand::ulid();                        -- u"01HGW3E..."
RETURN rand::time(d'2020-01-01', d'2026-01-01'); -- random datetime in range
```

---

## 9. parse:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `parse::email::host` | `(string) -> string` | string | Extracts host from email |
| `parse::email::user` | `(string) -> string` | string | Extracts user from email |
| `parse::url::domain` | `(string) -> string` | string | Extracts domain from URL |
| `parse::url::fragment` | `(string) -> string` | string | Extracts fragment (#) from URL |
| `parse::url::host` | `(string) -> string` | string | Extracts host from URL |
| `parse::url::path` | `(string) -> string` | string | Extracts path from URL |
| `parse::url::port` | `(string) -> int` | int | Extracts port from URL |
| `parse::url::query` | `(string) -> string` | string | Extracts query string from URL |
| `parse::url::scheme` | `(string) -> string` | string | Extracts scheme (http/https) |

**Examples:**
```surql
RETURN parse::email::host("scott@advosy.com");     -- "advosy.com"
RETURN parse::email::user("scott@advosy.com");     -- "scott"
RETURN parse::url::domain("https://app.advosy.com/dashboard?tab=1"); -- "app.advosy.com"
RETURN parse::url::path("https://example.com/api/v1/users");        -- "/api/v1/users"
RETURN parse::url::port("https://example.com:8080/path");           -- 8080
RETURN parse::url::scheme("https://example.com");                   -- "https"
RETURN parse::url::query("https://example.com?foo=bar&baz=1");      -- "foo=bar&baz=1"
```

---

## 10. encoding:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `encoding::base64::decode` | `(string) -> bytes` | bytes | Decodes base64 string to bytes |
| `encoding::base64::encode` | `(bytes) -> string` | string | Encodes bytes to base64 string |

**Examples:**
```surql
RETURN encoding::base64::encode(<bytes>"hello");  -- "aGVsbG8="
RETURN encoding::base64::decode("aGVsbG8=");      -- bytes value
```

---

## 11. geo:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `geo::area` | `(geometry) -> number` | number | Area of geometry in sq meters |
| `geo::bearing` | `(point, point) -> number` | number | Bearing between two points (degrees) |
| `geo::centroid` | `(geometry) -> point` | point | Center point of geometry |
| `geo::distance` | `(point, point) -> number` | number | Distance in meters between points |

### geo::hash:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `geo::hash::decode` | `(string) -> point` | point | Decodes geohash to point |
| `geo::hash::encode` | `(point, precision?) -> string` | string | Encodes point as geohash |

**Examples:**
```surql
-- Distance between two points (meters)
RETURN geo::distance(
    type::point(-111.926, 33.494),  -- Phoenix, AZ
    type::point(-112.074, 33.448)   -- near downtown
);
-- Returns distance in meters

RETURN geo::bearing(
    type::point(-111.926, 33.494),
    type::point(-112.074, 33.448)
);
-- Returns bearing in degrees

RETURN geo::hash::encode(type::point(-111.926, 33.494), 6); -- "9tbk7p"
RETURN geo::hash::decode("9tbk7p"); -- approximate point
```

---

## 12. object:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `object::entries` | `(object) -> array` | array | Array of [key, value] pairs |
| `object::from_entries` | `(array) -> object` | object | Object from [key, value] pairs |
| `object::keys` | `(object) -> array` | array | Array of keys |
| `object::len` | `(object) -> int` | int | Number of keys |
| `object::values` | `(object) -> array` | array | Array of values |

**Examples:**
```surql
LET $obj = { name: "Scott", role: "Sales Lead", company: "Advosy" };

RETURN object::keys($obj);     -- ["company", "name", "role"]
RETURN object::values($obj);   -- ["Advosy", "Scott", "Sales Lead"]
RETURN object::entries($obj);  -- [["company","Advosy"],["name","Scott"],["role","Sales Lead"]]
RETURN object::len($obj);      -- 3

RETURN object::from_entries([["a", 1], ["b", 2]]); -- { a: 1, b: 2 }
```

---

## 13. record:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `record::id` | `(record) -> any` | any | Extracts the ID portion |
| `record::tb` | `(record) -> string` | string | Extracts the table name |
| `record::exists` | `(record) -> bool` | bool | Checks if record exists in DB |

**Examples:**
```surql
RETURN record::id(user:123);    -- 123
RETURN record::id(user:scott);  -- "scott"
RETURN record::tb(user:123);    -- "user"

-- Check existence
RETURN record::exists(user:123); -- true/false depending on DB state

-- Useful in queries
SELECT *, record::id(id) AS short_id FROM user;
```

---

## 14. value:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `value::diff` | `(value, value) -> array` | array | JSON patch diff between two values |
| `value::patch` | `(value, patches) -> any` | any | Applies JSON patches to value |

**Examples:**
```surql
-- Diff two objects
RETURN value::diff(
    { name: "Scott", age: 35 },
    { name: "Scott", age: 36, title: "Head of Sales" }
);
-- Returns JSON Patch operations

-- Apply patches
RETURN value::patch({ name: "Scott", age: 35 }, [
    { op: "replace", path: "/age", value: 36 },
    { op: "add", path: "/title", value: "Head of Sales" }
]);
-- { name: "Scott", age: 36, title: "Head of Sales" }
```

---

## 15. vector:: Functions

### vector::distance:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `vector::distance::chebyshev` | `(array, array) -> number` | number | Chebyshev (L-infinity) distance |
| `vector::distance::euclidean` | `(array, array) -> number` | number | Euclidean (L2) distance |
| `vector::distance::hamming` | `(array, array) -> number` | number | Hamming distance |
| `vector::distance::knn` | `(array, array) -> number` | number | K-nearest neighbor distance |
| `vector::distance::mahalanobis` | `(array, array) -> number` | number | Mahalanobis distance |
| `vector::distance::manhattan` | `(array, array) -> number` | number | Manhattan (L1) distance |
| `vector::distance::minkowski` | `(array, array, p) -> number` | number | Minkowski distance |

### vector::similarity:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `vector::similarity::cosine` | `(array, array) -> number` | number | Cosine similarity (-1 to 1) |
| `vector::similarity::jaccard` | `(array, array) -> number` | number | Jaccard similarity |
| `vector::similarity::pearson` | `(array, array) -> number` | number | Pearson correlation |
| `vector::similarity::spearman` | `(array, array) -> number` | number | Spearman rank correlation |

### vector:: Math Operations

| Function | Signature | Returns | Description |
|---|---|---|---|
| `vector::add` | `(array, array) -> array` | array | Element-wise addition |
| `vector::angle` | `(array, array) -> number` | number | Angle between vectors |
| `vector::cross` | `(array, array) -> array` | array | Cross product (3D vectors) |
| `vector::divide` | `(array, array) -> array` | array | Element-wise division |
| `vector::dot` | `(array, array) -> number` | number | Dot product |
| `vector::magnitude` | `(array) -> number` | number | Vector magnitude (length) |
| `vector::multiply` | `(array, array) -> array` | array | Element-wise multiplication |
| `vector::normalize` | `(array) -> array` | array | Normalizes to unit vector |
| `vector::project` | `(array, array) -> array` | array | Projects first onto second |
| `vector::scale` | `(array, scalar) -> array` | array | Scalar multiplication |
| `vector::subtract` | `(array, array) -> array` | array | Element-wise subtraction |

**Examples:**
```surql
-- Cosine similarity for embeddings
RETURN vector::similarity::cosine([1,2,3], [4,5,6]); -- ~0.974

-- Euclidean distance
RETURN vector::distance::euclidean([1,0], [0,1]); -- ~1.414

-- Vector math
RETURN vector::add([1,2,3], [4,5,6]);       -- [5, 7, 9]
RETURN vector::dot([1,2,3], [4,5,6]);       -- 32
RETURN vector::magnitude([3, 4]);            -- 5
RETURN vector::normalize([3, 4]);            -- [0.6, 0.8]
RETURN vector::scale([1, 2, 3], 2);          -- [2, 4, 6]
```

---

## 16. search:: Functions

> Used with full-text search indexes (DEFINE INDEX ... SEARCH ANALYZER).

| Function | Signature | Returns | Description |
|---|---|---|---|
| `search::analyze` | `(analyzer, string) -> array` | array | Shows how analyzer tokenizes text |
| `search::highlight` | `(prefix, suffix, field, partial?) -> string` | string | Highlights matching terms in results |
| `search::offsets` | `(field, partial?) -> object` | object | Returns match positions |
| `search::score` | `(index) -> number` | number | Relevance score for a match |

**Examples:**
```surql
-- Define a search index first
DEFINE ANALYZER my_analyzer TOKENIZERS blank, class FILTERS lowercase, snowball(english);
DEFINE INDEX search_idx ON TABLE article FIELDS content SEARCH ANALYZER my_analyzer BM25;

-- Query with scoring
SELECT *, search::score(0) AS relevance
FROM article
WHERE content @0@ "surrealdb functions"
ORDER BY relevance DESC;

-- Highlight matches
SELECT search::highlight("<b>", "</b>", content) AS highlighted
FROM article
WHERE content @@ "surrealdb";

-- Analyze text
RETURN search::analyze("my_analyzer", "Running quickly through the database");
-- ["run", "quick", "through", "databas"] (after stemming)
```

---

## 17. session:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `session::ac` | `() -> string` | string | Current access method name |
| `session::db` | `() -> string` | string | Current database name |
| `session::id` | `() -> string` | string | Current session ID |
| `session::ip` | `() -> string` | string | Client IP address |
| `session::ns` | `() -> string` | string | Current namespace name |
| `session::origin` | `() -> string` | string | Client HTTP origin |
| `session::rd` | `() -> any` | any | Record access authentication data |
| `session::token` | `() -> string` | string | Current authentication token (JWT) |

**Examples:**
```surql
RETURN session::db();      -- "mydb"
RETURN session::ns();      -- "mynamespace"
RETURN session::ip();      -- "192.168.1.1"
RETURN session::id();      -- unique session identifier
RETURN session::ac();      -- "user" (access method name)
RETURN session::origin();  -- "https://myapp.com"

-- Useful in permissions
DEFINE TABLE private_data PERMISSIONS
    FOR select WHERE created_by = session::rd().id;
```

---

## 18. sleep() Function

| Function | Signature | Returns | Description |
|---|---|---|---|
| `sleep` | `(duration) -> none` | none | Pauses execution for specified duration |

**Examples:**
```surql
RETURN sleep(100ms);   -- Pause 100 milliseconds
RETURN sleep(1s);      -- Pause 1 second
RETURN sleep(500ms);   -- Pause 500 milliseconds
```

---

## 19. count() Function

| Function | Signature | Returns | Description |
|---|---|---|---|
| `count` | `() -> int` | int | Counts rows (used as aggregate) |
| `count` | `(value) -> int` | int | Returns 1 if truthy, 0 if falsy |
| `count` | `(array) -> int` | int | Number of items in array |

**Examples:**
```surql
-- Count all records
SELECT count() FROM user GROUP ALL;

-- Count with condition
SELECT count(age > 30) FROM user GROUP ALL;

-- Count array items
RETURN count([1, 2, 3, 4, 5]); -- 5

-- Count with GROUP BY
SELECT department, count() AS total
FROM employee
GROUP BY department;
```

---

## 20. duration:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `duration::days` | `(duration) -> number` | number | Total days in duration |
| `duration::hours` | `(duration) -> number` | number | Total hours in duration |
| `duration::micros` | `(duration) -> number` | number | Total microseconds |
| `duration::millis` | `(duration) -> number` | number | Total milliseconds |
| `duration::mins` | `(duration) -> number` | number | Total minutes |
| `duration::nanos` | `(duration) -> number` | number | Total nanoseconds |
| `duration::secs` | `(duration) -> number` | number | Total seconds |
| `duration::weeks` | `(duration) -> number` | number | Total weeks |
| `duration::years` | `(duration) -> number` | number | Total years |
| `duration::from::days` | `(number) -> duration` | duration | Creates duration from days |
| `duration::from::hours` | `(number) -> duration` | duration | Creates duration from hours |
| `duration::from::micros` | `(number) -> duration` | duration | Creates duration from microseconds |
| `duration::from::millis` | `(number) -> duration` | duration | Creates duration from milliseconds |
| `duration::from::mins` | `(number) -> duration` | duration | Creates duration from minutes |
| `duration::from::nanos` | `(number) -> duration` | duration | Creates duration from nanoseconds |
| `duration::from::secs` | `(number) -> duration` | duration | Creates duration from seconds |
| `duration::from::weeks` | `(number) -> duration` | duration | Creates duration from weeks |

**Examples:**
```surql
RETURN duration::days(7d);       -- 7
RETURN duration::hours(2d12h);   -- 60
RETURN duration::secs(1h30m);    -- 5400
RETURN duration::from::hours(48); -- 2d
RETURN duration::from::mins(90); -- 1h30m
```

---

## 21. bytes:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `bytes::len` | `(bytes) -> int` | int | Length of bytes value |

**Examples:**
```surql
RETURN bytes::len(<bytes>"hello"); -- 5
```

---

## 22. meta:: Functions

| Function | Signature | Returns | Description |
|---|---|---|---|
| `meta::id` | `(record) -> any` | any | Alias for record::id |
| `meta::tb` | `(record) -> string` | string | Alias for record::tb |

> **Note:** `meta::id` and `meta::tb` are legacy aliases. Prefer `record::id` and `record::tb` in new code.

---

## 23. not() Function

| Function | Signature | Returns | Description |
|---|---|---|---|
| `not` | `(value) -> bool` | bool | Logical negation |

**Examples:**
```surql
RETURN not(true);    -- false
RETURN not(false);   -- true
RETURN not(0);       -- true
RETURN not("hello"); -- false
```

---

## Quick Reference: Function Family Count

| Family | Count | Primary Use |
|---|---|---|
| string:: | ~45+ | Text manipulation, validation, similarity |
| array:: | ~50+ | Collection operations, closures |
| math:: | ~45+ | Arithmetic, statistics, trigonometry |
| time:: | ~25+ | DateTime manipulation, extraction |
| crypto:: | ~14 | Hashing, password security |
| http:: | 6 | External API calls |
| type:: | ~40+ | Conversion and type checking |
| rand:: | ~14 | Random data generation |
| parse:: | ~9 | URL and email parsing |
| encoding:: | 2 | Base64 encode/decode |
| geo:: | ~6 | Geospatial calculations |
| object:: | 5 | Object key/value operations |
| record:: | 3 | Record ID decomposition |
| value:: | 2 | JSON diff/patch |
| vector:: | ~25+ | Vector math, similarity, distance |
| search:: | 4 | Full-text search scoring/highlighting |
| session:: | 8 | Session/auth context |
| duration:: | ~17 | Duration conversion |
| bytes:: | 1 | Byte operations |
| meta:: | 2 | Legacy record aliases |
| sleep | 1 | Execution pause |
| count | 1 | Aggregation counting |
| not | 1 | Logical negation |
| **TOTAL** | **~325+** | |
