# Scott-Toolkit v2 — How to Use It

This is your personal cheat sheet. The toolkit handles context engineering — making sure Claude Code always knows where you left off, what you're building, and what lessons you've learned. It works alongside GSD (project management) and Superpowers (dev methodology).

---

## Starting a Session

Just open Claude Code in your project folder. The toolkit handles the rest:

1. **Session-start hook fires automatically** — it checks for context files and shows you what's available
2. **If you see "Resume file found"** — Claude will read `.claude-resume.md` and know exactly where you left off
3. **If you see "No resume file"** — type `/scott:resume` for a guided walkthrough of getting back up to speed

If you're in your home directory (`~`), the hook shows your active projects list. Pick one and `cd` into it.

---

## The Slash Commands

These are your workflows. Type them and Claude walks you through each one.

| Command | When to use it |
|---------|---------------|
| `/scott:new-project` | Starting something from scratch |
| `/scott:new-feature` | Adding a feature to an existing project |
| `/scott:resume` | Picking up a project after time away |
| `/scott:retro` | After finishing a milestone — capture lessons |
| `/scott:handoff` | When a prototype is ready for Gary |
| `/scott:toolkit-update` | When you want to improve the toolkit itself |
| `/scott:log-success` | Something went really well — capture it |
| `/scott:log-error` | Something went wrong — capture it |
| `/scott:bypass` | A guard hook blocked something you approved — bypass it |

You don't need to memorize these. Just describe what you want to do and Claude will suggest the right one.

---

## What Happens Automatically (You Don't Need to Do Anything)

### When you start a session
- Hook scans for project context files (CLAUDE.md, PRD.md, todo.md, resume file)
- Hook rebuilds `~/Sites/Global/ACTIVE-PROJECTS.md` from all your project resume files
- You see a short summary of what's available

### When context is about to compact
- Hook saves a mechanical backup (`.context-snapshot.md`)
- Hook tells Claude to write a proper resume file (`.claude-resume.md`)
- **You might see Claude write a file right before compaction — that's normal and intentional**

### When a session ends
- Hook reminds Claude to write the resume file and update docs
- This is your safety net — even if you forget, the reminder fires

### Guard hooks (always running)
- **git push blocked** — prevents accidental pushes (use `/scott:push` or confirm manually)
- **Destructive commands blocked** — `rm -rf`, `git reset --hard`, etc. require explanation
- **CLAUDE.md protected** — can't be overwritten without confirmation
- **npm install blocked** — new dependencies need your approval

---

## Pausing Work (The Most Important Part)

When you're done for the day or switching projects, you have two options:

### Option A: Just close Claude Code
The session-end hook will remind Claude to write the resume file. If Claude has time before the session closes, it writes `.claude-resume.md` with everything needed to continue.

### Option B: Tell Claude "let's stop here"
Claude will:
1. Write/update `.claude-resume.md` with current state
2. Update CLAUDE.md's Current Status section
3. Mark completed tasks in `tasks/todo.md`

**Option B is better** because Claude has full context when you explicitly pause. If you just close the window, the hook fires but Claude might not have time to respond.

### If context fills up mid-session
The PreCompact hook fires automatically. Claude writes the resume file before compaction compresses the conversation. After compaction, Claude reads the resume file back and continues. You shouldn't notice any disruption.

---

## The Resume File (`.claude-resume.md`)

This is the magic. It's a ~10-line file in your project root that tells the next session exactly where to pick up.

**You never write this file.** Claude writes it. It contains:
- What workflow/phase you were in
- What's done and what's next
- Key decisions made during the session

**You never read this file manually either.** Claude reads it at session start. It's a machine-to-machine handoff note.

If you're curious, it looks like this:
```
# Resume Context
Workflow: /scott:new-feature — Phase 4 (Build)
PM Mode: GSD
Branch: feat/user-auth

Done: Mini-PRD approved. Schema updated.
Current: Auth middleware written, not connected to routes.
Next: Connect middleware, then verify.
Decisions: JWT over sessions. 15min access / 7day refresh.
```

---

## Active Projects List (`~/Sites/Global/ACTIVE-PROJECTS.md`)

This file is auto-generated every time you start a session. It lists all projects that have a `.claude-resume.md` file. You can glance at it to see what's in flight:

```
| Project    | Last Worked | Status                    | Path              |
|------------|-------------|---------------------------|-------------------|
| life-os    | 2026-03-01  | Phase 3: data model       | ~/Sites/life-os   |
| advosy-crm | 2026-02-28  | Feature: user auth        | ~/Sites/advosy-crm|
```

**Don't edit this file.** It gets rebuilt from resume files every session. When a project is done and its resume file is removed, it disappears from this list automatically.

---

## Multi-Machine Sync

The toolkit lives at `~/Sites/Global/scott-toolkit/` and is a git repo. To sync across machines:

