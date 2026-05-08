---
name: scott-research
description: |
  Multi-lens research skill that dispatches up to 10 parallel subagents to investigate a topic
  from different angles (Historical, Academic, Book, Current Application, Social, Technical,
  Risk, Contrarian, Economic, Adjacent), then synthesizes findings into a single RESEARCH.md
  with 5-dimension analysis (strongly supported, congruencies, discrepancies, unique ideas,
  weakly supported).

  Five modes optimize for different use cases: Decision (drives an action), Learning (broad
  survey for knowledge acquisition), Tech (technical feasibility/comparison), Quick (early
  scan, calibrated lite), Deep (sustained multi-session domain research). Mode is
  auto-inferred in Phase 1 with single-line confirmation; user can override.

  Includes anti-hallucination guardrails, source verification (Phase 2.5 with verifier-Sonnet
  on a different model than the lenses), calibrated confidence reporting, an optional
  Decision-Ready Brief, and a Recommended Actions section that turns each high-confidence
  finding into a concrete next step with a ready-to-paste prompt.

  Use this skill whenever Scott says "research X", "investigate X", "look into X", "what do
  we know about X", "dig into X", "explore X from all angles", or any variation of wanting
  structured research before making a decision or starting a project. Also use when Scott
  asks to prepare research for a Council deliberation, NotebookLM deep dive, or GSD phase.
  Even for seemingly simple research requests, this skill adds rigor that ad-hoc searching
  cannot match.
user_invocable: true
invocation_hint: |
  Standard:        /scott:research <topic> [--mode=<decision|learning|tech|quick|deep>] [--notebooklm] [--council <triad>]
  Deepen finding:  /scott:research --deepen <RESEARCH.md path> <finding-id>
  Deep re-run:     /scott:research --deepen-domain <RESEARCH-DEEP folder> [--reason="<what's new>"]
input_examples:
  - "/scott:research how market research applies to product development"
  - "/scott:research SurrealDB v3 migration strategies --mode=tech"
  - "/scott:research membership pricing models for home services --notebooklm"
  - "/scott:research background operations methodology --council strategy"
  - "/scott:research body recomposition for 35+ males --mode=deep"
  - "/scott:research --deepen ~/Scott/growth-os/raw/research/global/RESEARCH-foo-2026-05-01.md F3"
  - "/scott:research --deepen-domain ~/Scott/growth-os/raw/research/personal/RESEARCH-DEEP-recomp/"
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

Auto-infer mode, topic type, and scope from the topic + any provided context. Present inferences as one-line confirmations. The flow is fast when inferences are right (single greenlight), longer only when overrides are needed.

### 1. What to research

"What topic do you want investigated?"

### 2. Mode (auto-inferred, confirm)

Five modes. The skill auto-infers from topic phrasing and context, then confirms.

| Mode | Use case | Auto-inference signals |
|---|---|---|
| **Decision** | Decision-relevant research that drives action | "should we...", "which X for Y", explicit decision context |
| **Learning** | Knowledge acquisition; NotebookLM prep; broad survey | "help me understand", "survey of", "tell me about", "catalog" |
| **Tech** | Technical feasibility, tool comparison, stack compatibility | Specific tool/library/framework + "how to" / "vs" / "configure" |
| **Quick** | Early-stage scan; calibrated lite | "quick check", "is X real", "30-second on", terse one-liner |
| **Deep** | Sustained multi-session domain research; designed to grow | "ongoing research on X", "build knowledge on", topic is a named domain (Health, sales-methodology, leadership), explicit `--mode=deep` |

When multiple signals match (e.g., "I want to understand whether to adopt SurrealDB"), default to **Decision** (most rigorous; safest default).

User can override in two ways: explicit `--mode=<name>` flag, or correcting the confirmation in Phase 1.

Confirmation script per mode (presented as a single line):

| Mode | Phase 1 confirmation |
|---|---|
| Decision | "This looks like Decision mode. Decision anchor required: what action will this research inform?" |
| Learning | "This looks like Learning mode. Broad survey or deep dive into one school of thought?" |
| Tech | "This looks like Tech research. Confirm specific tools/stacks in scope?" |
| Quick | "This looks like Quick mode (calibrated lite scan). Confirm, or escalate to Decision?" |
| Deep | "This looks like Deep mode. Confirm topic AND lifecycle anchor (long-term purpose), AND re-run cadence (suggested: [X] days based on [signal])?" |

### 3. Decision anchor (mandatory in Decision; lifecycle anchor mandatory in Deep)

