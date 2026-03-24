# Degradation Stress Tests

Test fixtures that simulate degraded conditions to verify the 4 degradation tiers
work as designed. Each scenario defines the expected tier.

## How to use

These are documentation-driven tests. The actual degradation behavior lives in
`stack-preflight.sh`. These fixtures describe the expected behavior under each
failure scenario so it can be verified manually or by a future test runner.

## Scenarios

### context7-unavailable
**Simulates:** Context7 MCP server is down or rate-limited.
**Expected tier:** Reduced (CLI + single agent, no parallel dispatch or Context7 queries)
**Expected announcement:** "Stack audit running in REDUCED mode (Context7 unavailable)."
**What still works:** Static grep checks, single-agent live audit (without doc comparison)
**What's lost:** Version-aware doc queries, doc compliance agents

### mcp-timeout
**Simulates:** MCP server responds but audit agent times out (>120s).
**Expected tier:** Dynamic degradation from Full to Reduced for remainder of audit.
**Expected announcement:** "Audit agent timed out for [tech] live check. Degraded to Reduced mode."
**What still works:** Static checks, already-completed agent results
**What's lost:** The timed-out agent's results (closeout audit will retry)

### surrealdb-down
**Simulates:** SurrealDB server is not running or unreachable.
**Expected tier:** Reduced for DB checks (static checks still run), Full for non-DB checks.
**Expected announcement:** "SurrealDB server not reachable. Live DB audit skipped."
**What still works:** All static checks, non-DB agent checks
**What's lost:** Schema apply, seed, live query testing

### all-external-down
**Simulates:** No MCP, no Context7, no SurrealDB, no external services.
**Expected tier:** Minimal (CLI static checks only)
**Expected announcement:** "Stack audit running in MINIMAL mode. CLI static checks only."
**What still works:** grep-based static pattern matching
**What's lost:** All agent-based checks, live audit, doc comparison
