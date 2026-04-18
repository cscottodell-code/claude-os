# Machine Cleanup & Knowledge Centralization Prompt

> **What this is:** An executable prompt for Claude Code or Claude Cowork.
> Paste the relevant phase section into a fresh session to execute it.
> Each phase has [STOP] checkpoints where Claude will pause for your approval.
>
> **Created:** 2026-04-13
> **Plan file:** ~/.claude/plans/lovely-moseying-sketch.md

---

## Master Context (paste this BEFORE any phase)

Every phase prompt should be preceded by this block. Copy this + the phase you're running.

```
## WHO I AM
I'm Scott, Head of Sales at Advosy (home services company, Arizona). I'm a beginner developer
learning to code. I build tools across three organizations: Advosy (work), Bresco (SaaS startup
with Brett Arrington), and Personal projects (Eleanor AI assistant, Life OS).

## MY PREFERENCES
- I'm a beginner. Be thorough, explain what you're doing and why.
- When something fails, explain in plain English.
- Break complex tasks into smaller pieces and check in with me.
- Use tables and bullet points. Be direct and concise.
- Label claims: [VERIFIED], [INFERRED], [ASSUMED]
- Package manager: pnpm (not npm)
- Tech stack: Nuxt 4, Nuxt UI v4, Tailwind CSS v4, TypeScript, SurrealDB v3
- Infrastructure: GitHub | Hetzner + Coolify | Vercel (legacy only)

## WHAT WE'RE DOING (THE BIG PICTURE)
I'm reorganizing my entire machine. My ~/Sites/ directory grew into a mess with duplicate git
repos, scattered knowledge files, empty directories, and no cross-device access. The goals are:

1. CLEAN UP: Remove duplicate repos, empty dirs, dead files (~18,700 archived files to delete)
2. CENTRALIZE KNOWLEDGE: Create a single GitHub repo (scott-context) following Andrej Karpathy's
   LLM Wiki pattern -- raw/ for immutable sources, wiki/ for LLM-maintained compiled knowledge,
   CLAUDE.md as the schema that tells the LLM how to ingest/query/lint the wiki
3. OBSIDIAN AS FRONTEND: Use Obsidian to view/edit the wiki on all devices. [[Wikilinks]] connect
   pages. Graph View shows the shape of knowledge. obsidian-git syncs to GitHub on Macs.
4. CROSS-DEVICE ACCESS: 5 Apple devices need access:
   - M4 MacBook Air (primary, Claude Code + some Cowork)
   - M1 Max Mac Studio (always-on, mostly Cowork + some Claude Code)
   - M1 iPad Pro (Claude AI + Obsidian for reading/research)
   - iPhone 17 Air (Claude AI + Obsidian for quick reference)
   - M4 Mac Mini (family computer, minimal use)
5. MAC STUDIO SETUP: Auto-pulling repos + Obsidian vault so Cowork always has fresh context
6. CLAUDE AI PROJECTS: 5 Projects on claude.ai linked to GitHub repos for mobile Claude access
7. UPDATE CONFIG: ~/.claude/cowork-global-instructions.md is badly outdated (references npm, Notion)

## KEY CONSTRAINTS
- Git + iCloud = structural corruption [VERIFIED]. Never store .git directories in iCloud.
- Markdown files in iCloud are fine. The corruption is .git-specific.
- Claude AI/Cowork can't read iCloud Drive. GitHub is the sync layer for Claude interfaces.
- Obsidian Sync ($4/month) handles cross-device vault sync (chosen over free iCloud approach).

## KARPATHY'S LLM WIKI PATTERN (what scott-context follows)
Three layers:
- raw/ = immutable source material (articles, research output, transcripts, PDFs). Never edit.
- wiki/ = LLM-maintained compiled knowledge. Claude writes and maintains all pages. Organized by
  org: wiki/advosy/, wiki/bresco/, wiki/personal/, wiki/global/. Pages use [[wikilinks]] for
  cross-references.
- CLAUDE.md = schema file defining three workflows:
  - Ingest: drop source in raw/, LLM reads it, updates/creates wiki pages, updates index.md
  - Query: search wiki first, fall back to raw/, update wiki if answer found in raw/ but not wiki/
  - Lint: health check for contradictions, stale data, orphan pages, broken wikilinks

## MY DEVICES
| Device | Primary Use | Claude Interface |
|--------|------------|-----------------|
| MacBook Air | Primary dev machine | Claude Code + some Cowork |
| Mac Studio | Always-on server | Mostly Cowork + some Claude Code |
| iPad Pro | Consumption, late-night research | Claude AI + Obsidian |
| iPhone 17 Air | Quick reference, future workflows | Claude AI + Obsidian |
| Mac Mini | Family computer | Minimal |

## KEY FACTS ABOUT MY REPOS
- Bresco has TWO separate projects (not versions of the same thing):
  - Bresco/platform/ = the Bresco SaaS product (v2, actively built, last commit Apr 7)
  - Bresco/automation-business/ = side business with Brett (automation consulting, separate)
- advosy-sales exists on TWO GitHub remotes:
  - cscottodell-code/advosy-sales (personal) -- may have unique commits
  - advosy-hq/advosy-sales (company) -- canonical for work
  - Must compare before deleting either
- scott-toolkit = the backbone of my Claude Code config (skills, hooks, rules, references)
- scott-knowledge = 11 extracted knowledge skills (separate from scott-context)

## PHASE TRACKING
Read ~/.claude/plans/lovely-moseying-sketch.md for the full plan with all details.

Phases:
1. Create scott-context repo (Karpathy LLM Wiki structure)
2. Consolidate duplicate repos
3. Move remaining non-git content to scott-context
4. Clean up dead files
5. Update all navigation files + exhaustive ripple scan
6. Obsidian setup on MacBook Air
7. Mac Studio setup
8. Claude AI Projects + Mobile Obsidian

Before starting any phase, verify which phases are already complete by checking:
- Does ~/Sites/Global/scott-context/ exist? (Phase 1 done)
- Are the code/ subdirectories gone? (Phase 2 done)
- Are knowledge/planning/research dirs gone from org folders? (Phase 3 done)
- Is ~/Sites/Archive/ gone? (Phase 4 done)
- Do CLAUDE.md files reference scott-context? (Phase 5 done)
- Is Obsidian configured on this machine? (Phase 6 or 7 done)
- Do Claude AI Projects exist? (Phase 8 done)
```

---

## Phase 1: Create scott-context repo with Karpathy LLM Wiki structure

