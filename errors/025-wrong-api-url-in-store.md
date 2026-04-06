# Error #025: Wrong API URL in Frontend Store
**Date:** 2026-04-05
**Project:** Bresco Platform

## What Happened
Pinia sequences store called `/api/sequences/pending` and `/api/sequences/batch-approve` but the API mounts these at `/api/sequences/scheduled/pending` and `/api/sequences/scheduled/batch-approve`. Would 404 at runtime.

## The Triggering Prompt
```
Execute plan 03-06 (frontend, gsd-executor subagent)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Frontend agent inferred API routes from the plan description instead of reading `apps/api/src/app.ts` to see the actual route mounting structure. The scheduled routes mount under `/api/sequences/scheduled/*`, not directly under `/api/sequences/*`.
**Surface symptom:** Code review caught the URL mismatch.

## What The Prompt Should Have Been
```
Before writing store API calls, read app.ts to find the exact route prefix for each route module, then construct URLs accordingly.
```

## Prevention
1. Frontend executor prompt: "Read app.ts route mounting before writing API URLs in stores"
2. Integration tests would catch this when hitting a live server

## Pattern Check
- **Seen before?** No — first URL mismatch error
- **Added to toolkit?** Fixed in code review phase
