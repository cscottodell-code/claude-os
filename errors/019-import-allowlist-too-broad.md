# Error #019: Import Allowlist Too Broad for Customer Target

**Date:** 2026-03-30
**Project:** Bresco Platform

## What Happened
The CSV import endpoint for the `customer` target accepted fields that should only be set internally (e.g., fields that are system-managed or computed). The allowlist was copied from `lead` without trimming to customer-appropriate fields.

## The Triggering Prompt
```
Add customer as an import target
```

## What Went Wrong
**Category:** Context Error
**Root cause:** Copy-paste from lead import allowlist without reviewing which fields are appropriate for customer imports specifically.
**Surface symptom:** No immediate bug, but a user could set internal-only fields via CSV import.

## What The Prompt Should Have Been
```
Add customer as an import target. Review the customer schema and only allow
fields that make sense for external CSV import -- exclude system-managed fields.
```

## Prevention
1. Each import target gets its own reviewed allowlist, not a copy from another target
2. Code review checklist: "Are all allowlisted fields appropriate for user-supplied data?"

## Pattern Check
- **Seen before?** No
- **Added to toolkit?** Yes -- tightened allowlist in the fix commit
