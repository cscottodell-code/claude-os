# Council Deliberation Protocol

## Phase 1: Frame the Decision [STOP]

### With --from-research flag
If Scott provides a RESEARCH.md path, read it and extract:
- The Decision-Ready Brief (if present)
- The core tension identified by research
- Key findings from all lenses
- Use these as the briefing document for all council members

### Without research input
Ask Scott:
1. **The decision**: "What are you trying to decide?"
2. **The stakes**: "What happens if you get this wrong?"
3. **The constraints**: "What's off the table? What must be true?"
4. **Context**: Any relevant background (project state, timeline, budget)

### Select council composition
- If `--triad <name>` provided, use that triad
- If `--members <list>` provided, use those specific members
- If `--full` provided, use all 11
- If no flag, auto-detect the domain from the question and suggest a triad.
  Present the suggestion and let Scott confirm or adjust.

### Done when
Scott confirms the question, context, and council composition.

---

## Phase 2: Round 1 - Independent Analysis [AUTO]

Spawn all selected members as **parallel subagents**. Each member receives:

```
You are [MEMBER NAME], analyzing a decision through the lens of [DOMAIN].

## Your Identity
- Analytical method: [METHOD]
- You see what others miss: [STRENGTH]
- Your known blind spot: [BLIND SPOT]

## The Decision
[QUESTION]

## Context
[SCOTT'S CONTEXT + RESEARCH BRIEFING IF PROVIDED]

## Constraints
[WHAT'S OFF THE TABLE]

## Your Task
Analyze this decision from your unique perspective. You are NOT trying to give a
balanced answer. You are trying to surface what YOUR lens reveals that others will miss.

## Output Format (400 words max)

### Essential Question
[Reframe the decision through your lens - what is the REAL question here?]

### Analysis
[Your perspective on this decision, grounded in your analytical method]

### Verdict
[Your recommendation: what should Scott do and why]

### Confidence
[High/Medium/Low] - [why]

### Where I Might Be Wrong
[Honest assessment of what your blind spot might cause you to miss]
```

### Done when
All members have returned their independent analyses.

---

## Phase 3: Round 2 - Cross-Examination [AUTO]

Run **sequentially** (not parallel) so later members can reference earlier cross-examinations.

Each member receives all Round 1 outputs and must answer:

```
You are [MEMBER NAME]. You have read all Round 1 analyses.

Answer these 4 questions (300 words max total, must reference at least 2 other
members by name):

1. Which position do you MOST DISAGREE with, and why?
2. Which insight from another member STRENGTHENS your own position?
3. What, if anything, CHANGED your view?
4. RESTATE your position (may be updated based on what you learned)
```

### Anti-Recursion Rules

These exist because without them, Socrates and Feynman enter infinite questioning loops.

- **Hemlock rule**: If Socrates re-asks a question already addressed with evidence,
  force a 50-word position statement. No more questions.
- **3-level depth limit**: Question a premise, question the response, question once more.
  After 3 levels, the member must state their own position.
- **2-message cutoff**: If any pair exchanges more than 2 messages, force Round 3.

### Anti-Convergence Check

After Round 2, assess agreement level:
- If 70%+ of members agree on the same recommendation, trigger a **counterfactual round**:
  ask the 2 most agreeable members to argue the OPPOSITE position for 100 words each.
- This catches false consensus where members converge because they're all using the same
  reasoning pattern rather than genuinely independent analysis.

### Done when
All members have completed cross-examination. Anti-convergence check passed.

---

## Phase 4: Round 3 - Synthesis [AUTO]

Each member states their **final position in 100 words or fewer**. No new arguments.
Crystallization only.

Socrates gets exactly one final question, then must state his position.

### Build the Verdict

Read all 3 rounds and construct:

