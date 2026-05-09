# Comparison: scott-research (Claude Code) vs deep-research (Cowork)

*Generated 2026-05-08*

Two research skills, very different philosophies. Your scott-research is a precision instrument with heavy anti-hallucination guardrails. Cowork's deep-research is a presentation-first generalist with framework integration baked in.

## File structure side-by-side

| | scott-research | deep-research (Cowork) |
|---|---|---|
| Top-level | SKILL.md | SKILL.md |
| References | dispatch.md, synthesis.md, source-curation.md, labeling-rubric.md, verifier.md, recommended-actions.md | phase-guide.md, synthesis-guide.md, recommended-actions.md, framework-lens.md |
| Assets | none | template.html (19.5 KB Chart.js dashboard) |
| Reference total | 6 files, ~62 KB | 4 files, ~43 KB |

## Architecture

| Dimension | scott-research | deep-research |
|---|---|---|
| Execution model | Parallel subagent dispatch (up to 10 lenses simultaneously) | Sequential single-agent (5 phases run in order) |
| Investigation units | 10 lenses (Historical, Academic, Book, Current Application, Social, Technical, Risk, Contrarian, Economic, Adjacent) | 5 phases (Historical, Academic, Books, Recent Publications, Social) |
| Modes | 5 (Decision, Learning, Tech, Quick, Deep) | 1 mode |
| Sources per unit | Mode-conditional, 3-12 typical | 8-12 per phase |
| Verifier agent | Yes, separate Sonnet 4.6 subagent on different model than lens agents (Opus) | None |
| Output format | Markdown RESEARCH.md | HTML report with Chart.js dashboard |
| Output path | ~/Scott/growth-os/raw/research/<scope>/ | ~/Sites/Global/Research/ |

## Source integrity (the biggest delta)

| Feature | scott-research | deep-research |
|---|---|---|
| Tier system | T1/T2/T3/R with weighted confidence math | None, only "source quality hierarchy" prose |
| Per-lens T1 definitions | Yes, in source-curation.md §3 | None |
| Acceptable-domain matrix | Yes (10 lenses x 5 domain types) | None |
| Twitter/X rule | Explicit T1-in-Social, T3-elsewhere with author-credential exception | None |
| Recency cutoffs | Per-lens, with topic-type relaxation (1.5x for durable-knowledge) | "Last 2 years" mentioned for Phase 4 only |
| Fetch fallback chain | WebFetch -> defuddle -> firecrawl -> archive.org, mandatory logging | Not specified |
| Mandatory verbatim quotes | Yes, top 3 findings per lens | Not required |
| Comprehension block validation | Yes, 3-line block validated at synthesis (Pass 2) with auto-demotion to Low | None |
| Anti-fabrication rules | "EVERY claim needs source AND tier label", "DO NOT cite a URL you have not fetched" | "Cite sources where possible" |
| Forbidden phrases | Explicit list (no "downgraded conservatively", no "undated halves", etc.) | None |

## Confidence scoring

| | scott-research | deep-research |
|---|---|---|
| Method | Weighted sum from 8-row deterministic table | Count-based 1-5 scale |
| Thresholds | High >= 4.0, Medium 2.0-3.9, Low < 2.0 | 5 = 4-5 phases, 4 = 3-4 phases, etc. |
| T3 cap rule | >= 50% T3 sources cannot be Strongly Supported | None |
| Numerical Discrepancy Rule | Conflicting numbers route to Discrepancies regardless of lens count | None |
| Circular source detection | Yes, same-domain across lenses flagged | None |
| Verification penalty | UNVERIFIED or 404 = 0.25 weight | None |
| Calibration system | Cohen's kappa, drift thresholds, mode-specific accuracy targets, bias audits | None |

## Verifier (scott-research-only feature)

deep-research has nothing equivalent. scott-research has:

- Separate Sonnet 4.6 subagent (different model from Opus lens agents to reduce self-bias)
- Default disposition: skeptical, not balanced
- 6-step workflow per finding (fetch, quote check, summary fairness, tier check, contrary search, label)
- 4 labels: CORRECT, PARTIAL, INCORRECT, UNVERIFIABLE
- Structured YAML output with tier_check, contrary_search, spot_check_priority
- Mode-conditional sample size (Decision: full LB, Quick: top 1-2 LB, etc.)
- Cross-temporal verification for Deep mode (re-fetch prior LB sources)

## Synthesis output

### scott-research RESEARCH.md sections

1. TL;DR (5 bullets)
2. Research Summary (5 buckets: Strongly Supported, Congruencies, Discrepancies, Unique Ideas, Weakly Supported)
3. Per-lens output (10 lenses, lightly edited)
4. Decision-Ready Brief (when decision anchor provided)
5. Connections (BOPs, Eternal Wisdom, Temporal Wisdom, Eleanor, Other Projects)
6. Recommended Actions (6-12 with prompts in fenced blocks)
7. Research Metadata table (15+ metrics including verification stats)

### deep-research HTML sections

1. Title + metadata
2. Executive summary
3. Source stats (pill badges)
4. Dashboard (evidence radar + timeline + confidence cards)
5. Consensus findings (cards with "Research More" buttons)
6. Key discrepancies
7. Unique ideas
8. Cross-source comparison table
9. Phase details
10. Detailed analysis prose
11. Framework Lens Analysis (Eternal + Temporal + BOPs + Tensions)
12. Recommended Actions (cards with "Begin" buttons)
13. Sources list

