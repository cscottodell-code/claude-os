# NotebookLM Notebook — Creation Workflow

## Phase 0.5: Fork Detection [STOP]

Before any other work, check if a notebook already exists for this topic.

1. Compute the topic slug from the topic name (kebab-case)
2. Find the corresponding wiki page in `~/Scott/growth-os/wiki/`
3. Read its frontmatter for `notebook_id`
4. If `notebook_id` exists:
   a. Run `notebooklm metadata -n <id> --json` to get current state
   b. Check fork triggers (below)
   c. If any trigger fires, ask Scott: *"Notebook X exists with N sources, last updated Y. I suggest forking because [trigger]. Fork (new notebook), extend (add to existing), or override?"*
   d. If no trigger fires, default to extend mode (use existing notebook_id, skip Phase 5 creation)
5. If no `notebook_id`, proceed to Phase 1 normally

### Fork Triggers

| # | Trigger | Threshold |
|---|---|---|
| 1 | Source count high | >40 sources (NotebookLM Standard tier limit is 50) |
| 2 | Topic split on wiki | Sub-pages exist now that didn't when notebook was created |
| 3 | Output type mismatch | Existing persona is "deep-dive audio"; request is "study" or "chat" |
| 4 | Stale + bloated | Notebook >6 months old AND source count >10 |
| 5 | Persona conflict | Studio prompt would conflict with existing chat history's persona |

### --fork Override

`--fork` always creates a new notebook regardless of existing state. Use for clean breaks.

### Done when

Scott confirms: extend, fork, or override. Proceed to Phase 1.

---

## Phase 1: Determine Mode and Output Type [STOP]

### If --learning (dispatched by /scott:learn)

