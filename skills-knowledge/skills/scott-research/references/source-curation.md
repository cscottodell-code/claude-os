# Multi-Lens Research: Source Curation Reference

## Why this exists

Source-integrity rules in `orchestration.md` define how an agent should cite. This file defines what an agent is allowed to cite in the first place. Together they prevent two failure modes: fabricated quotes (integrity), and confident findings backed entirely by AI-generated aggregator content (curation).

This file is loaded by every lens subagent and the verification subagent. It is also consulted at synthesis time when computing confidence levels.

## 1. Universal Tier Definitions

These tier definitions apply identically across all 10 lenses. What counts as Tier 1 changes per lens (see section 4), but the tier-to-weight mapping does not.

| Tier | Criterion | Weight |
|------|-----------|--------|
| **T1, Primary** | The source itself produced the claim. No one stands between you and the original. | 2.0 |
| **T2, Reputable Secondary** | Named author with domain credibility, citing T1 sources you can trace back. | 1.0 |
| **T3, Aggregator** | Anonymous or AI-generated content; uncited; rolls up other people's work. | 0.5 |
| **R, Rejected** | Hard-blocked. Cannot count toward confidence. May be cited only as evidence of "what bad info is circulating." | 0 |

Every cited source MUST carry a tier label in the source table. Format: `T1`, `T2`, `T3`, or `R`.

## 2. Rejected Sources (R-tier)

These domains and content types are R-tier across all lenses. Default reject list:

- AI-aggregator content farms: grokipedia.com, aitooldiscovery.com, similarweb.com summary pages, alphaXiv summaries, any "AI-generated overview" page.
- Uncited listicles: "10 best", "top X", "everything you need to know about" pages with no author and no primary citations.
- Scraped Wikipedia mirrors and Wikipedia clones with no editorial control.
- Auto-generated stack-overflow-clone sites that copy-paste answers without attribution.
- Marketing landing pages with no concrete numbers or named case studies (vendor blog R-tier when content is purely promotional, T1 when it contains primary engineering writeups; judge per-page, not per-domain).

**Wikipedia itself** is **T2 with citation-trace requirement**. A Wikipedia citation only counts if the agent fetches the underlying reference Wikipedia cites and confirms the claim from that primary source. Wikipedia alone, without the trace, is R.

When in doubt: if a page does not name its author and does not link to its sources, it is T3.

## 3. Lens-Specific T1 Definitions

What "primary" means changes by lens. T1 examples per lens (T2 examples included for calibration):

| Lens | T1 looks like | T2 looks like |
|------|---------------|---------------|
| **Historical** | Original primary documents, peer-reviewed history papers, foundational books in original print | Reputable secondary histories, biographies, named-expert essays |
| **Academic** | Peer-reviewed journals, conference proceedings (NeurIPS, ICML, etc.), arXiv preprints with named authors | .edu pages, working papers, citations within systematic reviews |
| **Book** | Direct excerpts, author interviews, official author sites, transcripts of talks by the author | Long-form professional reviews (NYT, Atlantic, LRB), Goodreads reviews with substantive direct quotes |
| **Current Application** | Engineering blogs from named companies (Stripe, Anthropic, Vercel), case studies with named clients and concrete numbers, conference talks with slides | Reputable trade press (Latent Space tier), substantive Substack with named author |
| **Social** | Twitter/X via fxtwitter (verified handles), Hacker News threads with >50 comments and linked artifacts, Reddit posts with >100 upvotes and substantive comments, GitHub Issues and Discussions with >10 comments AND named-maintainer participation (these function as project-scoped public conversation) | Named-author Substacks and newsletters, podcast transcripts |
| **Technical** | Official docs, source code, RFCs, GitHub issues and PRs from maintainers | Named tutorial authors (Kent C. Dodds tier), Stack Overflow accepted answers with >5 votes |
| **Risk** | Postmortems from named companies (Cloudflare, GitLab status reports), CVE filings, regulatory filings, GitHub Issues with reproductions | Bug-bounty writeups, named security researchers' blogs |
| **Contrarian** | Critical academic papers, formal rebuttals, named-expert dissent essays | Substack and blog critiques by domain experts |
| **Economic** | Primary data (Gartner, IDC, Pitchbook, official earnings, NACMS, government statistics) | Analyst summaries with traceable primary citations, journalism with linked data |
| **Adjacent** | Domain-authoritative sources from the adjacent field (e.g., NEJM/JAMA for healthcare, McMaster-Carr catalogs for manufacturing) | Reputable cross-disciplinary analyses |

## 4. Acceptable Domain Types per Lens

This matrix prevents domain leak across lenses (e.g., a tweet ending up as Academic evidence, an arXiv paper ending up as Social evidence). Cells are tier ratings; `R` means do not cite at all in that lens.

**Precedence rule.** When this matrix appears to conflict with the per-lens T1 definitions in §3, **§3 wins**. The matrix is a generic baseline; §3 is the authoritative T1 definition. Examples:
- A critical academic paper on arXiv is **T1 in Contrarian** per §3 (critical academic papers are listed as T1), even though this matrix lists arXiv as T2 for Contrarian.
- A GitHub Issue with substantive comments is **T1 in Social** per §3, even though GitHub does not have a column in this matrix.

