# Recommended Actions: Turning Research Into Work

## Why this section exists

A research report that ends with "interesting findings" forces the reader to translate findings into work themselves. Every time. That translation is the most valuable and most-skipped step.

The Recommended Actions section closes the loop. Every high-confidence finding produces at least one concrete next step that Scott can act on Monday morning. Every action ships with a ready-to-paste prompt so the next agent doesn't have to reconstruct context.

The goal: Scott finishes the report and has a clear list of work he can start immediately, queue for later, or explore further. No re-reading. No prompt-crafting. Just copy, paste, go.

---

## Action Types Catalog

Pick the type that fits each finding. Not every finding needs every type. Skip what does not fit.

### Build Training

**When to use:** A finding directly informs how to train Advosy or Savvynth (Bresco) reps. Could be a new module, a revision, or a coaching focus.

**Card content:**
- What specific training to build
- Which finding(s) support it
- Audience (new reps, experienced reps, managers)
- Format (role-play, worksheet, one-pager, live coaching)

### Create Skill

**When to use:** A finding or cluster is rich enough to become a reusable Claude skill. Something Scott would invoke repeatedly across contexts.

**Card content:**
- What the skill does
- Trigger conditions (when would Scott use it)
- Findings that feed it
- Where it lives (claude-os/skills/, advosy/, savvynth/, etc.)

### Deep Dive

**When to use:** A subtopic surfaced during research that deserves its own full research run. The current report only scratched the surface.

**Card content:**
- Specific subtopic
- Why it needs its own report (which question is unanswered)
- Finding(s) that flagged the gap
- Suggested research angle

### NotebookLM Prep

**When to use:** Findings rich enough that feeding source material into NotebookLM produces audio overviews, deeper synthesis, or connections text-based analysis misses. Useful for commute listening.

**Card content:**
- Sources to compile
- Question to orient the session
- Output format (audio overview, deep dive, Q&A)
- Findings needing deeper synthesis

### Build Process

**When to use:** A finding maps directly to a BOPs framework and should become a documented, systematized process. EIB Protocol in action.

**Card content:**
- Process to build
- BOPs framework that applies (EIB, Value Stream, Entrainment, Hard Rules, Issue Log, etc.)
- What it replaces (ad hoc decisions, gut feeling, nothing)
- Where it lives (Advosy playbook, Savvynth platform, personal system)

### Write Document

**When to use:** A finding should become a playbook, one-pager, reference doc, memo, or any deliverable people other than Scott will read.

**Card content:**
- Document type
- Who reads it
- Format (markdown, PDF, Notion page)
- Findings feeding it

### Test/Experiment

**When to use:** A finding suggests a hypothesis worth testing in real conditions before broad rollout. Good for moderate-confidence findings (3 of 5) or where research disagrees with Scott's experience.

**Card content:**
- Hypothesis
- Test method (A/B test, pilot with one rep, shadow analysis)
- Success metric and timeframe
- Finding(s) suggesting the experiment

### Council Deliberation

**When to use:** A research finding hits a strategic decision Scott needs to weigh from multiple perspectives. Especially when discrepancies appear between lenses, or when the decision is hard to reverse.

**Card content:**
- The decision question
- Suggested council triad (or "default" for the standard 5)
- Findings that frame the question

---

## Mode-conditional action sets

Action types and counts vary by mode. Match the mode to keep output proportional to the research depth.

| Mode | Action count | Action types favored | Notes |
|---|---|---|---|
| **Decision** | 6-12 | All types eligible | Full action set with mix of Do Now / Queue / Explore |
| **Learning** | 2-4 | Deep Dive, NotebookLM Prep, Write Document | Learning produces knowledge artifacts more than direct work |
| **Tech** | 2-4 | Build Process, Test/Experiment, Write Document, Create Skill | Tech actions are concrete and runnable |
| **Quick** | 0-2 | Deep Dive primarily ("worth a full Decision-mode research?") | Quick is exploratory; if a Decision is warranted, that IS the action |
| **Deep** | 4-8 per session + cross-cutting "domain actions" | Build Training, Create Skill, Deep Dive, Build Process | Deep mode also produces "domain actions" stored in `index.md`: longer-horizon work that spans sessions |

