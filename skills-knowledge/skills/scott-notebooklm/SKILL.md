---
name: scott:notebooklm
description: |
  Create a NotebookLM notebook on any topic with explicit output choice and fork detection.

  Three input modes:
  1. **From research** (preferred): Receives a RESEARCH.md from /scott:research and converts
     its 10-lens findings into source documents.
  2. **Standalone**: Lightweight research via `notebooklm source add-research`. Use for
     topics Scott already understands well.
  3. **From /scott:learn**: Receives topic, session type, and context docs from the learning
     skill. Suggests output type based on session type but ALWAYS confirms with Scott.

  Five output choices, always asked: Audio | Chat | Study (quiz/flashcards/study-guide) |
  Reference (sources only) | None (notebook + sources + persona, no artifact). Never assumes.

  Detects when a notebook for the topic already exists and suggests forking based on
  staleness, source-count, output-type mismatch, or wiki-page splits. Scott decides each
  time: fork, extend, or override. Force a fork anytime with `--fork`.

  Standalone notebooklm sessions log a consumption event to the wiki page's history[]
  but do NOT promote depth. Depth promotion only via /scott:learn --log.

  Use when Scott says "prepare a notebooklm about X", "make me a notebooklm on X",
  "deep dive on X", "podcast about X", "study materials on X", or any variation of
  wanting a NotebookLM resource. Also triggers when Scott passes --notebooklm to
  /scott:research, or when /scott:learn dispatches with --learning flag.
user_invocable: true
invocation_hint: /scott:notebooklm <topic> [--output audio|chat|study|reference|none] [--from-research path] [--learning] [--fork] - Create a NotebookLM notebook with explicit output choice
input_examples:
  - "/scott:notebooklm --from-research ~/Sites/Global/scott-context/raw/research/global/RESEARCH-memberships-2026-03-28.md"
  - "/scott:notebooklm context engineering best practices"
  - "/scott:notebooklm how SurrealDB v3 works --output none"
  - "/scott:notebooklm the scott-toolkit --fork"
  - "/scott:notebooklm atomic habits --output chat"
  - "/scott:notebooklm --learning --type quiz --topic bops"
section: tools
---

# NotebookLM

Create a NotebookLM notebook on any topic. Always confirms output type — never assumes.

## Entry Points

- **From research**: `--from-research <path>` skips to Phase 2 using an existing RESEARCH.md
- **Standalone**: lightweight research via `notebooklm source add-research`
- **From learn**: `--learning` flag with topic, session type, context docs from /scott:learn

## Output Types (always asked)

| Type | What you get |
|---|---|
| **Audio** | AI podcast deep dive |
| **Chat** | Configured Socratic Q&A persona |
| **Study** | Native quiz, flashcards, or study-guide artifact |
| **Reference** | Sources only, no artifact |
| **None** | Notebook + sources + persona configured, no artifact generated |

Never default to audio. Never assume from topic. Always ask.

## Fork Detection

When a notebook for the topic already exists, the system suggests forking if any trigger
fires (see `references/creation-workflow.md` Phase 0.5):

1. Source count >40 (approaching plan tier limits)
2. Topic has split into sub-pages on the wiki since last session
3. Output type differs from existing notebook's persona
4. Notebook >6 months old AND source count >10
5. Studio prompt would conflict with existing chat history's persona

When triggered: *"Notebook X exists with N sources. I suggest forking because [trigger].
Fork, extend, or override?"* Scott decides each time. `--fork` flag forces a fork.

## Consumption Logging

Every notebook session (any mode) appends a `consumption` event to the wiki page's
`history[]` and sets `notebook_id` if not present. This does NOT promote depth.
Depth advances only via `/scott:learn --log`.

## Prerequisites

- `notebooklm` CLI installed and authenticated (`notebooklm login` if needed)
- Verify with: `notebooklm status`
- Command reference: `references/cli-cheatsheet.md`

## Workflow

Read `references/creation-workflow.md` for the full workflow:

- Phase 0.5: Fork Detection [STOP]
- Phase 1: Determine Mode and Output Type [STOP]
- Phase 1.5: Lightweight Research (standalone only) [AUTO]
- Phase 2: Plan Source Documents [AUTO]
- Phase 3: Configure Persona and Studio Prompt [AUTO]
- Phase 4: Write Source Documents [AUTO]
- Phase 5: Create Notebook and Upload [AUTO]
- Phase 6: Generate Output [AUTO] — skipped if output type is None
- Phase 7: Summary + Consumption Log [STOP]

## Troubleshooting

- **Auth expired**: Run `notebooklm login` (interactive)
- **Long-running generation**: Use the subagent pattern (see Phase 6). Never poll in main conversation.
- **Source upload fails**: Check file size; split large files if needed
- **Rate limited**: Wait 5-10 min, retry. See `references/cli-cheatsheet.md` for full error tree.
- **Need full CLI reference**: Run `notebooklm skill install` to restore the official skill alongside this one.

## Completion Checklist

- [ ] Fork decision made (if existing notebook detected)
- [ ] Topic and angles confirmed (or received from /scott:learn)
- [ ] Output type explicitly confirmed: audio | chat | study | reference | none
- [ ] Research completed (codebase, web, or `source add-research`)
- [ ] Source documents written (5-10 files, 1,500-4,000 words each, if needed)
- [ ] NotebookLM notebook created (or extended/forked per Phase 0.5)
- [ ] All sources uploaded and processed (status: ready)
- [ ] Chat persona configured (tailored to output type and topic)
- [ ] Studio prompt crafted (tailored to session type if learning)
- [ ] Output generated (or skipped if None)
- [ ] notebook_id added to wiki page frontmatter
- [ ] Consumption event appended to wiki page history[]
- [ ] Summary presented to Scott
