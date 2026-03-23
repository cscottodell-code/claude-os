# Error #004: Audit Agent Scoping Failures (Context Limits + Blind Spots)

**Date:** 2026-03-22
**Project:** Bresco (Pass 3 audit)

## What Happened
Four audit agents were dispatched in parallel. Two hit "Prompt is too long" and returned zero useful output, wasting tokens and time. The schema auditor that DID complete missed a critical bug: `pulse.surql` depends on `sequences.surql` but was loaded after it, causing `applySchemas()` to fail silently. The audit also missed that the test helper only loaded 4 of 11 schemas. Both issues were discovered later during integration test debugging, not during the dedicated audit.

## The Triggering Prompt
```
You are performing a THIRD-PASS SurrealDB schema audit...
For EACH SCHEMAFULL table defined, extract the complete list of DEFINE FIELD statements...
[800+ words of detailed instructions]
```

## What Went Wrong
**Category:** Prompt Error
**Root cause:** Three failures compounded:
1. **Overloaded agent prompts** caused 2 of 4 agents to exceed context before doing any work. Instructions were comprehensive but too long for the agent's available context after loading the codebase.
2. **Audit scope excluded test files** so `tests/helpers/db.ts` (which only loaded 4 schemas) was never checked against the 11 schemas in the codebase.
3. **No cross-file dependency check** in the audit prompt. Asked about field alignment, indexes, computed tables, and injection. Never asked "do these schema files have load-order dependencies?"
**Surface symptom:** Schema audit returned "all OK" for things that were broken. Integration tests failed with "table does not exist" errors that should have been caught by the audit.

## What The Prompt Should Have Been
```
Schema audit — keep prompts under 400 words. Process 3-4 schemas per agent, not all 11.

Additional checks to include:
- "Check schema files for cross-file dependencies (computed tables, record links). Report required load order."
- "Check test helpers that load schemas — do they load ALL schema files? In the correct order?"
- "Check applySchemas() — does it have error handling? Does it load schemas in dependency order?"
```

## Prevention
1. Keep subagent prompts under 400 words. Split large audits into 3-4 focused agents, not 1-2 overloaded ones.
2. Every audit must include test files in scope, not just production code. Test helpers are infrastructure.
3. Schema audits must check load order dependencies, not just field alignment.
4. When an agent returns "Prompt is too long," immediately re-dispatch with a narrower scope rather than hoping the next attempt works.

## Pattern Check
- **Seen before?** Yes. RETRO.md lesson #2: "first-pass review agents weren't given deep enough instructions." This is the inverse problem: instructions were too detailed (overloaded) but still had blind spots (no dependency check, no test files).
- **Added to toolkit?** No. Need to add "schema load order" and "test helper coverage" to the code reviewer checklist in superpowers.
