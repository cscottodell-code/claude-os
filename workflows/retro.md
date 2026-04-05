# Retrospective

## Metadata
- Last updated: 2026-04-05
- Version: 1.3
- Changelog:
  - v1.3: Replace inline context file list with shared _gather-project-context.md template
  - v1.2: Add GSD artifacts (.planning/STATE.md, ROADMAP.md, VERIFICATION.md) to Phase 1 context gathering
  - v1.1: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE])
  - v1.0: Initial workflow

## Scope
**Supplementary workflow.** This is typically invoked as part of `/scott:phase-closeout`
(the reflect phase) for GSD phase-level retros. Use standalone for full project or
milestone-level retrospectives that span multiple phases.

**Relationship to phase-closeout:** Phase-closeout produces error logs, success logs,
RETRO.md, and lessons.md for a single phase. This standalone retro workflow is for
bigger-picture reflection across an entire project or milestone.

## Purpose
Run a post-project or post-milestone retrospective. Captures what went well, what
went wrong, and feeds lessons back into the toolkit. This is the engine that makes
the toolkit improve over time.

Use this after finishing a project or completing a major milestone.

## Prerequisites
- A project with a CLAUDE.md and PRD.md
- At least one milestone completed
- Scott has time for a 15-20 minute reflection

## Instructions for Claude Code
Start by reading the project's CLAUDE.md, PRD.md, and tasks/lessons.md to understand
what was built and how it went. Then walk Scott through the reflection questions
conversationally. Draft each section, get approval, and move on.

The most important output is Section 5 (Toolkit Updates Needed) — this is how the
toolkit gets better.

## Phase 1: Gather Context [AUTO]

### What this phase does
Claude Code reviews the project artifacts to build a summary of what was built
and how it went.

### Files to read

**Standard context:** Read `~/Sites/Global/scott-toolkit/context/_gather-project-context.md` and gather all listed files.

**Retro-specific additions:**
- `~/Sites/Global/scott-toolkit/errors/` — any error logs captured during this project
- `~/Sites/Global/scott-toolkit/successes/` — any success logs captured during this project

### Output
A brief summary presented to Scott:
- "Here's what I understand was built: [summary]"
- "The original plan was: [from PRD]. Here's what actually happened: [from git/status]"
- "I see these lessons were captured during the build: [from lessons.md]"

### Done when
Scott confirms the summary is accurate.

## Phase 2: Guided Reflection [STOP]

### What this phase does
Walk Scott through the retro template questions to capture his thoughts.

### Questions to ask (grouped by section)

**What went well:**
1. What parts of the build went smoothly?
2. Were there any moments where something worked better than expected?
3. Which toolkit skills or templates were most helpful?
4. Any patterns you'd want to reuse?
5. Did you capture any success logs during this project? Let's review them.

**What went wrong:**
1. What caused the most frustration?
2. Did Claude Code get anything wrong repeatedly?
3. Were there any missing skills or references that would have helped?
4. Was there information you wish you'd had from the start?
5. Did you capture any error logs during this project? Let's review them.

**Lessons learned:**
1. Based on what went wrong, what would you do differently next time?
2. Help Scott phrase these as: "Next time, do X instead of Y because Z"

**Patterns discovered:**
1. Did any reusable code or query patterns emerge?
2. Any architectural patterns worth documenting?

### Output
Answers to all reflection questions, drafted into retro template format.

### Done when
Scott has reflected on all areas and is satisfied with the captured insights.

## Phase 3: Generate Retro Document [AUTO]

### What this phase does
Create the formal retro file using the RETRO-TEMPLATE.md format.

### Steps
1. Read ~/Sites/Global/scott-toolkit/context/RETRO-TEMPLATE.md
2. Fill in all sections using the answers from Phase 2
3. Save in TWO locations:
   a. Project repo: `RETRO.md` (or `retros/YYYY-MM-milestone-name.md` if multiple milestones)
   b. Toolkit: `~/Sites/Global/scott-toolkit/retros/YYYY-MM-project-name.md`
4. Update `~/Sites/Global/scott-toolkit/retros/_retro-index.md` with a summary entry

### Output
Retro document saved in both locations.

### Done when
Both copies saved and retro index updated.

## Phase 4: Identify Toolkit Updates [STOP]

### What this phase does
The most important phase. Based on the lessons learned, propose specific changes
to toolkit files.

### Steps
1. Review error logs in ~/Sites/Global/scott-toolkit/errors/ for recurring patterns that suggest a skill or template change
2. Review Section 5 (Toolkit Updates Needed) from the retro document
3. For each proposed update:
   a. Identify the specific file to change
   b. Describe the specific change needed
   c. Explain why this change would have helped
3. Present all proposed changes to Scott as a table
4. Get Scott's approval for each one

### Output
A list of approved toolkit changes with file paths and descriptions.

### Done when
Scott has approved or rejected each proposed change.

## Phase 5: Apply Updates [AUTO]

### What this phase does
Make the approved changes to the toolkit files.

### Steps
1. For each approved update:
   a. Read the current file
   b. Make the change
   c. Update the file's metadata (Last updated, Version, Changelog)
   d. Show the change to Scott
2. Update ~/Sites/Global/scott-toolkit/CHANGELOG.md with a new entry describing all changes
3. Commit all changes to the toolkit repo

### Output
Updated toolkit files with changelog entries.

### Done when
All approved changes are applied and committed.

## Completion Checklist
- [ ] Project context reviewed
- [ ] Reflection questions answered
- [ ] Retro document saved in project repo
- [ ] Retro document saved in ~/Sites/Global/scott-toolkit/retros/
- [ ] Retro index updated
- [ ] Toolkit updates identified and approved
- [ ] Toolkit updates applied
- [ ] CHANGELOG.md updated
- [ ] Toolkit changes committed

- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