```
### Prerequisites
- None. This is the first phase.
- Verify: ~/Sites/Global/scott-context/ should NOT exist yet. If it does, Phase 1 is already done.

You are helping me set up a Karpathy-style LLM Wiki as a centralized knowledge base.

### Context
My ~/Sites/ directory has knowledge files scattered across multiple org folders (Advosy, Bresco, Personal, Global). I'm consolidating everything into a single GitHub repo called `scott-context` that follows Andrej Karpathy's LLM Wiki pattern: raw/ for immutable sources, wiki/ for LLM-maintained compiled knowledge, and a CLAUDE.md schema file.

This repo will also be an Obsidian vault for cross-device access.

### Step 1: Create the GitHub repo [STOP]
Create a new GitHub repo: `cscottodell-code/scott-context`
- Public or private (ask me)
- Initialize with README
- Clone to ~/Sites/Global/scott-context/

### Step 2: Create directory structure [AUTO]
```
scott-context/
├── raw/
│   ├── articles/          # Web clips (Obsidian Web Clipper)
│   ├── research/          # Claude research output
│   │   ├── bresco-v1-planning/   # 101 files from Bresco/planning/
│   │   ├── bresco-research/      # 31 files from Bresco/research/
│   │   ├── global/               # 3 files from Global/research/
│   │   └── deep-research/        # 6 files from Global/deep-research/
│   ├── transcripts/       # Meeting notes, interviews
│   │   └── notebooklm-eos/      # 5 files from Personal/notebooklm-eos/
│   └── artifacts/         # PDFs, HTMLs, dashboards, images
│       └── advosy/               # sarah-seat files, membership docs, dashboards
├── wiki/
│   ├── advosy/            # Advosy business context
│   ├── bresco/            # Platform, industry, planning
│   │   └── tasks/         # 4 files from Bresco/tasks/
│   ├── personal/          # Eleanor, Life OS, BOPs
│   │   └── learning/      # 18 files from Personal/learning/
│   └── global/
│       ├── people/        # 11 files from Global/people/
│       └── decisions/     # 3 ADR .md files from Global/decisions/
├── index.md               # Will be auto-maintained
├── log.md                 # Append-only operation log
├── CLAUDE.md              # Schema file (see below)
└── .gitignore             # Exclude .obsidian/workspace.json (device-specific)
```

### Step 3: Copy knowledge files [AUTO]
COPY (not move) files from their current locations to scott-context. Do NOT delete originals yet.

Source -> Destination mapping:

**Wiki files (LLM will maintain these):**
- ~/Sites/Advosy/knowledge/ -> wiki/advosy/ (note: this is a git repo, just copy the .md files)
- ~/Sites/Bresco/knowledge/ -> wiki/bresco/
- ~/Sites/Personal/knowledge/ -> wiki/personal/
- ~/Sites/Global/knowledge/ -> wiki/global/
- ~/Sites/Global/people/ -> wiki/global/people/
- ~/Sites/Global/decisions/*.md -> wiki/global/decisions/ (skip .html files)
- ~/Sites/Bresco/tasks/ -> wiki/bresco/tasks/
- ~/Sites/Advosy/tasks/ -> wiki/advosy/tasks/
- ~/Sites/Personal/learning/ -> wiki/personal/learning/

**Raw files (immutable sources):**
- ~/Sites/Bresco/planning/ -> raw/research/bresco-v1-planning/
- ~/Sites/Bresco/research/ -> raw/research/bresco-research/
- ~/Sites/Global/research/ -> raw/research/global/
- ~/Sites/Global/deep-research/ -> raw/research/deep-research/
- ~/Sites/Personal/notebooklm-eos/ -> raw/transcripts/notebooklm-eos/
- ~/Sites/Advosy/planning/ -> raw/artifacts/advosy/
- ~/Sites/Advosy/advosy-membership/ -> raw/artifacts/advosy/
- ~/Sites/Advosy/claimsforce/loe_to_close_dashboard.html -> raw/artifacts/advosy/
- ~/Sites/Advosy/sarah-seat-final.* -> raw/artifacts/advosy/

### Step 4: Write CLAUDE.md schema [AUTO]
Write this as the CLAUDE.md for the repo:

```markdown
# Scott's Knowledge Base (LLM Wiki)

## Architecture
This is a Karpathy-style LLM Wiki. Two directories, strict separation:
- `raw/` -- Immutable source material. Never edit these. Drop new sources here.
- `wiki/` -- LLM-maintained compiled knowledge. Claude owns this entirely.

## Workflows

### Ingest (when new source is added to raw/)
1. Read the new source file(s)
2. Identify which wiki pages need updating (or create new ones)
3. Update/create wiki pages with summaries, key facts, cross-references
4. Add [[wikilinks]] to related pages
5. Update index.md with new/changed pages
6. Append to log.md: date, source file, pages affected

### Query (when asked a question)
1. Search wiki/ for relevant pages
2. If wiki has the answer, respond from wiki (cite the page)
3. If wiki doesn't have the answer, check raw/ for source material
4. If answer found in raw/ but not wiki/, update wiki with the finding

### Lint (periodic health check)
1. Check for contradictions between pages
2. Flag stale data (dates more than 6 months old without verification)
3. Find orphan pages (no inbound [[wikilinks]])
4. Find broken [[wikilinks]]
5. Report findings, fix what's clear, flag ambiguous items

