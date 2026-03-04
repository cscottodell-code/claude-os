# Compare Sources

## Metadata
- Last updated: 2026-03-03
- Version: 1.0
- Changelog:
  - v1.0: Initial workflow

## Purpose
Compare new context engineering sources against the current scott-toolkit configuration.
Surfaces what's validated, what's new, and what conflicts — so Scott can decide whether
to update his toolkit. The primary goal is always to **maximize protecting context windows**.

Use when Scott has collected new articles, tweets, repos, or resources into
`~/Sites/Global/context-engineering/` and wants to know what's actionable.

## Prerequisites
- Sources exist in `~/Sites/Global/context-engineering/sources/` (processed .md files)
- Optionally: new raw inputs in `~/Sites/Global/context-engineering/research-sources/`
- The toolkit repo at `~/Sites/Global/scott-toolkit/`

## Instructions for Claude Code
This is a 5-phase workflow. Each phase has clear inputs, outputs, and "done when"
criteria. Follow them in order. Protect the main context window — Phase 3 builds
lightweight indexes so Phase 4's subagent can do the heavy lifting in its own window.

---

## Phase 1: Collect Sources

### What this phase does
Identify what new sources to process.

### Steps
1. List files in `~/Sites/Global/context-engineering/research-sources/` (raw inputs)
2. List files in `~/Sites/Global/context-engineering/sources/` (processed markdown)
3. Show both lists to Scott in a table:
   | Location | File | Status |
   |----------|------|--------|
   | research-sources/ | [name] | Unprocessed |
   | sources/ | [name] | Processed |
4. Ask Scott: "Are there new sources to add?" — accept URLs, file drops, or pasted content
5. For x.com links → delegate to `/scott:tweet-to-source`
6. For other URLs → use WebFetch to extract content, save raw output to `research-sources/`
7. For PDFs already in `research-sources/` → note for Phase 2 processing

### Done when
Scott confirms the list of new sources to process (or says "just review existing sources").

---

## Phase 2: Process Sources

### What this phase does
Convert each new source into standardized markdown. Skip this phase if Scott said
"just review existing sources" in Phase 1.

### Steps
1. Read 1-2 existing files in `~/Sites/Global/context-engineering/sources/` to match
   formatting conventions
2. For each new source, apply the standard processing prompt:
   > "Create a .md file that gives you all of the helpful information from this source
   > to help customize Claude Code later. Update any outdated information with current
   > information. Don't customize the information to any context about the user — stay
   > true to the source, except for the updates."
3. Name using convention: `[topic-slug]-[author-or-project]-[year].md`
4. Save to `~/Sites/Global/context-engineering/sources/`
5. Show each processed file to Scott for approval before moving to the next

### Done when
All new sources are processed and saved (or Phase 1 said "review only").

---

## Phase 3: Build Comparison Inventory

### What this phase does
Create lightweight indexes of the toolkit and sources — **this is the context window
protection mechanism**. Instead of loading every file into the main window or the
subagent's window at once, we build summary manifests that enable progressive loading.

### Step 1: Build Toolkit Manifest
Scan these files and write a 1-2 line summary for each:

| Category | Files to scan |
|----------|--------------|
| Rules | `~/Sites/Global/scott-toolkit/rules/*.md` |
| Workflows | `~/Sites/Global/scott-toolkit/workflows/*.md` |
| Knowledge | `~/Sites/Global/scott-toolkit/knowledge/active/*.md` |
| Templates | `~/Sites/Global/scott-toolkit/context/*.md` |
| References | `~/Sites/Global/scott-toolkit/references/*.md` (skip ai-orchestration/) |
| Hooks | `~/Sites/Global/scott-toolkit/hooks/*.sh` |
| MEMORY.md | `~/.claude/projects/-Users-scott/memory/MEMORY.md` |
| CLAUDE.md | `~/.claude/CLAUDE.md` |
| Existing synthesis | `~/Sites/Global/context-engineering/sources/ce-synthesis.md` (summary only) |

