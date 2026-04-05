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
section: tools
---

# Council Deliberation

Force structured disagreement between multiple analytical perspectives before reaching
a decision. The goal is to surface blind spots, not to reach consensus quickly.

## Core Principle

**Agreement is a bug.** When perspectives converge too quickly, the real complexity
hasn't been reached. This skill enforces dissent before allowing consensus.

## The Council Members

### Depth Thinkers (use Opus-tier reasoning)

| Member | Domain | Sees What Others Miss | Known Blind Spot |
|--------|--------|----------------------|-----------------|
| Socrates | Assumption destruction | Hidden premises everyone accepts | Spirals into infinite questioning |
| Aristotle | Categorization & structure | What category something actually belongs to | Over-classifies, misses emergence |
| Marcus Aurelius | Resilience & moral clarity | What you control vs what you don't | Too stoic, dismisses emotion |
| Lao Tzu | Non-action & emergence | When the solution is to stop trying | Too passive for urgent problems |
| Alan Watts | Perspective dissolution | When the problem IS the framing | Dissolves problems that need solving |

### Speed Thinkers (use Sonnet-tier reasoning)

| Member | Domain | Sees What Others Miss | Known Blind Spot |
|--------|--------|----------------------|-----------------|
| Feynman | First-principles debugging | Unexplained complexity hiding real costs | Misses forest for trees |
| Sun Tzu | Adversarial strategy | Terrain and competitive dynamics | Sees enemies everywhere |
| Ada Lovelace | Formal systems & abstraction | What can/cannot be mechanized | Over-formalizes messy human problems |
| Machiavelli | Power dynamics & realpolitik | How actors actually behave | Cynical about genuine cooperation |
| Linus Torvalds | Pragmatic engineering | What ships vs what sounds good | Dismisses theoretical elegance |
| Miyamoto Musashi | Strategic timing | The decisive moment to act | Can over-wait for "perfect" timing |

### The 6 Polarity Pairs

- **Socrates vs Feynman**: Destroy top-down vs rebuild bottom-up
- **Aristotle vs Lao Tzu**: Classify everything vs the categories are the problem
- **Sun Tzu vs Aurelius**: Win the external game vs govern the internal one
- **Ada vs Machiavelli**: Formal abstraction vs messy human incentives
- **Torvalds vs Watts**: Ship concrete solutions vs question whether the problem exists
- **Musashi vs Torvalds**: Wait for the perfect moment vs ship it now

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

## Deliberation Protocol

Read `references/council-protocol.md` for the full 5-phase protocol:
- Phase 1: Frame the Decision [STOP]
- Phase 2: Round 1 - Independent Analysis [AUTO]
- Phase 3: Round 2 - Cross-Examination [AUTO] (with anti-recursion and anti-convergence)
- Phase 4: Round 3 - Synthesis [AUTO] (verdict construction)
- Phase 5: Present to Scott [STOP]

## When to Use vs When Not To

**Use for**: Complex decisions with real trade-offs. Architecture choices, strategic
pivots, build-vs-buy, pricing, timing decisions.

**Don't use for**: Clear correct answers, simple technical choices, obvious decisions.

**Don't use --full when a triad covers the domain.** 11 members consume significant
context. A triad (3 members) covers most decisions well.
