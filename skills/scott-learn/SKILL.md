---
name: scott:learn
description: |
  Learning operations manager for Scott's Knowledge Engine. Prepares NotebookLM
  sessions, tracks depth progression, and shows learning progress. Does NOT run
  learning sessions itself. NotebookLM is the learning environment.

  Use when Scott says "prep my learning", "what should I study", "log my learning",
  "how am I progressing", "what's overdue", or any variation of wanting to engage
  with the depth engine. Also triggers when Scott says /scott:learn.
user_invocable: true
invocation_hint: /scott:learn [--prep|--today|--log|--progress|--overdue|--phase <domain>]
input_examples:
  - "/scott:learn --prep"
  - "/scott:learn --prep --type quiz --topic bops"
  - "/scott:learn --today"
  - "/scott:learn --log"
  - "/scott:learn --progress"
  - "/scott:learn --overdue"
  - "/scott:learn --phase bops"
section: tools
---

# Scott's Learning Engine

Manages the depth progression system for Scott's Knowledge Engine.
All learning sessions happen in NotebookLM. This skill prepares them and tracks results.

## Commands

### --prep (prepare tomorrow's session)

Prepares a NotebookLM learning session. Can be run manually or via cron.

**Steps:**
1. Scan all wiki pages with depth metadata frontmatter
2. Apply session selection logic (see `references/session-types.md`)
3. Pick 3-5 topics and assign session types
4. For each topic:
   a. Gather source material from wiki pages
   b. If Application or Connection type: write a "Scott's Context" source doc
   c. Write any additional source docs needed
5. Create NotebookLM notebook: `notebooklm create "Learning Session YYYY-MM-DD"`
6. Upload source docs: `notebooklm source add <file>`
7. Configure persona and studio prompt based on session types
8. Report what was prepped:

```
Learning session prepped for tomorrow:

| # | Topic | Type | Depth | Why |
|---|-------|------|-------|-----|
| 1 | EIB Protocol | quiz | understood | Overdue by 3 days |
| 2 | Karpathy Wiki | overview | findable | New capture, first engagement |
| 3 | Value Stream Mapping | application | understood | Ready for transfer test |

Notebook: "Learning Session 2026-04-19" (ready in NotebookLM)
Estimated time: 15-20 min
```

**Flags:**
- `--type <type>`: Force a specific session type (overview|vocabulary|quiz|application|connection|teaching)
- `--topic <topic>`: Force a specific topic (matches wiki page title, case-insensitive)
- `--scope single|related|cross-domain`: Control topic scoping
- No flags: system picks based on schedule and selection logic

### --today (show what's ready)

Quick check of what's been prepped.

1. Look for the most recent prep output (NotebookLM notebook created today or yesterday)
2. Show the session summary table
3. Show daily brief highlights if `raw/briefs/YYYY-MM-DD-daily.md` exists
4. Show streak and weekly completion rate

### --log (record session results)

After Scott completes a session in NotebookLM, log the results.

1. Ask: "How did today's session go? You can:"
   - Describe it conversationally
   - Give a quick rating per topic: pass / partial / fail
   - Paste a NotebookLM chat export (if available)
2. For each topic covered:
   - Update `last_reviewed` to today
   - Update `review_count` += 1
   - Calculate `next_review` based on spaced repetition schedule
   - Update `streak` (increment on pass, reset on fail)
   - Append to `history` array
   - Update `exploration` (mark session type as completed)
   - Check promotion criteria: if met, promote depth level
   - Update `mastery_phase` if depth changed
   - Update `mastery_notes` with any gaps identified
3. Write changes to wiki page frontmatter
4. Report:

```
Session logged!

| Topic | Result | Depth | Change | Next review |
|-------|--------|-------|--------|-------------|
| EIB Protocol | pass | understood | stayed | Apr 23 |
| Karpathy Wiki | pass | understood | promoted from findable! | Apr 20 |
| Value Stream Mapping | partial | understood | stayed | Apr 20 |

Streak: 13 days
This week: 5/7 (71%)

Notes: "VSM application was partial. Scott applied waste identification correctly
but missed the distinction between value-enabling and pure waste. Schedule another
application session in 2 days."
```

### --progress (progression dashboard)

Show the full learning dashboard:

1. Read depth metadata from all tracked wiki pages
2. Calculate and display:
   - Depth distribution (bar chart in ASCII)
   - Breakdown by context (personal/bops, advosy/*, etc.)
   - Current streak and weekly completion rate
   - Topics overdue for review
   - Recent promotions (last 14 days)
   - Exploration depth per topic (session types completed, coverage %)
   - Mastery phase assessment per domain
   - Monthly CBE comparison (if enough history)
   - Identity reinforcement message

### --overdue (quick overdue check)

1. Find all topics where today > next_review
2. Sort by how overdue they are
3. Display as a simple list with days overdue

### --phase <domain> (mastery phase assessment)

Assess Scott's mastery phase for a domain using Greene's framework:

1. Find all wiki pages in the specified context
2. Analyze depth distribution across those pages
3. Map to Greene's phases (Apprenticeship/Creative/Mastery)
4. Report evidence and growth edges
5. Suggest next steps aligned with the current phase

## Reference Files

- `references/depth-schema.md` - Depth metadata schema and spaced repetition rules
- `references/session-types.md` - Session type definitions, studio prompts, selection logic

## Integration

### With /scott:notebooklm
`--prep` dispatches to `/scott:notebooklm` with `--learning` flag when creating notebooks.
The notebooklm skill handles notebook creation, source upload, and persona configuration.

### With BOPs
Daily learning is a keystone habit in the Lights Spreadsheet. The 70% rule applies:
- 100% weekly: increase difficulty (system adds harder session types or more topics)
- <70% for two weeks: decrease difficulty (fewer topics, simpler types, shorter sessions)

### With Atomic Habits
- Two-Minute Rule: on bad days, accept "open NotebookLM, answer one question" as a valid session
- Never Miss Twice: one skip is noted, two skips triggers intervention
- Phase scaling: Week 1-2 of a new domain = 5-10 min sessions. Week 3-4 = 15 min. Week 5+ = full 15-30 min.
- Habit stack: pour coffee --> open NotebookLM --> session --> /scott:learn --log --> check daily brief

### With Mastery (Greene)
- `--phase` command maps directly to Greene's phases
- Session types align with mastery progression
- Deep Observation principle: system starts with overview, never jumps to testing
- Move Toward Resistance: system prioritizes weak areas over comfortable ones
