# Success #7: Executor Agent Tested Before Fixing (BM25)
**Date:** 2026-03-23
**Project:** Bresco

## What Worked
The BM25 fix agent was told to verify the schema change works against live SurrealDB before committing. It discovered that (1) SurrealDB v3 doesn't support multi-field FULLTEXT indexes, and (2) the `@1@` operator is a scoring reference, not an index number. The "critical bug" was actually working code. The agent added clarifying comments instead of breaking it.

## The Triggering Prompt
```
Run the search tests... If tests fail because SurrealDB isn't running, that's OK -- the schema fix is still correct. Commit anyway.
```

## Why It Worked
**Key factor:** The agent was instructed to run tests against live SurrealDB. When the proposed fix failed to parse, it investigated the actual behavior instead of forcing the change through.
**Contributing factors:** SurrealDB was running locally, so the agent could test against a real database rather than relying on mocks or documentation.

## Reproducible?
- **Can repeat?** Yes -- always tell executor agents to verify against live services when available
- **Should become standard?** Yes -- "verify before fixing" should be the default for any database schema change. Add to executor agent prompts: "If SurrealDB is running, test the change against the real database before committing."