**Vendor-blog refinement.** When a row says `R` for vendor blogs, that applies to **promotional content** (marketing pages, generic feature descriptions, AI-rollups of customer wins). When the vendor is the **subject of the controversy** being researched and is making a primary statement defending or explaining their position, treat the vendor blog as **T2** (named author, primary source for "what the vendor said," but inherently self-interested). Example: smartconnections.app/introducing-pro-plugins/ as evidence for "what Petro said about paywalling" is T2 in Contrarian, not R.

| Lens | Twitter/X | Reddit/HN | arXiv | Vendor blog | Wikipedia |
|------|-----------|-----------|-------|-------------|-----------|
| Historical | T2 (named historian only) | T3 | T2 | R | T2 with citation-trace |
| Academic | R | R | T1 | R | T2 with citation-trace |
| Book | T2 (author handle) | T3 | R | R | T2 |
| Current Application | T2 | T2 (substantive only) | T2 | **T1** | T3 |
| Social | **T1** | **T1** | R | T2 | R |
| Technical | T2 (maintainer handle) | T2 | T2 | T1 | T2 |
| Risk | T2 | T2 | T2 | T1 (postmortems only) | T3 |
| Contrarian | T2 (named expert) | T2 | T2 | R | R |
| Economic | T3 | T3 | T2 | T2 | T3 |
| Adjacent | T3 | T3 | T2 | T2 | T2 |

When citing a domain not on this matrix, judge by the universal tier definitions in section 1.

## 5. Twitter/X Source Rule

Twitter/X is T1 in the Social lens (it IS the medium for online sentiment). In all non-Social lenses, tweets are T3 by default with one exception:

**Author-credential exception.** A tweet from an author with direct domain credibility on the topic, citing their own work or canonical thinking, is tier-judged on merit rather than auto-demoted. Examples:

- Karpathy tweet on his own "LLM as OS" thesis, cited in Historical lens: stays T1 (he is the originator).
- Simon Willison tweet announcing a feature he built, cited in Technical lens: stays T1.
- Random tweet about Karpathy's thesis, cited in Historical lens: T3 (per default).
- Anonymous account tweet on market sizing, cited in Economic lens: T3 (per default).

Apply the exception only when the tweet author is the primary source of the claim being made, not when they are commenting on someone else's work.

## 6. Recency Cutoffs

Per-lens recency defaults. Cutoffs measure from today's date back to the source's publication date.

| Lens | Default cutoff | Reasoning |
|------|---------------|-----------|
| Historical | None | This lens deliberately reaches back |
| Academic | <5 years for empirical claims; no cutoff for foundational theory | Empirical findings stale fast; theory persists |
| Book | None | Books are the work; publication date is irrelevant |
| Current Application | **<2 years (hard)** | "Current" stops being current fast |
| Social | **<6 months (hard)** | Old social is dead social |
| Technical | <2 years for evolving tools; <5 years for stable APIs | Stack-current is the whole point |
| Risk | None for eternal pitfalls; <3 years for tool-specific failures | Some failure modes are evergreen, some are version-specific |
| Contrarian | None for principle critiques; <2 years for trend critiques | Eternal critiques don't expire |
| Economic | **<2 years (hard)** | Market data is perishable |
| Adjacent | Inherits cutoff from the adjacent domain's natural pace | Healthcare moves slow; AI moves weekly |

### Topic-type override

Phase 1 of the skill asks Scott whether the topic is **time-sensitive** (current state, market data, recent trends) or **durable-knowledge** (principles, history, eternal frameworks). This answer modulates the cutoffs above:

- **Time-sensitive topic:** Use cutoffs as listed. Stricter where listed as hard.
- **Durable-knowledge topic:** Cutoffs relax by 1.5x. The Current Application "<2 years (hard)" becomes "<3 years (soft)". The Social "<6 months (hard)" becomes "<9 months (soft)". Lenses with no listed cutoff stay no-cutoff.
- **Mixed (default):** Use cutoffs as listed.

A source older than the cutoff is not auto-rejected; it is **flagged stale** in the source table and contributes at half its tier weight (so a stale T1 effectively counts as T2 weight, a stale T2 counts as T3 weight, a stale T3 is flagged but still 0.5).

## 7. Confidence Math (Weighted Sum)

Replaces the old count-based rule ("4+ credible sources = High").

For each lens, sum the weights of all cited sources using the table below. Then map to confidence.

### Deterministic weights table

These 8 weights are exhaustive. Agents MUST NOT invent additional modifiers (e.g., "undated halves," "opposition framing rather than support," "comment-on-someone-else's-work"). Any modifier not on this table does not exist.

| Source state | Weight |
|---|---|
| T1 (verified, current) | 2.0 |
| T1 + stale | 1.0 |
| T2 (verified, current) | 1.0 |
| T2 + stale | 0.5 |
| T3 (verified, current) | 0.5 |
| T3 + stale | 0.25 |
| R (any state) | 0 (cannot count toward confidence) |
| Verification-failed (UNVERIFIED or 404, any tier) | 0.25 |

