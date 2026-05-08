# Multi-Lens Research: Labeling Rubric

Used by the verifier-Sonnet subagent to label every finding produced by lens agents during the calibration study and during Phase 2.5 verification in production runs. Scott's 20% spot-check (30% on the first calibration) uses the same rubric so we can measure inter-rater agreement.

This file is the source of truth for labeling. The verifier reads it as a required first action. Scott reads it before spot-checking.

## 1. Per-finding labels

Every finding receives exactly one of four labels.

| Label | Criterion (ALL conditions must hold) |
|---|---|
| **CORRECT** | (a) Cited URL resolves via the fetch fallback chain. (b) Direct quote appears verbatim in the source. (c) Finding is a fair summary of the source's claim INCLUDING any caveats, qualifications, or counter-views the source mentions. (d) Verifier's independent contrary-evidence search surfaces no high-quality contrary sources the lens missed. (e) Tier label matches what source-curation.md per-lens patterns prescribe for this URL. |
| **PARTIAL** | (a) and (b) hold. AND one of: finding is directionally correct but overstates strength; finding omits a caveat the source explicitly includes; lens missed contrary high-quality sources that exist; lens picked one of several mainstream positions without acknowledging the alternatives. |
| **INCORRECT** | One of: quote does not appear in source (verbatim or paraphrased); finding misrepresents the source's claim; tier label is wrong by more than one tier (e.g., labeled T1 but is a personal blog); the finding has no recoverable source after the fetch fallback chain. |
| **UNVERIFIABLE** | Source is permanently unreachable: 404, paywalled, gated WAF, dead archive.org. ALL fetch fallbacks attempted and logged. Counts as 0.5 weight in calibration accuracy. Flags the finding for re-research. |

## 2. Per-finding evidence (verifier output structure)

For each finding labeled, the verifier produces:

```yaml
finding_id: F<N>
label: CORRECT | PARTIAL | INCORRECT | UNVERIFIABLE
quote_check: FOUND_VERBATIM | FOUND_PARAPHRASED | NOT_FOUND
tier_check: TIER_CORRECT | TIER_DOWNGRADE_TO_<T2|T3> | TIER_UPGRADE_TO_T1
contrary_search:
  queries:
    - <query 1>
    - <query 2>
  contrary_findings_count: <integer>
  highest_quality_contrary: null | { url, tier, brief_claim }
spot_check_priority: HIGH | MEDIUM | LOW
rationale: <one or two sentences>
```

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

After Scott's spot-check, compute Cohen's kappa between verifier-Sonnet's labels and Scott's labels for the spot-check sample.

```
kappa = (observed_agreement - chance_agreement) / (1 - chance_agreement)
```

Where:
- `observed_agreement` = fraction of findings where verifier and Scott agreed on label
- `chance_agreement` = sum over labels L of P(verifier=L) * P(Scott=L), computed from the marginal distributions

### Threshold

| Kappa | Interpretation | Action |
|---|---|---|
| >= 0.80 | Almost perfect | Verifier is trustworthy; calibration data is reliable. |
| 0.60 - 0.79 | Substantial | Verifier is trustworthy; calibration data is reliable. |
| 0.40 - 0.59 | Moderate | Verifier prompt needs revision before calibration data is used for threshold-setting. Run a second pass with revised prompt. |
| < 0.40 | Fair to poor | Verifier prompt is broken. Major revision required before any calibration claims are made. |

Production threshold: kappa >= 0.6.

### Sample size caveat

With 20% spot-check on ~60 findings, the spot-check sample is ~12 pairs. Kappa estimates with n=12 have wide confidence intervals (typically ±0.2-0.3). The first calibration uses 30% spot-check (~18 pairs) to tighten the estimate. Subsequent calibrations drop to 20%.

If kappa with 30% sample is between 0.5 and 0.7, the result is too noisy to act on; expand spot-check temporarily.

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

Last updated: 2026-05-08
