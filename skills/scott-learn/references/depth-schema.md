# Depth Metadata Schema

## Frontmatter Format

Every wiki page that participates in the depth tracking system has YAML frontmatter:

```yaml
---
depth: findable        # findable | understood | internalized | applied
notebook_id: null      # NotebookLM notebook slug for this topic, null if none created yet
last_reviewed: null    # ISO date of last review session, null if never reviewed
next_review: null      # ISO date when next review is due, null if not scheduled
review_count: 0        # total number of review sessions
streak: 0              # consecutive successful reviews
exploration:           # which session types have been completed
  overview: false
  vocabulary: false
  quiz: false
  application: false
  connection: false
  teaching: false
mastery_phase: apprenticeship  # apprenticeship | creative | mastery (Greene phases)
history: []            # array of review records and consumption events
mastery_notes: ""      # free-text notes about current understanding gaps
---
```

## Field Definitions

### depth (required)
Current depth level. Progression: findable --> understood --> internalized --> applied.

| Level | Meaning | Promotion criteria |
|---|---|---|
| findable | You know it exists | Auto-promotes after first overview session |
| understood | You grasp the why | Can explain without reference. 2 successful recalls. |
| internalized | Can teach and adapt | Can apply to novel situations. 3 successful applications across contexts. |
| applied | Behavior has changed | Evidence of real-world application. |

### notebook_id (optional)
Slug of the primary NotebookLM notebook for this topic. One notebook per topic, lifelong — sources accumulate over time. `null` if no notebook has been created yet.

Forking a notebook (via `--fork` or one of the 5 trigger conditions) does NOT change this ID; the fork becomes a new wiki page with its own `notebook_id`. The original page keeps pointing at the original notebook.

Used by `scott-notebooklm` to detect existing notebooks before creation and to log `consumption` events back to the right wiki page.

### Spaced repetition schedule

| After successful review | Next review in |
|---|---|
| 1st | 2 days |
| 2nd | 5 days |
| 3rd | 12 days |
| 4th | 30 days |
| 5th+ | 60 days |

Failed review resets next_review to 2 days from now.

### history (array of records)

Two record shapes share the array, distinguished by `type`:

**Review records** (logged via `/scott:learn --log` — these CAN promote depth):
```yaml
- date: 2026-04-18
  type: quiz           # overview | vocabulary | quiz | application | connection | teaching
  result: pass          # pass | partial | fail
  notes: "Got EIB right but confused backgroundize with automate"
  promoted: false       # true if this session triggered a depth promotion
  promoted_from: null   # previous depth level if promoted
  promoted_to: null     # new depth level if promoted
```

**Consumption events** (logged when a standalone `scott-notebooklm` session runs — these do NOT promote depth):
```yaml
- date: 2026-04-26
  type: consumption
  notebook_id: "claude-api-tool-use"   # which notebook was consumed (may differ from page's primary if forked)
  output_type: audio                    # audio | chat | study | reference | none
  notes: "Listened to 12-min audio overview while driving"
```

Consumption events are append-only breadcrumbs of engagement. They never set `promoted`, `result`, or any depth field. Depth advances only through `/scott:learn --log` with a rating.

### mastery_phase (Greene mapping)

| Phase | When |
|---|---|
| apprenticeship | depth is findable or understood |
| creative | depth is internalized |
| mastery | depth is applied |

## Which pages get depth metadata?

Not every wiki page needs depth tracking. Add it to pages that represent:
- Frameworks and methodologies (BOPs, Atomic Habits, Mastery, EOS)
- Technical concepts Scott is learning (SurrealDB patterns, Nuxt patterns)
- Business knowledge worth internalizing (sales methodology, market analysis)
- Principles and mental models

Do NOT add it to:
- Meeting notes
- Decision records (ADRs)
- Project status pages
- People profiles
- Log files (index.md, log.md)
- Raw source files
