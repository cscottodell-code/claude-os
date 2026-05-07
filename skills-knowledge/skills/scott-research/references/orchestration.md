# Multi-Lens Research: Orchestration Reference

## Phase 1.5: Topic Anchoring [AUTO]

After Phase 1 confirms topic, type, scope, and lens selection, the orchestrator performs one consolidation step before dispatching lens subagents.

### Identify canonical URLs

Run 1-2 broad WebSearch queries on the topic and identify the obvious canonical sources that any thorough research would cite. Typical anchors:

- The project's official website or documentation
- The primary GitHub repository
- The announcement post or controversy thread that defines the topic
- A high-engagement community thread (HN, Reddit, forum) that documents the broader conversation

Aim for 3 to 5 anchors total. These are URLs the orchestrator believes any honest lens would touch on regardless of its specific angle. Do not pre-fetch these; just identify and list them.

### Include anchors in lens dispatch prompts

Each lens subagent prompt gains a new section:

```
## Topic anchors (orchestrator-identified canonical sources)

The orchestrator identified these canonical URLs for this topic. Consider them as starter sources, not requirements; cite only those relevant to your lens. Multiple lenses citing the same anchor URL will be flagged "single-sourced, widely repeated" by Phase 3 circular source detection, so do not over-rely on anchors.

- [Anchor 1 URL] [brief description]
- [Anchor 2 URL] [brief description]
[...]
```

### Why this exists

Convergence acceleration: lens agents identify load-bearing canonical sources faster, spending less search time on rediscovery. Side benefit: Phase 3 circular source detection has cleaner inputs because anchors are explicitly known.

This is not a fetch-cache layer. Each lens still fetches anchors it cites. True fetch deduplication would require an orchestrator-side cache, which is out of scope for this version.

### Done when

Orchestrator has 3 to 5 canonical URLs listed and ready to inject into lens dispatch prompts.

---

## Phase 2: Dispatch Research Lenses [AUTO]

Spawn up to 10 parallel subagents, one per selected lens.

**Tools allowed for each subagent:** WebSearch, WebFetch, Skill, Read, Grep, Glob, ToolSearch. No Bash, Write, Edit, or NotebookEdit. The Skill tool is the only path to defuddle and firecrawl; subagents cannot invoke shell commands directly.

**MANDATORY first tool call (before any file reads or web searches):** every subagent must call `ToolSearch({query: "select:Skill", max_results: 1})` as the literal first action of the run. This guarantees the Skill tool schema is loaded into the subagent's context. Reason: deferred tools (like Skill) are not auto-loaded; without this call, an agent that tries `Skill(defuddle)` may receive an InputValidationError and incorrectly conclude that defuddle is unavailable, falsely classifying URLs as unfetchable. This was observed during May 2026 testing when one subagent reported "defuddle requires Bash" while a parallel subagent successfully used `Skill(defuddle)` on the same kind of URL. Mandating the call eliminates the variance.

### Subagent Prompt

Each lens agent receives this prompt (with lens-specific values filled in):

