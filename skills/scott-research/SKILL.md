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
---

# Multi-Lens Research

Investigate any topic from 10 parallel angles, verify sources, and synthesize findings
into a structured document with cross-lens analysis.

Inspired by the Council of High Intelligence pattern (structured multi-perspective
analysis), applied to research rather than decision-making.

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

---

## Phase 1: Understand the Topic [STOP]

Ask Scott:

1. **What to research**: "What topic do you want investigated?"
2. **Decision anchor** (optional): "What decision or action will this research inform?"
   This sharpens every lens's search queries. If Scott just wants to explore, that's fine too.
3. **Scope check**: Assess the topic's breadth.
   - If too broad (e.g., "AI"), decompose it and ask Scott to pick a narrower angle.
   - If very narrow, suggest which lenses might return thin results and offer to skip them.
4. **Output location**: Default is `~/Sites/Global/research/RESEARCH-<topic-slug>-<date>.md`.
   Ask if Scott wants it saved elsewhere.
5. **Lens selection**: All 10 run by default. Scott can exclude any that don't fit the topic.

### Done when
Scott confirms the topic, scope, and lens selection.

---

## Phase 2: Dispatch Research Lenses [AUTO]

Spawn up to 10 parallel subagents, one per selected lens. Each subagent is read-only
(WebSearch, WebFetch, Read, Grep, Glob only. No Write, Edit, or Bash).

### Subagent Prompt

Each lens agent receives this prompt (with lens-specific values filled in):

```
You are a research agent investigating a topic through a specific analytical lens.

Topic: [TOPIC]
Context: [SCOTT'S DESCRIPTION AND DECISION ANCHOR IF PROVIDED]
Your lens: [LENS NAME]
Your mission: [LENS-SPECIFIC SEARCH INSTRUCTION]

## Source Integrity Rules

These rules exist because web research subagents commonly fabricate URLs, misquote
sources, and pad thin findings with speculation. Following these rules produces
honest research. Violating them produces garbage.

1. EVERY claim must include a [Source](URL). A finding without a URL is not a finding.
   Delete any claim you cannot source.

2. Do NOT cite a URL you haven't WebFetched. Search result snippets are often
   misleading or outdated. Fetch the actual page. Read the actual content. Then
   decide whether to cite it.

3. For your top 3 findings, include a DIRECT QUOTE from the source in quotation
   marks, with one sentence of context before and after the quote. This proves you
   read the content and prevents cherry-picking.

4. Every source must include its publication date (or "undated" if not findable).

5. If you find fewer than 3 credible sources, report LOW confidence. Do NOT pad
   findings with speculation to appear thorough. "I found very little on this
   angle" is an honest and valuable result.

## Search Strategy

1. Run 2-3 web searches with different query angles
2. For each promising result, WebFetch the full page content
3. Read the actual content before deciding whether to cite it
4. Cross-reference findings across sources
5. If initial searches return thin results, try 2 alternative query
   formulations before reporting gaps

## Output Format

Return your findings in exactly this structure:

### [Lens Name] Lens

#### Key Findings
- [Finding 1] — [Source Title](URL) ([date])
  > "[sentence before quote.] Direct quote from source. [sentence after quote.]"
- [Finding 2] — [Source Title](URL) ([date])
  > "Direct quote from source with context"
- [Finding 3+] — [Source Title](URL) ([date])

#### Sources Consulted
| # | Source | URL | Date | What It Contributed |
|---|--------|-----|------|---------------------|
| 1 | [Title] | [URL] | [date] | [one-line summary] |

#### Confidence Level
[High/Medium/Low]
- High = 4+ credible sources, findings cross-referenced
- Medium = 2-3 sources, some claims single-sourced
- Low = 0-1 sources, mostly inference or thin evidence

#### Gaps
[What you couldn't find, what remains unclear, what needs deeper research]

#### Search Queries Used
- [query 1]
- [query 2]
- [query 3]

Word limit: 400-800 words. Be concrete. Cite everything.
```

### Lens-Specific Search Instructions

Use these as the `[LENS-SPECIFIC SEARCH INSTRUCTION]` in the prompt above:

**Historical**: "Find the origin story. When did this idea first appear? Who were the
early thinkers? How has it evolved? Search for 'history of [topic]', 'origin of [topic]',
'[topic] first proposed', '[topic] evolution timeline'."

**Academic**: "Find formal research. Search for '[topic] \"et al\" filetype:pdf',
'[topic] site:arxiv.org', '[topic] systematic review', '[topic] research paper 2024 2025 2026'.
Also try '[topic] site:scholar.google.com'. Focus on abstracts and conclusions. Academic pages
are hard to fetch, so extract what you can from search snippets plus any fetchable HTML papers
or PDFs."