## Recommended Actions

Both have nearly identical action systems. Notable differences:

| Action Type | scott-research | deep-research |
|---|---|---|
| Build Training | Yes | Yes |
| Create Skill | Yes | Yes |
| Deep Dive | Yes | Yes |
| NotebookLM Prep | Yes | Yes |
| Build Process | Yes | Yes |
| Write Document | Yes | Yes |
| Test/Experiment | Yes | Yes |
| Council Deliberation | Yes | No |
| Create Visual | No | Yes |

scott-research has stricter eligibility: "Every action's Supports findings list must reference at least one finding that is Strongly Supported, OR backed by 1 verified T1, OR backed by 2 verified T2 from different domains." deep-research has no eligibility floor.

scott-research has tier-evidence requirement on every action card. deep-research does not.

## Framework Lens (deep-research-only feature)

This is the most interesting thing scott-research is missing. deep-research has a dedicated 250-line `framework-lens.md` that maps every finding through:

- **Eternal Wisdom** (O'Dell Principles, 5 paired virtues with integration sequence)
- **Temporal Wisdom** (Robert Greene 4 frameworks: 48 Laws, 33 Strategies, Human Nature, Mastery)
- **BOPs** (10 frameworks with explicit "BOPs Test")
- **Tension Mode**: explicit table of common Temporal/Eternal conflicts ("Conceal intentions" vs "Pure motives", etc.)
- **BOPs as the Bridge**: when BOPs can resolve a Temporal/Eternal tension, note it

scott-research mentions BOPs/Eternal/Temporal in passing in the Connections section of synthesis.md but has no structured methodology for the mapping or for surfacing tensions.

## Deepen functionality

| | scott-research | deep-research |
|---|---|---|
| Single-finding deepen | Yes, `--deepen <RESEARCH.md path> <finding-id>` with sub-question confirmation | Yes, "Research More" button on every finding card with pre-built prompt |
| Domain re-run | Yes, `--deepen-domain` with cross-temporal verification + Drift Report | No |
| Output | New deepening report linking back to original | Triggers fresh research run |

The "Research More" button is a clever interactive primitive that scott-research does not have. The button copies a ready-to-paste prompt; user pastes into a new session and the deepen runs there. scott-research's deepen runs in-session via flag.

## Edge cases handled

scott-research handles explicitly:
- Topic too broad / too narrow
- All lenses return weak
- Academic lens struggles
- Contrarian lens finds nothing negative
- Lens aborted due to fetch failures (40% threshold, mode-conditional)
- Mode mismatch in Phase 1
- Deep mode without lifecycle anchor
- Verifier-Sonnet kappa below threshold

deep-research handles explicitly:
- Phase comes up thin (less than 3 sources, redistribute effort)

## Where each skill is stronger

### scott-research wins on
- Source integrity and anti-hallucination (massive lead)
- Verifier subagent with calibration (no equivalent)
- Mode flexibility (5 vs 1)
- Parallel execution speed (10 lenses simultaneously vs 5 phases sequentially)
- Action eligibility rules (only well-sourced findings can produce actions)
- Re-run cadence and drift detection (Deep mode + --deepen-domain)
- Decision-Ready Brief format
- Fetch fallback chain robustness

### deep-research wins on
- Visual presentation (Chart.js dashboard, evidence radar, timeline)
- Framework Lens Analysis (Eternal/Temporal/BOPs with explicit Tension mode)
- Interactive output (Research More + Begin buttons with copy-paste prompts)
- Lower invocation friction (no mode confirmation, no decision anchor required)
- Self-contained shareable output (one HTML file vs Markdown that needs rendering)
- Create Visual action type

## Things to consider porting

From deep-research INTO scott-research:

1. **HTML output mode**. Add a flag like `--format=html` that emits a Chart.js dashboard alongside the RESEARCH.md. Keep Markdown as default; HTML for sharing.
2. **Framework Lens Analysis as a structured section**. The Eternal/Temporal/BOPs mapping with explicit Tension surfacing is more rigorous than scott-research's current Connections section. The Tension table is particularly valuable.
3. **"Research More" button equivalent**. For HTML output, add per-finding deepen buttons. For Markdown output, generate ready-to-paste deepen commands per finding (like Recommended Actions but for follow-up research).
4. **Create Visual action type**. Genuinely useful and missing from scott-research.

From scott-research INTO deep-research (for personal use, not Cowork):

This is mostly not applicable since they target different environments, but if you wanted to harden the Cowork skill on your machine:

1. Add a tier system (T1/T2/T3) so confidence isn't just count-based
2. Add a verifier pass before generating the HTML
3. Add fetch fallback chain so flaky URLs do not silently degrade quality
4. Add the comprehension block / Pass 2 validation to detect when the agent skips the references

## Bottom line

Different tools for different jobs:

- **scott-research** is built for high-stakes business decisions where being wrong costs real money. The verifier, calibration math, and source integrity rules exist because LLMs hallucinate confidently and you need structural defenses.
- **deep-research** is built for fast, shareable research reports where the visual output and framework integration matter more than ironclad source verification. It assumes a willing reader who can apply judgment.

If you want one skill that does both, the highest-leverage merge is: keep scott-research's spine (modes, lenses, verifier, tier system) and bolt on deep-research's HTML presentation and Framework Lens Analysis.
