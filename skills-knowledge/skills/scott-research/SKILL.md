---
name: scott-research
description: |
  Multi-lens research skill that dispatches 10 parallel subagents to investigate a topic
  from different angles (Historical, Academic, Book, Current Application, Social, Technical,
  Risk, Contrarian, Economic, Adjacent), then synthesizes findings into a single RESEARCH.md
  with 5-dimension analysis (strongly supported, congruencies, discrepancies, unique ideas,
  weakly supported). Includes anti-hallucination guardrails, source verification, an
  optional Decision-Ready Brief, and a Recommended Actions section that turns each
  high-confidence finding into a concrete next step with a ready-to-paste prompt.

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
3. **Topic type classification**: Auto-infer from topic and decision anchor, then confirm with Scott. One of:
   - **TIME-SENSITIVE**: Current state, market data, recent trends, technology adoption, "what's happening now" questions. Recency cutoffs in `references/source-curation.md` apply as listed (hard cutoffs hold).
   - **DURABLE-KNOWLEDGE**: Principles, history, eternal frameworks, foundational theory. Recency cutoffs relax by 1.5x; lenses with no listed cutoff stay no-cutoff.
   - **MIXED** (default if unclear): Combination of both. Cutoffs apply as listed.

   Present the inferred type as a one-line confirmation: "This looks like a [TYPE] research. Confirm or override?" Topic type passes through to every lens subagent and modulates per-lens recency rules.
4. **Scope check**: If too broad, decompose. If very narrow, suggest skipping thin lenses.
5. **Output location** (convention, enforced, not default):
   ```
   ~/Scott/growth-os/raw/research/<scope>/RESEARCH-<topic-slug>-<date>.md
   ```
   - **`<scope>`**: `global` (default) | `advosy` | `bresco` | `personal`. Pick from the decision anchor or topic domain. When unsure, use `global`.
   - **`<topic-slug>`**: kebab-case, lowercase, alphanumerics and hyphens only. Strip articles (`the`, `a`, `an`) and filler. Max ~60 chars. Examples: `surrealdb-v3-migration`, `market-research-product-development`, `100m-leads-offers-models`.
   - **`<date>`**: ISO 8601 (`YYYY-MM-DD`), today's date when synthesizing.
   - The `RESEARCH-` prefix is required so directory listings sort by file type. Any deviation must be explicitly approved by Scott in Phase 1. Never deviate silently.
6. **Lens selection**: All 10 by default. Scott can exclude any that don't fit.

### Done when
Scott confirms the topic, topic type, scope, and lens selection.

## Phases 2-4: Orchestration

Read `references/orchestration.md` for the full dispatch, verification, synthesis, and
presentation protocol. It contains:

- Phase 2: Dispatch (subagent prompts, lens-specific search instructions)
- Phase 2.1: Triage Fetch Failures (auto-retry then abort)
- Phase 2.25: Assess & Reallocate (weak lens handling)
- Phase 2.5: Verify Sources (fact-checking protocol)
- Phase 3: Synthesize (cross-lens analysis, RESEARCH.md structure, Connections, Recommended Actions)
- Phase 4: Present to Scott

Source curation rules (which sources count, tier weights, recency rules, fetch fallback chain) live in `references/source-curation.md`. Every lens subagent and the verification subagent must Read that file as their first action. The orchestrator does not need to load it directly; it propagates through subagent prompts.

The Recommended Actions section is mandatory and uses a separate reference. Read
`references/recommended-actions.md` for the action-types catalog (Build Training,
Create Skill, Deep Dive, NotebookLM Prep, Build Process, Write Document,
Test/Experiment, Council Deliberation), the priority assignment rules
(Do Now, Queue, Explore), and the prompt-template starting points.

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

**Lens aborted due to fetch failures**: A lens with >40% unfetchable sources after one auto-retry pass is excluded from synthesis. Surface this in the Decision-Ready Brief and Research Metadata. If 3 or more lenses abort, stop synthesis and escalate to Scott; the research run is unreliable.
