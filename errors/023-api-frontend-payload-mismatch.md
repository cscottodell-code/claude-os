# Error #023: API/Frontend Payload Field Name Mismatch
**Date:** 2026-04-05
**Project:** Bresco Platform

## What Happened
ChatApprovalCard.vue read `rendered_body` and `send_id` from payload, but the API (sms-sender.ts) sends `message_preview` and `scheduled_send_id`. Would have rendered empty approval cards at runtime.

## The Triggering Prompt
```
Execute plan 03-06 (frontend chat cards, gsd-executor subagent)
```

## What Went Wrong
**Category:** Context Error
**Root cause:** The frontend agent built components from the UI-SPEC without cross-referencing the actual API payload structure from earlier waves. The UI-SPEC described fields conceptually but didn't specify exact payload key names.
**Surface symptom:** Code review caught the mismatch.

## What The Prompt Should Have Been
```
Before building Vue components that read message.payload, grep the API code for the CREATE message statement that produces this message type and use the exact field names from the payload object.
```

## Prevention
1. UI-SPEC should include exact payload field names (not just conceptual descriptions)
2. Frontend executor prompt: "Read the API route that creates this message type and match field names exactly"

## Pattern Check
- **Seen before?** No — first frontend/backend contract mismatch
- **Added to toolkit?** Fixed in code review phase
