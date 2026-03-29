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
- **Standalone**: does its own lightweight research (original behavior, for quick topics)

## Prerequisites

- `notebooklm` CLI installed and authenticated (`notebooklm login` if needed)
- Verify with: `notebooklm status`

## Phase 1: Determine Mode [STOP]

### If --from-research path is provided
1. Read the RESEARCH.md file
2. Confirm the topic and lens coverage with Scott
3. Ask about audience and tone:
   - "Who's the audience? Just you, or sharing with others?"
   - "How technical should it be?"
4. Skip to Phase 2 (no research needed)

### If standalone (no --from-research)
1. Ask Scott to describe the topic and what angle he wants:
   - "What do you want to learn about or understand better?"
   - "Any specific angles you want covered?"
   - "Who's the audience? Just you, or sharing with others?"
   - "How technical should it be?"
2. Suggest: "Want to run `/scott:research` first for more rigorous findings? Or is this a quick topic where lightweight research is fine?"
3. If Scott wants full research, stop and tell him to run `/scott:research <topic> --notebooklm`
4. If standalone is fine, proceed with lightweight research below

### Done when
Scott confirms mode, topic, and tone.

## Phase 1.5: Lightweight Research (standalone mode only) [AUTO]

Only runs when NOT using --from-research. This is the original research approach.

### Steps
1. **Dispatch parallel research subagents** (up to 3) to cover different aspects:
   - For **codebase topics**: Read the actual files deeply
   - For **external topics**: Web search for recent articles, official docs, expert opinions
   - For **hybrid topics**: Combine both
2. Research should gather facts, examples, comparisons, motivations, trade-offs
3. Aim for enough material to write 5-10 substantial source documents

### Done when
Research is comprehensive enough to write all planned source documents.

## Phase 2: Plan Source Documents [AUTO]

### From research mode
When working from a RESEARCH.md, map lens sections to source documents:
- Combine related lenses that are under 1,500 words (e.g., Historical + Academic = one doc)
- Keep strong lenses (High confidence, 4+ sources) as standalone documents
- The Research Summary becomes Document 1 (overview)
- Weak lenses can be folded into related stronger lenses or omitted
- The Connections section becomes the final comparison/context doc (if present)
- Target: 5-10 documents, each 1,500-4,000 words

