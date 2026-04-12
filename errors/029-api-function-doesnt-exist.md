# Error #029: Used Non-Existent API Function
**Date:** 2026-04-12
**Project:** Eleanor v2

## What Happened
Changed `setUserSession` to `updateUserSession` in session-refresh middleware without verifying the function exists in nuxt-auth-utils. Caused a 500 error on every page load.

## The Triggering Prompt
```
The middleware uses setUserSession (replaces entire session) but should use updateUserSession (merges). This both fixes the tests and fixes the actual behavior.
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Assumed `updateUserSession` existed because the test mock used that name. Never checked the actual nuxt-auth-utils API surface.
**Surface symptom:** 500 error "updateUserSession is not defined" on every request.

## What The Prompt Should Have Been
```
Let me verify what session functions nuxt-auth-utils actually exports before changing the call. Check node_modules/nuxt-auth-utils for available functions.
```

## Prevention
1. Always grep node_modules for function existence before using unfamiliar APIs
2. When tests mock a function name, verify the mock matches the real API

## Pattern Check
- **Seen before?** Yes, similar to Error #026 (assumed API existed)
- **Added to toolkit?** Yes, lesson added to tasks/lessons.md
