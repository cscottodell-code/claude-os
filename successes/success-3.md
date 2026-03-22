# Success #3: Research-First Toolkit Overhaul with Parallel Subagents
**Date:** 2026-03-22
**Project:** scott-toolkit (global)

## What Worked
Single session completed three major changes: Cowork project setup (10 context files across 5 projects), full BMAD removal (20+ files, 3 repos, 42 deleted commands), and GSD+Superpowers integration model (7-step build loop propagated across all workflows, rules, templates, and instructions). Everything committed, pushed, and PDF regenerated.

## The Triggering Prompt
```
Research how GSD and Superpowers currently work together in Scott's scott-toolkit. Read these files thoroughly and report back on: 1. How GSD workflows reference Superpowers (or don't) 2. How Superpowers skills reference GSD (or don't) 3. Where there are gaps, overlaps, or conflicts 4. Where handoffs are smooth vs. awkward
```

## Why It Worked
**Key factor:** Research subagent with a structured diagnostic framework (gaps/overlaps/conflicts) before any edits. The subagent read 20+ files across both systems and produced a categorized analysis. Every subsequent edit was informed by this analysis, not ad-hoc.
**Contributing factors:**
- Parallel subagents for cross-repo edits (3 agents editing toolkit, Eleanor, and rules simultaneously)
- Existing CLAUDE.md files in each project gave rich context for Cowork setup
- The build loop concept (7-step sequence) created a concrete, memorable artifact to propagate everywhere
- Proactive toolkit usage section in CLAUDE.md ensures future sessions suggest next steps automatically

## Reproducible?
- **Can repeat?** Yes. "Research first, then fix" with structured diagnostic prompts.
- **Should become standard?** Yes. Two patterns to standardize:
  1. **Research-first for toolkit changes:** Always send a subagent to map all integration points before editing. Use a structured framework (gaps/overlaps/conflicts/handoffs) to organize findings.
  2. **Parallel subagents for cross-repo changes:** When changes span 3+ repos or 10+ files, dispatch parallel agents with clear scope boundaries rather than editing sequentially.