```
You are a research agent investigating a topic through a specific analytical lens.

Topic: [TOPIC]
Topic type: [TIME-SENSITIVE | DURABLE-KNOWLEDGE | MIXED]
Context: [SCOTT'S DESCRIPTION AND DECISION ANCHOR IF PROVIDED]
Your lens: [LENS NAME]
Your mission: [LENS-SPECIFIC SEARCH INSTRUCTION]

## REQUIRED FIRST ACTION

Before any search or fetch, Read the source curation reference:
~/.claude/skills/scott-research/references/source-curation.md

That file defines:
- Universal tier definitions (T1, T2, T3, R) and weights
- Per-lens T1 examples and acceptable-domain matrix
- Recency cutoffs per lens, with topic-type relaxation
- The Twitter/X rule (T3 in non-Social lenses, with author-credential exception)
- The fetch failure protocol (fallback chain)
- Confidence math (weighted sum)

Every cited source MUST carry a tier label. Findings without tier labels will be rejected at synthesis.

## Source Integrity Rules

These rules exist because web research subagents commonly fabricate URLs, misquote sources, and pad thin findings with speculation. Following these rules produces honest research. Violating them produces garbage.

1. EVERY claim must include a [Source](URL) AND a tier label. A finding without both is not a finding. Delete any claim you cannot source-and-tier.

2. Do NOT cite a URL you have not actually fetched and read. Search-result snippets are often misleading or outdated. Use the fetch fallback chain (Search Strategy step 2 below) to obtain real content. If all fetch attempts fail, the URL is unfetchable; do not paraphrase the snippet.

3. For your top 3 findings, include a DIRECT QUOTE from the source in quotation marks, with one sentence of context before and after the quote. This proves you read the content and prevents cherry-picking.

4. Every source must include its publication date (or "undated" if not findable). If the date exceeds the lens recency cutoff in source-curation.md, mark the source as `[stale]` in the source table.

5. If you find fewer than 3 credible sources, report LOW confidence. Do NOT pad findings with speculation to appear thorough. "I found very little on this angle" is an honest and valuable result.

## Search Strategy

1. Run 2-3 web searches with different query angles.
2. For each promising result, fetch the full page content via the fallback chain. **You do NOT have Bash. Do NOT report "no Bash available" as a reason for fetch failure. The fallback chain uses the Skill tool, not Bash.** Exact invocation syntax:
   a. **WebFetch** the URL: `WebFetch({url: "<URL>", prompt: "<extraction prompt>"})`
   b. If WebFetch fails or returns truncated content, **invoke defuddle via Skill**: `Skill({skill: "defuddle", args: "<URL>"})`
   c. If defuddle fails, **invoke firecrawl via Skill**: `Skill({skill: "firecrawl:firecrawl", args: "scrape <URL>"})`
   d. For T1 or T2 candidates that all three fail on, attempt `https://web.archive.org/web/*/<original-url>` via WebFetch. Mark the source as `archived` in the Flags column if rescued.
   e. If all four attempts fail, mark the URL as unfetchable and exclude it. Do not paraphrase from search snippets.

   **Validation rule:** Before marking any URL unfetchable, your Fetch Failure Report must list every fallback you actually attempted, by name. "Defuddle rescues: 0 (no Bash available)" is a violation; it means you did not actually try defuddle. Listing fewer than 3 fallbacks attempted means the source is not yet unfetchable.
3. Read the actual content before deciding whether to cite it.
4. Tier the source per source-curation.md (use the per-lens T1/T2 examples and the acceptable-domain matrix).
5. Cross-reference findings across sources.
6. If initial searches return thin results, try 2 alternative query formulations before reporting gaps.

## Output Format

**Strict format rules. Violations cause findings to be rejected at synthesis.**

### Rule 0: No preamble (HIGHEST PRIORITY)

LLMs commonly want to write a thinking summary like "I have enough material now" or "Let me synthesize the report" before structured output. **Do not do this.** Your response must begin with the literal string `### [Lens Name] Lens` as the very first characters output. No "Now I'll write," no "I have sufficient sources," no acknowledgment of being ready, no recap of what you found. Begin output at `###`. Period.

This is the most-violated rule in production. The orchestrator treats any text before the first `###` as a critical instruction violation and may strip it or reject the lens output entirely.

### Rule 1: No closing commentary

Output ends after the Search Queries Used list. No "I hope this helps," no reflective note, no methodology summary.

### Rule 2: Tier labels are mechanical

Inline tier labels must be EXACTLY one of: `[T1]`, `[T2]`, `[T3]`, `[R]`. No qualifiers in brackets. `[T2 stale]`, `[T2, stale]`, `[T2 author-credential]` are all wrong.

All flags go in the Flags column of Sources Consulted, not inline. Valid flags: `stale`, `archived`, `undated`, `unverified`, `404`. Multiple flags are comma-separated.

### Rule 3: Source curation acknowledgment

First line after the lens header must be exactly:

`> Source curation read: T1=2.0, T2=1.0, T3=0.5, R=0; stale halves; verification fail = 0.25.`

### Rule 4: Confidence math is itemized and mechanical

Use the strict template in the output structure below. Fill in counts (use `0` for unused rows). Multiply by the per-row weight. Sum. Map to confidence per the §7 thresholds.

**Forbidden math-modification phrases.** Never write any of these or their variants:
- "downgraded one step because..."
- "conservatively..." / "conservative recount"
- "undated discount" / "undated halves"  (undated is NOT stale)
- "opposition framing rather than support"
- "thin individual evidence" as a downgrade reason
- Any sentence after `Confidence: [level]` that explains why you adjusted the number