### Confidence thresholds

| Weighted sum | Confidence |
|--------------|------------|
| >= 4.0 | **High** |
| 2.0 to 3.9 | **Medium** |
| < 2.0 | **Low** |

### Undated sources

Undated is **not** stale. An undated source contributes at full tier weight. The `undated` flag goes in the Flags column for awareness but does not penalize the math.

A source is `stale` only if its publication date is known AND exceeds the per-lens recency cutoff in §6. If you cannot determine the date, mark the source `undated` (not stale).

### Worked example

A Technical lens agent cites:
- Official SurrealDB v3 docs page (T1, current): 2.0
- arXiv paper on graph databases from 2022 (T2, falls outside Technical's <2-year cutoff for evolving tools): T2 + stale = 0.5
- GitHub README from a maintainer (T1, current): 2.0
- Stack Overflow accepted answer (T2, current): 1.0
- A blog post that later fails Phase 2.5 verification (originally T2, now verification-failed): 0.25

Weighted sum: 2.0 + 0.5 + 2.0 + 1.0 + 0.25 = **5.75 → High**

Reported as: `Confidence: High (weighted sum 5.75: 1xT1=2.0, 1xT2-stale=0.5, 1xT1=2.0, 1xT2=1.0, 1xT2-failed=0.25)`

### T3 cap rule (SC5)

Any finding where ≥50% of supporting sources are T3 cannot be classified Strongly Supported in synthesis, regardless of the weighted-sum total. This prevents 4 aggregator sources from creating false High confidence. The finding can still be classified as Congruent, Unique, or Weakly Supported.

### Verification effect on weight

A source that fails Phase 2.5 verification (URL 404 or quote not found on page) drops to weight 0.25 for that lens, regardless of its original tier (already enumerated in the deterministic weights table above). The non-zero weight retains a small signal so a lens with several near-misses is not erased entirely, but the source is still demoted below T3. If verification drops a lens below the High threshold, downgrade.

## 8. Fetch Failure Protocol

Lens agents and the verification agent must follow this fallback chain when a URL fails to fetch:

1. **WebFetch** the URL directly.
2. If WebFetch returns an error or the content is clearly truncated, retry once with `defuddle` (Bash skill: extracts clean markdown).
3. If defuddle fails, retry once with `firecrawl` (Bash skill).
4. If all three fail and the URL appears authoritative (T1 or T2), attempt `https://web.archive.org/web/*/<original-url>` via WebFetch. Mark the source as **archived** in the source table; archived versions are still tier-rated normally but flagged.
5. If the archive.org fetch also fails, mark the source as **unfetchable** and exclude it from the source table for that finding. Do not paraphrase from search snippets; that is a source-integrity violation.

### Per-lens failure threshold

If a lens accumulates more than **40% unfetchable sources** across its initial source set, the lens is in failure mode:

1. **Auto-retry pass.** Dispatch one follow-up attempt with the same lens, instructing it to seek different domains and re-run the fallback chain.
2. **Abort if still failing.** If the auto-retry pass also accumulates >40% unfetchable, abort the lens. Mark in synthesis metadata: "Lens [name] excluded due to fetch failure rate above threshold." Do not include partial findings from the failed lens in synthesis.

This is the structural fix for the "WebFetch was widely blocked" failure mode that produced the May 5-6 research runs.

## 9. Plumbing into Synthesis

Synthesis (Phase 3 in `orchestration.md`) must:

1. **Carry tier labels through.** Every finding in the synthesized RESEARCH.md must show its supporting sources with tier labels in the format `[T1]`, `[T2]`, `[T3]`, or `[T3, stale]`.
2. **Apply the T3 cap.** Before classifying any finding as Strongly Supported, count T3 sources. If ≥50%, cap at Congruent.
3. **Apply circular source detection** as currently specified in `orchestration.md` (same domain across lenses = single source). This rule remains unchanged.
4. **Report curation metrics** in the metadata table:
   - Sources by tier: `T1: N | T2: N | T3: N | R: N`
   - Stale sources flagged: `N`
   - Unfetchable sources excluded: `N`
   - Fetch fallback rescues (count of sources rescued via defuddle/firecrawl/archive.org): `N`
   - Lenses aborted: `[list]` or `none`

## 10. Quick reference for lens agents

When an agent is unsure how to tier a source, apply this decision order:

1. Is the domain on the rejected list (section 2)? → R, do not cite.
2. Is it Wikipedia? → T2 only if you also fetch and verify the underlying reference.
3. Is it on the per-lens domain matrix (section 4)? → Use that tier rating.
4. Is it Twitter/X? → T1 in Social lens; T3 in non-Social lenses unless author-credential exception applies (section 5).
5. Otherwise, judge by the universal definitions (section 1):
   - The source itself produced the claim → T1
   - Named author with domain credibility, citing traceable T1 sources → T2
   - Anonymous, AI-generated, or rolls up other work uncited → T3

If still unsure, default to the lower tier and note the uncertainty in the source table.
