---
name: scott:pause
description: |
  Generate a compact resume prompt when pausing any work session. Works globally
  across GSD projects, personal projects, or any conversation.
  Produces a copy-paste prompt with just enough context to pick up where you left
  off in a fresh session. Use when Scott says "let's pause", "save my place",
  "I need to stop", "pause this", "bookmark this", "wrap up for now", "gotta go",
  "let's pick this up later", or any variation of ending a session. Also use when
  Scott seems to be wrapping up but hasn't explicitly asked to pause.
user_invocable: true
invocation_hint: /pause - Generate a resume prompt for picking up later
---

# Pause & Generate Resume Prompt

When Scott pauses a session, generate a compact, self-contained resume prompt
that a fresh Claude can use to pick up exactly where things left off. The prompt
should be minimal but complete: enough context to avoid re-reading everything,
but not so much that it wastes the next session's context window.

## How It Works

### Step 1: Scan for Context [AUTO]

Quickly determine what kind of session this is by checking what's available:

```
Check (in order, stop when you have enough):
1. Current conversation - what was discussed, decided, built
2. Working directory - is this a project? which one?
3. .planning/ directory - GSD project state (read .planning/STATE.md for current phase/step)
4. docs/superpowers/plans/ directory - active Superpowers workflow (TDD cycle, code review, etc.)
5. tasks/todo.md - task list with progress
6. CLAUDE.md - project context
7. Git status - uncommitted work, current branch (worktree?)
```

You don't need to read every file. Skim what's relevant based on the conversation.

### Step 2: Identify the Essentials

Extract only what a fresh Claude needs:

| What | Why |
|------|-----|
| **Project & directory** | So it knows where to `cd` |
| **What we were doing** | The task/goal, not the full history |
| **Where we stopped** | Specific stopping point |
| **Key decisions made** | So they don't get re-asked |
| **Files that matter** | Paths to read for context, not contents |
| **Uncommitted changes** | So nothing gets lost |
| **Active Superpowers workflow** | TDD mid-cycle? Code review pending? Worktree branch? |
| **Next concrete step** | What to do first when resuming |

### Step 3: Generate the Resume Prompt

Write a resume prompt in a fenced code block that Scott can copy-paste. The
prompt should be written as instructions TO Claude, not as a summary FOR Scott.

**Format:**

~~~
```
Continue work on [brief description of what we're doing]

Working directory: [absolute path]

Where we left off: [1-2 sentences about the stopping point]

Key decisions made this session:
- [decision 1]
- [decision 2]

Key files:
- [path] - [why it matters, 3-5 words]
- [path] - [why it matters]

[If uncommitted changes exist:]
Uncommitted changes: [brief description of what's modified but not committed]

Next step: [specific action to take first]
```
~~~

### Guidelines

**Keep it short.** The whole prompt should be 10-25 lines. If you're writing
more than 25 lines, you're including too much. A fresh Claude can read files;
you just need to tell it which ones.

**Point to files, don't paste contents.** Instead of including a plan inline,
write `- .planning/phases/03-goals-weights/03-CONTEXT.md - decisions for phase 3`.
The next session will read the file.

**Be specific about the stopping point.** "Working on Phase 3" is too vague.
"Phase 3 context gathered, ready for /gsd:plan-phase 3" is specific.

**Include the next command if applicable.** If the next step is running a
specific slash command or CLI command, include it. `/gsd:plan-phase 3` or
`npm run dev` saves the next session from figuring it out.

**Decisions are gold.** The most expensive thing to re-derive is decisions
that were made through discussion. Include the ones that affect future work.

**Skip obvious context.** Don't include things like the tech stack or project
purpose if they're in CLAUDE.md. The next session will read CLAUDE.md
automatically. Only include things that are NOT in persistent files.

### Step 4: Also Save to File (if in a project)

If we're in a project directory (has CLAUDE.md or .planning/), also write the
resume prompt to `.claude-resume.md` at the project root so it persists even
if Scott doesn't copy-paste it. This is the file that session-start.sh looks
for to trigger AUTO-RESUME in the next session.

```bash
# Write to project root (must be .claude-resume.md for session-start.sh detection)
echo "[resume prompt content]" > .claude-resume.md
```

If using GSD, also update STATE.md:
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "[stopping point description]" \
  --resume-file ".claude-resume.md"
```

### Step 5: Sync Up [AUTO]

Run `/scott:sync-up` to push all config and code changes to GitHub before ending the session.
This ensures the other machine will have everything when Scott starts a new session there.

### Step 6: Present to Scott

Show the resume prompt in a copyable code block, then confirm:

```
Your resume prompt is above (and saved to .claude-resume.md).

To pick up later, paste it at the start of a fresh session.
```

## Examples

**Good resume prompt (GSD project):**
```
Continue work on Sales Ops Hub Phase 3: Goals & Weights

Working directory: ~/Sites/Advosy/sales-ops-hub

Where we left off: Phase 3 context gathered, ready to plan. All implementation
decisions captured in CONTEXT.md.

Key decisions made this session:
- Tabbed layout by org level (D2D/Regions/Teams/Reps)
- Spreadsheet-style weight grid, D2D-level only
- UModal for goal editing (all 6 KPIs at once)
- "Distribute Evenly" button for splitting parent goals

Key files:
- .planning/ROADMAP.md - phase definitions and progress
- .planning/phases/03-goals-weights/03-CONTEXT.md - all Phase 3 decisions
- .planning/STATE.md - current project state

Next step: /gsd:plan-phase 3
```

**Good resume prompt (non-project work):**
```
Continue helping me set up n8n webhook sync between Spotio and Claimsforce

Working directory: ~/Sites/Advosy/automations

Where we left off: Webhook endpoint is working, tested with curl. Still need
to map Spotio "status" field values to CF stage names.

Key decisions:
- Using n8n HTTP Request node (not webhook trigger) for polling
- Status mapping: "Pitched" -> "Appointment Set", "Sold" -> "Signed Contract"
- Skipping "Cancelled" status (don't sync to CF)

Key files:
- ~/.claude/n8n-reference.md - workflow IDs and patterns
- workflows/spotio-sync.json - the n8n workflow export

Next step: Add the status mapping switch node in n8n workflow 234
```

**Too long (bad):**
A prompt that includes file contents, full conversation history, or
re-explains the project from scratch. Point to files instead.

**Too vague (bad):**
```
Continue working on the sales ops hub project.
```
No stopping point, no decisions, no files, no next step.
