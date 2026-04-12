# Error #030: Auth Threshold Desync Across Files
**Date:** 2026-04-12
**Project:** Eleanor v2

## What Happened
Auth middleware checked `count < 2` for redirect-to-setup, but setup.vue checked `count >= 1` for redirect-to-home. With 1 credential, this created an infinite redirect loop (blank page).

## The Triggering Prompt
```
Setup wizard temporarily lowered to 1 credential for local dev
```

## What Went Wrong
**Category:** Context Error
**Root cause:** The credential threshold was lowered in setup.vue during a previous session but the auth middleware threshold was not updated to match.
**Surface symptom:** Blank page, redirect loop between / and /setup.

## What The Prompt Should Have Been
```
When changing the credential threshold, update ALL files that check credential count: auth.global.ts and setup.vue. Search for the old value across the codebase.
```

## Prevention
1. When changing a threshold/constant, grep the entire codebase for the old value
2. Magic strings/numbers used in multiple files should be extracted to a shared constant

## Pattern Check
- **Seen before?** No
- **Added to toolkit?** Yes, lesson added to tasks/lessons.md
