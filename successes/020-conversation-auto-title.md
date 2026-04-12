# Success #020: Minimal Code for Conversation Auto-Title
**Date:** 2026-04-12
**Project:** Eleanor v2

## What Worked
Added conversation auto-titling with 3 lines of SurrealQL using IF/THEN/ELSE in the existing UPDATE query. No new endpoints, no LLM calls, no additional DB queries. Just truncate the first user message to 50 chars and use it as the title.

## The Triggering Prompt
```
Chat name doesn't get renamed automatically. It remains New Conversation.
```

## Why It Worked
**Key factor:** SurrealQL's inline IF/THEN/ELSE in UPDATE statements avoided needing a separate query or API call.
**Contributing factors:** Keeping the solution simple (truncated first message) instead of over-engineering (LLM-generated summaries).

## Reproducible?
- **Can repeat?** Yes
- **Should become standard?** Yes. Prefer inline SurrealQL conditionals for simple business logic over separate queries.
