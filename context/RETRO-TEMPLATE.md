# Retrospective: [Project Name]

## Metadata
- Last updated: YYYY-MM-DD
- Version: 1.0
- Project: [name]
- Milestone: [which milestone, or "full project"]

<!--
WHAT THIS IS: A post-project (or post-milestone) review that captures what you
learned. The lessons from this retro feed back into the toolkit, making the next
project better.

WHY IT MATTERS: Without retros, you repeat the same mistakes. With them, every
project is better than the last. This is the engine that makes the toolkit improve
over time.

HOW TO USE: Run through this with Claude Code using the retro workflow skill.
Claude Code will review the project's CLAUDE.md and PRD, then walk you through
each section with prompting questions.
-->

---

## 1. Project Summary

<!--
PROMPTING QUESTIONS:
- What did you build? (One paragraph)
- How long did it take? (Rough estimate)
- Desktop, web, or both?
- What milestone(s) were completed?
-->

- **What was built:** [one paragraph summary]
- **Time spent:** [rough estimate]
- **Deployment target:** Desktop / Web / Both
- **Milestones completed:** [list]

---

## 2. What Went Well

<!--
PROMPTING QUESTIONS:
- What parts of the build went smoothly?
- Were there any "aha" moments where something worked better than expected?
- Which toolkit skills or templates were most helpful?
- What patterns do you want to reuse in future projects?

Be specific. "The build went fine" is not useful. "The PRD template forced me to
think through the data model before coding, which saved time in Milestone 1" is useful.
-->

- [specific thing that went well and why]
- [another thing]
- [another thing]

**Skills/templates that helped most:**
- [which ones and how they helped]

---

## 3. What Went Wrong

<!--
PROMPTING QUESTIONS:
- What caused the most frustration or wasted time?
- Did Claude Code get anything wrong repeatedly?
- Were there any missing skills or references that would have helped?
- Was there information you wish Claude Code had known from the start?
- Did the PRD miss anything important?

Again, be specific. "Some things were annoying" is not useful. "Claude Code kept
using SSR features in a Tauri project because the CLAUDE.md didn't explicitly say
not to" is useful and fixable.
-->

- [specific thing that went wrong and why]
- [another thing]
- [another thing]

**Biggest time sink:** [what ate the most time unnecessarily]
**Root cause:** [why it happened]

---

## 4. Lessons Learned

<!--
WHAT THIS IS: The most important section. Specific, actionable takeaways that
prevent future mistakes.

FORMAT: "Next time, do X instead of Y because Z"

This format is important because:
- "Next time" makes it forward-looking (not dwelling on the past)
- "do X instead of Y" makes it specific and actionable
- "because Z" explains the reasoning (so the rule can be adapted, not just followed blindly)

EXAMPLE:
  - Next time, explicitly state "ssr: false" in the CLAUDE.md constraints section
    instead of only putting it in nuxt.config.ts, because Claude Code reads CLAUDE.md
    first and may not check config files
  - Next time, define all SurrealDB table relationships in the PRD data model section
    instead of figuring them out during implementation, because changing relationships
    mid-build requires touching multiple files
-->

- Next time, [do X] instead of [Y] because [Z]
- Next time, [do X] instead of [Y] because [Z]
- Next time, [do X] instead of [Y] because [Z]

---

## 5. Toolkit Updates Needed

<!--
WHAT THIS IS: Concrete changes to the toolkit based on lessons learned.
These get applied during the retro workflow.

PROMPTING QUESTIONS:
- Based on the lessons above, which skill files need updating?
- Are any new skills needed that don't exist yet?
- Do any templates need changes?
- Should any new reference documents be added?

FORMAT: Be specific about what file needs what change.

EXAMPLE:
  - UPDATE skills/reference/tauri-nuxt.md: Add section about Tauri v2
    capabilities/permissions system. We hit this during Milestone 2 and had
    to research it from scratch.
  - UPDATE templates/PRD-TEMPLATE.md: Add a question in the Data Model section
    about graph edges vs record links, since this decision affected our query
    patterns significantly.
  - NEW skills/reference/pinia-patterns.md: We ended up needing complex Pinia
    store patterns that aren't documented anywhere in the toolkit.
-->

| Action | File | Change Needed | Reason |
|--------|------|--------------|--------|
| UPDATE / NEW | [file path] | [what to change] | [why] |
| UPDATE / NEW | [file path] | [what to change] | [why] |

---

## 6. Patterns Discovered

<!--
WHAT THIS IS: Reusable code, architecture, or query patterns that emerged during
this project and are worth documenting for future use.

PROMPTING QUESTIONS:
- Did you discover any code patterns worth reusing?
- Any architectural patterns that worked well?
- Any SurrealQL query patterns that were tricky to figure out?
- Any component composition patterns worth saving?

EXAMPLE:
  Code pattern: Optimistic updates with rollback
  ```typescript
  // In composable: update local state immediately, revert if server fails
  const original = [...items.value]
  items.value = items.value.filter(i => i.id !== id)
  try {
    await db.delete(id)
  } catch {
    items.value = original
    toast.add({ title: 'Delete failed', color: 'red' })
  }
  ```

  SurrealQL pattern: Paginated query with total count
  ```surql
  LET $total = (SELECT count() FROM claim GROUP ALL)[0].count;
  LET $items = SELECT * FROM claim ORDER BY created_at DESC LIMIT $limit START $offset;
  RETURN { total: $total, items: $items };
  ```
-->

### Code Patterns
- **[Pattern name]:** [description and code example]

### Architecture Patterns
- **[Pattern name]:** [description]

### SurrealQL Patterns
- **[Pattern name]:** [query example and explanation]