The mapping from weighted sum to confidence is mechanical and final. The 8 weights in §7 are exhaustive. There are no judgment-call adjustments. If you feel the urge to add nuance, add it to the Gaps section, not the Confidence section.

### Rule 5: Skill attempts are required for unfetchable claims

Before marking any URL as `unfetchable`, you must log at least one Skill attempt in the Fetch Failure Report. Specifically:
- The Fetch Failure Report's "Defuddle rescues" or "Firecrawl rescues" lines must reflect ATTEMPTS, not just successes. If you tried and failed, count the attempt.
- A URL marked `unfetchable` with zero Skill attempts logged is reclassified as `untried` by the orchestrator, which fails the lens.

Example Skill invocations the agent should use:
- `Skill({skill: "defuddle", args: "https://reddit.com/r/ObsidianMD/..."})` returns markdown content.
- `Skill({skill: "firecrawl:firecrawl", args: "scrape https://forum.obsidian.md/t/..."})` returns scraped content.

If the Skill tool's schema is not loaded, call `ToolSearch({query: "select:Skill", max_results: 1})` first.

Return your findings in exactly this structure:

### [Lens Name] Lens

> Source curation read: T1=2.0, T2=1.0, T3=0.5, R=0; stale halves; verification fail = 0.25.

#### Key Findings
- [Finding 1] [T1] [Source Title](URL) ([date])
  > "[sentence before quote.] Direct quote from source. [sentence after quote.]"
- [Finding 2] [T2] [Source Title](URL) ([date])
  > "Direct quote from source with context"
- [Finding 3+] [T3] [Source Title](URL) ([date])

#### Sources Consulted
| # | Source | URL | Date | Tier | Flags | LB | What It Contributed |
|---|--------|-----|------|------|-------|-----|---------------------|
| 1 | [Title] | [URL] | [date] | T1 | (none, or comma-separated: stale, archived, undated, unverified, 404) | * | [one-line summary] |

**LB column ("Load-Bearing").** Mark with `*` any source that is the sole or primary basis for a Key Finding (typically your top 1-3 findings). Phase 2.5 verifier prioritizes Load-Bearing sources for verification. Other sources get random sampling for breadth. Aim for 1-3 LB sources per lens, not more.

#### Confidence Level

Use this exact itemized template. Fill counts (0 if none). Multiply each row. Sum. Map to confidence per §7. Stop after the `Confidence:` line.

```
Sources by weight class:
- T1 current: [N] x 2.0 = [N x 2.0]
- T1 stale:   [N] x 1.0 = [N x 1.0]
- T2 current: [N] x 1.0 = [N x 1.0]
- T2 stale:   [N] x 0.5 = [N x 0.5]
- T3 current: [N] x 0.5 = [N x 0.5]
- T3 stale:   [N] x 0.25 = [N x 0.25]
- Verification-failed (any tier): [N] x 0.25 = [N x 0.25]

Total weighted sum: [X.X]
Confidence: [High | Medium | Low]
```

Confidence thresholds (mechanical, no overrides):
- High = sum >= 4.0
- Medium = sum 2.0 to 3.9
- Low = sum < 2.0

Do not add commentary after `Confidence: [level]`. If you have nuance to share, add it to Gaps.

#### Fetch Failure Report
- Total URLs attempted: [N]
- WebFetch successes: [N]
- Defuddle rescues: [N]
- Firecrawl rescues: [N]
- Archive.org rescues: [N]
- Unfetchable: [N]

If unfetchable rate exceeds 40% of attempted URLs, append: "FETCH FAILURE THRESHOLD EXCEEDED, request retry."

