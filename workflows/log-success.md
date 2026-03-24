# Log Success

## Metadata
- Last updated: 2026-03-05
- Version: 1.1
- Changelog:
  - v1.1: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE])
  - v1.0: Initial workflow

## Scope
**Supplementary workflow.** This is typically invoked as part of `/scott:phase-closeout`
(the reflect phase), not as a standalone workflow. Use standalone only for mid-session
captures outside of GSD phase boundaries.

**What belongs here:** Wins in prompting, context engineering, workflow design, or
skill effectiveness. Think "the toolkit or the approach worked exceptionally well."
**What does NOT belong here:** Normal task completion (that's just doing the work),
or project-specific patterns (capture in project's `tasks/lessons.md`).

## Purpose
Capture what went RIGHT in the moment, while context is fresh. Successes are
just as important to log as errors: they reveal which prompts, patterns, and
approaches work well so you can repeat them deliberately.

Use this when Claude nails something: a prompt that worked perfectly, a workflow
that saved significant time, or a pattern that should become standard.

## Prerequisites
- Something just went well in a Claude Code session
- The conversation history still contains the success context

## Instructions for Claude Code
Walk Scott through each phase conversationally. Reference specific messages and
outputs from the current conversation. Keep it quick — success logging should
feel rewarding, not like paperwork.

## Phase 1: Review Context [STOP]

### What this phase does
Claude reviews the recent conversation to identify what went well.

### Steps
1. Scan the last 10-20 messages for the success moment
2. Identify what made it work
3. Present a 2-3 sentence summary to Scott: "Here's what I think went well..."

### Output
A clear description of the success, presented for Scott's confirmation.

### Done when
Scott confirms the summary is accurate (or corrects it).

## Phase 2: Interview Scott [STOP]

### What this phase does
Ask targeted questions to understand why it worked.

### Questions to ask Scott
1. What were you trying to accomplish?
2. What about the result impressed you or saved you time?
3. Was this the first time you tried this approach, or have you refined it?
4. What context or setup made this possible? (A skill, a CLAUDE.md rule, a specific prompt style?)
5. Would this work in other projects too, or is it project-specific?
6. Should this become your standard approach going forward?

### Output
Answers to the relevant questions (skip any that don't apply).

### Done when
Scott has explained why it worked well enough to reproduce.

## Phase 3: Trace the Trigger [STOP]

### What this phase does
Identify the exact prompt or approach that led to the success.

### Steps
1. Find the specific prompt or action in the conversation that produced the good result
2. Copy it verbatim (or ask Scott to confirm)
3. Identify the key factor — what made the difference:
   - A well-structured prompt
   - Good context in CLAUDE.md or skills
   - The right workflow or approach
   - A specific tool or technique

### Output
The triggering prompt (verbatim) and key success factor.

### Done when
The trigger is identified and the key factor is clear.

## Phase 4: Log It [AUTO]

### What this phase does
Create the log file and update the metadata counter.

### Steps
1. Read ~/scott-toolkit/successes/_metadata.json to get the next ID
2. Create the log file using the template below
3. Increment the counter in _metadata.json

### Log template

```markdown
# Success #[ID]: [Short Descriptive Name]
**Date:** [Date]
**Project:** [Project name]

## What Worked
[2-3 sentences]

## The Triggering Prompt
\```
[Exact prompt - verbatim]
\```

## Why It Worked
**Key factor:** [what made the difference]
**Contributing factors:** [context, skill, approach]

## Reproducible?
- **Can repeat?** Yes/No
- **Should become standard?** Yes/No — [what to standardize]
```

### Output
Log file saved at ~/scott-toolkit/successes/[ID]-[short-description].md (e.g., 008-parallel-agent-strategy.md)

### Done when
Log file is created and metadata is updated.

## Completion Checklist
- [ ] Success accurately described
- [ ] Triggering prompt captured verbatim
- [ ] Key success factor identified
- [ ] Log file created in ~/scott-toolkit/successes/
- [ ] Metadata counter incremented
- [ ] Assessed whether this should become standard practice

- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
