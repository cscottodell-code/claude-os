# Toolkit Update

## Metadata
- Last updated: 2026-02-25
- Version: 1.0
- Changelog:
  - v1.0: Initial workflow

## Purpose
Update the toolkit based on lessons learned, bug discoveries, new tool versions,
or retro insights. This keeps the toolkit current and accurate.

Use this when Scott says "update the toolkit" or after a retro identifies changes,
or when a new version of a technology is released.

## Prerequisites
- A specific reason to update (retro findings, bug pattern, version update)
- The toolkit repo at ~/scott-toolkit/

## Instructions for Claude Code
Be surgical. Only change what needs changing. Every change should have a clear
reason documented in the changelog. Don't "improve" things that don't need improving.

## Phase 1: Review Trigger

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

## Phase 2: Identify Files to Update

### What this phase does
Determine exactly which files need changes.

### Steps
1. Based on the trigger, identify affected files
2. For each file, describe the change needed
3. Check for ripple effects:
   - If a template changes, do workflow skills that reference it need updating?
   - If a reference skill changes, do templates that link to it need updating?
   - Are there cross-references that need to stay consistent?

### Output
A table of files and changes:

| File | Change | Reason |
|------|--------|--------|
| [path] | [what to change] | [why] |

### Done when
Scott approves the change list.

## Phase 3: Draft Changes

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

## Phase 4: Update CHANGELOG.md

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

## Phase 5: Commit & Push

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
- [ ] Changes committed and pushed

- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