## Wiki Page Format
Each page in wiki/ should have:
- Title (# heading)
- One-paragraph summary
- Structured content (tables, bullet points preferred)
- [[Wikilinks]] to related pages
- Last updated date at bottom

## Organization
- wiki/advosy/ -- Advosy business, sales, EOS, CRM, team
- wiki/bresco/ -- Bresco platform, industry, planning, competition
- wiki/personal/ -- Eleanor, Life OS, BOPs, learning, vision
- wiki/global/ -- People, decisions, infrastructure, cross-cutting topics

## About Scott
- Head of Sales at Advosy (home services company, Arizona)
- Building tools across Advosy, Bresco, and personal projects
- Tech stack: Nuxt 4, Nuxt UI v4, Tailwind CSS v4, TypeScript, SurrealDB v3, pnpm
- Learning developer, prefers clear explanations
- Uses Claude Code (MacBook Air), Cowork (Mac Studio), Claude AI (iPad/iPhone)
```

### Step 5: Initial wiki compilation [STOP]
Run an "ingest" pass on ALL files now in wiki/:
- Add [[wikilinks]] between related pages
- Write index.md with categorized one-line summaries of every page
- Write initial log.md entry documenting the migration
- Do NOT rewrite the content of existing pages, just add wikilinks and ensure formatting matches the schema

### Step 6: Write .gitignore [AUTO]
```
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.DS_Store
```

### Step 7: Commit and push [STOP]
Stage all files, commit with message: "feat: initialize Karpathy-style LLM Wiki with migrated knowledge"
Push to GitHub.

### Step 8: Verify [STOP]
- Count files in wiki/ and raw/ and report
- Show index.md
- Confirm all source files were copied (not moved)
- Show the git log
```

---

## Phase 2: Consolidate duplicate repos

```
### Prerequisites
- Phase 1 complete: ~/Sites/Global/scott-context/ exists with raw/ and wiki/ directories
- Verify: ls ~/Sites/Global/scott-context/wiki/ should show advosy/, bresco/, personal/, global/

You are helping me clean up duplicate git repos in ~/Sites/.

### Context
I have multiple copies of the same repos. The "top-level" copies are more recent.
The "code/" copies are older duplicates from a previous organizational attempt.

### Pre-flight checks [STOP]
Before deleting anything, run these checks and show me the results:

1. For each duplicate pair, compare the latest commit:
   - ~/Sites/Personal/eleanor/ vs ~/Sites/Personal/code/eleanor/
   - ~/Sites/Personal/life-os/ vs ~/Sites/Personal/code/life-os/
   - ~/Sites/Bresco/automation-business/ vs ~/Sites/Bresco/code/automation-business/

2. Check for uncommitted changes in ALL copies:
   git -C [path] status --short

3. Show me the results in a table:
   | Repo | Top-level commit | code/ commit | Uncommitted? | Safe to delete code/? |

### Delete duplicates [STOP after showing table]
Only after I confirm, delete these:
- rm -rf ~/Sites/Personal/code/eleanor/
- rm -rf ~/Sites/Personal/code/life-os/
- rm -rf ~/Sites/Bresco/code/automation-business/

Then delete the now-empty Personal/code/ directory (if empty).

### Move Bresco platform [STOP]
Move Bresco v2 from code/ to top-level:
- mv ~/Sites/Bresco/code/platform ~/Sites/Bresco/platform
- rm -rf ~/Sites/Bresco/code/ (if now empty)
- Verify: git -C ~/Sites/Bresco/platform status

### Handle advosy-sales dual-remote [STOP]
This is the most complex part. Two copies with DIFFERENT GitHub remotes:
- ~/Sites/Advosy/advosy-sales/ -> cscottodell-code/advosy-sales (personal)
- ~/Sites/Advosy/code/advosy-sales/ -> advosy-hq/advosy-sales (company)

Steps:
1. Show me the last 10 commits from each
2. Check if personal version has unique commits not in advosy-hq:
   cd ~/Sites/Advosy/advosy-sales
   git remote add advosy-hq https://github.com/advosy-hq/advosy-sales.git
   git fetch advosy-hq
   git log advosy-hq/main..HEAD --oneline
3. Show me what's unique and let me decide

### Clean up Advosy/code/ [STOP]
Check the non-git directories in Advosy/code/ for unique content:
- advosy-sales-ui-overhaul/ (non-git)
- b2b/ (non-git)
- claimsforce/ (non-git)

For each: show me the files and let me decide if they should be:
- Moved to scott-context/raw/artifacts/advosy/
- Deleted
- Kept

Then delete remaining Advosy/code/ duplicates (d2d-apps, d2d-payroll, spotio-cf).
```

---

## Phase 3: Move remaining non-git content to scott-context

```
### Prerequisites
- Phase 1 complete: scott-context repo exists with knowledge files COPIED in
- Phase 2 complete: duplicate code/ directories deleted, Bresco/platform at root level
- Verify: ls ~/Sites/Personal/code/ should fail (directory gone)
- Verify: ls ~/Sites/Bresco/platform/ should succeed

You are helping me move remaining scattered files to the scott-context knowledge repo.

### Context
Phase 1 COPIED files. Now we move the originals and clean up.
The scott-context repo is at ~/Sites/Global/scott-context/

### Move artifacts [AUTO]
Move these to raw/artifacts/advosy/ (if not already there from Phase 1):
- ~/Sites/Advosy/sarah-seat-final.html
- ~/Sites/Advosy/sarah-seat-final.pdf
- ~/Sites/Advosy/sarah-seat-final.png
- ~/Sites/Advosy/planning/sarah-seat-proposal.html
- ~/Sites/Advosy/planning/sarah-seat-proposal.pdf
- ~/Sites/Advosy/advosy-membership/advosy-membership-program.pdf
- ~/Sites/Advosy/advosy-membership/advosy-membership-program.html
- ~/Sites/Advosy/claimsforce/loe_to_close_dashboard.html

### Delete emptied source directories [STOP]
After confirming all files are in scott-context, delete:
- ~/Sites/Advosy/planning/ (should be empty)
- ~/Sites/Advosy/tasks/ (moved to wiki/)
- ~/Sites/Advosy/advosy-membership/
- ~/Sites/Advosy/claimsforce/
- ~/Sites/Bresco/knowledge/
- ~/Sites/Bresco/planning/
- ~/Sites/Bresco/research/
- ~/Sites/Bresco/tasks/
- ~/Sites/Personal/knowledge/
- ~/Sites/Personal/learning/
- ~/Sites/Personal/notebooklm-eos/
- ~/Sites/Global/knowledge/
- ~/Sites/Global/people/
- ~/Sites/Global/decisions/
- ~/Sites/Global/research/
- ~/Sites/Global/deep-research/

### Commit scott-context [STOP]
Stage and commit: "feat: complete knowledge migration from Sites directories"
Push to GitHub.

### Run lint pass [AUTO]
Run the "Lint" workflow from CLAUDE.md on the wiki:
- Check for broken [[wikilinks]]
- Find orphan pages
- Report any issues
```

---

## Phase 4: Clean up dead files

```
### Prerequisites
- Phases 1-3 complete: all knowledge files moved to scott-context, source dirs emptied
- Verify: ls ~/Sites/Bresco/knowledge/ should fail (directory gone or empty)
- Verify: ls ~/Sites/Global/scott-context/wiki/advosy/ should show .md files

You are helping me clean up abandoned and empty directories in ~/Sites/.

### Delete Archive [STOP]
~/Sites/Archive/ contains ~18,700 files of old projects. I've confirmed these can be deleted.
- Show me the total size first: du -sh ~/Sites/Archive/
- After my confirmation: rm -rf ~/Sites/Archive/

### Delete empty directories [AUTO]
- rm -rf ~/Sites/Personal/journal/
- rm -rf ~/Sites/Personal/later/
- rm -rf ~/Sites/Personal/planning/
- rm -rf ~/Sites/Personal/research/
- rm -rf ~/Sites/Advosy/research/

### Delete replaced/redundant items [STOP]
Show me each before deleting:
- ~/Sites/Global/BMAD-METHOD/ (replaced by GSD)
- ~/Sites/Global/deep-research.skill/ (empty)
- ~/Sites/Advosy/.gitignore (Advosy root is not a git repo)
- ADR .html files in Global/decisions/ (keep .md only -- but these should already be in scott-context)

### Delete redundant standalone files [AUTO]
- ~/Sites/Advosy/about-me.md
- ~/Sites/Advosy/conventions.md
- ~/Sites/Bresco/about-me.md (if exists)
- ~/Sites/Bresco/conventions.md (if exists)
- ~/Sites/Personal/about-me.md
- ~/Sites/Personal/conventions.md
- ~/Sites/Global/about-me.md
- ~/Sites/Global/conventions.md

### Verify clean state [STOP]
Show me the new ~/Sites/ directory tree (top 2 levels) so I can confirm it matches the target structure.
```

---

## Phase 5: Update all navigation files + exhaustive ripple scan

```
### Prerequisites
- Phases 1-4 complete: scott-context populated, duplicates gone, dead files deleted
- Verify: ls ~/Sites/Archive/ should fail (deleted)
- Verify: ls ~/Sites/Personal/code/ should fail (deleted)
- Verify: ls ~/Sites/Global/scott-context/index.md should succeed
- The directory structure should now match the target (run: ls -1 ~/Sites/*/ to check)

You are helping me update ALL path references across my entire system after a major directory restructure.

### Context
After cleanup, the structure changed:
- Code repos: flat under each org folder (no more code/ subdirectory)
- Knowledge: consolidated in ~/Sites/Global/scott-context/ (Karpathy LLM Wiki)
- Bresco platform moved from code/platform to top-level
- Many directories deleted or moved

THIS IS THE MOST IMPORTANT PHASE. A missed path reference means something breaks silently.

### Step 1: Exhaustive ripple scan [STOP]

Run this grep to find EVERY file that references old paths. This is non-negotiable.
Show me the FULL results before changing anything.

```bash
# EXHAUSTIVE ripple scan -- follows symlinks, includes hidden files,
# searches .planning/ dirs, only skips .git/ and binary bloat
rg --no-ignore --hidden --follow -l \
  -e 'Sites/Personal/code/' \
  -e 'Sites/Advosy/code/' \
  -e 'Sites/Bresco/code/' \
  -e 'Sites/Global/knowledge/' \
  -e 'Sites/Global/people/' \
  -e 'Sites/Global/decisions/' \
  -e 'Sites/Global/research/' \
  -e 'Sites/Global/deep-research' \
  -e 'Sites/Personal/knowledge/' \
  -e 'Sites/Personal/learning/' \
  -e 'Sites/Personal/notebooklm' \
  -e 'Sites/Bresco/knowledge/' \
  -e 'Sites/Bresco/planning/' \
  -e 'Sites/Bresco/research/' \
  -e 'Sites/Bresco/tasks/' \
  -e 'Sites/Advosy/planning/' \
  -e 'Sites/Advosy/tasks/' \
  -e 'Sites/Advosy/knowledge/' \
  -e 'Sites/Advosy/claimsforce/' \
  -e 'Sites/Advosy/advosy-membership/' \
  -e 'Sites/Global/BMAD-METHOD' \
  -e 'Sites/Archive/' \
  -g '!.git/' -g '!node_modules/' -g '!.nuxt/' -g '!*.lock' -g '!pnpm-lock.yaml' \
  ~/Sites/ ~/.claude/ ~/.claude-config/ 2>/dev/null
```

Flags explained:
- `--no-ignore`: don't skip files listed in .gitignore
- `--hidden`: search hidden files and directories (.planning/, .claude-resume.md, .context-snapshot.md, etc.)
- `--follow`: follow symlinks (catches ~/.claude/skills/ and ~/.claude/hooks/ which are symlinks to scott-toolkit)
- `-g '!.git/'`: only exclusion is .git internals (thousands of pack files, not useful)
- No `!.planning/` exclusion: .planning/ directories inside projects (like Bresco platform) contain path references that need updating

Then for EACH file found, show me a table:

| File | Old Path Reference | Category |
|------|-------------------|----------|
| path/to/file | the old path it references | FIX / IGNORE / ASK |

Category rules:
- **FIX**: Active config, CLAUDE.md, skills, hooks, settings -- must update
- **IGNORE**: Old session metadata (.claude/projects/*/subagents/), historical docs (superpowers/plans/), the cleanup prompt itself
- **ASK**: Anything you're not sure about -- show me and let me decide

### Step 2: Path migration table [AUTO]

Use this mapping for all fixes. Apply these replacements:

| Old Path | New Path |
|----------|----------|
| `Sites/Personal/code/eleanor` | `Sites/Personal/eleanor` |
| `Sites/Personal/code/life-os` | `Sites/Personal/life-os` |
| `Sites/Advosy/code/advosy-sales` | `Sites/Advosy/advosy-sales` |
| `Sites/Advosy/code/d2d-apps` | `Sites/Advosy/d2d-apps` |
| `Sites/Advosy/code/d2d-payroll` | `Sites/Advosy/d2d-payroll` |
| `Sites/Advosy/code/spotio-cf` | `Sites/Advosy/spotio-cf` |
| `Sites/Bresco/code/platform` | `Sites/Bresco/platform` |
| `Sites/Bresco/code/automation-business` | `Sites/Bresco/automation-business` |
| `Sites/Global/knowledge/` | `Sites/Global/scott-context/wiki/global/` |
| `Sites/Global/people/` | `Sites/Global/scott-context/wiki/global/people/` |
| `Sites/Global/decisions/` | `Sites/Global/scott-context/wiki/global/decisions/` |
| `Sites/Global/research/` | `Sites/Global/scott-context/raw/research/global/` |
| `Sites/Global/deep-research/` | `Sites/Global/scott-context/raw/research/deep-research/` |
| `Sites/Personal/knowledge/` | `Sites/Global/scott-context/wiki/personal/` |
| `Sites/Personal/learning/` | `Sites/Global/scott-context/wiki/personal/learning/` |
| `Sites/Personal/notebooklm-eos/` | `Sites/Global/scott-context/raw/transcripts/notebooklm-eos/` |
| `Sites/Bresco/knowledge/` | `Sites/Global/scott-context/wiki/bresco/` |
| `Sites/Bresco/planning/` | `Sites/Global/scott-context/raw/research/bresco-v1-planning/` |
| `Sites/Bresco/research/` | `Sites/Global/scott-context/raw/research/bresco-research/` |
| `Sites/Bresco/tasks/` | `Sites/Global/scott-context/wiki/bresco/tasks/` |
| `Sites/Advosy/knowledge/` | `Sites/Global/scott-context/wiki/advosy/` |
| `Sites/Advosy/planning/` | `Sites/Global/scott-context/raw/artifacts/advosy/` |
| `Sites/Advosy/tasks/` | `Sites/Global/scott-context/wiki/advosy/tasks/` |
| `Sites/Advosy/claimsforce/` | `Sites/Global/scott-context/raw/artifacts/advosy/` |
| `Sites/Advosy/advosy-membership/` | `Sites/Global/scott-context/raw/artifacts/advosy/` |
| `Sites/Global/BMAD-METHOD/` | (deleted, remove reference) |
| `Sites/Archive/` | (deleted, remove reference) |

### Step 3: Fix all FIX-category files [STOP]

Apply the path migration table to every file marked FIX. Show me a diff for each file before saving.

Known high-priority files (fix these even if the grep somehow misses them):
- `~/.claude/settings.local.json` -- Claude Code project routing
- `~/.claude-config/settings.local.json` -- backup config
- `~/Sites/Global/scott-toolkit/hooks/session-start.ts` -- runs every session
- `~/Sites/Global/scott-toolkit/references/project-catalog.md` -- master project index
- `~/Sites/Personal/scott-knowledge/skills/*/SKILL.md` -- all 11 skills, check each for old paths

### Step 4: Update CLAUDE.md files [STOP]

Rewrite these navigation files to reflect the new structure:

**~/Sites/CLAUDE.md** (master nav):
- Remove the "Every Org Has the Same Subfolders" section (no longer true -- knowledge is centralized)
- Replace code/ references with flat repo layout
- Point knowledge lookups to scott-context/wiki/
- Point research lookups to scott-context/raw/research/
- Remove Archive reference

**~/Sites/Advosy/CLAUDE.md**:
- Remove code/ references, repos are flat under Advosy/
- Point knowledge to scott-context/wiki/advosy/

**~/Sites/Bresco/CLAUDE.md**:
- platform/ at root level (not code/platform)
- Point knowledge to scott-context/wiki/bresco/

**~/Sites/Personal/CLAUDE.md**:
- No code/ dir, repos flat
- Point knowledge to scott-context/wiki/personal/

**~/Sites/Global/CLAUDE.md**:
- Add scott-context as the knowledge hub
- Remove standalone knowledge/, people/, decisions/, research/ references
- Keep scott-toolkit and context-engineering

### Step 5: Update ~/.claude/CLAUDE.md [STOP]
Update project paths in the Quick References and Context Routing sections.
Do NOT change tech stack, preferences, or other unrelated sections.

### Step 6: Rewrite ~/.claude/cowork-global-instructions.md [STOP]
Full rewrite. The current version is badly outdated (references npm, Notion, old stack).
New content should include:
- About Scott (Head of Sales, Advosy, Arizona, learning developer)
- Current tech stack: Nuxt 4 + Nuxt UI v4 + Tailwind CSS v4 | TypeScript | SurrealDB v3 | pnpm
- Infrastructure: GitHub | Hetzner + Coolify (primary) | Vercel (legacy)
- Where context lives: ~/Sites/Global/scott-context/ (Karpathy LLM Wiki)
  - wiki/ for compiled knowledge, raw/ for source material
- Active projects table with CORRECT paths:
  | Project | Path |
  | Advosy Sales | ~/Sites/Advosy/advosy-sales/ |
  | Bresco Platform | ~/Sites/Bresco/platform/ |
  | Automation Business | ~/Sites/Bresco/automation-business/ |
  | Eleanor | ~/Sites/Personal/eleanor/ |
  | Life OS | ~/Sites/Personal/life-os/ |
  | Scott Toolkit | ~/Sites/Global/scott-toolkit/ |
  | Scott Context (Wiki) | ~/Sites/Global/scott-context/ |
- Team: Scott (training/dev lead), Brett (co-developer), Gary (production developer)
- Communication style: direct, concise, tables/bullets, no jargon, label claims
- Anti-patterns: no Notion, no npm (use pnpm), never confuse Claimsforce with Advosy CRM
- LLM Wiki workflows: ingest, query, lint

### Step 7: Second ripple scan (verification) [STOP]

Run the SAME grep from Step 1 again. This time the results should be:
- Zero FIX-category files remaining
- Only IGNORE-category files (old session metadata, historical docs, the cleanup prompt itself)

If any FIX files remain, fix them before proceeding.

### Step 8: Smoke test [STOP]
1. Start a fresh Claude Code session (or /clear)
2. Verify CLAUDE.md loads correctly
3. Ask Claude to find knowledge about Advosy -- does it route to scott-context/wiki/advosy/?
4. Ask Claude to find a person profile -- does it route to scott-context/wiki/global/people/?
5. Run the session-start hook -- does it execute without errors?
6. Report results
```

---

## Phase 6: Obsidian setup on MacBook Air

```
### Prerequisites
- Phases 1-5 complete: scott-context repo populated, all CLAUDE.md files updated, ripple scan clean
- Verify: ~/Sites/Global/scott-context/wiki/ has .md files with [[wikilinks]]
- Verify: Obsidian is installed (ls /Applications/Obsidian.app). If not, install from https://obsidian.md/download
- Decision already made: using Obsidian Sync ($4/month) for cross-device sync (not iCloud)

You are helping me set up Obsidian as the frontend for my LLM Wiki knowledge base.
I have never used Obsidian before. Walk me through everything step by step.

### Context
- Obsidian is already installed on this MacBook Air
- The scott-context repo at ~/Sites/Global/scott-context/ will be the Obsidian vault
- It follows Karpathy's LLM Wiki pattern with raw/ and wiki/ directories
- I need: obsidian-git plugin (GitHub sync), Dataview plugin (queries), Web Clipper (browser)
- I also need the Obsidian MCP server so Claude Code can search my vault

### Step 1: Open your vault [STOP]

Tell me to do these exact steps:

1. Open the Obsidian app (it's in Applications or Spotlight search "Obsidian")
2. You'll see a screen that says "Vault" with options. Click **"Open folder as vault"**
   (NOT "Create new vault" -- we already have the folder)
3. Navigate to: **~/Sites/Global/scott-context/**
   - In the file picker: click your username in the sidebar > Sites > Global > scott-context
   - Click **"Open"**
4. Obsidian will create a `.obsidian/` folder inside scott-context (this is normal, it stores your settings)
5. You should now see your wiki/ and raw/ folders in the left sidebar

**What you should see:**
- Left sidebar: a file tree showing `raw/`, `wiki/`, `index.md`, `log.md`, `CLAUDE.md`
- If you click on any `.md` file, it opens in the main area
- Files with `[[wikilinks]]` will show clickable purple links

**If something looks wrong:** Tell me what you see and I'll help troubleshoot.

### Step 2: Enable community plugins [STOP]

Obsidian ships with community plugins DISABLED by default. We need to turn them on first.

Tell me to do these exact steps:

1. Click the **gear icon** (bottom-left corner of the Obsidian window) to open Settings
2. In the left sidebar of Settings, click **"Community plugins"**
3. You'll see a warning: "Community plugins can access files on your computer..."
4. Click **"Turn on community plugins"**
5. You should now see a "Browse" button and an empty list of installed plugins
6. Leave Settings open for the next step

### Step 3: Install obsidian-git plugin [STOP]

This plugin auto-syncs your vault to GitHub so your Mac Studio and mobile devices stay current.

Tell me to do these exact steps:

1. In Settings > Community plugins, click **"Browse"**
2. A plugin marketplace opens. In the search bar at the top, type: **obsidian-git**
3. Click on **"Obsidian Git"** by Vinzent (Denis Olehov) -- it should be the top result
4. Click the purple **"Install"** button
5. After it installs, click **"Enable"** (the button changes from Install to Enable)
6. You should see "Obsidian Git" appear in your left sidebar under Community plugins with a toggle ON

### Step 4: Configure obsidian-git [STOP]

Tell me to do these exact steps:

1. In Settings > Community plugins, find "Obsidian Git" in the list and click the **gear icon** next to it
2. Set these settings (scroll through the options):

   **Automatic:**
   - "Vault backup interval (minutes)": set to **10**
     (This auto-commits and pushes every 10 minutes)
   - "Auto pull interval (minutes)": set to **5**
     (This pulls changes from GitHub every 5 minutes)
   - "Commit message on auto backup": change to **vault: auto-backup {{date}}**
   - "Pull updates on startup": toggle **ON**
   - "Push on backup": toggle **ON**

   **Commit message:**
   - "Commit message on manual backup/commit": change to **vault: manual backup {{date}}**

3. All other settings can stay at defaults
4. Close Settings (click X or press Escape)

**Test it works:**
- Press `Cmd + P` to open the Command Palette (a search bar pops up)
- Type: **git push**
- Click "Obsidian Git: Push"
- If it works, you'll see a brief notification at the top. If it fails, tell me the error.

### Step 5: Install Dataview plugin [STOP]

Dataview lets you query your wiki like a database (think: spreadsheet formulas for your notes).

Tell me to do these exact steps:

1. Open Settings (gear icon, bottom-left)
2. Go to Community plugins > click **"Browse"**
3. Search for: **dataview**
4. Click on **"Dataview"** by Michael Brenan
5. Click **"Install"**, then **"Enable"**
6. Close Settings

You can use Dataview later to create dashboards like "show me all wiki pages updated in the last week."
We won't configure it now -- the defaults are fine.

### Step 6: Install Obsidian Web Clipper [STOP]

This is a BROWSER extension (not an Obsidian plugin). It lets you save web articles directly into your raw/articles/ folder.

Tell me to do these exact steps:

1. Open your web browser (Chrome, Safari, Arc, whatever you use)
2. Search for: **"Obsidian Web Clipper"** in your browser's extension store
   - Chrome: https://chromewebstore.google.com and search "Obsidian Web Clipper"
   - Safari: it's available on the Mac App Store, search "Obsidian Web Clipper"
   - Arc: uses Chrome extensions, same link as Chrome
3. Install the extension
4. After installing, click the extension icon in your browser toolbar
5. It will ask you to connect to your vault:
   - Open Obsidian
   - In Obsidian Settings > Community plugins, you may need to enable the "Local REST API" plugin for some clipper versions
   - OR: the clipper may auto-detect your vault
6. Configure the save location:
   - Set the default folder to: **raw/articles**
   - This means clipped articles land in your raw/ directory (immutable sources)

**Test it:**
- Go to any article on the web
- Click the Web Clipper extension icon
- It should show a preview of the article in markdown
- Click "Add to Obsidian"
- Check Obsidian: the article should appear in raw/articles/

If the Web Clipper setup is confusing, we can skip it for now and come back to it.
The core vault + git sync is more important.

### Step 7: Set up MCP server for Claude Code [STOP]

This connects Claude Code to your Obsidian vault so Claude can search your knowledge base.

Claude Code will do this step for you. Tell Claude Code:

"Install the obsidian-claude-code-mcp server. The vault is at ~/Sites/Global/scott-context/.
Add it to ~/.claude/mcp-servers.json."

Claude Code should:
1. Check if the MCP server package exists: https://github.com/iansinnott/obsidian-claude-code-mcp
2. Install it (usually via npm or npx)
3. Add the server config to ~/.claude/mcp-servers.json
4. Test it by searching the vault for a known page

If Claude Code can't install it automatically, the manual steps are:
```bash
# Install the MCP server globally
npm install -g obsidian-claude-code-mcp

# Add to mcp-servers.json (Claude Code can do this)
```

Then add this to ~/.claude/mcp-servers.json:
```json
{
  "obsidian": {
    "command": "obsidian-claude-code-mcp",
    "args": ["--vault", "/Users/scott/Sites/Global/scott-context"]
  }
}
```

**Test it:**
After restarting Claude Code, ask: "Search my Obsidian vault for 'Advosy'"
Claude should be able to find wiki/advosy/ pages.

### Step 8: Decide on mobile sync method [STOP]

You have two options for getting your vault to iPad and iPhone.
Read both and tell me which you prefer:

**Option A: Obsidian Sync ($4/month)**
- Official Obsidian service, works perfectly across all devices
- End-to-end encrypted
- Toggle ON in Obsidian Settings > "Sync" (left sidebar, under Core plugins)
- You sign in with an Obsidian account on each device
- No symlinks, no scripts, nothing to maintain
- One downside: the .git directory won't sync (which is actually fine, git stays on Macs only)

**Option B: iCloud sync (free but requires setup)**
- We create a SEPARATE copy of just the markdown files in iCloud (no .git)
- Set up a script that runs every 10 minutes to rsync changes
- More complex, can occasionally have sync conflicts
- Free

I recommend Option A (Obsidian Sync) because:
- You have 5 devices, iCloud sync gets messy with that many
- $4/month is trivial compared to the time you'll waste debugging iCloud sync issues
- It "just works" without any maintenance

If you choose Option A, here's how to set it up:

1. Go to https://obsidian.md/account and create an account (or sign in)
2. Subscribe to Sync ($4/month under the "Sync" tab)
3. In Obsidian on your MacBook Air:
   - Open Settings > Core plugins > toggle ON **"Sync"**
   - Click on "Sync" in the left sidebar
   - Sign in with your Obsidian account
   - Click **"Create new remote vault"**
   - Name it: **scott-context**
   - Check "End-to-end encryption" if you want (recommended)
   - Click **"Create"**
4. It will start uploading your vault files
5. Wait for the initial sync to complete (watch the sync icon in the bottom-right)

If you choose Option B, Claude Code will set up the rsync script for you.

### Step 9: Learn the basics [STOP]

Quick orientation so you know what you're looking at:

**Navigation:**
- Left sidebar = file tree (like Finder)
- Click any .md file to open it
- `Cmd + O` = quick file switcher (type part of a filename to jump to it)
- `Cmd + P` = command palette (search for any action)

**Wikilinks:**
- Text in `[[double brackets]]` is a link to another page
- Click a wikilink to jump to that page
- If the page doesn't exist yet, it shows as a dimmed link. Clicking it creates the page.

**Graph View (the cool part):**
- `Cmd + P` > type "graph" > click "Open graph view"
- You'll see a visual map of all your pages and how they connect via wikilinks
- Zoom in/out, drag nodes around, hover for previews
- This is why Karpathy uses Obsidian -- it shows you the shape of your knowledge

**Search:**
- `Cmd + Shift + F` = search across ALL files in the vault
- This searches inside files, not just filenames

**Editing:**
- Just click in a file and start typing -- it's markdown
- But remember: wiki/ files are LLM-maintained. If you edit them manually, that's fine, but the LLM may update them on the next ingest pass.
- raw/ files are immutable -- don't edit those, they're source material

### Step 10: Verify everything works [STOP]

Run through this checklist:

1. ✅ Can you see wiki/ and raw/ in the sidebar?
2. ✅ Can you open a wiki page and see [[wikilinks]] as clickable links?
3. ✅ Can you open Graph View and see connections?
4. ✅ Does `Cmd + P` > "Obsidian Git: Push" work without errors?
5. ✅ Is the Web Clipper installed in your browser? (OK to skip for now)
6. ✅ Can Claude Code search the vault via MCP? (test in a Claude Code session)
7. ✅ Did you choose a mobile sync method? (Obsidian Sync or iCloud)

Tell me which items passed and which need help.
```

---

## Phase 7: Mac Studio setup
(Execute this ON the Mac Studio, not remotely)

```
### Prerequisites
- Phases 1-6 complete on the MacBook Air: scott-context repo on GitHub, Obsidian configured
- Verify: the scott-context repo exists on GitHub (gh repo view cscottodell-code/scott-context)
- This phase runs on the Mac Studio, NOT the MacBook Air
- Decision already made: using Obsidian Sync ($4/month) for vault sync across devices

You are helping me set up my always-on Mac Studio for Claude Cowork access.
I'll also set up Obsidian here so the wiki is browsable on this machine.

### Context
The Mac Studio should have:
- All code repos cloned (for Cowork to reference)
- scott-context vault (for knowledge access via Obsidian)
- scott-toolkit deployed (for Claude config sync)
- Auto-pull cron jobs to stay current
- Obsidian running with the same vault

### Step 1: Verify prerequisites [STOP]
Check:
- git is installed: git --version
- SSH keys exist for GitHub: ls ~/.ssh/id_*
- gh CLI is installed: gh --version
- If any missing, tell me what to install and walk me through it

### Step 2: Create directory structure [AUTO]
mkdir -p ~/Sites/{Advosy,Bresco,Personal,Global}

### Step 3: Clone repos [STOP]

Run these commands. If any fail (e.g., SSH key issue), stop and help me fix it.

```bash
cd ~/Sites/Global && git clone https://github.com/cscottodell-code/scott-toolkit.git
cd ~/Sites/Global && git clone https://github.com/cscottodell-code/scott-context.git
cd ~/Sites/Personal && git clone https://github.com/cscottodell-code/scott-knowledge.git
cd ~/Sites/Personal && git clone https://github.com/cscottodell-code/eleanor.git
cd ~/Sites/Advosy && git clone https://github.com/advosy-hq/advosy-sales.git
cd ~/Sites/Bresco && git clone https://github.com/cscottodell-code/bresco.git platform
cd ~/Sites/Bresco && git clone https://github.com/cscottodell-code/automation-business.git
```

### Step 4: Deploy scott-toolkit [STOP]

```bash
cd ~/Sites/Global/scott-toolkit && ./setup.sh
```

Verify it worked:
```bash
ls -la ~/.claude/skills/    # Should show symlinks
ls -la ~/.claude/hooks/     # Should show symlinks
cat ~/.claude/CLAUDE.md     # Should show Scott's config
```

If setup.sh fails, show me the error.

### Step 5: Install and configure Obsidian [STOP]

Tell me to do these exact steps on the Mac Studio:

1. Download Obsidian from https://obsidian.md/download (if not already installed)
2. Open Obsidian
3. Click **"Open folder as vault"**
4. Navigate to: ~/Sites/Global/scott-context/ and click Open
5. You'll see the same wiki/ and raw/ structure as on the MacBook Air

**Enable community plugins:**
1. Settings (gear icon, bottom-left) > Community plugins
2. Click "Turn on community plugins"

**Install obsidian-git:**
1. Community plugins > Browse > search "obsidian-git"
2. Install > Enable

**Configure obsidian-git for Mac Studio (READ-MOSTLY):**
1. Settings > Community plugins > Obsidian Git > gear icon
2. Settings to change:
   - "Vault backup interval (minutes)": set to **0** (DISABLED -- Mac Studio doesn't auto-push)
   - "Auto pull interval (minutes)": set to **15**
   - "Pull updates on startup": toggle **ON**
   - "Push on backup": toggle **OFF**
3. The Mac Studio PULLS changes but does NOT push. The MacBook Air is the primary writer.

**If using Obsidian Sync (from Phase 6):**
1. Settings > Core plugins > toggle ON "Sync"
2. Click "Sync" in the left sidebar
3. Sign in with the same Obsidian account as MacBook Air
4. Click "Connect to remote vault" > select "scott-context"
5. It will download all files. This replaces the obsidian-git auto-pull for vault sync.
6. You STILL need obsidian-git for code repos (Obsidian Sync only handles the vault).

### Step 6: Set up cron jobs for code repos [STOP]

These keep the code repos fresh for Cowork. The wiki syncs via obsidian-git or Obsidian Sync.

Tell me to run:
```bash
crontab -e
```

This opens a text editor (probably vim or nano). Add these lines at the bottom:

```
# Code repos - hourly during work hours (7am-10pm)
0 7-22 * * * cd ~/Sites/Advosy/advosy-sales && git pull --ff-only 2>/dev/null
0 7-22 * * * cd ~/Sites/Bresco/platform && git pull --ff-only 2>/dev/null
0 7-22 * * * cd ~/Sites/Personal/eleanor && git pull --ff-only 2>/dev/null
```

Save and exit:
- If nano: `Ctrl+O` to save, `Ctrl+X` to exit
- If vim: press `Escape`, type `:wq`, press Enter

Verify:
```bash
crontab -l   # Should show the 3 cron jobs
```

### Step 7: Verify everything [STOP]

Run through this checklist on the Mac Studio:

1. ✅ `ls ~/Sites/Global/scott-context/wiki/` shows knowledge files?
2. ✅ `ls ~/Sites/Global/scott-toolkit/skills/` shows skill files?
3. ✅ Obsidian shows the vault with wiki pages and working [[wikilinks]]?
4. ✅ `crontab -l` shows the 3 hourly pull jobs?
5. ✅ Open a Cowork session and ask: "Read ~/Sites/Global/scott-context/wiki/global/people/ and tell me who is on my team" -- does it work?
6. ✅ Ask Cowork: "What is Bresco?" -- does it find context from the wiki?

Tell me which items passed and which need help.
```

---

## Phase 8: Claude AI Projects + Mobile Obsidian

```
### Prerequisites
- Phases 1-6 complete: scott-context on GitHub, wiki populated, Obsidian configured on MacBook Air
- Phase 7 is independent (Mac Studio). Phases 7 and 8 can run in either order.
- Verify: the scott-context repo exists on GitHub with wiki/ files
- You need: access to claude.ai on a web browser, iPad with App Store, iPhone with App Store
- Decision already made: using Obsidian Sync ($4/month) for mobile vault access

You are helping me set up Claude AI Projects for mobile access and Obsidian on my iPad and iPhone.
I have never set up Claude AI Projects before. Walk me through everything.

### Context
- I want to access my knowledge from iPad and iPhone via both Claude AI and Obsidian
- Claude AI Projects lets me link GitHub repos and upload knowledge files
- Projects must be CREATED on the web (claude.ai), but can be USED on mobile
- Obsidian on iPad/iPhone syncs via Obsidian Sync or iCloud

### Step 1: Create Claude AI Projects [STOP]

Tell me to do these exact steps in my web browser:

1. Go to https://claude.ai
2. Sign in (or create an account if needed)
3. Look at the left sidebar. You should see "Projects" or a folder icon.
   - If you don't see it, click the hamburger menu (three lines) at the top-left
4. Click **"New Project"** (or the + icon next to Projects)
5. Create these 5 projects, one at a time:

**Project 1: Advosy Work**
- Name: Advosy Work
- Description: "Advosy business context, sales tools, EOS, CRM, team"
- Click Create

**Project 2: Bresco**
- Name: Bresco
- Description: "Bresco platform development, business planning, roofing industry"
- Click Create

**Project 3: Eleanor**
- Name: Eleanor
- Description: "Eleanor desktop app, personal AI assistant, SurrealDB, Tauri"
- Click Create

**Project 4: Scott Toolkit**
- Name: Scott Toolkit
- Description: "Claude configuration, skills, hooks, workflows, rules"
- Click Create

**Project 5: General / Personal**
- Name: General / Personal
- Description: "Cross-cutting research, people, learning, life, decisions"
- Click Create

### Step 2: Link GitHub repos to each Project [STOP]

For each Project, you'll connect GitHub repos so Claude can reference the code.

Tell me to do these steps for EACH project:

1. Click on the Project name to open it
2. Look for **"Project knowledge"** or **"Add content"** in the Project settings
3. Click **"Connect GitHub"** or **"Add from GitHub"**
   - First time: you'll need to authorize Claude to access your GitHub
   - Click "Connect GitHub account"
   - Authorize the Anthropic app
   - Select which repos to give access to (select all, or at minimum the ones listed below)
4. Once connected, add repos to each Project:

| Project | Repos to Link |
|---------|--------------|
| Advosy Work | `advosy-hq/advosy-sales` AND `cscottodell-code/scott-context` |
| Bresco | `cscottodell-code/bresco` AND `cscottodell-code/scott-context` |
| Eleanor | `cscottodell-code/eleanor` AND `cscottodell-code/scott-context` |
| Scott Toolkit | `cscottodell-code/scott-toolkit` |
| General / Personal | `cscottodell-code/scott-context` AND `cscottodell-code/scott-knowledge` |

5. After linking, you should see the repo files listed in the Project knowledge section
6. Click **"Sync now"** if there's a sync button (pulls latest files from GitHub)

### Step 3: Upload key wiki pages [STOP]

GitHub linking gives Claude access to the FULL repo, but uploading specific files to the
Project knowledge base makes them always-available (not dependent on retrieval).

For each Project:

1. Open the Project
2. Click **"Add content"** > **"Upload files"**
3. Navigate to ~/Sites/Global/scott-context/wiki/ on your Mac
4. Upload these files:

**Advosy Work:** Upload all .md files from `wiki/advosy/`
**Bresco:** Upload all .md files from `wiki/bresco/`
**Eleanor:** Upload `wiki/personal/Eleanor.md` and any related Eleanor pages
**General / Personal:** Upload all .md files from `wiki/global/` (including `people/` subfolder)
**Scott Toolkit:** Skip uploads (the linked repo is enough)

Note: You can only upload about 5 files at a time in the UI. Repeat until all files are uploaded.
If there are too many files, prioritize the "Hub" files (Advosy Hub.md, Bresco Hub.md, etc.)

### Step 4: Add custom instructions to each Project [STOP]

Each Project can have custom instructions that Claude always follows in that Project.

For each Project:

1. Open the Project
2. Look for **"Custom instructions"** or **"Project instructions"** (usually at the top or in settings)
3. Add this text (customize per project):

**For Advosy Work:**
```
You are helping Scott with Advosy work. Scott is Head of Sales at Advosy, a home services company in Arizona.

Key context:
- Tech stack: Nuxt 4, Nuxt UI v4, Tailwind CSS v4, TypeScript, SurrealDB v3
- Team: Scott (training/dev), Brett (co-developer), Gary (production developer)
- The wiki/ folder in scott-context has compiled knowledge about Advosy
- The raw/ folder has source documents and artifacts
- Never confuse Claimsforce (EspoCRM, old system) with Advosy CRM (Gary's new build)
- Use pnpm (not npm)
- Label claims: [VERIFIED], [INFERRED], [ASSUMED]
```

**For Bresco:**
```
You are helping Scott with Bresco. Bresco is a "fractional COO in your pocket" SaaS product for small businesses, starting with home services (roofing).

Key context:
- Tech stack: Nuxt 4, Nuxt UI v4, Tailwind CSS v4, TypeScript, SurrealDB v3
- Team: Scott and Brett Arrington
- The platform repo is the v2 active build
- The wiki/ folder in scott-context has business context and planning docs
- $500/month target price, chat-first interface
- Built on Background Operations (BOPs) methodology
```

**For Eleanor:**
```
You are helping Scott with Eleanor, a personal AI desktop assistant built with Tauri + Nuxt.

Key context:
- Tech stack: Tauri (Rust shell), Nuxt 4, SurrealDB v3
- Eleanor has a knowledge module with source->article->concept schema
- SurrealDB-first search, per-domain staleness, MCP server
- Scott is learning Rust through this project
```

**For General / Personal:**
```
You are helping Scott with personal projects, research, and learning.

Key context:
- The wiki/ folder has Scott's compiled knowledge across all domains
- wiki/global/people/ has profiles of team members and contacts
- wiki/global/decisions/ has architecture decision records
- wiki/personal/learning/ has study guides and course notes
- Label claims: [VERIFIED], [INFERRED], [ASSUMED]
```

### Step 5: Test Projects from the web [STOP]

Before going to mobile, test that each Project works on the web:

1. Open the **Advosy Work** Project
2. Start a new conversation in it
3. Ask: "What do you know about Advosy? Who is on the team?"
4. Claude should reference the wiki pages and repo content
5. If it doesn't know anything, the GitHub sync or uploads didn't work. Tell me.

Repeat a quick test for each Project.

### Step 6: Set up Obsidian on iPad [STOP]

Tell me to do these exact steps on the iPad:

1. Open the **App Store** on your iPad
2. Search for **"Obsidian"** (the icon is a purple/dark gemstone)
3. Download and install it (it's free)
4. Open Obsidian

**If you chose Obsidian Sync (recommended, from Phase 6):**
1. When Obsidian opens, tap **"Sign in"** or go to Settings > Sync
2. Sign in with the SAME Obsidian account you used on your MacBook Air
3. Tap **"Connect to remote vault"**
4. Select **"scott-context"**
5. Tap **"Open vault"**
6. Wait for files to download (may take a minute on first sync)
7. You should see wiki/ and raw/ in the sidebar

**If you chose iCloud sync:**
1. When Obsidian opens, tap **"Create new vault"**
2. Toggle ON **"Store in iCloud"**
3. Name it **"scott-context"**
4. The vault will be empty because iCloud needs to sync the files from your Mac
5. On your MacBook Air, verify the rsync script is running (set up in Phase 6)
6. Wait for iCloud to sync files to iPad (can take 5-30 minutes)
7. Pull down to refresh in Obsidian

### Step 7: Set up Obsidian on iPhone [STOP]

Same steps as iPad:

1. App Store > search "Obsidian" > install
2. Open Obsidian
3. If Obsidian Sync: sign in > connect to "scott-context" vault
4. If iCloud: create vault with iCloud toggle ON, name "scott-context", wait for sync
5. The iPhone experience is similar to iPad but smaller screen

Tips for iPhone:
- Swipe right to show the sidebar/file tree
- Tap a file to open it
- The editor works but is better for reading than editing on a small screen
- Use the search icon (magnifying glass) to find pages quickly

### Step 8: Test the full mobile workflow [STOP]

Run through this on your iPad:

**Obsidian test:**
1. ✅ Open Obsidian. Can you see wiki/ and raw/ folders?
2. ✅ Open a wiki page (e.g., wiki/advosy/). Can you read it?
3. ✅ Tap a [[wikilink]]. Does it navigate to the linked page?
4. ✅ Use search (magnifying glass). Search for "Bresco". Does it find results?

**Claude AI test:**
1. ✅ Open the Claude app on iPad
2. ✅ Tap the menu/sidebar to see your Projects
3. ✅ Tap **"Advosy Work"**
4. ✅ Ask: "What are Scott's active projects?"
5. ✅ Ask: "Tell me about the Advosy sales team"
6. ✅ Does Claude reference knowledge from the wiki/repo?

**Cross-reference test:**
1. ✅ Find something interesting in Obsidian (e.g., an ADR or person profile)
2. ✅ Switch to Claude AI and ask about that same topic
3. ✅ Does Claude's response align with what you read in Obsidian?

Tell me which items passed and which need help. If everything works,
you now have your knowledge accessible on every device!
```

---

## Quick Reference: What Changed

| Before | After |
|---|---|
| Knowledge in 10+ scattered dirs | One repo: scott-context (Karpathy LLM Wiki) |
| Duplicate repos everywhere | One copy per repo, flat under org folder |
| No cross-device access | Obsidian (all devices) + Claude AI Projects (mobile) |
| Stale cowork instructions | Updated with current stack + context routing |
| No knowledge maintenance | LLM ingest/query/lint workflows |
| 18,700 archived files | Deleted |
| Empty placeholder dirs | Deleted |
| Mac Studio disconnected | Auto-pulling repos + Obsidian vault |