For each file, read it and write a brief summary capturing:
- What the file configures or teaches
- Key patterns, rules, or techniques it implements

Write the manifest to:
`~/Sites/Global/context-engineering/reviews/_comparison-manifest.md`

Format:
```markdown
# Toolkit Comparison Manifest
Generated: YYYY-MM-DD

## Rules
- **claude-behavior.md** — [1-2 line summary]
- **code-style.md** — [1-2 line summary]
...

## Workflows
- **new-project.md** — [1-2 line summary]
...

[etc. for each category]
```

### Step 2: Build Source Index
For each file in `~/Sites/Global/context-engineering/sources/` (both old and new):
- Read the file
- Write a 1-2 line summary listing key claims, patterns, and techniques
- Note the author and focus area

Write to: `~/Sites/Global/context-engineering/reviews/_source-index.md`

Format:
```markdown
# Source Index
Generated: YYYY-MM-DD

| # | File | Author | Focus | Key Claims |
|---|------|--------|-------|------------|
| 1 | [filename] | [author] | [area] | [2-3 key points] |
```

### Why this matters
The subagent in Phase 4 reads these indexes first (~2-3k tokens), then only loads
the specific files it needs for deeper comparison. This keeps the main context window
lean and gives the subagent a focused starting point instead of 200k of raw content.

### Done when
Both `_comparison-manifest.md` and `_source-index.md` are written. No Scott approval
needed — these are intermediate artifacts.

---

## Phase 4: Run Comparison Analysis (Subagent)

### What this phase does
Delegate the heavy comparison work to a subagent with a fresh context window.

### Subagent Setup
Launch a **general-purpose** subagent (via the Agent tool) with these instructions:

**Prompt for the subagent:**
```
You are comparing context engineering sources against Scott's toolkit configuration.

## Your Inputs
1. Read `~/Sites/Global/context-engineering/reviews/_comparison-manifest.md` (toolkit inventory)
2. Read `~/Sites/Global/context-engineering/reviews/_source-index.md` (source summaries)

## Your Task: Two-Pass Comparison

### Pass 1 — Source Scan (new sources first)
For each source in the index:
1. Read the full source file from `~/Sites/Global/context-engineering/sources/[filename]`
2. For each significant claim, pattern, or technique in the source:
   - Check the manifest: does the toolkit already implement this?
     → If yes: **Congruency** (note which toolkit file)
     → If the toolkit does something contradictory: **Discrepancy** (note both sides)
     → If the toolkit is silent on this: **Unique idea** (note what it would change)
3. If you need more detail about a specific toolkit file to confirm a match or conflict,
   read the full file. Only deep-read files where the summary is ambiguous.

### Pass 2 — Toolkit Gap Scan (reverse direction)
For each toolkit file in the manifest:
1. Are there source-backed improvements the toolkit could adopt?
2. Is the toolkit doing something no source supports? (flag for awareness, not necessarily a problem)

## Output
Write your findings to `~/Sites/Global/context-engineering/reviews/_raw-findings.md`
using this format:

```markdown
# Raw Comparison Findings
Generated: [date]
Sources analyzed: [count]
Toolkit files inventoried: [count]

## Congruencies
| # | Pattern | Source(s) | Toolkit File(s) |
|---|---------|-----------|----------------|
| 1 | [pattern name] | [source filenames] | [toolkit filenames] |

[For each: 1-sentence explanation of the match]

## Discrepancies
| # | Tension | Source Says | Toolkit Does | Priority |
|---|---------|-----------|-------------|----------|
| 1 | [name] | [claim + source file] | [current approach + toolkit file] | High/Med/Low |

[For each: why this is a tension, what the options are]

## Unique Ideas
| # | Idea | Source | What It Would Change | Effort | Value |
|---|------|--------|---------------------|--------|-------|
| 1 | [name] | [source file] | [toolkit area affected] | Low/Med/High | Low/Med/High |

[For each: 1-sentence description of the opportunity]

