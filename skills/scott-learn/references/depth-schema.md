# Depth Metadata Schema

## Frontmatter Format

Every wiki page that participates in the depth tracking system has YAML frontmatter:

```yaml
---
depth: findable        # findable | understood | internalized | applied
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
history: []            # array of review records
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

Each entry:
```yaml
- date: 2026-04-18
  type: quiz           # overview | vocabulary | quiz | application | connection | teaching
  result: pass          # pass | partial | fail
  notes: "Got EIB right but confused backgroundize with automate"
  promoted: false       # true if this session triggered a depth promotion
  promoted_from: null   # previous depth level if promoted
  promoted_to: null     # new depth level if promoted
```

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
