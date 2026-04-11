---
name: scott:update-toolkit
description: >-
  Update the scott-toolkit itself using the guided workflow.
  Walks through 6 phases: Review Trigger, Identify Files, Draft Changes,
  Update CHANGELOG, Update Instructions & PDF, and Commit & Push.
user_invocable: true
invocation_hint: /scott:update-toolkit - Update the scott-toolkit with new lessons or patterns
section: learning
---

# Toolkit Update

## Metadata
- Last updated: 2026-04-05
- Version: 1.4
- Changelog:
  - v1.4: Add .changes-drafted file-system gate after Phase 3 (Draft Changes)
  - v1.3: Add v5 directory awareness (checks/, tools/, config/) to Phase 2 ripple effects
  - v1.2: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE])
  - v1.1: Add Phase 5 -- auto-update instructions doc and regenerate PDF after every toolkit change
  - v1.0: Initial workflow

## Purpose
Update the toolkit based on lessons learned, bug discoveries, new tool versions,
or retro insights. This keeps the toolkit current and accurate.

Use this when Scott says "update the toolkit" or after a retro identifies changes,
or when a new version of a technology is released.

## Prerequisites
- A specific reason to update (retro findings, bug pattern, version update)
- The toolkit repo at ~/Sites/Global/scott-toolkit/

## Instructions for Claude Code
Be surgical. Only change what needs changing. Every change should have a clear
reason documented in the changelog. Don't "improve" things that don't need improving.

## Phase 1: Review Trigger [STOP]

### What this phase does
Understand what prompted this update.

### Questions to ask Scott
1. What triggered this update?
   - A retro identified changes needed?
   - A bug was discovered that a skill should document?
   - A tool has a new version?
   - Something else?
2. Do you have specific files in mind, or should I identify them?
3. How big is this update? (One file tweak, or multiple files?)

### Output
A clear scope statement: "Updating [X] because [Y]."

### Done when
The scope of the update is defined.

## Phase 2: Identify Files to Update [STOP]

### What this phase does
Determine exactly which files need changes.

### Steps
1. Based on the trigger, identify affected files
2. For each file, describe the change needed
3. Check for ripple effects:
   - If a template changes, do workflow skills that reference it need updating?
   - If a reference skill changes, do templates that link to it need updating?
   - If a check file changes, do test fixtures need updating?
   - If a command is renamed, does `config/interfaces.json` need updating?
   - If a new tool is added to `tools/`, does `setup.sh` need to deploy it?
   - Are there cross-references that need to stay consistent?

### Output
A table of files and changes:

| File | Change | Reason |
|------|--------|--------|
| [path] | [what to change] | [why] |

### Done when
Scott approves the change list.

## Phase 3: Draft Changes [STOP]

### What this phase does
Make the edits.

### Steps
1. For each file:
   a. Read the current content
   b. Make the change
   c. Update the file's metadata:
      - Last updated: [today's date]
      - Version: [increment]
      - Changelog: Add entry
   d. Show the change to Scott
   e. Get approval

### Output
Updated files with metadata changes.

### Done when
All changes are made and approved.

**Gate:** Write `.changes-drafted` marker in the toolkit root after changes approved.

## Phase 4: Update CHANGELOG.md [AUTO]

### What this phase does
Add an entry to the toolkit's changelog.

### Format
```markdown
## v1.X.X - YYYY-MM-DD
- [description of change 1]
- [description of change 2]
- Triggered by: [what prompted this update]
```

### Done when
Changelog entry is added.

## Phase 5: Update Instructions & Regenerate PDF [AUTO]

### What this phase does
Keep the user-facing instructions document in sync with the toolkit. This phase
runs after every toolkit update — no exceptions.

### Files
- Source: `docs/user-guide.md` (in toolkit repo)
- Output: `docs/user-guide.pdf` (same location)

### Steps
1. Read the current `docs/user-guide.md`
2. Review all changes made in Phases 2-4 and determine what sections of the
   instructions need updating:
   - New hooks → update the "Hooks that fire on their own" table
   - New skills/commands → update the "Slash Commands" table
   - New guard hooks → update the "Guard hooks" list
   - New auto-generated files → update the "Files that write themselves" table
   - Changed paths → update all path references
   - New rules → update the "Behavior rules always loaded" table
   - New "Coming Soon" items or completed items → update that section
   - Changed directory structure → update "Quick Reference: What Lives Where"
3. Make the edits to the markdown file
4. Generate a styled HTML version and convert to PDF:
   ```bash
   node ~/.claude/tools/pdf-tools/html-to-pdf.js <html-file> docs/user-guide.pdf
   ```
5. Delete the intermediate HTML file
6. Visually verify the PDF renders correctly (spot-check 1-2 pages)

### Output
Updated `docs/user-guide.md` and freshly generated `docs/user-guide.pdf`.

### Done when
The instructions doc reflects all changes made in this update and the PDF is regenerated.

## Phase 6: Commit & Push [AUTO]

### What this phase does
Save the changes and sync so both machines have the update.

### Steps
1. Stage all changed files
2. Commit with a descriptive message: "Update [files]: [reason]"
3. Push to GitHub

### Output
Changes committed and pushed.

### Done when
Both machines can pull the latest toolkit.

## Completion Checklist
- [ ] Trigger and scope defined
- [ ] Files to update identified
- [ ] Changes made and approved
- [ ] File metadata updated (version, date, changelog)
- [ ] CHANGELOG.md updated
- [ ] docs/user-guide.md updated to reflect changes
- [ ] docs/user-guide.pdf regenerated
- [ ] Changes committed and pushed

- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
