# Error #012: Auth middleware silent passthrough on failure

**Date:** 2026-03-29
**Project:** Bresco

## What Happened
The Hono auth middleware catch block set tenantId to empty string and called next() instead of returning 401. This meant any request with an invalid/expired JWT would pass through to protected routes with an empty tenant context.

## The Triggering Prompt
```
Execute plan 01-02 of phase 01-foundation. (GSD executor agent)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** The executor agent wrote a catch block that gracefully degraded instead of failing hard. The pattern "set defaults and continue" is common in middleware but catastrophic for auth.
**Surface symptom:** Code review caught it - no runtime failure because tests mocked the DB layer.

## What The Prompt Should Have Been
```
The plan should have included an acceptance criterion: "Auth middleware catch block returns 401, never calls next()"
```

## Prevention
1. All auth middleware plans must include an explicit "failure returns 401" acceptance criterion
2. Integration tests must verify that invalid tokens get 401 (the Plan 06 tests did this correctly)

## Pattern Check
- **Seen before?** No
- **Added to toolkit?** Yes - lesson in tasks/lessons.md