```markdown
## Council Verdict

### Decision
[The question that was deliberated]

### Council Composition
[Which members participated and why they were selected]

### Consensus Position
[The recommendation, if 2/3+ majority exists]
OR
### No Consensus
[If no 2/3 majority, present each position clearly without forcing agreement]

### Key Insights by Member
- [Member]: [Their unique contribution to the deliberation]

### Points of Agreement
[What all or most members agreed on]

### Points of Disagreement
[Where genuine tension remains]

### Minority Report
[The dissenting view(s), stated fully. Sometimes the minority is right.]

### Domain Expert Weighting
[Which member's domain most directly matched the problem, given 1.5x weight]

### Recommended Next Steps
1. [Concrete action]
2. [Concrete action]
3. [Concrete action]

### Research Quality (if --from-research was used)
[Note which RESEARCH.md findings were most relevant and which were challenged]
```

---

## Phase 5: Present to Scott [STOP]

Show the **Consensus Position** (or No Consensus) and **Key Insights** as a
conversational summary.

Highlight:
- The strongest argument for the recommended action
- The strongest counterargument (from the minority report)
- What surprised the council (insights that reframed the question)

Ask Scott:
1. "Want to dig deeper into any member's reasoning?"
2. "Want to run a different triad on the same question?"
3. "Ready to act on this?"

Mention: "I'll persist this as ADR-NNN once you've reviewed."

---

## Phase 6: Persist Verdict [AUTO]

Every council session produces a permanent record. Two-tier output, based on weight.

### Tier 1: ADR — always

Write to `~/Sites/Global/scott-context/wiki/global/ADR-NNN-<topic-slug>.md`.

**Numbering**: scan `wiki/global/` for `ADR-NNN-*.md`, take the max NNN, increment by 1, zero-pad to 3 digits. (Existing as of 2026-04: ADR-001 through ADR-003.)

**Topic slug**: same rules as scott-research — kebab-case, lowercase, alphanumerics + hyphens, articles stripped, ~60 char max.

**ADR template**:

```markdown
# ADR-NNN: <Title derived from the deliberation question>

**Status:** Decided | **Date:** YYYY-MM-DD | **Author:** Scott (via Council) | **Applies to:** <scope>

---

## The Question
[The Phase 1 framed question, verbatim or lightly edited for clarity]

## Council Composition
[Members + triad name if applicable. Note --full if used.]

## Decision
[Consensus position. If no consensus, write "No consensus — see minority positions below."]

## Key Reasoning
[2-3 bullets capturing the strongest arguments for the chosen direction.]

## Minority Report
[Dissenting position(s) stated fully. Sometimes the minority is right. Omit section if true consensus.]

## Recommended Next Steps
1. [Concrete action]
2. [Concrete action]
3. [Concrete action]

## Provenance
- Source research: [path to RESEARCH-*.md if --from-research was used, else "none"]
- Full transcript: [path to raw/sessions/ if Tier 2 archived, else "none — quick triad"]
```

`Status` starts as `Decided`. Update to `Superseded by ADR-NNN` if a future council overturns it. Never delete or rewrite — ADRs are append-only history.

### Tier 2: Full transcript — major deliberations only

Trigger any one of:
- `--full` flag was used (11-member council)
- More than one cross-examination round was needed (Phase 3 looped)
- Scott explicitly requested archival ("save the full debate", "keep this transcript")

Quick 3-member triads with a single round get **ADR only** — no Tier 2.

Write to `~/Sites/Global/scott-context/raw/sessions/<YYYY-MM-DD>-council-<topic-slug>/`:

| File | Contents |
|------|----------|
| `00-frame.md` | Phase 1 question, scope, decision anchor, members selected and rationale |
| `01-round1.md` | Each member's independent analysis (Phase 2) |
| `02-round2.md` | Cross-examination transcripts (Phase 3) |
| `03-round3.md` | Final positions and Socrates' last question (Phase 4) |
| `04-verdict.md` | The full verdict markdown block from Phase 4 |

The directory name uses the synthesis date, not the dispatch date. If a council spans days, use the date of the final round.

### Output to Scott

After persisting, append to the Phase 5 presentation:

```
Persisted:
- ADR: wiki/global/ADR-NNN-<slug>.md
- Full transcript: raw/sessions/<date>-council-<slug>/      (only if Tier 2 triggered)
```

If Scott previously said "ready to act on this" in Phase 5, persistence happens silently — confirm with the file paths only. If Scott deferred or rejected the verdict, still persist (the deliberation happened, history is history) — note the deferred status in the ADR's `Status` field as `Proposed` instead of `Decided`.
