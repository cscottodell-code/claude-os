---
name: scott:notebooklm
description: |
  Create a NotebookLM deep-dive audio overview on any topic. Two modes:

  1. **From research** (preferred): Receives a RESEARCH.md from /scott:research and converts
     its 10-lens findings into source documents for NotebookLM. Faster, more rigorous, no
     duplicate research.
  2. **Standalone** (quick topics): Does its own lightweight research when full 10-lens
     research is overkill. Use for topics Scott already understands well.

  Use when Scott says "prepare a notebooklm about X", "make me a notebooklm on X",
  "deep dive audio on X", "podcast about X", or any variation of wanting a NotebookLM
  audio overview. Also triggers when Scott passes --notebooklm to /scott:research.
user_invocable: true
invocation_hint: /scott:notebooklm <topic or --from-research path> - Create a NotebookLM audio deep dive
input_examples:
  - "/scott:notebooklm --from-research ~/Sites/Global/research/RESEARCH-memberships-2026-03-28.md"
  - "/scott:notebooklm context engineering best practices"
  - "/scott:notebooklm how SurrealDB v3 works"
  - "/scott:notebooklm the scott-toolkit"
---

# NotebookLM Deep Dive

Create a comprehensive NotebookLM audio overview on any topic.

Two entry points:
- **From research**: `--from-research <path>` skips to Phase 2 using an existing RESEARCH.md
- **Standalone**: does its own lightweight research (for quick topics)

## Prerequisites

- `notebooklm` CLI installed and authenticated (`notebooklm login` if needed)
- Verify with: `notebooklm status`

## Workflow

Read `references/creation-workflow.md` for the full 7-phase workflow:
- Phase 1: Determine Mode [STOP]
- Phase 1.5: Lightweight Research (standalone only) [AUTO]
- Phase 2: Plan Source Documents [AUTO]
- Phase 4: Write Source Documents [AUTO]
- Phase 5: Create Notebook and Upload [AUTO]
- Phase 6: Generate Audio Overview [AUTO]
- Phase 7: Summary [STOP]

## Troubleshooting

- **`notebooklm login`**: If auth expired, Scott needs to run this interactively
- **Audio stuck in `pending`**: Normal for long deep-dives. Can take 15-20 minutes. Keep polling.
- **Audio generation fails**: Try regenerating with a shorter prompt or `--length default`
- **Source upload fails**: Check file size (NotebookLM has limits). Split large files if needed.

## Completion Checklist
- [ ] Topic and angles confirmed with Scott
- [ ] Research completed (codebase + web as appropriate)
- [ ] Source documents written (5-10 files, 1,500-4,000 words each)
- [ ] NotebookLM notebook created
- [ ] All sources uploaded
- [ ] Chat persona configured
- [ ] Audio overview generated and downloaded
- [ ] Summary presented to Scott