- **Decision mode**: "What action will this research inform?" If unanswered, mode is wrong; suggest Learning or Quick.
- **Deep mode**: "What is the long-term purpose of this research?" Stored in `index.md` frontmatter. Drives re-run cadence.
- **Other modes**: Optional.

### 4. Topic type (auto-infer, confirm)

One of:
- **TIME-SENSITIVE**: Current state, market data, recent trends, technology adoption. Recency cutoffs in source-curation.md apply as listed.
- **DURABLE-KNOWLEDGE**: Principles, history, eternal frameworks, foundational theory. Recency cutoffs relax by 1.5x.
- **MIXED** (default if unclear): Cutoffs apply as listed.

Present as: "This looks like a [TYPE] topic. Confirm or override?"

### 5. Output location (convention, enforced, never silently deviated)

```
~/Scott/growth-os/raw/research/<scope>/<MODE-PREFIX>-<topic-slug>-<date>.md
```

For Deep mode, output is a folder, not a file:
```
~/Scott/growth-os/raw/research/<scope>/RESEARCH-DEEP-<topic-slug>/
  ├── index.md
  ├── <date>-<session-tag>.md
  └── deepenings/
```

| Mode | Filename prefix | Notes |
|---|---|---|
| Decision | `RESEARCH-` | Default; matches existing convention |
| Learning | `RESEARCH-LEARN-` | |
| Tech | `RESEARCH-TECH-` | |
| Quick | `RESEARCH-QUICK-` | Output stamped "Quick mode: verified to LB-only, lighter coverage than Decision" |
| Deep | `RESEARCH-DEEP-<slug>/` | Folder, not file. `index.md` is master synthesis |

- **`<scope>`**: `global` (default) | `advosy` | `bresco` | `personal`. Pick from decision/lifecycle anchor or topic domain.
- **`<topic-slug>`**: kebab-case, lowercase, alphanumerics and hyphens only. Strip articles and filler. Max ~60 chars.
- **`<date>`**: ISO 8601 (`YYYY-MM-DD`), today's date when synthesizing.

### 6. Lens selection (mode-dependent default; user can override)

| Mode | Default lens count | Default lenses |
|---|---|---|
| Decision | 10 (all) | All |
| Learning | 10 (all) | All - Learning research often surfaces unexpected angles |
| Tech | 3-5 | Technical, Current Application, Risk; sometimes Adjacent |
| Quick | 2-4 | Current Application, Social, plus 1-2 others depending on topic |
| Deep | 10+ | All on initial run; re-runs may re-dispatch with new framings |

User can exclude any lens that doesn't fit.

### Done when
Scott confirms topic, mode, decision/lifecycle anchor (where mandatory), topic type, scope, and lens selection.

## Mode-conditional defaults

Mode determines lens count, verification rigor, output format, action types, and confidence calibration target.

| Setting | Decision | Learning | Tech | Quick | Deep |
|---|---|---|---|---|---|
| Lens count default | 10 | 10 | 3-5 | 2-4 | 10+ on re-runs |
| Decision/lifecycle anchor | Decision: mandatory | Optional | Optional | Optional | Lifecycle: mandatory |
| Phase 2.5 verification | Full pass; all LB | Light pass; top 3 LB | Top 3 LB | Top 1-2 LB | Full + cross-temporal |
| Verifier-Sonnet | Full multi-layer | Sample LB only | Sample LB | Sample LB | Full + cross-temporal |
| Adversarial sourcing | Yes (Contrarian + cross-search) | Skip | Risk lens covers | Skip | Yes + adjacent-domain on re-runs |
| Re-dispatch on Pass 2 fail | 2 retries | 0 retries | 1 retry | 0 retries | 2 retries |
| Fetch fail threshold | 40% | 50% | 30% | 60% | 30% |
| Confidence reporting | Calibrated continuous + tier | Same | Same | Same | Same |
| Calibration target accuracy on "High" | 80% | 70% | 70% | 70% | 80% |

## Deepen modes

Two deepening paths exist.

### --deepen (single finding from any mode)

When invoked with `--deepen <RESEARCH.md path> <finding-id>`:

1. Reads the existing RESEARCH.md.
2. Extracts the named finding (e.g., F3) statement, supporting sources, and Gaps subsection.
3. Confirms 1-3 sub-questions with Scott (drawn from Gaps).
4. Dispatches 2-3 lens subagents on the focused sub-questions.
5. Verifies and synthesizes a "deepening report" linking back to the original.