## Toolkit-Only Patterns (no source backing)
| # | Pattern | Toolkit File | Notes |
|---|---------|-------------|-------|
| 1 | [pattern] | [file] | [whether this seems fine or worth investigating] |
```

Be thorough but concise. Focus on actionable findings. Skip trivial matches
(e.g., "both say use TypeScript") — focus on patterns, techniques, and architecture.
```

### Important
- Do NOT read the raw findings back into the main window during this phase.
  The subagent writes them to disk. Phase 5 reads them.
- If the subagent encounters errors reading files, note them in the findings
  and continue with what's available.

### Done when
The subagent has returned and `_raw-findings.md` exists.

---

## Phase 5: Generate Review & Act

### What this phase does
Transform raw findings into a scannable review document, then let Scott decide what to do.

### Steps

#### 1. Read the raw findings
Read `~/Sites/Global/context-engineering/reviews/_raw-findings.md`

#### 2. Generate the review document
Write to `~/Sites/Global/context-engineering/reviews/YYYY-MM-DD-review.md` using this format:

```markdown
# Context Engineering Review — YYYY-MM-DD

**Sources reviewed:** [count] ([count] new, [count] existing)
**Compared against:** scott-toolkit v[version], [count] files inventoried

---

## Executive Summary
[2-3 sentences: what's validated, what's new, what needs attention]

---

## Congruencies (Your Setup Is Validated)

| # | Pattern | Source(s) | Your Implementation |
|---|---------|-----------|-------------------|
| 1 | [pattern] | [source names] | [which toolkit file(s)] |

[1-2 paragraphs: what this means for confidence in current setup]

---

## Discrepancies (Needs Your Decision)

| # | Tension | Source Says | Your Toolkit Does | Priority |
|---|---------|-----------|-------------------|----------|
| 1 | [name] | [claim] | [current approach] | High/Med/Low |

For each:
- **Option A:** Adapt toolkit → [what changes]
- **Option B:** Keep current → [rationale]
- **Recommended:** [which and why]

---

## Unique Ideas (Opportunities)

| # | Idea | Source | What It Would Change | Effort | Value |
|---|------|--------|---------------------|--------|-------|
| 1 | [name] | [source] | [toolkit area] | Low/Med/High | Low/Med/High |

**Top picks** (ranked by effort-to-value): [3-5 with 1-sentence rationale each]

---

## Recommendations

| # | Action | File(s) to Change | Priority |
|---|--------|--------------------|----------|
| 1 | [specific action] | [path(s)] | P1/P2/P3 |

[For each P1: implementation notes detailed enough for /scott:toolkit-update]
```

#### 3. Present summary to Scott
Show:
- Count of congruencies / discrepancies / unique ideas
- Top 3 recommendations ranked by impact
- Ask: "Which of these do you want to act on?"

#### 4. For approved recommendations
Write `~/Sites/Global/context-engineering/reviews/_pending-updates.md`:

```markdown
# Pending Toolkit Updates
Generated from: [review date] review
Approved by: Scott

| File | Change | Reason |
|------|--------|--------|
| [path] | [specific change] | [from review finding #N] |
```

This file uses the same table format as toolkit-update Phase 2, so it plugs
directly into `/scott:toolkit-update`.

#### 5. Tell Scott next steps
"Run `/scott:toolkit-update` when ready. The pending updates file will be picked up
automatically in Phase 2."

### Done when
Review document is generated and Scott has decided which recommendations to pursue.

---

## Completion Checklist
- [ ] Sources collected (Phase 1)
- [ ] New sources processed into markdown (Phase 2, if applicable)
- [ ] Toolkit manifest built (`_comparison-manifest.md`)
- [ ] Source index built (`_source-index.md`)
- [ ] Subagent comparison complete (`_raw-findings.md`)
- [ ] Review document generated (`YYYY-MM-DD-review.md`)
- [ ] Scott reviewed recommendations
- [ ] Pending updates written (if any approved)
