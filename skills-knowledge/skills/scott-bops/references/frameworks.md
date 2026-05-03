# Background Ops Frameworks - Complete Reference

Read this file when you need the full step-by-step process for a specific framework.
The SKILL.md has quick summaries; this file has the deep detail.

## Table of Contents
1. [Value Stream Mapping](#value-stream-mapping)
2. [EIB Protocol](#eib-protocol)
3. [Lights Spreadsheet](#lights-spreadsheet)
4. [Explore/Exploit](#exploreexploit)
5. [Pozen's Creative Process](#pozens-creative-process)
6. [Operational Entrainment](#operational-entrainment)
7. [Universal Principles](#universal-principles)
8. [Hard Rules](#hard-rules)
9. [Issue/Error Log](#issueerror-log)
10. [Meeting Protocol](#meeting-protocol)

---

## Value Stream Mapping

**Purpose:** Audit workflows by categorizing every step as value-producing, non-value-producing,
or waste. This must happen before any automation or backgroundizing.

### Process
1. **Draw out the current process** - Write down every single step on paper. Every handoff,
   every wait, every approval, every movement.
2. **Identify value** - Mark only the steps that directly shape the final product or service
   for the customer/end user.
3. **Identify waste** - Everything else: waiting, walking, unnecessary approvals, correcting
   errors, moving things between systems, processing that doesn't shape the product.
4. **Eliminate or streamline** - Relentlessly cut, combine, or automate the non-value steps.

### Key Questions
- "At what points do we make decisions that directly affect the product?"
- "When do we actually conduct important tests or analysis that impacts those decisions?"
- "Which of these steps actually end up shaping the final product?"
- "Are any of these steps just waiting, correcting, moving, or processing?" (If yes = waste)

### Cross-Domain Examples
| Domain | Application |
|--------|-------------|
| **Automation design** | Before building in n8n, map the current manual workflow. Identify which steps create value vs. which are just moving data between systems. |
| **Finance** | Sam Carpenter mapped a 53-step check deposit process, streamlined to 23 steps, then automated with a scanner. Saved 104 hours/year. |
| **Work processes** | Measure productivity by following the product being transformed, not by watching what people are doing. |

### The Critical Rule
You cannot measure productivity by looking at what a person is doing. You must follow
the progress of the actual product being transformed and ask which steps actively shaped it.

---

## EIB Protocol

**Purpose:** The core Background Operations loop for turning manual work into automatic processes.

### Process
1. **Explicate** - Pluck the process out of real-time existence. Write down every single step
   on paper. Make the implicit explicit. If you can't describe it, you can't improve it.
2. **Improve** - Now that you can see the whole process, eliminate waste, combine steps,
   streamline. Use Value Stream Mapping to identify what's actually producing value.
3. **Backgroundize** - Move the streamlined process into the background through:
   - Software automation (n8n workflows, scripts, scheduled tasks)
   - Habitual training (entrainment until it requires zero thought)
   - Delegation with written procedures

### Dependencies
- Step 1 (Explicate) must happen before Step 2 (Improve)
- Step 2 (Improve) must happen before Step 3 (Backgroundize)
- Value Stream Map should inform Step 2

### The Critical Rule
Never automate a broken process. If you skip straight to backgroundizing without
explicating and improving first, you just make a broken process run faster.

### Cross-Domain Examples
| Domain | Application |
|--------|-------------|
| **Health** | Explicate your morning routine → Improve by removing unnecessary steps → Backgroundize by drilling until it's automatic |
| **Finance** | Explicate expense reconciliation → Improve by combining steps → Backgroundize with auto-generated weekly tasks |
| **Work** | Explicate client onboarding → Improve by eliminating redundant approvals → Backgroundize with automation |

---

## Lights Spreadsheet

**Purpose:** A self-calibrating daily habit tracker. The "Ops Keystone" that ensures all
backgroundized operations are actually being maintained.

### Setup
1. Create a tracker where rows are target habits/tasks and columns are dates
2. Mark each cell Yes (green) or No (red) at end of day
3. Review success rate at end of week
4. Calibrate based on the 70% rule

### The 70% Calibration Rule
- **>70% success rate:** Add a new task or increase difficulty (e.g., meditation 5→10 min)
- **<70% for two consecutive weeks:** Remove tasks or make them easier (e.g., "run 5 miles" → "lace up shoes and go outside")
- **100% success rate:** The system is too easy. You are stagnating. Raise the bar.
- **Below 50%:** The keystone is too ambitious. Dramatically simplify.

### The Worst Week Rule
Your tracking system must:
- Take no more than 5-10 minutes per day
- Be simple enough to survive your worst, most exhausting week
- Use binary Yes/No, not nuanced scoring

### Why It Works
Removes reliance on memory and willpower. The 70% calibration keeps you at the exact
edge of your capabilities without demoralizing you. The green/red visual provides a
motivating feedback loop that replaces addictive dopamine loops (gaming, social media)
with productive ones.

---

## Explore/Exploit

**Purpose:** A decision model for when to capitalize on known gains (exploit) vs.
spend resources discovering new opportunities (explore).

### How to Decide
- **Boredom and mental fatigue** are evolutionary signals to shift from exploit to explore.
  Fatigue is not a loss of energy - it's an emotion that interrupts current behavior
  so alternative options can be entertained.
- **Feeling energized and productive** = exploit mode. Ride the wave.
- **Feeling stuck, restless, or diminishing returns** = explore mode. Try something new.

### Daily Application
- **Morning:** Exploit. Use fresh cognitive energy for decisive action on known priorities.
- **Evening:** Explore. Use natural fatigue as a prompt to learn, network, try new things.

### Seasonal Application
- Schedule explicit exploration time (quarterly or when energy shifts)
- During exploit phases, stack conversations with thriving people for motivation
- During explore phases, schedule daily outreach to new people or domains

### The 60% Rule
Schedule no more than 60% of your maximum possible output in a week. This ensures
adequate recovery during exploitation and leaves bandwidth for exploration.

### Addiction & Bad Habits Connection
When trying to quit an unhealthy behavior, ask:
- "What underlying needs is this activity meeting?" (mastery, rapid rewards, escape)
- "Where will that sense of mastery and rapid rewards come from if I quit?"
Replace the bad habit with a healthy exploration behavior that has a similar feedback loop.

### Cross-Domain Examples
| Domain | Application |
|--------|-------------|
| **Networking** | Carlos Miceli operationalized exploration: one Skype call every day with an interesting person. Built hundreds of connections. |
| **Work** | During exploit phases, focus exclusively on value-producing work. During explore phases, investigate new tools, markets, or approaches. |

---

## Pozen's Creative Process

**Purpose:** Prevent cognitive overload during creative work by strictly separating
planning from creating. The brain cannot plan and translate simultaneously - they
compete for the same limited working memory.

### The 5 Phases (Never Overlap)
1. **Brainstorm** - Generate as many ideas as possible without filtering or judging
2. **Categorize** - Group the unrelated ideas logically
3. **Outline** - Put categories into a sequence that maps the final product
4. **Write/Create** - Translate the outline into the first draft
5. **Edit** - Do not edit until the first draft is fully complete

### When Stuck
Stop creating immediately. Ask: "Okay, what am I trying to say here?"
This forces a micro-cycle back to brainstorm → categorize → outline, which
relieves working memory and breaks the block.

### Why It Works
Writer's block occurs because planning and translating simultaneously compete for
the same limited working memory. Separating them makes you twice as fast and
eliminates the paralysis of trying to do both at once.

### Cross-Domain Examples
| Domain | Application |
|--------|-------------|
| **Content creation** | Brainstorm all ideas for an article → Group into themes → Outline the flow → Write → Edit |
| **Strategy** | Brainstorm all possible approaches → Categorize by type → Sequence into a plan → Execute → Review |
| **Presentations** | Brainstorm key points → Group into sections → Outline slide flow → Build slides → Polish |

---

## Operational Entrainment

**Purpose:** A military-derived training system to ensure routine best practices
are followed automatically, especially under stress. For behaviors that cannot
be handed to software.

### Process
1. **Codify** - Write down the objective steps of the behavior
2. **Account for human nature** - Add explicit instructions for edge cases where
   humans naturally fail or get lazy (the boring parts, the "it probably won't happen" parts)
3. **Strip inessentials** - Remove bureaucratic steps to ensure the rule is actually usable
4. **Train** - Repeatedly drill the behavior until it requires zero thought
5. **Inspect and verify** - Test the system under stress to ensure it holds up

### Why It Matters
Sentry duty is boring and >99% of the time nothing happens, so people get lax.
The Carthaginians at Utica didn't follow known best practices for camp construction
and sentry duty because it was boring. Scipio exploited this, destroying 30,000 men
in a night fire attack.

### Cross-Domain Examples
| Domain | Application |
|--------|-------------|
| **Crisis response** | Pre-program exact steps for common emergencies so you don't freeze |
| **Error handling** | Drill the "log it immediately" response until it's automatic |
| **Team training** | Write procedures, then practice them under realistic conditions |

---

## Universal Principles

**Purpose:** Diagnose the root cause of recurring problems and codify fixed rules
to handle all future decisions of that type. Turns dozens of agonizing, minute-by-minute
decisions into a single, pre-made choice.

### Process
1. **Diagnose the problem** - Spend 15-60 minutes identifying the root cause.
   Focus on "what is" (current reality) before "what to do" (solution).
2. **Codify the problem** - Write it down clearly. Name the category.
   Ask: "Is this 'another one of those'?" to identify the broader class.
3. **Explore and codify solutions** - Write a universal rule that handles all
   future instances of this problem type.
4. **Operationalize** - Build tools, dashboards, or processes to enforce the principle.
5. **Entrain** - Practice invoking the rule until it's culturally embedded.

### The Critical Rule
Never prescribe before diagnosing. Moving in a nanosecond from identifying a tough
problem to proposing a solution is the most common failure mode. If an employee makes
an error, firing them (prescription) without diagnosing the system will only cause
other employees to hide their mistakes.

### Key Questions
- "What is the 'what is'?" (Objectively identify current reality)
- "Is this 'another one of those'?" (Identify the broader category)
- "What is the universal root cause?"
- "What rule can we codify to handle all future decisions of this type?"

### Cross-Domain Examples
| Domain | Application |
|--------|-------------|
| **Work** | Ray Dalio's Error Log at Bridgewater: log mistakes = safe, hide mistakes = trouble. Turned individual errors into system improvements. |
| **Management** | "We all eat the same dirt": total transparency (share P&Ls, salaries, cap tables) so everyone acts like an owner. |
| **Personal** | If you keep making the same mistake, extract a principle and codify it as a Hard Rule. |

---

## Hard Rules

**Purpose:** Replace ambiguous decisions with binary, non-negotiable rules.
Hard rules are superior to soft guidelines because they remove the need to think
about whether to follow them.

### Hard Rules from the Methodology

| Rule | Definition | When to Apply |
|------|-----------|---------------|
| **Hell Yeah or No** | If you feel anything less than 10/10 excitement, say no | Any new opportunity, project, or commitment |
| **The Admiration Test** | Would you want this person on a 3-day beach vacation after 14 intense workdays? | Evaluating clients, partners, collaborators |
| **Clean Separation** | One device exclusively for work, different device for leisure | Setting up workspace and routines |
| **Anathema** | Completely forbid specific bad habits rather than moderating | Quitting behaviors (start with least-liked vice first) |
| **The Worst Week Rule** | System must take <10 min/day and survive your worst week | Designing any tracking or habit system |
| **Error Logging** | If you log a mistake, you are safe. If you hide it, trouble. | Any error or mistake, at any level |
| **Overrule Power** | Any principle is only valid if the lowest-ranking person can invoke it to overrule the CEO | Creating team rules or policies |

### Soft Guidelines (Flexible)

| Guideline | Definition |
|-----------|-----------|
| **Skill of Quitting** | Build quitting muscles on easy wins before tackling favorite vices |
| **Explore/Exploit Signal** | Use boredom and fatigue as prompts to switch modes |
| **Max Sustainable Pace** | Schedule no more than 60% of maximum output |
| **Anticipate Reactance** | Under-schedule during first weeks of any new system |

### Why Hard > Soft
Thinking is expensive. Hard rules make a single first cut before you need to weigh
all the variables. They make the decision for you automatically, saving limited
cognitive capacity for the moments that actually require judgment.

---

## Issue/Error Log

**Purpose:** Track all execution errors transparently to improve the system,
not punish the individual.

### How It Works
1. When a bad outcome occurs, record: what happened, severity, who was responsible
2. The logging itself is the safety net - log it = safe, hide it = trouble
3. Review logs to find systemic patterns, not individual blame
4. Frequent errors in one area indicate a broken process, poor training,
   or skill mismatch, not necessarily a bad person

### Why It Matters
If mistakes are punished, people hide them. Hidden mistakes compound.
The system never improves. By making logging safe, you get transparency
and continuous improvement.

---

## Meeting Protocol

**Purpose:** Prevent meetings from degrading into "fatty degeneration" where
people talk in circles without making concrete decisions.

### Process
1. Set a strict agenda before the meeting begins
2. Start a 10-minute timer
3. When the timer goes off, a designated person writes down exactly what was decided
4. Repeat until the agenda is complete

### The 25% Rule
If anyone spends 25% or more of their time in meetings, the organization suffers
from "time-wasting malorganization." It means people don't have the information
or resources they need to do their jobs independently.

### Why It Works
Forces concrete decisions at regular intervals instead of open-ended discussion.
The act of writing down what was decided creates accountability and prevents
the same topics from being rehashed.