#### Gaps
[What you couldn't find, what remains unclear, what needs deeper research]

#### Search Queries Used
- [query 1]
- [query 2]
- [query 3]

Word limit: 400-800 words. Be concrete. Cite everything. Tier everything.
```

### Lens-Specific Search Instructions

Use these as the `[LENS-SPECIFIC SEARCH INSTRUCTION]` in the prompt above:

**Historical**: "Find the origin story. When did this idea first appear? Who were the early thinkers? How has it evolved? Search for 'history of [topic]', 'origin of [topic]', '[topic] first proposed', '[topic] evolution timeline'."

**Academic**: "Find formal research. Search for '[topic] \"et al\" filetype:pdf', '[topic] site:arxiv.org', '[topic] systematic review', '[topic] research paper 2024 2025 2026'. Also try '[topic] site:scholar.google.com'. Focus on abstracts and conclusions."

**Book**: "Find published books on this topic. Search for 'best books about [topic] site:goodreads.com', '[topic] book recommendation', '[topic] book review'. Extract key frameworks and arguments from reviews, summaries, and descriptions."

**Current Application**: "Find who is implementing this right now. Search for '[topic] implementation', '[topic] case study 2025 2026', 'companies using [topic]'. Focus on concrete examples with specifics, not theory."

**Social**: "Find what people are saying online today. Search Twitter/X, Reddit, Hacker News, dev communities. Look for '[topic] site:reddit.com', '[topic] site:news.ycombinator.com'. For X/Twitter, use the fxtwitter API: fetch https://api.fxtwitter.com/[handle]/status/[id] for specific tweets found in search. Capture sentiment and recurring themes."

**Technical**: "Assess feasibility and technical landscape. What tools exist? What are the architecture patterns? Search for '[topic] tutorial', '[topic] architecture', '[topic] tools'. If relevant to Scott's stack (Nuxt 4, SurrealDB v3, TypeScript, Hetzner/Coolify), note compatibility or conflicts."

**Risk**: "Find what could go wrong. Search for '[topic] failure', '[topic] problems', '[topic] criticism', '[topic] postmortem'. What are the known pitfalls and failure modes?"

**Contrarian**: "Actively argue against this. Search for 'why [topic] is bad', '[topic] overrated', 'against [topic]', '[topic] criticism'. Find the strongest counterarguments. If you can't find published criticism, construct the best devil's advocate case."

**Economic**: "Find the numbers. Search for '[topic] market size', '[topic] cost', '[topic] pricing', '[topic] ROI', '[topic] adoption rate'. Prefer primary data sources over blog summaries."

**Adjacent**: "Find analogous solutions from completely different fields. If the topic is about home services, search healthcare, logistics, or real estate for similar patterns. Search for 'similar to [topic] in [other field]'."

---

## Phase 2.1: Triage Fetch Failures [AUTO]

Inspect each lens output for the Fetch Failure Report and the optional "FETCH FAILURE THRESHOLD EXCEEDED" marker.

For each lens flagged at >40% unfetchable:

1. **Auto-retry pass.** Dispatch one follow-up subagent to that lens with this added instruction: "Your prior pass had >40% unfetchable URLs. Seek different domains, prioritize primary publishers (T1 per source-curation.md), and re-run the full fallback chain on each. Return the same output format."
2. **Abort if still failing.** If the retry pass also returns >40% unfetchable, mark the lens as ABORTED. Add to synthesis metadata: "Lens [name] excluded due to fetch failure rate above threshold." Do not include partial findings from the aborted lens in synthesis.

Lenses passing the threshold proceed to Phase 2.25 unchanged.

---

## Phase 2.25: Assess & Reallocate [AUTO]

After fetch triage, classify each surviving lens:

| Rating | Criteria | Action |
|--------|----------|--------|
| Strong | Weighted sum >= 4.0, High confidence | Keep as-is |
| Moderate | Weighted sum 2.0 to 3.9, Medium confidence | Keep, note in synthesis |
| Weak | Weighted sum < 2.0, Low confidence | Admit thin results, consider reallocation |

For each **weak** lens: mark it honestly ("This lens found limited results on this topic").

**Reallocation**: Dispatch 1-2 follow-up subagents to the strongest lenses. These agents:
- Receive the original lens output as context (so they don't repeat the same searches)
- Go deeper: different query angles, longer-tail searches, follow secondary links
- Turn a strong lens into a comprehensive one

Maximum 2 follow-up agents. Skip reallocation entirely if all surviving lenses returned Moderate or better.

---

## Phase 2.5: Verify Sources [AUTO]

Spawn a single **verification subagent** (completely separate from the lens agents). This agent audits source integrity the way a fact-checker works at a newspaper.

The verification agent must Read source-curation.md as its first action and apply the same fetch fallback chain as the lens agents.

Process:
1. Build the verification sample for each lens using priority order:
   a. **All Load-Bearing (`LB = *`) sources** are included automatically (typically 1-3 per lens). These are where false claims would do the most damage at synthesis time.
   b. **Stratification gap-fill**: if the LB set does not already contain a T1 source for the lens, add 1 random T1 from the remaining sources, EXCEPT for Social lens (where T1 sources are inherently transient tweets/HN/Reddit).
   c. **Breadth fill**: add 1 random non-LB source per lens for sample diversity.
   Cap total sample at 20 URLs across all lenses; if LB sources alone exceed 20, drop breadth-fill first, then gap-fill.
2. Fetch each URL via the fallback chain (WebFetch -> defuddle -> firecrawl -> archive.org).
3. For each, confirm:
   - (a) The URL resolves (not 404)
   - (b) The direct quote cited by the lens agent actually appears on the page
4. Mark each source as VERIFIED, UNVERIFIED (quote not found), or 404 (page gone).
5. **Verification failure = weight 0.25.** Any source marked UNVERIFIED or 404 contributes 0.25 to the lens's weighted sum, regardless of its original tier. The non-zero weight retains a small signal so a lens with several near-misses is not erased entirely, but the source is still demoted below T3.
6. After applying verification-failure penalties, recompute each lens's weighted sum and confidence.

Flagged sources are kept in the final output with their flag, not silently removed.

---

## Phase 3: Synthesize [AUTO]

### Phase 3 prologue: Strip preamble (mandatory)

Before processing any lens output, strip everything that appears before the first `###` header. Subagents commonly prepend thinking commentary like "Now I'll compose the report" or "I have enough material" despite explicit instructions. The orchestrator treats all pre-`###` content as discarded.

If a lens output contains genuinely informative content in its preamble (e.g., a Skill failure note that didn't make it into the Fetch Failure Report), the orchestrator may move that content into the Gaps section of the synthesized RESEARCH.md, but only after explicit review. Default behavior is silent strip.

Read all surviving lens outputs (post-strip) and the verification report, then build the unified RESEARCH.md.

### Step 1: Cross-Lens Analysis

Categorize all findings across the 5 analytical dimensions:

| Dimension | How to Identify |
|-----------|-----------------|
| **Strongly Supported** | 4+ lenses found it independently, multiple sources per lens, AND <50% of supporting sources are T3 (T3 cap rule), AND no numerical discrepancies (Numerical Discrepancy Rule) |
| **Congruencies** | 2-3 lenses align, but using different sources (not the same URL) |
| **Discrepancies** | Lenses actively contradict each other (state the tension explicitly) |
| **Unique Ideas** | Only 1 lens found it (flag as potential breakthrough or outlier) |
| **Weakly Supported** | 1-2 lenses, thin sources, Low confidence |

**T3 cap rule**: Any finding where >=50% of its supporting sources across all lenses are T3 cannot be classified as Strongly Supported. Cap such findings at Congruencies. This prevents 4 aggregator sources from creating false High confidence. Note the T3 cap application explicitly when it triggers.

**Numerical Discrepancy Rule**: When 2+ verified sources cite different numbers for the same fact (price, count, percentage, date, version, install base, or any quantitative claim), the finding goes to **Discrepancies**, not Strongly Supported, regardless of how many lenses cited it. The synthesis must add a "Resolution required before action" note next to the finding and include the conflicting numbers explicitly so the reader can see the spread.

Reasoning: an action plan cannot be built on uncertainty like "$10 to $30/mo" or "150k to 944k installs." Numerical disagreement signals that the underlying fact is unsettled, even if the surrounding qualitative claim is widely repeated. Examples that would trigger this rule:
- Pro tier price cited as $10/mo (one source), $20/mo (another), $30/mo (vendor page)
- Adoption stats cited as "60% unpaid" (one survey) vs. "73% unpaid" (different survey)
- Release dates cited as "Dec 9, 2025" (commit hash trace) vs. "December 2025" (vague)

The third example is borderline: same fact, different precision. Apply judgment. The rule fires when the numbers actually conflict, not when one is more precise than another.

When the rule fires, it does not prevent the underlying qualitative finding from being reported. It just routes the numerical claim to Discrepancies and forces explicit acknowledgment of the spread.

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
*Topic type: [TIME-SENSITIVE | DURABLE-KNOWLEDGE | MIXED]*
*Decision anchor: [the decision/action this informs, if provided]*

## TL;DR (5-minute read)

If you only read 5 bullets, read these. Each bullet is a one-line summary of a Strongly Supported finding. The full report follows for context, sourcing, and decision support.

- [One-line summary of F1, with concrete specifics]
- [One-line summary of F2]
- [One-line summary of F3]
- [One-line summary of F4]
- [One-line summary of F5]

If there are fewer than 5 Strongly Supported findings, list what you have and add 1-2 lines from the most consequential Discrepancies or Unique Ideas to fill the slot. Cap at 5 bullets total. The TL;DR is for re-skimming the report a month later, so make each line useful without context from the full body.

---

## Research Summary

### Strongly Supported
[Findings backed by 4+ lenses with multiple independent sources, <50% T3]
- [F1: Finding] (lenses: A, B, C, D | sources: 2xT1, 3xT2 | weighted sum: 7.0)

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
[Lens agent output, lightly edited for consistency. Source table includes Tier and Flags columns.]

## Academic Lens
[...]

[... remaining lenses ...]

---

## Decision-Ready Brief

*Include this section if a decision anchor was provided in Phase 1.
Omit if this was exploratory research with no specific decision.*

**Topic:** [topic]
**Research quality:** [X] lenses ran, [Y] strongly supported findings, [Z] discrepancies found, [W] lenses aborted
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

## Recommended Actions

*Generate 6-12 concrete next steps. Each card includes a ready-to-paste
prompt so Scott can start the work in a fresh session without rebuilding
context. See `references/recommended-actions.md` for the full catalog,
priority rules, and prompt-template starting points.*

[Action cards go here, one per concrete next step]

---

## Research Metadata

All counts in this table MUST be computed by summing rows in the lens-output Sources Consulted tables, not estimated. The synthesizer's job is to add the rows up; do not eyeball.

| Metric | Value | How to compute |
|--------|-------|---------------|
| Date | [date] | today's ISO 8601 date |
| Topic | [topic] | from Phase 1 |
| Topic type | [TIME-SENSITIVE / DURABLE-KNOWLEDGE / MIXED] | from Phase 1 |
| Lenses run | [list] | lens names whose output reached synthesis |
| Lenses skipped (Phase 1 exclusion) | [list, if any] | lenses dropped in Phase 1 |
| Lenses aborted (fetch threshold) | [list, if any] | lenses excluded by Phase 2.1 |
| Total sources cited | [N] | sum of rows in all lens Sources Consulted tables |
| Sources by tier | T1: [N], T2: [N], T3: [N], R: [N flagged, 0 cited] | count rows by Tier column |
| Stale sources flagged | [N] | rows where Flags column contains "stale" |
| Unfetchable sources excluded | [N] | rows where Flags column contains "unfetchable" or "404" |
| Fetch fallback rescues | defuddle: [N], firecrawl: [N], archive.org: [N] | sum across lens Fetch Failure Reports |
| Total URLs fetched | [N] | sum of "Total URLs attempted" across lens Fetch Failure Reports |
| Total search queries | [N] | sum of Search Queries Used lengths |
| Sources verified | [N of M checked] | from Phase 2.5 verification table |
| Sources flagged unverified or 404 | [N, with weight-0.25 penalty applied] | from Phase 2.5; verify count matches the verification table |
| Load-bearing sources verified | [N of LB-marked total] | from Phase 2.5; how many `LB = *` sources got checked |
| Per-lens confidence | [table: lens to High/Medium/Low with weighted sum] | from each lens's Confidence Level itemized total, post-verification adjustments |
| Reallocation | [which lenses received extra budget, if any] | from Phase 2.25 |
| Sources older than per-lens cutoff | [N, flagged stale] | same as Stale sources flagged; cross-check |
| T3 cap triggered | [list of findings capped, if any] | findings where >=50% T3 forced cap to Congruency |
| Numerical Discrepancy Rule triggered | [list of findings routed to Discrepancies, if any] | findings flagged by Phase 3 Step 1 Numerical Discrepancy Rule |

### Cross-checks the synthesizer must run before finalizing

- Total sources cited = sum of T1 + T2 + T3 cited rows. R-tier sources are flagged but not cited; they should not appear in tier counts.
- Stale sources flagged should match Sources older than per-lens cutoff (these are the same metric, named differently for legacy reasons).
- Per-lens confidence weighted sums should equal the sum of weights in each lens's Sources Consulted table (after verification adjustments). If they do not, recompute and fix the lens output before synthesis.

If any cross-check fails, the metadata table is wrong; fix it rather than ship inconsistent numbers.
```

### Step 3.5: Determine Final File Path

Apply the naming convention from `SKILL.md` Phase 1.4. Final path:

```
~/Scott/growth-os/raw/research/<scope>/RESEARCH-<topic-slug>-<date>.md
```

**Slug derivation** (turn the topic into `<topic-slug>`):
- Lowercase, kebab-case, alphanumerics and hyphens only.
- Strip articles (`the`, `a`, `an`) and filler words (`how`, `what`, `applies`, `to`, etc.) when they don't carry meaning.
- Strip currency symbols and punctuation. `$100M` -> `100m`.
- Max ~60 chars; truncate at a word boundary if longer.

Examples:
| Topic | Slug |
|-------|------|
| "How market research applies to product development" | `market-research-product-development` |
| "SurrealDB v3 migration strategies" | `surrealdb-v3-migration-strategies` |
| "$100M Leads, Offers, Models" | `100m-leads-offers-models` |
| "Membership pricing models for home services" | `membership-pricing-home-services` |

**Scope selection**:
- `global`: cross-cutting topics that don't belong to one business (default if unclear).
- `advosy`: sales, claims, pest control, home services context.
- `bresco`: fractional COO product, automation business.
- `personal`: Eleanor, Life OS, personal learning, methodologies.

**Date**: today's date in ISO 8601 (`YYYY-MM-DD`), captured at synthesis time, not at dispatch time.

**Enforcement**: if Scott proposed a non-conforming path in Phase 1, the skill should have already normalized or asked. Reaching this step with a non-conforming path is a bug. Stop and ask Scott rather than deviate silently.

### Step 4: Connections Pass

Review all findings against Scott's personal frameworks and active projects:
- **BOPs**: Does the research reveal a repeatable process that could be systematized?
- **Eternal wisdom**: Do Historical/Academic/Book lenses show principles that held across decades?
- **Temporal wisdom**: Are key findings specific to the current moment?
- **Eleanor**: Do findings suggest a feature or design pattern for the desktop app?
- **Other projects**: Do findings connect to Advosy, Bresco, or other active work?

If no genuine connections exist, omit the Connections section entirely.

### Step 5: Recommended Actions Pass

The most important step in the synthesis. Without this, the report ends with findings and forces Scott to translate them into work himself. The action section closes the loop.

Read `references/recommended-actions.md` for the full method. Summary:

1. Generate 6-12 concrete next steps. Each must reference specific findings.
2. **Block actions sourced only from snippet-paraphrased or unfetchable findings.** An action's "Supports findings" list must reference at least one finding that is either Strongly Supported or backed by a verified T1 or T2 source. Actions sourced solely from Weakly Supported findings or T3-only clusters are not allowed.
3. Pick the right type per action: Build Training, Create Skill, Deep Dive, NotebookLM Prep, Build Process, Write Document, Test/Experiment, or Council Deliberation.
4. Assign priority: Do Now (high confidence + ready to execute), Queue (high confidence but has dependencies), or Explore (moderate confidence, needs testing).
5. Aim for a mix: 2-4 Do Now, 3-5 Queue, 2-3 Explore. If everything is Do Now the action set is unrealistic; if everything is Explore the research did not produce enough actionable findings.
6. For each action, write a complete ready-to-paste prompt in a fenced code block. The prompt must reference the RESEARCH.md filename so the next session can locate it.

The action card format (markdown):

````
### Action N: [Specific, descriptive title]

- **Type:** [type]
- **Priority:** [Do Now | Queue | Explore]
- **Supports findings:** F1 (label, tier evidence), F3 (label, tier evidence)
- **What:** [2-3 sentence description]

**Prompt to start:**

```
[Complete prompt that Claude can act on without follow-up questions.
Reference findings from this RESEARCH.md by filename.]
```
````

Note the four-backtick outer fence: required when the inner prompt is itself a triple-backtick code block.

If a finding does not naturally produce an action, that finding is informational rather than actionable. That is fine. Not every finding has to become work.

If no genuine connections exist, omit the Connections section entirely.

---

## Deepen Mode Orchestration [AUTO]

When invoked via `/scott:research --deepen <RESEARCH.md path> <finding-id>`, the orchestrator follows this divergent path instead of Phases 1-3.

### Phase D1: Read and confirm [STOP]

1. Read the RESEARCH.md at the provided path.
2. Locate the finding referenced by `<finding-id>` (e.g., F3, F7). The finding can be in any classification (Strongly Supported, Congruencies, Discrepancies, Unique Ideas, Weakly Supported); Gaps may exist on any.
3. Extract:
   - The finding statement (one or two sentences)
   - The supporting sources cited for it (URLs and tier labels)
   - Any per-lens Gaps subsection that touches the finding
4. Formulate 1 to 3 sub-questions from the Gaps. Each sub-question must be answerable by lens research, not by abstract reasoning.
5. Present to Scott:
   - Original finding statement
   - Original supporting sources (count + tier breakdown)
   - Gaps as identified
   - Proposed sub-questions
   - Proposed lens selection (typically 2-3 of the original lenses, picked for relevance to the sub-questions)
6. Wait for Scott to confirm or adjust.

If the finding has no Gaps subsection or Gaps are too broad to formulate sub-questions, abort: tell Scott "this finding does not have actionable Gaps; consider running a fresh `/scott:research` with a narrower topic instead."

### Phase D2: Targeted dispatch [AUTO]

Dispatch 2 to 3 lens subagents (per Scott's Phase D1 confirmation) with focused prompts:

- **Topic**: original topic + " (deepening F[N])"
- **Topic type**: inherited from original RESEARCH.md
- **Mission**: investigate the specific sub-questions; do not re-research the broader topic
- **Topic anchors**: the original RESEARCH.md path + the original finding's supporting URLs

Standard subagent rules apply: source-curation read first, fetch fallback chain, output format with TLB column. Tier definitions and weights are inherited from source-curation.md.

Word limit per lens: 300-500 words (tighter than standard, since the scope is narrower).

### Phase D3: Verify and synthesize [AUTO]

Phase 2.5 verification runs proportionally smaller: sample at least all Load-Bearing sources, plus 1 random per lens. With 2-3 lenses, this is typically 4-9 URLs.

Phase 3 synthesis produces a deepening report:

```markdown
# Research Deepening: [Finding statement] (originally F[N])

*Generated [date] via deepen mode of 10-lens research skill*
*Original RESEARCH.md: [path]*
*Finding deepened: F[N] from original*
*Sub-questions investigated: [list]*

## Original Finding (verbatim from RESEARCH.md)
[finding statement and original supporting sources]

## Gaps That Triggered This Deepening
[the specific Gaps text from the original]

## Sub-Questions
1. [sub-question 1]
2. [sub-question 2]
3. [sub-question 3, if applicable]

## TL;DR (3-minute read)
- [one-line summary per sub-question's resolution status]

## Sub-Question Findings

### Sub-Question 1: [restate]
[Lens findings synthesized; tier breakdown noted; resolution status: ANSWERED / PARTIALLY ANSWERED / STILL OPEN]

### Sub-Question 2: ...

## Resolution Status
- Sub-question 1: [ANSWERED | PARTIALLY ANSWERED | STILL OPEN] [one-line reason]
- Sub-question 2: ...

## Implications for the Original Finding
- Does the deepening confirm, refine, contradict, or expand the original F[N]?
- Should the original RESEARCH.md be updated? If so, what specifically?

## Lens Outputs (compressed, preamble stripped)
[Each lens's full output, post-strip]

---

## Deepen Metadata
| Metric | Value |
|---|---|
| Date | [date] |
| Original RESEARCH.md | [path] |
| Finding deepened | F[N] |
| Sub-questions | [count] |
| Lenses dispatched | [list] |
| Total sources cited | [N] |
| Sources by tier | T1: [N], T2: [N], T3: [N] |
| Verification: LB-only / breadth | [N / N] |
| Resolution: ANSWERED / PARTIAL / OPEN | [count split] |
```

### Output path

`~/Scott/growth-os/raw/research/<scope>/RESEARCH-<topic-slug>-DEEPEN-F[N]-<date>.md`

Same naming convention as standard research, with `DEEPEN-F[N]` inserted before the date so the file sorts adjacent to the original alphabetically.

### When the deepening should update the original

If the deepening's "Implications for the Original Finding" answer is "contradicts" or "significantly refines," propose an update to the original RESEARCH.md. Do not silently rewrite. Show the diff and let Scott decide.

If the deepening only confirms or expands, no update needed; the deepening file stands alone as supplementary research.
