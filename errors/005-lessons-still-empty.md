---
resolved: true
---
# Error #005: lessons.md Still Empty After Third Session

**Date:** 2026-03-22
**Project:** Bresco

## What Happened
The RETRO.md from the previous session explicitly flagged "lessons.md was never updated" as a failure mode. The CLAUDE.md rule says "Update tasks/lessons.md after EVERY phase." This session fixed 31 code bugs, resolved 51 test failures, discovered schema load-order dependencies, hit 6 doom-loop iterations, and encountered 14 distinct mistakes. Not a single lesson was captured in tasks/lessons.md. The file still says "(No lessons yet. Project hasn't started building.)"

## The Triggering Prompt
```
(No specific prompt — this is a failure of omission. No prompt triggered it because no prompt was ever issued to update lessons.md.)
```

## What Went Wrong
**Category:** Harness Error
**Root cause:** lessons.md updates are a CLAUDE.md rule, not a workflow gate. Rules can be forgotten. The retro identified this exact gap and recommended making it a workflow step, but that toolkit update was never applied. The rule exists in three places (CLAUDE.md, claude-behavior.md, RETRO.md) and was violated in all three sessions.
**Surface symptom:** Zero institutional memory captured across 3 sessions of intensive work. Every new session starts from scratch.

## What The Prompt Should Have Been
```
(After EVERY bug fix or correction, automatically)
"Adding to tasks/lessons.md: [what happened], [why], [what to do differently]"
```

## Prevention
1. This is the THIRD occurrence. Rules alone don't work. This needs a hook or workflow gate.
2. Add a pre-completion hook that checks `tasks/lessons.md` modified date. If it hasn't been updated this session and the session includes code fixes, block completion.
3. Or: add lessons.md update as a mandatory step in the `superpowers:verification-before-completion` checklist.
4. Immediately after this error log: actually populate tasks/lessons.md with lessons from THIS session.

## Pattern Check
- **Seen before?** Yes, three times now. Session 1: empty. Session 2 retro flagged it. Session 3: still empty.
- **Added to toolkit?** The RULE exists everywhere. It needs ENFORCEMENT (hook or gate), not another rule.