If a mode's action count exceeds these bounds, prune to the most decision-relevant.

## Priority Assignment

| Priority | Criteria |
|---|---|
| **Do Now** | High confidence (Strongly Supported), directly applicable, clear execution path, no dependencies |
| **Queue** | High confidence but needs prep work, has dependencies, or requires other people's input |
| **Explore** | Moderate confidence (Congruencies or Unique Ideas), needs more research or testing before committing resources |

Rules of thumb:
- "Build Training" actions on strongly supported findings are almost always Do Now
- "Deep Dive" actions are usually Queue (need to schedule research time)
- "Test/Experiment" actions are usually Explore (hypothesis needs validation)
- "NotebookLM Prep" actions are usually Queue (need to compile material)
- "Council Deliberation" actions on discrepancies are usually Do Now (the disagreement is the signal)
- "Create Skill" depends on how well-defined the scope is

In Quick mode, the dominant action is "run a full Decision-mode research on [topic] if [condition]." This is the natural escalation path from exploratory scan to committed research.

---

## How to Generate Actions

After completing the synthesis and the Connections pass, scan findings one more time with this question: **"If Scott were going to act on this research starting Monday, what would he actually do?"**

**Step 1:** Start with Strongly Supported findings. Each should produce at least one action. Informational findings without action implications are fine; not every finding has to become work.

**Step 2:** Check Discrepancies. Unresolved disagreements often suggest Test/Experiment, Deep Dive, or Council Deliberation actions.

**Step 3:** Check Unique Ideas. These often suggest Test/Experiment since they have limited corroboration but high potential.

**Step 4:** Check the Connections section. Every BOPs mapping should have a matching Build Process action. Every Eleanor connection should have a Build Training, Create Skill, or Write Document action.

**Step 5:** Check for knowledge gaps. Thin lenses suggest Deep Dive or NotebookLM Prep.

**Step 6:** Prioritize. Aim for a mix:
- 2-4 Do Now
- 3-5 Queue
- 2-3 Explore

If everything is Do Now, the action set is unrealistic. If everything is Explore, the research did not produce enough actionable findings.

Total: 6-12 actions per report.

---

## Sourcing Constraints

Actions are how research turns into commitment of Scott's time and money. They cannot be backed by weak evidence. The following rules are hard, not soft.

### Eligibility rule

Every action's "Supports findings" list must reference at least one finding that meets one of these conditions:

1. The finding is classified Strongly Supported in the synthesis, OR
2. The finding is backed by at least one verified T1 source, OR
3. The finding is backed by at least two verified T2 sources from different domains.

If none of an action's supporting findings meet the eligibility rule, the action is **not allowed**. Drop it.

### What this excludes

- Actions sourced only from Weakly Supported findings.
- Actions sourced only from T3 (aggregator) clusters.
- Actions sourced from findings that were paraphrased from search snippets because all fetch attempts failed (these are excluded from the source table at the lens level, but residual paraphrased content sometimes survives into Unique Ideas; do not act on it).
- Actions sourced from findings whose only verified sources came from a single domain or single author (these are flagged as "single-sourced, widely repeated" by Phase 3 Step 2; treat them as informational, not actionable).

### Tier evidence requirement on the action card

Every action's "Supports findings" entry must include the tier evidence, formatted as:

`F[number] (short label, [tier breakdown])`

Examples:
- `F1 (status quo bias is #1 lost-deal cause, 2xT1 + 1xT2)`
- `F3 (loss-frame outperforms gain-frame, 1xT1 + 3xT2)`
- `F7 (membership pricing produces 23% LTV lift, Strongly Supported, 4 lenses)`

Tier evidence makes it visible at-a-glance whether an action is well-sourced. Reviewing the report a month later, Scott can tell which actions were built on solid ground without re-reading the full lens output.

