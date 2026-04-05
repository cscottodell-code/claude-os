---
name: scott-research
description: |
  Multi-lens research skill that dispatches 10 parallel subagents to investigate a topic
  from different angles (Historical, Academic, Book, Current Application, Social, Technical,
  Risk, Contrarian, Economic, Adjacent), then synthesizes findings into a single RESEARCH.md
  with 5-dimension analysis (strongly supported, congruencies, discrepancies, unique ideas,
  weakly supported). Includes anti-hallucination guardrails, source verification, and an
  optional Decision-Ready Brief for downstream tools.

  Use this skill whenever Scott says "research X", "investigate X", "look into X", "what do
  we know about X", "dig into X", "explore X from all angles", or any variation of wanting
  structured research before making a decision or starting a project. Also use when Scott
  asks to prepare research for a Council deliberation, NotebookLM deep dive, or GSD phase.
  Even for seemingly simple research requests, this skill adds rigor that ad-hoc searching
  cannot match.
user_invocable: true
invocation_hint: /scott:research <topic> [--notebooklm] [--council <triad>] - Research a topic from 10 angles with source verification
input_examples:
  - "/scott:research how market research applies to product development"
  - "/scott:research SurrealDB v3 migration strategies"
  - "/scott:research membership pricing models for home services --notebooklm"
  - "/scott:research background operations methodology --council strategy"
section: tools
---

# Multi-Lens Research

Investigate any topic from 10 parallel angles, verify sources, and synthesize findings
into a structured document with cross-lens analysis.

## The 10 Lenses

| # | Lens | What It Hunts For |
|---|------|-------------------|
| 1 | Historical | Origin stories, early thinking, how the idea evolved over time |
| 2 | Academic | Formal research, papers, studies, peer-reviewed findings |
| 3 | Book | Published long-form expert thinking, key frameworks from authors |
| 4 | Current Application | Real-world implementations today, who's doing it, how it works |
| 5 | Social | What people are saying online right now, sentiment, emerging trends |
| 6 | Technical | Feasibility, tools, architecture options, stack compatibility |
| 7 | Risk | What could go wrong, what's failed before, known pitfalls |
| 8 | Contrarian | Why this might be a bad idea, criticism, strongest counterarguments |
| 9 | Economic | Numbers: market size, costs, pricing, adoption curves, ROI data |
| 10 | Adjacent | Analogous solutions from completely different fields or industries |

## Phase 1: Understand the Topic [STOP]

Ask Scott:

1. **What to research**: "What topic do you want investigated?"
2. **Decision anchor** (optional): "What decision or action will this research inform?"
3. **Scope check**: If too broad, decompose. If very narrow, suggest skipping thin lenses.
4. **Output location**: Default `~/Sites/Global/research/RESEARCH-<topic-slug>-<date>.md`
5. **Lens selection**: All 10 by default. Scott can exclude any that don't fit.

### Done when
Scott confirms the topic, scope, and lens selection.

## Phases 2-4: Orchestration

Read `references/orchestration.md` for the full dispatch, verification, synthesis, and
presentation protocol. It contains:

- Phase 2: Dispatch (subagent prompts, lens-specific search instructions)
- Phase 2.25: Assess & Reallocate (weak lens handling)
- Phase 2.5: Verify Sources (fact-checking protocol)
- Phase 3: Synthesize (cross-lens analysis, RESEARCH.md structure)
- Phase 4: Present to Scott

## Edge Cases

**Topic too broad**: Decompose in Phase 1. "AI" becomes "AI-assisted code review tools
for small development teams."

**Topic too narrow**: Warn that some lenses will return thin results. Suggest skipping
lenses that clearly don't apply.

**All lenses return weak**: Valuable information. Report honestly and suggest narrowing
scope or accepting this is frontier territory.

**Academic lens struggles**: Expected for practical topics. Reports Low confidence and
budget gets reallocated to stronger lenses.

**Contrarian lens finds nothing negative**: Construct best devil's advocate case from
limitations, even if no published criticism exists.