```bash
# On any machine — pull latest
cd ~/Sites/Global/scott-toolkit && git pull

# If hooks/rules/skills seem off — re-deploy
./setup.sh

# On Brett's machine (different path)
./setup.sh --toolkit-path /path/to/scott-toolkit
```

The setup script uses symlinks, so after `git pull` most changes take effect immediately without re-running setup. Re-run setup only if new hooks or skills were added.

---

## Quick Reference: What Lives Where

| Location | What's there | Who maintains it |
|----------|-------------|-----------------|
| `~/Sites/Global/scott-toolkit/` | The toolkit repo (source of truth) | You + Claude via `/scott:toolkit-update` |
| `~/.claude/hooks/` | Deployed hooks (symlinked to toolkit) | `setup.sh` |
| `~/.claude/rules/` | Behavior rules (symlinked to toolkit) | `setup.sh` |
| `~/.claude/skills/scott-*/` | Deployed workflow skills | `setup.sh` |
| `~/.claude/settings.json` | Hook registrations, plugins | Manual (machine-specific) |
| `<project>/.claude-resume.md` | Resume file for that project | Claude (automatically) |
| `~/Sites/Global/ACTIVE-PROJECTS.md` | Master project list | Session-start hook (automatically) |

---

## What Runs Without You Thinking About It

Everything below happens behind the scenes. You'll never need to trigger, configure, or maintain any of it. It's listed here so you know what's going on if you see something unexpected.

### Files that write themselves

| File | What it is | When it's created/updated | By whom |
|------|-----------|--------------------------|---------|
| `.claude-resume.md` | Per-project handoff note (~10 lines) | Before compaction, at session end, at workflow end | Claude |
| `.context-snapshot.md` | Mechanical backup (git state, todos) | Right before compaction | Hook (shell script) |
| `~/Sites/Global/ACTIVE-PROJECTS.md` | Master list of all in-flight projects | Every session start | Hook (shell script) |

You never create, edit, or delete these files. They're machine-to-machine communication.

### Hooks that fire on their own

| Hook | When it fires | What it does | What you see |
|------|--------------|-------------|-------------|
| **session-start.sh** | Every time you open Claude Code | Scans for resume files, rebuilds active projects list, tells Claude what context exists | A 2-3 line message at the top of your session |
| **pre-compact.sh** | When the context window is about to compress | Saves mechanical backup, tells Claude to write the resume file immediately | Claude suddenly writing a file — that's normal |
| **session-end.sh** | When Claude Code is closing | Reminds Claude to write resume file + update docs | A short checklist reminder |
| **guard-git-push.sh** | Every time Claude tries to `git push` | Blocks it until you confirm | "Git push blocked" message |
| **guard-destructive.sh** | Every time Claude tries `rm -rf`, `git reset --hard`, etc. | Blocks it and explains why | "Blocked: [command] would..." message |
| **guard-claude-md.sh** | Every time Claude tries to edit CLAUDE.md or MEMORY.md | Blocks it until you confirm | "CLAUDE.md modification blocked" message |
| **guard-npm-install.sh** | Every time Claude tries to install packages | Blocks it and lists the packages | "npm install blocked — packages: ..." message |
| **bash logger** | Every Bash command Claude runs | Logs the command to `~/.claude/bash-commands.log` | Nothing — completely silent |
| **GSD context monitor** | After every tool use | Tracks how full the context window is | Warning when context reaches 80%+ |
| **GSD update checker** | At session start | Checks if GSD has updates available | Update notification if one exists |
| **GSD status line** | Continuously | Shows project/phase info in the status bar | A status line at the bottom of your terminal |
| **Notification sound** | When Claude needs your attention | Plays a sound + macOS notification | "Blow" sound + popup |

### Behavior rules always loaded

These rules live in `~/.claude/rules/` and Claude reads them automatically in every session, every project. You never need to reference them.

| Rule | What it tells Claude |
|------|---------------------|
| **claude-behavior.md** | Use Superpowers for dev methodology, GSD for project management, toolkit for learning capture. Enter plan mode for complex tasks. Never mark work done without proving it works. |
| **code-style.md** | TypeScript strict mode, Vue 3 Composition API, Tailwind v4, Pinia, 2-space indent, single quotes. |
| **n8n-sync.md** | Keep local tools-needing-setup file and n8n reminder workflow in sync. |

### Symlinks (why updates "just work")

The hooks and rules in `~/.claude/` are symlinks — shortcuts that point back to `~/Sites/Global/scott-toolkit/`. When you `git pull` toolkit updates, the symlinks still point to the same files, so the updates take effect instantly. No re-deploy needed unless brand new files were added.

---

## Coming Soon (Designed, Not Yet Built)

- **PM Mode switching** — Each project will declare GSD or BMAD mode in its CLAUDE.md. Workflows will automatically use the right tools and PRD template for that mode.
- **Phase auto-advancement** — Mechanical phases (create repo, generate PRD) will run without asking "ready for next phase?" Only judgment phases (approve PRD, confirm direction) will pause for your input.
