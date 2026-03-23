# Scott's Toolkit v2

A context engineering toolkit for building apps with Claude Code. Owns session management, templates, domain knowledge, and learning capture. Delegates project management to GSD and development methodology to Superpowers.

Lives at `~/Sites/Global/scott-toolkit/` on all of Scott's machines. Deployed to `~/.claude/` via `setup.sh`.

## Who It's For

- **Scott O'Dell** - AI orchestrator building prototypes with Claude Code
- **Brett (Arrington)** - Partner on Bresco, vibe coder

## Quick Start

```bash
# Clone the repo
git clone git@github.com:cscottodell-code/scott-toolkit.git ~/Sites/Global/scott-toolkit

# Deploy to ~/.claude/
cd ~/Sites/Global/scott-toolkit && ./setup.sh

# On Brett's machine (different path):
./setup.sh --toolkit-path /path/to/scott-toolkit
```

That's it. The setup script creates symlinks from `~/.claude/` to the repo. Update the repo once, every machine benefits after `git pull`.

## How to Use It

All workflows are invoked via slash commands:

| Command | What it does |
|---------|-------------|
| `/scott:new-project` | Start a new project (8-phase guided workflow) |
| `/scott:new-feature` | Add a feature to an existing project |
| `/scott:resume` | Pick up where you left off on a project |
| `/scott:phase-closeout` | Mandatory post-execution: verify, review, reflect, gate (hook-enforced) |
| `/scott:handoff` | Prepare a project for Gary to productionize |
| `/scott:update-toolkit` | Update the toolkit itself |
| `/scott:compare-sources` | Compare context engineering sources against your toolkit |

## Three-System Architecture

| System | Owns | Use for |
|--------|------|---------|
| **Scott-toolkit** | Context engineering | Session management, templates, domain knowledge, learning capture |
| **GSD** | Project management | Phases, milestones, execution, task tracking, verification |
| **Superpowers** | Development methodology | TDD, git worktrees, code review, plan writing, debugging |

Toolkit workflows are **orchestrators** — they call GSD and Superpowers at the right moments.

## Repo Structure

```
scott-toolkit/
├── README.md
├── CHANGELOG.md
├── setup.sh                          # One-command deploy to ~/.claude/
│
├── context/                          # Templates for new projects
│   ├── CLAUDE-MD-TEMPLATE.md
│   ├── PRD-TEMPLATE.md
│   ├── DESIGN-INTENT-TEMPLATE.md
│   └── RETRO-TEMPLATE.md
│
├── knowledge/                        # Domain knowledge skills
│   ├── active/                       # Used regularly
│   │   ├── surrealdb.md             # SurrealDB + SurrealQL (consolidated)
│   │   ├── nuxt-ui-v4.md
│   │   └── n8n-integration.md
│   └── archive/                      # Available but not promoted
│       ├── tauri-nuxt.md
│       ├── rust-tauri-commands.md
│       ├── error-handling.md
│       └── frontend-design.md
│
├── workflows/                        # Interactive step-by-step processes
│   ├── new-project.md               # 8-phase orchestrator
│   ├── resume-project.md            # Session start (delegates to GSD)
│   ├── new-feature.md               # Feature workflow (delegates build to GSD)
│   ├── retro.md
│   ├── handoff-to-gary.md
│   ├── toolkit-update.md
│   ├── log-success.md
│   ├── log-error.md
│   └── compare-sources.md
│
├── hooks/                            # Automated session management
│   ├── session-start.sh             # Context file discovery + AUTO-RESUME
│   ├── session-end.sh               # Close reminder
│   ├── pre-compact.sh               # State snapshot before compaction
│   ├── pre-completion-checklist.sh  # Verification checklist at session end
│   ├── post-commit-skill-triggers.sh # Skill nudges after git commits
│   ├── context-reminders.sh         # Session health (duration/tool count)
│   ├── auto-format.sh               # Prettier on Write/Edit
│   ├── offload-large-output.sh      # Large output management
│   ├── extract-instincts.sh         # Pattern capture before compaction
│   ├── guard-git-push.sh
│   ├── guard-destructive.sh
│   ├── guard-claude-md.sh
│   └── guard-npm-install.sh
│
├── rules/                            # Behavior rules (-> ~/.claude/rules/)
│   ├── claude-behavior.md           # 3-system delegation rules
│   └── code-style.md               # TypeScript/Vue/Tailwind standards
│
├── references/                       # Business context (loaded on demand)
│   ├── project-catalog.md
│   ├── advosy-context.md
│   ├── bresco-context.md
│   ├── hetzner-surrealdb-setup.md
│   └── surrealdb-v3-reference.md
│
├── retros/                           # Retrospective outputs
│   └── _retro-index.md
├── errors/                           # Error logs
│   └── _metadata.json
└── successes/                        # Success logs
    └── _metadata.json
```

## Multi-Machine Sync

```
git pull                              # Get latest from GitHub
./setup.sh                            # Re-deploy (symlinks update automatically)
```

## How It Improves Over Time

```
Start project (use toolkit)
  -> Build with Claude Code + GSD + Superpowers
  -> Phase completes
  -> Run /scott:phase-closeout (verify, review, reflect)
  -> Error logs + success logs + RETRO.md + lessons.md
  -> /scott:toolkit-update to apply improvements
  -> Push to GitHub
  -> Next project starts smarter
```
