# Error #016: JWT Secret/Algorithm Mismatch in Tests

**Date:** 2026-03-30
**Project:** Bresco Platform

## What Happened
Unit tests signed JWTs with HS256, but the Hono app middleware validates with HS512. Tests passed because the mock bypassed real JWT verification entirely. Any test asserting "authenticated request succeeds" was testing the mock, not the auth flow.

## The Triggering Prompt
```
Write tests for CRM pipeline routes
```

## What Went Wrong
**Category:** Harness Error
**Root cause:** Test helper created tokens with `jose` using HS256 algorithm and a short secret. The app uses HS512 with a longer secret. The mocked middleware never actually verified tokens.
**Surface symptom:** Tests passed. Auth bugs only appeared during integration testing against real SurrealDB + real JWT verification.

## What The Prompt Should Have Been
```
Write tests for CRM pipeline routes. The app uses HS512 for JWT --
verify the test token helper matches the algorithm and secret length
in app.ts before writing any route tests.
```

## Prevention
1. Test token helpers must read the algorithm from the same config the app uses
2. JWT_SECRET for tests must be long enough for HS512 (64+ bytes)
3. At least one integration test must round-trip a real signin/JWT/authenticated-request flow

## Pattern Check
- **Seen before?** No -- first JWT algorithm mismatch
- **Added to toolkit?** Yes -- lesson in tasks/lessons.md, also captured in STATE.md decisions
