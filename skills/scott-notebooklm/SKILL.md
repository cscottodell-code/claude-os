---
name: scott:notebooklm
description: |
  Create a NotebookLM deep-dive audio overview on any topic. Researches the topic
  extensively, writes 5-10 focused source documents, creates a NotebookLM notebook,
  uploads the sources, configures the chat persona, and generates a long deep-dive
  audio overview with a custom prompt. Use when Scott says "prepare a notebooklm
  about X", "make me a notebooklm on X", "deep dive audio on X", "podcast about X",
  or any variation of wanting a NotebookLM audio overview on a topic. Also use when
  Scott mentions notebooklm, audio overview, or deep dive podcast.
user_invocable: true
invocation_hint: /scott:notebooklm <topic> - Research a topic and create a NotebookLM audio deep dive
input_examples:
  - "/scott:notebooklm context engineering best practices"
  - "/scott:notebooklm how SurrealDB v3 works"
  - "/scott:notebooklm the scott-toolkit"
  - "/scott:notebooklm Nuxt 4 app architecture"
---

# NotebookLM Deep Dive

Create a comprehensive NotebookLM audio overview on any topic. This skill handles
everything: research, source document creation, notebook setup, and audio generation.

## Prerequisites

- `notebooklm` CLI installed and authenticated (`notebooklm login` if needed)
- Verify with: `notebooklm status`

## Phase 1: Understand the Topic [STOP]

### Steps
1. Ask Scott to describe the topic and what angle he wants:
   - "What do you want to learn about or understand better?"
   - "Any specific angles you want covered? (how it works, comparison to alternatives, history, practical application)"
   - "Who's the audience? Just you, or sharing with others?"
   - "How technical should it be? (high-level overview, moderate depth, deep technical)"

2. Based on answers, identify:
   - **Core topic**: What's the main subject
   - **Angles**: 5-10 distinct aspects worth covering
   - **Sources of truth**: What should be researched (codebase, web, docs, files)
   - **Tone**: Technical depth and accessibility level

### Done when
Scott confirms the topic scope and angles.

## Phase 2: Research [AUTO]

### Steps
1. **Dispatch parallel research subagents** (up to 3) to cover different aspects:
   - For **codebase topics** (toolkit, a project, a technology Scott uses): Read the actual files deeply. Every hook, every config, every workflow.
   - For **external topics** (industry practices, a technology, a concept): Web search for recent articles, official docs, expert opinions, comparisons.
   - For **hybrid topics**: Combine both. Read Scott's implementation AND research how others approach it.

2. Research should gather:
   - Facts, architecture, how things work
   - Real examples and concrete details (not generic descriptions)
   - Comparisons and context (how does this relate to alternatives or industry norms)
   - Origin stories and motivations (why was this built/designed this way)
   - Strengths, weaknesses, and trade-offs
   - Expert opinions and notable quotes

3. Aim for enough material to write 5-10 substantial source documents.

### Done when
Research is comprehensive enough to write all planned source documents.

## Phase 3: Plan Source Documents [AUTO]

### Steps
1. Design 5-10 focused source documents. Each should:
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