### When in doubt

If an action would be valuable but no finding clears the eligibility rule, the right move is a **Deep Dive** action (queue research to surface T1/T2 evidence first), not a direct action sourced on weak grounds.

---

## Markdown Card Format

Each action card in the RESEARCH.md uses this structure. Note the prompt is in a fenced code block so Scott can copy-paste it directly into a new Claude session.

````markdown
### Action N: [Specific, descriptive title]

- **Type:** [Build Training | Create Skill | Deep Dive | NotebookLM Prep | Build Process | Write Document | Test/Experiment | Council Deliberation]
- **Priority:** [Do Now | Queue | Explore]
- **Supports findings:** F1 (short label, tier breakdown), F3 (short label, tier breakdown)
- **What:** [2-3 sentence description: what to do, why, and how]

**Prompt to start:**

```
[A complete, specific prompt that Claude can act on. Include:
- The action type and what to produce
- Specific task scope and deliverables
- Reference to relevant findings from this RESEARCH.md
- Any context needed to start without follow-up questions]
```
````

Two formatting rules for the prompt block:
1. The outer fence (around the card) must use four backticks if the inner prompt is a triple-backtick code block. Otherwise the inner code block breaks the outer.
2. The prompt should reference the RESEARCH.md by filename. Example: "Reference findings F1 and F3 from RESEARCH-sales-psychology-2026-05-05.md."

## Prompt-template starting points

Use these as the opening line of the inner prompt. Customize the rest.

| Type | Prompt opens with |
|---|---|
| Build Training | "Build a training module for Advosy reps on [topic]. Audience is [who]. Format is [what]. Include..." |
| Create Skill | "Create a Claude skill called '[name]' that [does what]. Trigger conditions: [when Scott would use it]. It lives in [path]." |
| Deep Dive | "Use /scott:research to investigate [subtopic]. Focus on [angle]. This builds on findings from..." |
| NotebookLM Prep | "Use /scott:notebooklm to compile a notebook on [topic]. Output type: [audio/chat/study]. Sources to include..." |
| Build Process | "Use /scott:bops to build a documented process for [what]. Apply the [framework] from BOPs. It replaces..." |
| Write Document | "Write a [format] called '[title]' for [audience]. Include..." |
| Test/Experiment | "Design an experiment to test [hypothesis]. Method: [how]. Success metric: [what]. Duration: [timeframe]." |
| Council Deliberation | "Use /scott:council to deliberate on [decision question]. Triad: [default or specified]. The research found..." |

---

## Example action card

````markdown
### Action 1: Build a status-quo-bias diagnostic for Advosy reps

- **Type:** Build Process
- **Priority:** Do Now
- **Supports findings:** F1 (status quo bias is #1 lost-deal cause, 40% of pipeline, Strongly Supported, 2xT1 + 3xT2), F3 (loss-frame outperforms gain-frame 2.3x, 1xT1 + 2xT2)
- **What:** Apply the BOPs EIB Protocol to systematize objection handling. Build a 5-question diagnostic that fires when an objection appears, mapping it to its psychological root and providing the matched talk track. Replaces gut-feel responses currently in use.

**Prompt to start:**

```
Use /scott:bops to build a documented process for handling sales objections at Advosy. Apply the EIB Protocol to make it systematic.

Inputs:
- The 6 most common objections from Q1 2026 sales calls (collect from Claimsforce or ask Sarah)
- The status-quo-bias and loss-aversion findings from RESEARCH-sales-psychology-2026-05-05.md (F1 and F3)

Outputs:
- A one-page diagnostic flowchart (objection -> psychological root -> talk track)
- Talk tracks per objection type (3-5 sentences each, conversational tone)
- Logging mechanism in Issue/Error Log format so we can track which talk tracks work over 30 days

Constraint: process must be runnable by a rep with under 60 seconds of training. The flowchart goes on their desk.
```
````

This format, when followed across 6-12 actions per research run, turns every report into a queued backlog of executable work.