**Book**: "Find published books on this topic. Search for 'best books about [topic]
site:goodreads.com', '[topic] book recommendation', '[topic] book review'. Extract key
frameworks and arguments from reviews, summaries, and descriptions. Look for author interviews
that summarize the book's thesis."

**Current Application**: "Find who is implementing this right now. Search for '[topic]
implementation', '[topic] case study 2025 2026', 'companies using [topic]'. Focus on concrete
examples with specifics, not theory."

**Social**: "Find what people are saying online today. Search Twitter/X, Reddit, Hacker News,
dev communities. Look for '[topic] site:reddit.com', '[topic] site:news.ycombinator.com'.
For X/Twitter, use the fxtwitter API: fetch https://api.fxtwitter.com/[handle]/status/[id]
for specific tweets found in search. Capture sentiment and recurring themes."

**Technical**: "Assess feasibility and technical landscape. What tools exist? What are the
architecture patterns? Search for '[topic] tutorial', '[topic] architecture', '[topic] tools'.
If relevant to Scott's stack (Nuxt 4, SurrealDB v3, TypeScript, Hetzner/Coolify), note
compatibility or conflicts."

**Risk**: "Find what could go wrong. Search for '[topic] failure', '[topic] problems',
'[topic] criticism', '[topic] postmortem'. What are the known pitfalls and failure modes?
What has been tried and failed?"

**Contrarian**: "Actively argue against this. Search for 'why [topic] is bad', '[topic]
overrated', 'against [topic]', '[topic] criticism'. Find the strongest counterarguments.
If you can't find published criticism, construct the best devil's advocate case from what
you learn about the topic's limitations. This lens exists to prevent confirmation bias."

**Economic**: "Find the numbers. Search for '[topic] market size', '[topic] cost', '[topic]
pricing', '[topic] ROI', '[topic] adoption rate'. Look for statistics, benchmarks, financial
data, and growth curves. Prefer primary data sources over blog summaries."

**Adjacent**: "Find analogous solutions from completely different fields. If the topic is
about home services, search healthcare, logistics, or real estate for similar patterns.
Search for 'similar to [topic] in [other field]', '[core concept] in [different industry]'.
The best insights often come from fields that solved a similar problem in a different context."

---

## Phase 2.25: Assess & Reallocate [AUTO]

After all 10 lens agents return, classify each result:

| Rating | Criteria | Action |
|--------|----------|--------|
| Strong | 4+ sources, High confidence | Keep as-is |
| Moderate | 2-3 sources, Medium confidence | Keep, note in synthesis |
| Weak | 0-1 sources, Low confidence | Admit thin results, reallocate budget |

For each **weak** lens: mark it honestly ("This lens found limited results on this topic").

