# NotebookLM Deep Dive — Creation Workflow

## Phase 1: Determine Mode [STOP]

### If --from-research path is provided
1. Read the RESEARCH.md file
2. Confirm the topic and lens coverage with Scott
3. Ask about audience and tone:
   - "Who's the audience? Just you, or sharing with others?"
   - "How technical should it be?"
4. Skip to Phase 2 (no research needed)

### If standalone (no --from-research)
1. Ask Scott to describe the topic and what angle he wants
2. Suggest: "Want to run `/scott:research` first for more rigorous findings?"
3. If Scott wants full research, stop and tell him to run `/scott:research <topic> --notebooklm`
4. If standalone is fine, proceed with lightweight research below

### Done when
Scott confirms mode, topic, and tone.

## Phase 1.5: Lightweight Research (standalone mode only) [AUTO]

Only runs when NOT using --from-research.

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
Map lens sections to source documents:
- Combine related lenses under 1,500 words (e.g., Historical + Academic = one doc)
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

General pattern:
- **Document 1**: Big picture overview
- **Documents 2-N**: Deep dives into specific aspects
- **Final document**: Comparison/context

Present the document plan to Scott as a table:

| # | File | Title | Covers |
|---|------|-------|--------|
| 1 | 01-overview.md | ... | ... |

### Done when
Document plan looks good. Proceed immediately (this is [AUTO]).

## Phase 4: Write Source Documents [AUTO]

1. Create the output directory: `~/Sites/Personal/notebooklm-<topic-slug>/`

2. Write each source document as a markdown file. Writing guidelines:
   - **Technical but accessible**: Explain concepts clearly without oversimplifying
   - **Concrete examples**: Use real names, real code snippets, real numbers
   - **Analogies**: Use spreadsheet analogies when explaining to Scott
   - **Third person for subject, second person for reader**
   - **No filler**: Every paragraph should contain information
   - **Cross-references**: "As covered in the hooks document..." to help NotebookLM connect ideas
   - **Include key code snippets** where they illuminate design

3. Each document should have:
   - A clear H1 title (becomes the source title in NotebookLM)
   - Logical sections with H2 headers
   - Tables where comparison data is involved
   - Code blocks where technical details matter

### Done when
All source documents are written to the output directory.

## Phase 5: Create Notebook and Upload [AUTO]

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
   Upload sequentially, not in parallel.

4. Configure the chat persona:
   ```bash
   notebooklm configure --mode detailed --response-length longer --persona "<persona>"
   ```
   Persona template:
   ```
   You are a technical expert who deeply understands <topic>. When answering
   questions, reference specific details from the sources. The audience is
   Scott O'Dell, a Head of Sales at a home services company who builds software
   with AI assistance. He understands technical concepts but appreciates clear
   explanations with real-world analogies.
   ```

### Done when
Notebook created, all sources uploaded, chat configured.

## Phase 6: Generate Audio Overview [AUTO]

1. Craft a custom audio prompt:
   - Set the narrative frame (what makes this topic interesting)
   - List 4-6 key angles to cover
   - Include specific examples to reference
   - Set the tone
   - Tell hosts to use concrete details, not generic descriptions

2. Generate the audio:
   ```bash
   notebooklm generate audio --format deep-dive --length long "<custom prompt>"
   ```
   Do NOT use `--wait` as it times out.

3. Poll for completion:
   ```bash
   notebooklm artifact list
   ```
   Check every 2 minutes until status changes to `completed`.

4. Download when ready:
   ```bash
   notebooklm download audio ~/Sites/Personal/notebooklm-<topic-slug>/<topic-slug>-deep-dive.wav
   ```

5. Report file size and path to Scott.

### Done when
Audio file downloaded and path reported.

## Phase 7: Summary [STOP]

Present:

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

**Chat configured:** <mode>, custom persona for <topic>
**Audio prompt highlights:** <2-3 key angles>

Play: open <audio-path>
Chat: notebooklm.google.com
```

### Done when
Scott confirms the overview is good, or requests adjustments.
