# Scott's Toolkit v5

A context engineering toolkit for building apps with Claude Code. Owns session management, templates, domain knowledge, stack enforcement, and learning capture. Delegates project management to GSD and development methodology to Superpowers.

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
| `/scott:stack-review` | Stack health dashboard (learning loop) |
| `/scott:stack-baseline` | First-run audit for existing projects |

## Four-System Architecture

| System | Owns | Use for |
|--------|------|---------|
| **Scott-toolkit** | Context engineering | Session management, templates, domain knowledge, stack enforcement, learning capture |
| **GSD** | Project management | Phases, milestones, execution, task tracking, verification |
| **Superpowers** | Development methodology | TDD, git worktrees, code review, plan writing, debugging |
| **Impeccable** | UI/UX quality | Design critique, polish, accessibility audits |

Toolkit workflows are **orchestrators** -- they call GSD and Superpowers at the right moments. Command names are decoupled via `config/interfaces.json` so renaming a GSD command requires updating one line, not ten files.

## What v5 Adds

Three new systems built on top of the existing toolkit:

### Stack Enforcement
Technology-specific checks that catch version gotchas at build time. Check files per technology (`checks/*.json`), CLI tools (`tools/stack-detect.sh`, `tools/stack-check.sh`, `tools/stack-preflight.sh`), and integration into phase closeout as a stack audit step.

### Learning Loop
Lessons from each project feed back into the toolkit. `[stack]`-tagged lessons become check candidates. `tools/stack-metrics.sh` aggregates audit data across all projects. `/scott:stack-review` presents a dashboard for human-approved promotion of lessons to checks.

### Decoupling
Abstract operation names (`plan_phase`, `tdd`, `code_review`) mapped to concrete commands via `config/interfaces.json`. Toolkit files reference operations, not tool-specific commands. `tools/toolkit-resolve` resolves them at runtime.

## Repo Structure

```
scott-toolkit/
├── README.md
├── CHANGELOG.md
├── setup.sh                          # One-command deploy to ~/.claude/
├── .gitignore                        # Excludes checks/metrics.json (computed cache)
│
├── checks/                           # Stack enforcement check files
│   ├── surrealdb.json
│   ├── nuxt.json
│   ├── tailwind.json
│   ├── bun.json
│   ├── hono.json
│   ├── stack-lock.schema.json        # JSON Schema for stack-lock.json
│   └── test-fixtures/                # Good/bad samples for check validation
│
├── config/                           # Toolkit configuration
│   └── interfaces.json               # Abstract operations -> concrete commands
│
├── tools/                            # CLI tools (zero-token, shell-based)
│   ├── stack-detect.sh               # Auto-detect project technologies
│   ├── stack-check.sh                # Run static checks from check files
│   ├── stack-preflight.sh            # System readiness + provider health
│   ├── stack-metrics.sh              # Aggregate audit data for learning loop
│   └── toolkit-resolve               # Resolve abstract operation names
│
├── context/                          # Templates for new projects
│   ├── CLAUDE-MD-TEMPLATE.md
│   ├── PRD-TEMPLATE.md
│   └── DESIGN-INTENT-TEMPLATE.md
│
├── workflows/                        # Interactive step-by-step processes
│   ├── new-project.md               # 8-phase orchestrator
│   ├── resume-project.md            # Session start (delegates to GSD)
│   ├── new-feature.md               # Feature workflow (delegates build to GSD)
│   ├── phase-closeout.md            # Verify + stack audit + review + reflect
│   ├── retro.md
│   ├── handoff-to-gary.md
│   ├── toolkit-update.md
│   ├── toolkit-spa-day.md
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
│   ├── check-file-test-trigger.sh   # Auto-test on check file edits
│   ├── uiux-reminder.sh             # UI/UX quality nudge for .vue files
│   ├── guard-git-push.sh
│   ├── guard-destructive.sh
│   ├── guard-claude-md.sh
│   ├── guard-npm-install.sh
│   └── guard-phase-completion.sh    # Blocks phase complete without closeout
│
├── rules/                            # Behavior rules (-> ~/.claude/rules/)
│   ├── claude-behavior.md           # 3-system delegation + operation resolution
│   └── code-style.md               # TypeScript/Vue/Tailwind standards
│
├── skills/                           # Skill files (-> ~/.claude/skills/)
│   ├── scott-stack-review/          # Stack health dashboard
│   ├── scott-stack-baseline/        # First-run project audit
│   ├── scott-rebuild-metrics/       # Metrics cache recovery
│   └── [30+ other skills]
│
├── references/                       # Business context (loaded on demand)
│   ├── project-catalog.md
│   ├── bresco-context.md
│   └── hetzner-surrealdb-setup.md
│
├── docs/                             # Design documents and guides
│   ├── user-guide.md
│   └── v5-unified-design.md         # THE v5 design document
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

## Contributing Rules

- Always update CHANGELOG.md when modifying hooks or skills
- Do not modify settings.json directly (use the `update-config` skill)
- Each skill lives in its own subfolder: `skills/<name>/SKILL.md`
- Hook scripts must be executable (`chmod +x`)
- Test changes by verifying the hook/skill loads correctly in a new session
- Check files go in `checks/<technology>.json` following the schema in `checks/stack-lock.schema.json`
- Abstract operation names go in `config/interfaces.json`, not hardcoded in workflows

## How It Improves Over Time

```
Start project (use toolkit)
  -> Build with Claude Code + GSD + Superpowers
  -> Phase completes
  -> Run /scott:phase-closeout (verify, stack audit, review, reflect)
  -> Error logs + success logs + RETRO.md + lessons.md (tagged)
  -> [stack]-tagged lessons become check candidates
  -> /scott:stack-review to review and promote
  -> Checks apply to ALL future projects
  -> /scott:toolkit-update to apply other improvements
  -> Push to GitHub
  -> Next project starts smarter
```