Output: `~/Scott/growth-os/raw/research/<scope>/<MODE-PREFIX>-<topic-slug>-DEEPEN-<finding-id>-<date>.md`

**When to use**: a prior research surfaced a finding with a Gaps subsection pointing at unresolved sub-questions. Deepen closes specific gaps without re-running the entire dispatch.

### --deepen-domain (Deep-mode periodic re-run)

When invoked with `--deepen-domain <RESEARCH-DEEP folder> [--reason="<what's new>"]`:

1. Reads `index.md` and `history.md` in the Deep folder to load current state.
2. Re-dispatches the same lenses with prompt context: "Prior findings exist: [list]. Search for: (a) NEW evidence published since last run, (b) findings that contradict prior runs, (c) findings now stale per current cutoffs."
3. Cross-temporal verification: prior LB sources are re-fetched. Findings cited from sources now 404 get downgraded.
4. Synthesis adds a "Drift Report" section: what changed, what's new, what's stale, what's confirmed.
5. New session output goes in the folder; `index.md` is updated; `history.md` gets a changelog entry.

### Re-run cadence inference (Deep mode)

Phase 1 suggests a default cadence based on topic + lifecycle anchor signals:

| Topic signals | Suggested cadence |
|---|---|
| Tech-tool-named, "AI", "trends 2026", "emerging", "current" | 30-60 days |
| Methodology, framework, principle, foundational, historical | 6-12 months |
| Mixed (e.g., "B2B sales operations evolution") | 90-120 days |
| Health-domain (recomp, supplementation, training science) | 90 days |

Cadence stored in `index.md` frontmatter. Quarterly maintenance digest surfaces overdue Deep topics for re-run.

---

## Phases 1.5-4: Orchestration

The orchestration is split across reference files:

- `references/dispatch.md`: Phase 1.5 (topic anchoring), Phase 2 (subagent dispatch + lens-specific instructions + subagent prompt + output format), Phase 2.1 (fetch-failure triage), Phase 2.25 (assess and reallocate), Phase 2.5 (verification). Lens subagents and the verifier-Sonnet subagent both read this.
- `references/synthesis.md`: Phase 3 (cross-lens analysis, RESEARCH.md template, recommended actions pass) plus Deepen Mode Orchestration (Phases D1-D3). The orchestrator reads this when synthesizing or handling --deepen / --deepen-domain.
- `references/source-curation.md`: Tier system, per-lens T1/T2/T3 patterns, recency cutoffs, fetch fallback chain. Every lens subagent and the verifier MUST Read this as their first action.
- `references/labeling-rubric.md`: Source of truth for verifier-Sonnet labeling (CORRECT/PARTIAL/INCORRECT/UNVERIFIABLE), calibration accuracy formula, Cohen's kappa protocol, bias-audit dimensions. Verifier reads this; Scott reads it before spot-checking.
- `references/verifier.md`: Verifier-Sonnet subagent specification. Dispatched on Sonnet 4.6 (different model from lens agents on Opus) to reduce self-bias. Default disposition is skeptical, not balanced.
- `references/recommended-actions.md`: Action-types catalog (Build Training, Create Skill, Deep Dive, NotebookLM Prep, Build Process, Write Document, Test/Experiment, Council Deliberation), priority assignment rules (Do Now, Queue, Explore), prompt-template starting points.

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

**Lens aborted due to fetch failures**: A lens with >40% unfetchable sources after one auto-retry pass is excluded from synthesis. Surface this in the Decision-Ready Brief and Research Metadata. If 3 or more lenses abort, stop synthesis and escalate to Scott; the research run is unreliable. Fetch failure threshold is mode-conditional (40% Decision, 50% Learning, 30% Tech, 60% Quick, 30% Deep).

**Mode mismatch in Phase 1**: User says "this is a Decision but with no decision yet, just exploring options." Default to Decision but record the absent anchor; at synthesis time, the Decision-Ready Brief will be partial. Alternative: switch to Learning if exploration is honestly the goal.

**Deep mode without lifecycle anchor**: Lifecycle anchor is mandatory in Deep mode. If user can't articulate one, the topic is probably not actually Deep; suggest Learning instead.

**Verifier-Sonnet kappa below threshold (calibration only)**: If Scott's spot-check reveals kappa < 0.6 with verifier-Sonnet, the calibration data cannot be trusted yet. Re-run verifier with revised prompt before computing thresholds. See `labeling-rubric.md` §4 for protocol.
