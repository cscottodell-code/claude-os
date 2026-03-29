---
name: scott:compare-sources
description: |
  Compare context engineering sources against the current toolkit configuration.
  Walks through 6 phases: Ingest & Refresh Raw Sources, Revise Sources, Build Comparison
  Inventory, Run Comparison Analysis (subagent), Generate Review & Act, and Archive Processed Sources.
user_invocable: true
invocation_hint: /scott:compare-sources - Compare new sources against your toolkit and surface what's actionable
---

# Compare Sources

**Phases:** 1. Ingest & Refresh Raw Sources [AUTO] → 2. Revise Sources [STOP] → 3. Build Comparison Inventory [AUTO] → 4. Run Comparison Analysis [DELEGATE] → 5. Generate Review & Act [STOP] → 6. Archive Processed Sources [AUTO]

Read the full workflow file: `/Users/scott/Sites/Global/scott-toolkit/workflows/compare-sources.md`
and follow it phase by phase, exactly as written.

Also read the current project's CLAUDE.md and tasks/lessons.md for context.