### Standalone mode
Design 5-10 focused source documents. Each should:
   - Cover one distinct angle of the topic
   - Stand alone as a useful document
   - Cross-reference other documents where relevant
   - Be 1,500-4,000 words (NotebookLM's sweet spot)

2. The document set should follow this general pattern:
   - **Document 1**: Big picture overview (what is this, why does it exist, who's it for)
   - **Documents 2-N**: Deep dives into specific aspects (one topic per doc)
   - **Final document**: Comparison/context (how does this compare to alternatives, where does it fit in the bigger picture)

3. Present the document plan to Scott as a table:

   | # | File | Title | Covers |
   |---|------|-------|--------|
   | 1 | 01-overview.md | ... | ... |

### Adjust
- For narrower topics: 5-6 documents is fine
- For broad topics: up to 10 documents
- Always have an overview doc first and a comparison/context doc last

### Done when
Document plan looks good. Proceed immediately (this is [AUTO]).

## Phase 4: Write Source Documents [AUTO]

### Steps
1. Create the output directory: `~/Sites/Personal/notebooklm-<topic-slug>/`
   - Slugify the topic: lowercase, hyphens, no special chars
   - Example: "SurrealDB v3" → `notebooklm-surrealdb-v3`

2. Write each source document as a markdown file. Writing guidelines:
   - **Technical but accessible**: Explain concepts clearly without oversimplifying
   - **Concrete examples**: Use real names, real code snippets, real numbers
   - **Analogies**: Use spreadsheet analogies when explaining to Scott (his background)
   - **Third person for the subject, second person for the reader**: "The toolkit does X" + "When you run Y"
   - **No filler**: Every paragraph should contain information, not padding
   - **Cross-references**: "As covered in the hooks document..." to help NotebookLM connect ideas
   - **Include key code snippets** where they illuminate design, but don't dump entire files

3. Each document should have:
   - A clear H1 title (this becomes the source title in NotebookLM)
   - Logical sections with H2 headers
   - Tables where comparison data is involved
   - Code blocks where technical details matter

### Done when
All source documents are written to the output directory.

## Phase 5: Create Notebook and Upload [AUTO]

### Steps
1. Create the notebook:
   ```bash
   notebooklm create "<Topic Name> Deep Dive"
   ```

2. Set it as active:
   ```bash
   notebooklm use <notebook-id>
   ```

3. Upload all source documents:
   ```bash
   cd ~/Sites/Personal/notebooklm-<topic-slug>/
   for f in *.md; do notebooklm source add "$f"; done
   ```
   Note: Upload sequentially, not in parallel. The CLI needs each upload to complete.

4. Configure the chat persona:
   ```bash
   notebooklm configure --mode detailed --response-length longer --persona "<persona>"
   ```
   The persona should be tailored to the topic. Template:
   ```
   You are a technical expert who deeply understands <topic>. When answering
   questions, reference specific details from the sources — names, patterns,
   examples, and design decisions. Use concrete examples. Connect individual
   details to the bigger picture. The audience is Scott O'Dell — a Head of
   Sales at a home services company who builds software with AI assistance.
   He understands technical concepts but appreciates clear explanations with
   real-world analogies.
   ```

### Done when
Notebook created, all sources uploaded, chat configured.

## Phase 6: Generate Audio Overview [AUTO]

### Steps
1. Craft a custom audio prompt. The prompt should:
   - Set the narrative frame (what makes this topic interesting)
   - List 4-6 key angles to cover (from the document plan)
   - Include specific examples to reference (actual names, patterns, stories)
   - Set the tone (analytical, impressed, educational, etc.)
   - Tell the hosts to use concrete details from the sources, not generic descriptions

   Template structure:
   ```
   Create a deep, engaging conversation about <topic>. <1-2 sentences of context about why this matters and who built/uses it.>

   Key angles to hit:

   1. <ANGLE NAME>: <What to discuss, what specific example to use>
   2. <ANGLE NAME>: <What to discuss, what specific example to use>
   ...

   Tone: <Describe desired tone>. Use specific examples from the sources
   (<list 3-4 concrete things to reference>). Make it feel like <description
   of desired feel>.
   ```

2. Generate the audio:
   ```bash
   notebooklm generate audio --format deep-dive --length long "<custom prompt>"
   ```
   Note: Do NOT use `--wait` as it times out. The audio takes 10-20 minutes.

3. Poll for completion:
   ```bash
   notebooklm artifact list
   ```
   Check every 2 minutes until status changes from `in_progress`/`pending` to `completed`.

4. Download when ready:
   ```bash
   notebooklm download audio ~/Sites/Personal/notebooklm-<topic-slug>/<topic-slug>-deep-dive.wav
   ```

5. Report the file size and path to Scott.

### Done when
Audio file downloaded and path reported.

## Phase 7: Summary [STOP]

Present a summary:

```
## NotebookLM Deep Dive Complete

**Topic:** <topic>
**Notebook:** <name> (<id>)
**Sources:** <count> documents (<total words> words)
**Audio:** <title> (<file size>)
**Location:** ~/Sites/Personal/notebooklm-<topic-slug>/

**Source documents:**
| # | File | Words | Covers |
|---|------|-------|--------|
| 1 | ... | ... | ... |

**Chat configured:** <mode>, custom persona for <topic>
**Audio prompt highlights:** <2-3 key angles>

Play: open <audio-path>
Chat: notebooklm.google.com
```

### Done when
Scott confirms the overview is good, or requests adjustments (regenerate audio with different prompt, add more sources, etc.).

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