**Reallocation**: Dispatch 1-2 follow-up subagents to the strongest lenses. These agents:
- Receive the original lens output as context (so they don't repeat the same searches)
- Go deeper: different query angles, longer-tail searches, follow secondary links from
  already-found sources
- Turn a strong lens into a comprehensive one with the research budget the weak lens
  didn't need

Maximum 2 follow-up agents. Skip reallocation entirely if all lenses returned Moderate or better.

---

## Phase 2.5: Verify Sources [AUTO]

Spawn a single **verification subagent** (completely separate from the 10 lens agents).
This agent audits source integrity the way a fact-checker works at a newspaper.

Process:
1. Randomly select 2 cited URLs from each lens (up to 20 URLs total)
2. WebFetch each URL
3. For each, confirm:
   - (a) The URL resolves (not 404)
   - (b) The direct quote cited by the lens agent actually appears on the page
4. Mark each source as VERIFIED, UNVERIFIED (quote not found), or 404 (page gone)
5. If a lens has more than half its sources unverified, downgrade its confidence to Low

Flagged sources are marked in the final output, not silently removed. Scott sees which
claims held up and which didn't.

---

## Phase 3: Synthesize [AUTO]

This is the analytical heart of the skill. Read all 10 lens outputs and the verification
report, then build the unified RESEARCH.md.

### Step 1: Cross-Lens Analysis

Categorize all findings across the 5 analytical dimensions:

| Dimension | How to Identify |
|-----------|-----------------|
| **Strongly Supported** | 4+ lenses found it independently, multiple sources per lens |
| **Congruencies** | 2-3 lenses align, but using different sources (not the same URL) |
| **Discrepancies** | Lenses actively contradict each other (state the tension explicitly) |
| **Unique Ideas** | Only 1 lens found it (flag as potential breakthrough or outlier) |
| **Weakly Supported** | 1-2 lenses, thin sources, Low confidence |

### Step 2: Circular Source Detection

Check whether "independent" findings actually trace to the same root:
- Same domain cited by multiple lenses = flag as single source, not confirmation
- Same author cited across lenses = flag as single voice
- Same statistic appearing everywhere = trace it to the original study
- Downgrade from "congruency" to "single-sourced, widely repeated" if detected

### Step 3: Write RESEARCH.md

Use this exact structure:

```markdown
# Research: [Topic]

*Generated [date] via 10-lens research skill*
*Decision anchor: [the decision/action this informs, if provided]*

## Research Summary

### Strongly Supported
[Findings backed by 4+ lenses with multiple independent sources]

### Congruencies
[Findings where 2-3 lenses independently align]

### Discrepancies
[Where lenses contradict each other, with the tension stated]

### Unique Ideas
[Single-lens findings that could be breakthroughs or outliers]

### Weakly Supported
[Thin evidence, flagged honestly]

---

## Historical Lens
[Lens agent output, lightly edited for consistency]

## Academic Lens
[...]

## Book Lens
[...]

## Current Application Lens
[...]

## Social Lens
[...]

## Technical Lens
[...]

## Risk Lens
[...]

## Contrarian Lens
[...]

## Economic Lens
[...]

## Adjacent Lens
[...]

---

## Decision-Ready Brief

*Include this section if a decision anchor was provided in Phase 1.
Omit if this was exploratory research with no specific decision.*

**Topic:** [topic]
**Research quality:** [X] lenses ran, [Y] strongly supported findings, [Z] discrepancies found
**The core tension:** [the main unresolved disagreement between lenses]
**What's clear:** [strongly supported findings, safe to act on]
**What's uncertain:** [weakly supported or contradicted findings]
**Suggested decision question:** "[A concrete question for Council deliberation]"

---

## Connections

*Only include this section when genuine connections exist.
If no connection is real, omit entirely. Do not force it.*

### BOPs Application
[If research reveals a process that could be systematized as a Background Operation]

### Eternal Wisdom
[If Historical, Academic, or Book lenses surfaced timeless principles that have held
across eras, note them. These are safer to build on than temporal findings.]

### Temporal Wisdom
[If key findings are time-sensitive, trend-dependent, or specific to the current moment,
flag them. These may shift and should be re-evaluated periodically.]

### Eleanor Application
[If findings suggest a feature, data source, or design pattern relevant to Eleanor]

### Other Project Applications
[If findings connect to Advosy, Bresco, or other active work]

---

## Research Metadata

| Metric | Value |
|--------|-------|
| Date | [date] |
| Topic | [topic] |
| Lenses run | [list] |
| Lenses skipped | [list, if any] |
| Total sources cited | [N] |
| Total URLs fetched | [N] |
| Total search queries | [N] |
| Sources verified | [N of M checked] |
| Sources flagged | [N unverified or 404] |
| Per-lens confidence | [table: lens → High/Medium/Low] |
| Reallocation | [which lenses received extra budget, if any] |
| Sources older than 2 years | [N, flagged as potentially outdated] |
```

### Step 4: Connections Pass

Review all findings against Scott's personal frameworks and active projects:
- **BOPs**: Does the research reveal a repeatable process that could be systematized?
- **Eternal wisdom**: Do Historical/Academic/Book lenses show principles that held across decades or centuries?
- **Temporal wisdom**: Are key findings specific to the current moment and likely to change?
- **Eleanor**: Do findings suggest a feature, data source, or design pattern for the desktop app?
- **Other projects**: Do findings connect to Advosy, Bresco, or other active work?

If no genuine connections exist, omit the Connections section entirely.

---

## Phase 4: Present to Scott [STOP]

Show the **Research Summary** section (the 5 dimensions) as a conversational summary.

Highlight:
- The strongest findings (what you can act on with confidence)
- The biggest contradictions between lenses (where the real complexity lives)
- Notable gaps (what the research couldn't answer)
- Any flagged/unverified sources (where trust is lower)

Ask Scott:
1. "Want to dig deeper on any specific lens?"
2. "Want to feed this into a decision tool?" (future Council integration)
3. "Save as-is?"

---

## Edge Cases

**Topic too broad**: Decompose in Phase 1. "AI" becomes "AI-assisted code review tools
for small development teams."

**Topic too narrow**: Warn that some lenses will likely return thin results. Suggest
skipping lenses that clearly don't apply. A topic like "SurrealDB v3 DEFINE FIELD syntax"
probably doesn't need the Social or Adjacent lenses.

**All lenses return weak**: This is valuable information. It means the topic is under-researched
or poorly defined. Report it honestly and suggest Scott either narrow the scope or accept
that this is frontier territory with limited existing knowledge.

**Academic lens struggles**: Expected for many practical topics. Academic research moves
slowly and many topics won't have formal studies. The lens reports Low confidence and the
research budget gets reallocated to stronger lenses.

**Contrarian lens finds nothing negative**: Either the topic is genuinely uncontroversial
(rare) or the search terms need work. The Contrarian agent should construct its best
devil's advocate case from what it learned about limitations, even if no published criticism
exists.

