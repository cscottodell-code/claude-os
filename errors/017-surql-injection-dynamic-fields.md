# Error #017: SurrealQL Injection via Dynamic Field Keys

**Date:** 2026-03-30
**Project:** Bresco Platform

## What Happened
The CRM import and PATCH routes interpolated user-supplied field names directly into SurrealQL strings (e.g., `SET ${key} = $value`). An attacker could inject arbitrary SurrealQL by sending a field name like `name = 'hacked'; DELETE lead WHERE true; --`.

## The Triggering Prompt
```
Build CSV import endpoint for leads
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Treated field names as safe because "they come from column mapping." But the column mapping itself comes from user input (the frontend sends which CSV columns map to which DB fields).
**Surface symptom:** No visible symptom until code review. The injection would have allowed full database manipulation by any authenticated tenant user.

## What The Prompt Should Have Been
```
Build CSV import endpoint for leads. Field names from user input must be
validated against an explicit allowlist -- never interpolate user-supplied
strings into SurrealQL. Use validateFieldKeys() with a regex guard.
```

## Prevention
1. NEVER interpolate user-supplied strings as field names in SurrealQL
2. Every route that accepts dynamic field names needs an allowlist (per-table)
3. validateFieldKeys() regex: `/^[a-z][a-z0-9_]*$/` -- reject anything else

## Pattern Check
- **Seen before?** No -- but analogous to SQL injection in traditional databases
- **Added to toolkit?** Yes -- validateFieldKeys() added to shared utils, allowlists per route