1. Read the provided topic, session type, and context documents
2. Suggest output type based on session type:
   - Overview, Vocabulary, Quiz → study (suggested)
   - Application, Connection → chat (suggested, with Scott's context baked in)
   - Teaching → chat (suggested, with student persona)
3. **Always confirm with Scott:** *"Session type is X, suggested output is Y. Confirm or change?"*
   Five options: audio | chat | study | reference | none
4. Skip to Phase 2 (no research needed)

### If --from-research path is provided

1. Read the RESEARCH.md file
2. Confirm the topic and lens coverage with Scott
3. Ask about audience and tone:
   - "Who's the audience? Just you, or sharing with others?"
   - "How technical should it be?"
4. Ask about output type (always — see table below)
5. Skip to Phase 2 (no research needed)

### If standalone (no --from-research)

1. Ask Scott to describe the topic and what angle he wants
2. Suggest: "Want to run `/scott:research` first for more rigorous findings?"
3. If Scott wants full research, stop and tell him to run `/scott:research <topic> --notebooklm`
4. If standalone is fine, proceed with lightweight research in Phase 1.5
5. Ask about output type (always — see table below)

### Output type selection (always, every mode)

Ask Scott:
*"What kind of NotebookLM output do you want?"*

| Type | Best for | What you get |
|---|---|---|
| **Audio** | Deep dives, commute listening | AI podcast discussion |
| **Chat** | Interactive exploration, Q&A | Configured notebook for conversation |
| **Study** | Learning sessions, review | Native quiz / flashcards / study-guide artifact |
| **Reference** | Source organization | Just the sources, browse at will |
| **None** | Notebook only | Sources + persona configured, no artifact generated |

Never default to audio. Never assume from topic. Always ask.

### Done when

Scott confirms mode, topic, tone, and output type. (Or --learning skips topic/tone but
still confirms output type.)

---

## Phase 1.5: Lightweight Research (standalone mode only) [AUTO]

Only runs when NOT using --from-research or --learning.

### For external topics — use NotebookLM's built-in research

```bash
notebooklm source add-research "<topic query>" -n <notebook-id> --mode fast
```

This adds web sources directly to the notebook. Replaces the old subagent-dispatch pattern.

- `--mode fast`: 5-10 sources, 30s-2min, blocking
- `--mode deep`: 20+ sources, 15-30 min — use `--no-wait` and a subagent (below)

### For deep research

```bash
notebooklm source add-research "<query>" -n <notebook-id> --mode deep --no-wait
```

Then spawn a background subagent:

```
Task(
  prompt="Wait for research in notebook {notebook_id} to complete and import sources.
          notebooklm research wait -n {notebook_id} --import-all --timeout 1800
          Report number of sources imported.",
  subagent_type="general-purpose"
)
```

### For codebase topics

Read the actual files deeply (no web research needed). Aim for enough material to write
5-10 substantial source documents in Phase 4.

### For hybrid topics

Combine: `source add-research` for the external angle + file reads for the codebase angle.

### Done when

Sources are added to the notebook OR enough material is gathered to write Phase 4 source
documents.

---

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

If sources were added via `source add-research`, the notebook may already have enough.
Decide whether additional MD source documents are needed (e.g., for Scott-specific
context that the web sources don't cover).

If yes, design 5-10 focused source documents. Each should:
- Cover one distinct angle
- Stand alone as a useful document
- Cross-reference other documents where relevant
- Be 1,500-4,000 words

### Learning mode (--learning)

Design source documents around the session type:
- **Overview**: Structured lesson docs (intro, components, why it matters, key takeaways)
- **Vocabulary**: Term definition docs + usage-in-context examples
- **Quiz**: Conceptual docs dense with testable facts and distinctions
- **Application**: Topic docs + a "Scott's Context" doc with real scenarios from his work
- **Connection**: Topic docs + a doc mapping connections to Scott's existing knowledge
- **Teaching**: Topic docs framed for explanation, with analogies and common misconceptions

Present the document plan to Scott as a table:

| # | File | Title | Covers |
|---|------|-------|--------|
| 1 | 01-overview.md | ... | ... |

### Done when

Document plan looks good. Proceed immediately (this is [AUTO]).

---

## Phase 3: Configure Persona and Studio Prompt [AUTO]

Craft the chat persona and studio prompt based on output type and context.

### Persona templates by output type

**Audio (deep dive):**
Persona: Domain expert and engaging storyteller. Speaks with authority but makes
complex topics accessible. Uses concrete examples and analogies.
Studio prompt: Focus on what makes this topic interesting, list 4-6 key angles,
include specific examples, set conversational but substantive tone.

**Chat (interactive):**
Persona: Socratic teacher who asks probing questions. Never gives answers directly
when a question would teach better. Challenges assumptions. Uses Scott's real-world
context when available.
Studio prompt: "Engage the user in dialogue about [topic]. Ask questions before
explaining. When they answer, build on their response. Push back on surface-level
understanding."

**Study (learning):**
Persona: Demanding instructor (matches Eleanor's personality). Tests understanding,
doesn't accept vague answers. Gives immediate feedback.
Studio prompt varies by session type:
- Overview: "Teach [topic] in a structured lesson. Start with why it matters, then
  walk through each component. Use analogies. End with 3 key takeaways."
- Vocabulary: "Quiz the user on key terms from these sources. Give the term, ask
  for definition. Then give definitions and ask for the term. Score their accuracy."
- Quiz: "Create a 10-question multiple choice quiz on [topic]. Present one question
  at a time. After each answer, explain why the correct answer is correct and why
  wrong answers are wrong."

**Reference:**
Persona: Neutral librarian. Answers questions from sources only. Cites which source
each answer comes from.
Studio prompt: "Answer questions using only the provided sources. Always cite which
source document contains the answer."

**None:**
Persona: same as Chat (Socratic) by default. Scott can override at invocation time.
No studio prompt is needed (no artifact will be generated).

### Learning-specific: bake in Scott's context

When `--learning` flag is set and session type is Application or Connection:
1. Read relevant wiki pages about Scott's current projects and role
2. Write a "Scott's Context" source document (1,500-2,000 words) containing:
   - Current role (Head of Sales at Advosy, 8 sub-contexts)
   - Active projects and their status
   - Real scenarios from his work that relate to the topic
   - Current challenges or decisions he's facing
3. Upload this as a source alongside the topic sources
4. Studio prompt references this context: "Use the Scott's Context document to
   create realistic scenarios from his actual work."

### Done when

Persona and studio prompt are crafted. Proceed to source document writing.

---

## Phase 4: Write Source Documents [AUTO]

1. Create the output directory: `~/Scott/growth-os/raw/transcripts/notebooklm-<topic-slug>/`

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

---

## Phase 5: Create Notebook and Upload [AUTO]

If extending an existing notebook (Phase 0.5 chose extend), skip step 1 and use the
existing notebook_id throughout.

### 1. Create the notebook (parallel-safe with --json)

```bash
notebooklm create "<Topic Name>" --json
# Returns: {"id": "abc123de-...", "title": "..."}
```

Parse the `id` field. Use this ID with `-n <id>` for all subsequent commands. This is
parallel-safe and avoids the global `use` context (which collides between subagents).

### 2. Upload all source documents sequentially

```bash
cd ~/Scott/growth-os/raw/transcripts/notebooklm-<topic-slug>/
for f in *.md; do
  notebooklm source add "$f" -n <notebook-id> --json
done
```

Capture each `source_id` from JSON output if you need to wait on specific sources.

### 3. Wait for source processing (subagent pattern)

```
Task(
  prompt="Wait for sources in notebook {id} to be ready.
          For each source_id: notebooklm source wait {source_id} -n {id} --timeout 120
          Report when all ready or any failed.",
  subagent_type="general-purpose"
)
```

Sources must be `status: ready` before chat or generation works.

### 4. Configure chat persona

```bash
notebooklm configure --mode detailed --response-length longer --persona "<persona from Phase 3>" -n <notebook-id>
```

### Done when

Notebook created (or extended), all sources uploaded and ready, chat configured.

---

## Phase 6: Generate Output [AUTO]

Branches by output type. **If output type is None, skip this phase entirely.**

### If Audio

1. Craft a custom audio prompt using the studio prompt from Phase 3:
   - Narrative frame, 4-6 key angles, specific examples, tone instructions
2. Start generation (non-blocking):
   ```bash
   notebooklm generate audio --format deep-dive --length long "<custom prompt>" -n <id> --json
   # Returns: {"task_id": "...", "status": "pending"}
   ```
3. **Spawn a background subagent** to wait + download (NEVER poll in main conversation):
   ```
   Task(
     prompt="Wait for artifact {task_id} in notebook {id} to complete.
             notebooklm artifact wait {task_id} -n {id} --timeout 1200
             Then: notebooklm download audio <output-path>.mp3 -a {task_id} -n {id}
             Report file size and path when complete.",
     subagent_type="general-purpose"
   )
   ```
   Main conversation continues. Do NOT use `--wait` flag (times out).

### If Study

Generate native artifacts based on session type:

| Session type | Command |
|---|---|
| Overview, Vocabulary | `notebooklm generate report --format study-guide --append "<studio prompt>" -n <id> --json` |
| Quiz | `notebooklm generate quiz --difficulty medium --quantity standard -n <id> --json` |
| Application, Connection, Teaching | Skip native artifact; chat persona IS the artifact (configured in Phase 5) |

For study-guide and quiz, use the same subagent wait pattern as audio. Download:

```bash
notebooklm download report <output-path>.md -a <artifact-id> -n <id>
notebooklm download quiz <output-path>.md --format markdown -a <artifact-id> -n <id>
notebooklm download flashcards <output-path>.md --format markdown -a <artifact-id> -n <id>
```

### If Chat or Reference

Notebook is already configured from Phase 5. No artifact generation needed.
Report that the notebook is ready at notebooklm.google.com.

### If None

Skip this phase. Notebook is created with sources + persona configured, no artifact
generated. Scott can use ad-hoc with `notebooklm ask "..." -n <id>`.

### Done when

- Audio: subagent dispatched, will report on completion
- Study (with artifact): artifact downloaded (or subagent dispatched for long ones)
- Chat / Reference / None: notebook confirmed ready

---

## Phase 7: Summary + Consumption Log [STOP]

### Step 1: Update Wiki Page

For ANY notebook session (not just --learning):

1. Find the corresponding wiki page in `~/Scott/growth-os/wiki/`
2. If no wiki page exists, ask Scott: *"No wiki page exists for this topic. Should I create one? It would carry the notebook_id and depth metadata going forward."*
3. Update wiki page frontmatter:
   - Set `notebook_id: <id>` (if not already set)
   - Append to `history[]`:
     ```yaml
     - date: <today>
       type: consumption
       notebook_id: <id>
       output_type: <audio | chat | study | reference | none>
       artifact_id: <id-if-any>
     ```

This is a CONSUMPTION event. It does NOT update `depth`, `last_reviewed`, `review_count`,
`streak`, `next_review`, or `mastery_phase`. Those only advance via `/scott:learn --log`.

### Step 2: Present Summary to Scott

```
## NotebookLM Complete

**Topic:** <topic>
**Output type:** <audio | chat | study | reference | none>
**Notebook:** <name> (<id>)
**Decision:** <new | extended | forked from <old-id>>
**Sources:** <count> documents (<total words> words)
**Location:** ~/Scott/growth-os/raw/transcripts/notebooklm-<topic-slug>/

**Source documents:**
| # | File | Words | Covers |
|---|------|-------|--------|

**Persona:** <summary of configured persona>
**Studio prompt:** <key instruction>

[If audio:]
**Audio:** Subagent dispatched. Will download to <path> on completion.

[If study with artifact:]
**Study artifact:** <type> downloaded to <path>

[If chat / reference:]
Chat: notebooklm.google.com (notebook: <name>)

[If none:]
Notebook ready. Use ad-hoc with `notebooklm ask "..." -n <id>`.

**Wiki page:** <path> — notebook_id set, consumption event logged.
**Depth tracking:** Run `/scott:learn --log` after engaging with the notebook to advance depth.
```

### Done when

Scott confirms the overview is good, or requests adjustments.
