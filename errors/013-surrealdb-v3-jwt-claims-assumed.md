# Error #013: SurrealDB v3 JWT claims assumed incorrectly

**Date:** 2026-03-29
**Project:** Bresco

## What Happened
Frontend auth store and shared JwtPayload type assumed SurrealDB v3 tokens contain `tenant` and `functions` claims. They don't. SurrealDB v3 JWTs contain only: ID, NS, DB, AC, iat, exp.

## The Triggering Prompt
```
Execute plan 01-05 of phase 01-foundation. (GSD executor agent building frontend stores)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** The executor agent used the JwtPayload interface from @bresco/types (written by Plan 01 agent) without verifying it against actual SurrealDB v3 token structure. The interface was speculative, not validated against the real SDK.
**Surface symptom:** Code review caught it. Would have caused blank tenant state on frontend after signin.

## What The Prompt Should Have Been
```
Plan should have required: "Read SurrealDB v3 JWT docs via context7 before defining JwtPayload interface. Verify token structure against actual db.signup() output."
```

## Prevention
1. Any interface that models external system output (JWT, webhook, API response) must be validated against actual output, not assumed
2. SurrealDB v3 JWT structure: ID, NS, DB, AC, iat, exp. Custom claims require a /api/me endpoint.

## Pattern Check
- **Seen before?** Yes - similar to WASM SDK RecordId assumptions in Life OS
- **Added to toolkit?** Yes - lesson in tasks/lessons.md
