# Multi-Lens Research: Labeling Rubric

Used by the verifier-Sonnet subagent to label every finding produced by lens agents during the calibration study and during Phase 2.5 verification in production runs. Scott's 20% spot-check (30% on the first calibration) uses the same rubric so we can measure inter-rater agreement.

This file is the source of truth for labeling. The verifier reads it as a required first action. Scott reads it before spot-checking.

## 1. Per-finding labels

Every finding receives exactly one of four labels. Each finding is first decomposed into atomic claims (verifier Step 0); the label is then assigned per the criteria below.

### CORRECT
ALL of the following must hold:
- (a) Cited URL resolves via the fetch fallback chain.
- (b) **Direct quote is character-for-character identical to source text** (whitespace tolerant; punctuation tolerant only when meaning is preserved). Substituting one verb for another (e.g., "generated" for "accounted for") is NOT verbatim and disqualifies CORRECT.
- (c) **Every atomic claim in the finding is supported by the fetched snippet** (not by the URL slug, not by page title, not by the verifier's general knowledge).
- (d) Finding includes any caveats, qualifications, or counter-views the source mentions adjacent to the cited content.
- (e) Verifier's independent contrary-evidence search surfaces no high-quality contrary sources the lens missed.
- (f) Tier label matches what source-curation.md per-lens patterns prescribe for this URL.

### PARTIAL
At least one of:
- **Quote-integrity failure:** quote is paraphrased (`FOUND_PARAPHRASED`), OR quote is verbatim but pulled from a different section than implied. The underlying claim may still be supported.
- **Multi-part claim, partially supported:** finding asserts N atomic facts; M of them are supported by the snippet (1 <= M < N).
- **Caveat omission:** finding is supported but strips a caveat the source explicitly includes adjacent to the cited content.
- **Tier mismatch by exactly one tier** (T1<->T2 or T2<->T3).
- **Lens missed contrary high-quality sources** that exist; lens picked one of several mainstream positions without acknowledging alternatives.

### INCORRECT
At least one of:
- **Quote not in source at all** (`NOT_FOUND`): quote does not appear verbatim or paraphrased anywhere in the snippet.
- **All atomic claims unsupported:** every atomic claim in the finding fails support test (c).
- **Misrepresentation:** lens summary contradicts what the snippet actually says.
- **Tier mismatch by two tiers** (T1<->T3) or any cross-R-boundary mistier.

### UNVERIFIABLE
**Only when source is permanently unreachable.** ALL of:
- All four fetch fallbacks attempted (WebFetch, defuddle, firecrawl, archive.org) and logged in rationale.
- Each attempt returned: 404, paywall HTML, WAF challenge page, or no archive snapshot.
- Verifier did NOT receive a usable snippet.

UNVERIFIABLE is **not** a hedge label for "I'm not sure how to evaluate this." If a snippet was fetched, the finding gets one of CORRECT, PARTIAL, or INCORRECT. UNVERIFIABLE counts as 0.5 weight in calibration accuracy and flags the finding for re-research.

### Worked examples (drawn from 2026-05 calibration)

**CORRECT.** Single-claim finding with character-identical quote, all evidence in snippet, no missed caveats.

**PARTIAL (quote integrity).** Lens cites "Members generated 256% more revenue" but source says "members accounted for 256% more revenue." All numerical claims in the finding are supported, but the quote is paraphrased. Quote-integrity failure -> PARTIAL.

**PARTIAL (multi-part).** Finding asserts "Deming reasoning: quotas lead workers to game the numbers AND lead to optimizing locally rather than for the whole organization." Source supports the first claim, says nothing about the second. 1 of 2 atomic claims supported -> PARTIAL.

**PARTIAL (snippet-only evidence).** Finding asserts "Tommy Mello (A1 Garage Door, $30M+ business)" with a URL slug containing "homeservicemillionaire." Snippet does not mention Tommy Mello or $30M; only "over 50 thousand dollars in debt" growing "into the millions." URL slugs and page titles do not count as evidence. Atomic claim about $30M is unsupported -> PARTIAL.

**INCORRECT.** Lens cites a quote that does not appear in the source in any form (`NOT_FOUND`), or claims about a topic the source does not discuss at all.

**UNVERIFIABLE.** All four fetch fallbacks fail with 404 or paywall or WAF or no-archive. Snippet never obtained. Cannot evaluate.

## 2. Per-finding evidence (verifier output structure)

For each finding labeled, the verifier produces:

```yaml
finding_id: F<N>
label: CORRECT | PARTIAL | INCORRECT | UNVERIFIABLE
quote_check: FOUND_VERBATIM | FOUND_PARAPHRASED | NOT_FOUND
tier_check: TIER_CORRECT | TIER_DOWNGRADE_TO_<T2|T3> | TIER_UPGRADE_TO_T1
claim_decomposition:
  - claim: "<atomic claim 1, paraphrased to a single fact>"
    snippet_support: SUPPORTED | NOT_SUPPORTED | PARTIAL
  - claim: "<atomic claim 2>"
    snippet_support: SUPPORTED | NOT_SUPPORTED | PARTIAL
contrary_search:
  queries:
    - <query 1>
    - <query 2>
  contrary_findings_count: <integer>
  highest_quality_contrary: null | { url, tier, brief_claim }
spot_check_priority: HIGH | MEDIUM | LOW
rationale: <one or two sentences>
```

**claim_decomposition semantics:**
- `claim` - one atomic factual assertion paraphrased from the finding. An atomic claim is a single assertion that could be true or false independently of the others.
- `snippet_support: SUPPORTED` - the fetched snippet contains evidence for this claim
- `snippet_support: NOT_SUPPORTED` - the snippet does not contain evidence (URL slugs, titles, and verifier general knowledge do NOT count)
- `snippet_support: PARTIAL` - the snippet contains weaker or qualified evidence for this claim

Decomposition-to-label mapping:
- All claims SUPPORTED + quote verbatim + tier correct + no contrary evidence -> CORRECT
- All claims SUPPORTED + quote paraphrased -> PARTIAL (quote-integrity failure)
- Mixed SUPPORTED and NOT_SUPPORTED (M of N, M >= 1) -> PARTIAL (multi-part)
- All claims NOT_SUPPORTED -> INCORRECT
- Source not fetchable -> UNVERIFIABLE

**quote_check semantics:**
- `FOUND_VERBATIM` - the exact quoted text appears in the source as cited
- `FOUND_PARAPHRASED` - the source says it but in different words; the lens fabricated quotation marks around a paraphrase
- `NOT_FOUND` - the quoted text does not appear in any form

`FOUND_PARAPHRASED` is a quote-integrity failure (the lens claimed a verbatim quote that wasn't verbatim). It does not automatically make the finding INCORRECT, but it is grounds for PARTIAL at minimum.

**tier_check semantics:**
- `TIER_CORRECT` - the lens's tier matches what source-curation.md per-lens T1/T2/T3 patterns prescribe
- `TIER_DOWNGRADE_TO_<T2|T3>` - the lens overrated; the URL is actually lower-tier
- `TIER_UPGRADE_TO_T1` - the lens underrated; the URL meets a higher tier (rare; usually a missed primary-source classification)

A tier mismatch by exactly one tier (T1 vs T2, or T2 vs T3) is grounds for PARTIAL. A mismatch by two tiers (T1 vs T3) or any mistier across the R-tier boundary is grounds for INCORRECT.

**spot_check_priority semantics:**
- `HIGH` - verifier is genuinely uncertain about the label. Source is ambiguous, contrary evidence exists but quality is hard to judge, finding hinges on context the source doesn't explicitly state, or lens applied judgment that could go either way.
- `MEDIUM` - verifier is confident but the finding is load-bearing for the research's downstream decision actions (LB-marked sources in Decision/Deep modes).
- `LOW` - obviously CORRECT or obviously INCORRECT; spot-check is sanity only.

Target distribution: ~15-25% HIGH+MEDIUM combined. If a verifier produces 50% HIGH, the prompt is too uncertain or the lens output is too thin; investigate.

## 3. Calibration accuracy formula

For a given confidence tier (e.g., "High"), accuracy is computed across all findings in that tier across all topics in the calibration set:

```
accuracy = (CORRECT + 0.5 * PARTIAL) / (CORRECT + PARTIAL + INCORRECT + 0.5 * UNVERIFIABLE)
```

PARTIAL gets 0.5 weight: directional-but-incomplete is more useful than wrong but less useful than fully right.

UNVERIFIABLE is split 50/50 (denominator weight 0.5, numerator weight 0): we can't be sure which way it would go without a recoverable source.

INCORRECT contributes to the denominator at full weight, the numerator at 0.

### Drift threshold

If a tier's measured accuracy diverges from the tier's stated confidence by more than **10 percentage points**, the threshold gets reset. Example: "High" implies 80% accuracy in Decision mode. If calibration measures 65%, the High threshold (currently weighted-sum >= 4.0) is raised until the population in "High" only contains findings where measured accuracy >= 70% (within 10pp of target).

### What "stated confidence" means per mode

| Mode | "High" target accuracy | Source |
|---|---|---|
| Decision | 80% | mode-spec |
| Learning | 70% | mode-spec |
| Tech | 70% | mode-spec |
| Quick | 70% | mode-spec |
| Deep | 80% | mode-spec |

These are aspirational; first calibration measures actuals, threshold-setting follows.

## 4. Inter-rater agreement (verifier vs Scott)

After Scott's spot-check, compute **Gwet's AC1** between verifier-Sonnet's labels and Scott's labels for the spot-check sample. Also report Cohen's kappa (unweighted and linearly weighted) and raw agreement Po as supplementary metrics.

```
AC1 = (Po - Pe_AC1) / (1 - Pe_AC1)

Pe_AC1 = (1 / (k - 1)) * sum over categories i of [pi_avg * (1 - pi_avg)]

where:
  Po = fraction of findings where verifier and Scott agreed
  k = number of categories (4: CORRECT, PARTIAL, INCORRECT, UNVERIFIABLE)
  pi_avg = (P_verifier(i) + P_scott(i)) / 2 for each category i
```

### Why AC1 instead of Cohen's kappa

Cohen's kappa exhibits the **kappa paradox** when raters concentrate on one or two of the available categories: chance agreement (Pe) inflates with marginal imbalance, deflating kappa even when raw agreement is high. The 2026-05 calibration documented this directly: at v3 raw agreement of 73%, Cohen's unweighted kappa was 0.51 ("moderate") while Gwet's AC1 was 0.68 ("substantial"). Both raters had ~60% of labels in PARTIAL, which is structurally expected for this verifier (most findings ARE partially supported), so kappa systematically understates true agreement.

Gwet's AC1 is designed for this case: it computes chance agreement based on the assumption that random rating only happens for cases where the rater is genuinely uncertain, not on the marginal distribution. AC1 is monotonic with raw agreement under marginal imbalance; kappa is not.

References: Gwet, K. L. (2008). "Computing inter-rater reliability and its variance in the presence of high agreement." British Journal of Mathematical and Statistical Psychology, 61(1), 29-48.

### Threshold

| AC1 | Interpretation | Action |
|---|---|---|
| >= 0.80 | Almost perfect | Verifier is trustworthy; calibration data is reliable. |
| 0.60 - 0.79 | Substantial | Verifier is trustworthy; calibration data is reliable. |
| 0.40 - 0.59 | Moderate | Verifier prompt may need revision before calibration data is used for threshold-setting. Investigate disagreement patterns; run a second pass if patterns are systematic. |
| < 0.40 | Fair to poor | Verifier prompt is broken. Major revision required before any calibration claims are made. |

Production threshold: **AC1 >= 0.6**.

### Sample size caveat

With 20% spot-check on ~60 findings, the spot-check sample is ~12 pairs. Agreement estimates with n=12 have wide confidence intervals (typically ±0.15-0.20 for AC1; ±0.20-0.30 for Cohen's kappa). The first calibration uses 30% spot-check (~18 pairs) to tighten the estimate. Subsequent calibrations drop to 20%.

If AC1 with 30% sample is between 0.5 and 0.7, the result is borderline; review disagreement patterns and decide whether to expand spot-check or accept with a documented caveat.

### Reporting convention

Calibration close-out reports include all four metrics (raw Po, Cohen's κ unweighted, Cohen's κ linearly weighted, Gwet's AC1) so the kappa paradox is visible if it occurs. AC1 is the production-decision metric; the others provide context.

## 5. Bias audits (run after each calibration)

These audits surface systematic skews that affect skill reliability differently for different topic types or use cases.

### 5a. Topic-domain bias

Compute accuracy per topic-bucket from the calibration topic set:

| Bucket | Definition |
|---|---|
| A: Well-documented | Topics with dense T1 sources (official docs, GitHub issues for known projects) |
| B: Business decision | Strategy / sales / methodology topics with mixed source quality |
| C: Emerging/contested | New tech, controversies, fast-moving domains |
| D: Adversarial | Vendor-marketing-saturated, sparse T1, lens-likely-to-overclaim |

If accuracy varies by more than 15pp across buckets, the skill has unequal reliability across topic types. Document the gap; consider mode-specific defaults to compensate (e.g., Decision-mode High threshold raised on Bucket D topics).

### 5b. Lens bias

Compute accuracy per lens. If any lens drags overall accuracy down by more than 10pp, the lens's prompt or tier definitions need work.

### 5c. Tier bias

"High" should empirically be more accurate than "Medium" should be more accurate than "Low." If this is not strictly true, the tier system is broken (regardless of which tier dominates).

### 5d. Topic-type bias

Compute accuracy separately for TIME-SENSITIVE and DURABLE-KNOWLEDGE topic-types. They have different recency rules; conflating them in calibration hides real differences.

## 6. Anti-patterns (what the rubric does NOT do)

- **Does not measure usefulness.** A finding can be CORRECT and useless, or INCORRECT and inspirational. The rubric measures factual reliability only.
- **Does not measure decision quality.** "Did this research lead Scott to a good decision?" is downstream of accuracy and not in scope.
- **Does not handle subjective findings.** Findings like "X is the best framework for Y" are inherently judgment calls. Verifier should label them PARTIAL by default and lens agents should avoid producing them in this form (prefer "X is the most-recommended framework for Y per [survey/source]" which is verifiable).
- **Does not penalize legitimate uncertainty.** A lens that says "Low confidence: only 2 thin sources" and produces a Weakly Supported finding should not be penalized for being honest. The rubric labels accuracy of the claim, not the lens's epistemic posture.

## 7. Maintenance

This rubric is versioned with the skill. Changes:
- New label categories require changing the calibration accuracy formula AND re-running calibration.
- Threshold changes (e.g., kappa > 0.6 -> 0.7) are documented in the changelog and don't require re-calibration if direction is to tighten.
- Bias-audit dimensions are additive; new audits don't invalidate old calibrations.

Last updated: 2026-05-09 (v3: switched primary inter-rater metric from Cohen's kappa to Gwet's AC1, documented kappa paradox in §4 rationale. v2: tightened CORRECT/PARTIAL/INCORRECT/UNVERIFIABLE definitions per 2026-05 calibration findings, added claim_decomposition field, added worked examples)
