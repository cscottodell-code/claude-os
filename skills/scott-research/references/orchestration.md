# Multi-Lens Research — Orchestration Reference

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
Also try '[topic] site:scholar.google.com'. Focus on abstracts and conclusions."

**Book**: "Find published books on this topic. Search for 'best books about [topic]
site:goodreads.com', '[topic] book recommendation', '[topic] book review'. Extract key
frameworks and arguments from reviews, summaries, and descriptions."

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
'[topic] criticism', '[topic] postmortem'. What are the known pitfalls and failure modes?"

**Contrarian**: "Actively argue against this. Search for 'why [topic] is bad', '[topic]
overrated', 'against [topic]', '[topic] criticism'. Find the strongest counterarguments.
If you can't find published criticism, construct the best devil's advocate case."

**Economic**: "Find the numbers. Search for '[topic] market size', '[topic] cost', '[topic]
pricing', '[topic] ROI', '[topic] adoption rate'. Prefer primary data sources over blog summaries."

**Adjacent**: "Find analogous solutions from completely different fields. If the topic is
about home services, search healthcare, logistics, or real estate for similar patterns.
Search for 'similar to [topic] in [other field]'."

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
- Go deeper: different query angles, longer-tail searches, follow secondary links
- Turn a strong lens into a comprehensive one

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

Flagged sources are marked in the final output, not silently removed.

---

## Phase 3: Synthesize [AUTO]

Read all 10 lens outputs and the verification report, then build the unified RESEARCH.md.

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

[... remaining lenses ...]

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
[If Historical, Academic, or Book lenses surfaced timeless principles]

### Temporal Wisdom
[If key findings are time-sensitive or trend-dependent]

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
| Per-lens confidence | [table: lens to High/Medium/Low] |
| Reallocation | [which lenses received extra budget, if any] |
| Sources older than 2 years | [N, flagged as potentially outdated] |
```

### Step 4: Connections Pass

Review all findings against Scott's personal frameworks and active projects:
- **BOPs**: Does the research reveal a repeatable process that could be systematized?
- **Eternal wisdom**: Do Historical/Academic/Book lenses show principles that held across decades?
- **Temporal wisdom**: Are key findings specific to the current moment?
- **Eleanor**: Do findings suggest a feature or design pattern for the desktop app?
- **Other projects**: Do findings connect to Advosy, Bresco, or other active work?

If no genuine connections exist, omit the Connections section entirely.
