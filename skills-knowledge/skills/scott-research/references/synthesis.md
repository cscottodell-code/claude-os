# Multi-Lens Research: Synthesis and Deepen Reference

This file covers Phase 3 synthesis and the alternative deepen-mode entry point. The orchestrator reads this when synthesizing lens outputs into the final RESEARCH.md, and when handling `--deepen` invocations.

**Scope:** Phase 3 (cross-lens analysis, RESEARCH.md template, recommended actions pass, output path), Deepen Mode Orchestration (D1-D3).

For dispatch and verification, see `dispatch.md`. For tier definitions and per-lens calibration, see `source-curation.md`. For action types and eligibility, see `recommended-actions.md`.

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

Apply the naming convention from `SKILL.md` Phase 1.5. Final path:

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

Standard subagent rules apply (see `dispatch.md`): source-curation read first, fetch fallback chain, output format with LB column. Tier definitions and weights are inherited from source-curation.md.

Word limit per lens: 300-500 words (tighter than standard, since the scope is narrower).

### Phase D3: Verify and synthesize [AUTO]

Phase 2.5 verification (in `dispatch.md`) runs proportionally smaller: sample at least all Load-Bearing sources, plus 1 random per lens. With 2-3 lenses, this is typically 4-9 URLs.

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
