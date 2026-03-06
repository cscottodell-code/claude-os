# Log Error

## Metadata
- Last updated: 2026-03-05
- Version: 1.1
- Changelog:
  - v1.1: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE])
  - v1.0: Initial workflow

## Purpose
Capture a mistake or failure in the moment, while context is fresh. Instead of
waiting for a retro to remember what went wrong, this workflow logs the exact
triggering prompt, root cause, and prevention strategy right away.

Use this when something goes wrong — bad output from Claude, a prompt that
backfired, a context mistake, or a harness/skill issue. Also use when the
debug workflow reveals the bug was caused by a user error (not a code bug).

## Prerequisites
- Something just went wrong in a Claude Code session
- The conversation history still contains the failure context

## Instructions for Claude Code
Walk Scott through each phase conversationally. You have access to the current
conversation, so use it — reference specific messages, prompts, and outputs.
Be specific, not generic. The goal is a log entry that's useful months from now.

After logging, check if this error matches a previous pattern in ~/scott-toolkit/errors/.
If it does, flag it — recurring patterns need toolkit changes, not just logs.

## Phase 1: Review Context [STOP]

### What this phase does
Claude reviews the recent conversation to identify what went wrong.

### Steps
1. Scan the last 10-20 messages for the failure point
2. Identify the moment things went off track
3. Present a 2-3 sentence summary to Scott: "Here's what I think happened..."

### Output
A clear description of what went wrong, presented for Scott's confirmation.

### Done when
Scott confirms the summary is accurate (or corrects it).

## Phase 2: Interview Scott [STOP]

### What this phase does
Ask targeted questions to capture the full picture. These are NOT generic —
tailor them to what actually happened.

### Questions to ask Scott
1. What were you trying to accomplish when this happened?
2. What was the prompt you gave (or can I pull it from the conversation)?
3. What did you expect Claude to do?
4. What did Claude actually do instead?
5. Did you notice it going wrong in real-time, or only after?
6. Was there context Claude was missing? (A file it didn't read, a rule it didn't know?)
7. Have you seen this kind of mistake before?
8. On a scale of 1-5, how much time did this cost you?

### Output
Answers to the relevant questions (skip any that don't apply).

### Done when
Scott has provided enough detail to understand the root cause.

## Phase 3: Trace the Trigger [STOP]

### What this phase does
Identify the exact prompt or action that triggered the failure.

### Steps
1. Find the specific prompt in the conversation that led to the bad outcome
2. Copy it verbatim (or ask Scott to confirm)
3. Categorize the failure:
   - **Prompt Error** — the prompt was unclear, missing context, or misleading
   - **Context Error** — Claude had wrong/outdated info in CLAUDE.md, MEMORY.md, or skills
   - **Harness Error** — a skill, template, or hook caused the issue
4. Write a rewritten version of the prompt that would have avoided the issue

### Output
The triggering prompt (verbatim), failure category, and rewritten prompt.

### Done when
The trigger is identified and categorized.

## Phase 4: Log It [AUTO]

### What this phase does
Create the log file and update the metadata counter.

### Steps
1. Read ~/scott-toolkit/errors/_metadata.json to get the next ID
2. Create the log file using the template below
3. Increment the counter in _metadata.json
4. Check ~/scott-toolkit/errors/ for similar past errors — flag any patterns

### Log template

```markdown
# Error #[ID]: [Short Descriptive Name]
**Date:** [Date]
**Project:** [Project name]

## What Happened
[2-3 sentences]

## The Triggering Prompt
\```
[Exact prompt - verbatim]
\```

## What Went Wrong
**Category:** Prompt Error / Context Error / Harness Error
**Root cause:** [specific]
**Surface symptom:** [what Scott saw]

## What The Prompt Should Have Been
\```
[Rewritten prompt]
\```

## Prevention
1. [Specific action for next time]
2. [CLAUDE.md or skill change if applicable]

## Pattern Check
- **Seen before?** Yes/No
- **Added to toolkit?** Yes/No — [what was added]
```

### Output
Log file saved at ~/scott-toolkit/errors/error-[ID].md

### Done when
Log file is created and metadata is updated.

## Completion Checklist
- [ ] Failure accurately described
- [ ] Triggering prompt captured verbatim
- [ ] Failure categorized (Prompt / Context / Harness)
- [ ] Rewritten prompt drafted
- [ ] Prevention steps identified
- [ ] Log file created in ~/scott-toolkit/errors/
- [ ] Metadata counter incremented
- [ ] Checked for recurring patterns

- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
