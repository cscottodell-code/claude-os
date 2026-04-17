# Error #037: SurrealDB Migration Files Use v2 CLI Syntax
**Date:** 2026-04-16
**Project:** Eleanor v2

## What Happened
Migration files 002-007 use `ASSERT $value IN [...]` which fails when piped through the `surreal sql` CLI because `$value` gets interpolated as a shell/CLI parameter. Also, `ON DUPLICATE KEY UPDATE` is MySQL syntax, not SurrealQL. The migration runner script uses `--conn` (v2 flag) instead of `--endpoint` (v3).

## The Triggering Prompt
```
bash server/migrations/run.sh
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Migration files were written by agents using v2 SurrealDB patterns. The CLI parameter interpolation issue with `$value` wasn't caught because migrations were tested via MCP (which doesn't have the CLI interpolation problem), not via the `surreal sql` CLI.
**Surface symptom:** All migrations except 001_auth.surql fail to run. Tables either don't exist or exist without field definitions, causing "table does not exist" errors at runtime.

## What The Prompt Should Have Been
```
Write SurrealDB migrations compatible with v3 CLI. Test by running through `surreal sql --endpoint` 
before committing. Note: $value in ASSERT clauses will be interpolated by the CLI -- verify this works.
```

## Prevention
1. Test migrations via CLI, not just MCP
2. Fix run.sh to use `--endpoint` instead of `--conn`
3. Consider using `UPSERT` instead of `INSERT ... ON DUPLICATE KEY UPDATE`

## Pattern Check
- **Seen before?** Yes -- SurrealDB v2/v3 syntax issues are a recurring theme (errors #028, #031)
- **Added to toolkit?** Not yet -- needs a migration testing step in phase closeout
