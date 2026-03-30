---
name: scott-council
description: |
  Multi-perspective decision deliberation skill inspired by the Council of High Intelligence.
  Spawns 3-11 subagents as historical thinkers arranged in polarity pairs, runs a structured
  3-round protocol (independent analysis, cross-examination, synthesis), and produces a
  verdict with explicit disagreements, minority reports, and recommended next steps.

  Can receive RESEARCH.md from /scott:research as input context for evidence-based decisions.

  Use this skill whenever Scott says "council on X", "deliberate on X", "help me decide X",
  "what should we do about X", "weigh the options on X", or any variation of wanting
  structured multi-perspective deliberation before making a decision. Also use when Scott
  wants to feed research output into a decision process, or when facing architecture choices,
  strategic pivots, build-vs-buy, pricing decisions, or any complex trade-off.
user_invocable: true
invocation_hint: /scott:council <question> - Deliberate a decision from multiple perspectives
input_examples:
  - "/scott:council should we consolidate d2d-payroll into advosy-sales now?"
  - "/scott:council --triad architecture monorepo or polyrepo for Bresco?"
  - "/scott:council --from-research ~/Sites/Global/research/RESEARCH-memberships-2026-03-28.md"
  - "/scott:council --triad product what pricing model for Advosy memberships?"
---

# Council Deliberation

Force structured disagreement between multiple analytical perspectives before reaching
a decision. The goal is to surface blind spots, not to reach consensus quickly.

Inspired by the [Council of High Intelligence](https://github.com/0xNyk/council-of-high-intelligence)
by Nyk (CC0 licensed), adapted for Scott's toolkit conventions.

## Core Principle

**Agreement is a bug.** When perspectives converge too quickly, it usually means the
real complexity hasn't been reached. This skill enforces dissent before allowing consensus.

---

## The Council Members

### Depth Thinkers (use Opus-tier reasoning)

| Member | Domain | Sees What Others Miss | Known Blind Spot |
|--------|--------|----------------------|-----------------|
| Socrates | Assumption destruction | Hidden premises everyone accepts | Spirals into infinite questioning |
| Aristotle | Categorization & structure | What category something actually belongs to | Over-classifies, misses emergence |
| Marcus Aurelius | Resilience & moral clarity | What you control vs what you don't | Can be too stoic, dismisses emotion |
| Lao Tzu | Non-action & emergence | When the solution is to stop trying | Can be too passive for urgent problems |
| Alan Watts | Perspective dissolution | When the problem IS the framing | Can dissolve problems that need solving |

### Speed Thinkers (use Sonnet-tier reasoning)

| Member | Domain | Sees What Others Miss | Known Blind Spot |
|--------|--------|----------------------|-----------------|
| Feynman | First-principles debugging | Unexplained complexity hiding real costs | Can miss forest for trees |
| Sun Tzu | Adversarial strategy | Terrain and competitive dynamics | Sees enemies everywhere |
| Ada Lovelace | Formal systems & abstraction | What can and cannot be mechanized | Over-formalizes messy human problems |
| Machiavelli | Power dynamics & realpolitik | How actors actually behave vs how they should | Cynical about genuine cooperation |
| Linus Torvalds | Pragmatic engineering | What ships vs what sounds good | Dismisses theoretical elegance |
| Miyamoto Musashi | Strategic timing | The decisive moment to act | Can over-wait for "perfect" timing |

### The 6 Polarity Pairs

These pairs are deliberate counterweights. Each position has a structural opponent:

- **Socrates vs Feynman**: Destroy top-down vs rebuild bottom-up
- **Aristotle vs Lao Tzu**: Classify everything vs the categories are the problem
- **Sun Tzu vs Aurelius**: Win the external game vs govern the internal one
- **Ada vs Machiavelli**: Formal abstraction vs messy human incentives
- **Torvalds vs Watts**: Ship concrete solutions vs question whether the problem exists
- **Musashi vs Torvalds**: Wait for the perfect moment vs ship it now

---

## Pre-defined Triads

Use `--triad <name>` to select a pre-built 3-member group:

| Triad | Members | Best For |
|-------|---------|----------|
| architecture | Aristotle + Ada + Feynman | System design, structure, formalism |
| strategy | Sun Tzu + Machiavelli + Aurelius | Market moves, competitive positioning |
| ethics | Aurelius + Socrates + Lao Tzu | Right vs right dilemmas, values |
| debugging | Feynman + Socrates + Ada | Root cause analysis, assumptions |
| innovation | Ada + Lao Tzu + Aristotle | New product thinking, emergence |
| conflict | Socrates + Machiavelli + Aurelius | Negotiations, stakeholder tensions |
| complexity | Lao Tzu + Aristotle + Ada | When the problem feels intractable |
| risk | Sun Tzu + Aurelius + Feynman | Threat assessment, resilience |
| shipping | Torvalds + Musashi + Feynman | Ship-or-wait decisions |
| product | Torvalds + Machiavelli + Watts | Pricing, positioning, features |
| founder | Musashi + Sun Tzu + Torvalds | Timing, market entry, execution |

---

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
- [Member]: [Their unique contribution]

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
[Note which findings from RESEARCH.md were most relevant to the deliberation,
and which were challenged or contradicted by the council]
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

---

## When to Use vs When Not To

**Use for**: Complex decisions where trade-offs are real. Architecture choices. Strategic
pivots. Build-vs-buy. Pricing models. Timing decisions. Any question where you already
have an opinion but suspect you're missing something.

**Don't use for**: Questions with clear correct answers. Simple technical choices.
Anything where the answer is obvious and you just need to do it.

**Don't use --full when a triad covers the domain.** 11 members consume significant
context and subscription budget. A triad (3 members) covers most decisions well.

---

## Edge Cases

**All members agree immediately**: Trigger anti-convergence. If they still agree after
the counterfactual round, the consensus is genuine and high-confidence.

**No majority after all 3 rounds**: Present the dilemma honestly. The council does not
force artificial consensus. Sometimes the right answer is "this is genuinely uncertain."

**Scott disagrees with the verdict**: The council is advisory. The minority report might
contain exactly what Scott was sensing. Point him there.

**Research contradicts council reasoning**: Flag it explicitly. "The Academic lens found X,
but Torvalds argues Y based on practical experience. The tension is real."

