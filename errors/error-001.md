# Error #001: Stale Job Title in CLAUDE.md Propagated Across Session

**Date:** 2026-03-16
**Project:** scott-toolkit (Greene library skills)

## What Happened
Claude repeatedly used "Head of training and development for sales" instead of "Head of Sales" when writing NotebookLM prompts and SKILL.md files. Scott had to manually correct the prompt before running it. The old title also propagated into four new skill files before being caught.

## The Triggering Prompt
```
Rank the top 20 strategies by relevance to this person's context:
- Head of training and development for sales at a home services company
```

## What Went Wrong
**Category:** Context Error
**Root cause:** CLAUDE.md line 3 still said "Head of training and development for sales" (the old title). Claude reads this at session start and anchors on it. The old title was also present in 5 other config files (advosy-company-structure.md, cowork-global-instructions.md, team-contacts.md, Advosy/CLAUDE.md, scott-presentation SKILL.md).
**Surface symptom:** NotebookLM prompts and skill files all used the wrong title. Scott had to correct it himself.

## What The Prompt Should Have Been
```
Rank the top 20 strategies by relevance to this person's context:
- Head of sales at a home services company
```

## Prevention
1. When Scott's role or title changes, grep ALL config files (CLAUDE.md, cowork-global, team-contacts, company-structure, project CLAUDE.md files, skill descriptions) for the old title and update them all at once
2. Treat CLAUDE.md as the source of truth for Scott's identity. If it's wrong, everything downstream will be wrong.
3. When writing prompts that describe Scott, verify against CLAUDE.md rather than relying on memory or assumptions

## Pattern Check
- **Seen before?** Yes, Scott has corrected this before (he mentioned it)
- **Added to toolkit?** Yes, all 7 files fixed this session. CLAUDE.md is now the corrected source of truth.
