# Multi-Lens Research: Dispatch and Verification Reference

This file covers everything that happens between Phase 1 (topic confirmation in SKILL.md) and Phase 3 (synthesis in synthesis.md). Lens subagents read this file plus source-curation.md as their REQUIRED FIRST ACTIONS. The orchestrator reads this when dispatching, triaging, and verifying.

**Scope:** Phase 1.5 (anchoring), Phase 2 (subagent dispatch + lens-specific instructions + subagent prompt + output format), Phase 2.1 (fetch failure triage), Phase 2.25 (assess and reallocate), Phase 2.5 (verification).

For synthesis (Phase 3 + Deepen Mode), see `synthesis.md`. For tier definitions and per-lens calibration, see `source-curation.md`. For action types and eligibility, see `recommended-actions.md`.

---

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

### Rule 3: Source curation comprehension block (3 lines)

The first three non-empty lines after the lens header MUST be a comprehension block proving you actually read source-curation.md (not just pattern-matched its existence).

Format:

```
> Source curation read:
> - Weights: T1=2.0, T2=1.0, T3=0.5, R=0; stale halves; verification fail = 0.25.
> - My lens (<LENS-NAME>) recency cutoff: <cutoff specific to this lens, from source-curation.md §6>
> - My lens T1 example pattern: <one of the listed T1 example types for this lens, from source-curation.md §3>
```

Concrete examples:

For Risk lens:
```
> Source curation read:
> - Weights: T1=2.0, T2=1.0, T3=0.5, R=0; stale halves; verification fail = 0.25.
> - My lens (Risk) recency cutoff: none for eternal pitfalls; <3 years for tool-specific failures.
> - My lens T1 example pattern: postmortems from named companies, CVE filings, GitHub issues with reproductions.
```

For Social lens:
```
> Source curation read:
> - Weights: T1=2.0, T2=1.0, T3=0.5, R=0; stale halves; verification fail = 0.25.
> - My lens (Social) recency cutoff: <6 months (hard).
> - My lens T1 example pattern: Twitter/X via fxtwitter, Hacker News threads with >50 comments, Reddit posts with >100 upvotes.
```

The lens-specific facts (recency cutoff, T1 example pattern) come from source-curation.md and DIFFER per lens. To produce them correctly, you must actually read source-curation.md and extract the right facts for YOUR specific lens. The dispatch prompt does not contain these per-lens specifics in any form you could echo without reading the reference file.

**Phrasing tolerance.** Validation accepts equivalent phrasings. "<6 months" and "less than 6 months" and "6 months" are all valid. "no cutoff" / "no recency limit" / "uncapped" are all valid. The cutoff must be ONE of the per-lens cutoff forms listed in source-curation.md §6 for your lens. The T1 example pattern must reference at least ONE of the per-lens T1 examples listed in source-curation.md §3 for your lens.

**Consequence of omission or mismatch (enforced at synthesis):** the orchestrator runs three sub-checks:
1. Weights line literal-string match (whitespace-tolerant)
2. Recency-cutoff line matches the lens's listed cutoff per source-curation.md §6
3. T1 example line references at least one listed T1 example for the lens per source-curation.md §3

ANY sub-check failure flags the entire lens output `[CURATION-UNREAD]`, caps it at Low confidence regardless of weighted sum, and excludes it from "4+ lenses" Strongly Supported counts and "2-3 lenses align" Congruency counts. All findings from a flagged lens are demoted to Weakly Supported and visibly banner-warned. This is mechanical, not negotiable. See `synthesis.md` Phase 3 prologue Pass 2 for the lookup table and exact validation rules.

### Rule 4: Confidence math is itemized and mechanical

Use the strict template in the output structure below. Fill in counts (use `0` for unused rows). Multiply by the per-row weight. Sum. Map to confidence per source-curation.md §7 thresholds.

**Forbidden math-modification phrases.** Never write any of these or their variants:
- "downgraded one step because..."
- "conservatively..." / "conservative recount"
- "undated discount" / "undated halves"  (undated is NOT stale)
- "opposition framing rather than support"
- "thin individual evidence" as a downgrade reason
- Any sentence after `Confidence: [level]` that explains why you adjusted the number

The mapping from weighted sum to confidence is mechanical and final. The 8 weights in source-curation.md §7 are exhaustive. There are no judgment-call adjustments. If you feel the urge to add nuance, add it to the Gaps section, not the Confidence section.

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

> Source curation read:
> - Weights: T1=2.0, T2=1.0, T3=0.5, R=0; stale halves; verification fail = 0.25.
> - My lens ([Lens Name]) recency cutoff: [cutoff from source-curation.md §6 for your lens]
> - My lens T1 example pattern: [one or more T1 example types from source-curation.md §3 for your lens]

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

Use this exact itemized template. Fill counts (0 if none). Multiply each row. Sum. Map to confidence per source-curation.md §7. Stop after the `Confidence:` line.

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

After Phase 2.5 completes, the orchestrator proceeds to Phase 3 synthesis. See `synthesis.md` for the synthesis protocol and the deepen-mode alternative entry point.
