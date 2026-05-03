# Scott's Knowledge Skills

Personal knowledge and productivity skills for Claude Code. Extracted from scott-toolkit (v6.1) to keep the toolkit focused on context engineering.

**These are Claude Code skills, not a library or framework.** They provide domain knowledge, decision frameworks, and productivity workflows that Claude can invoke on demand.

## Skills

| Skill | What it does |
|-------|-------------|
| `/scott:bops` | Background Operations methodology for reducing cognitive load |
| `/scott:council` | Multi-perspective decision deliberation (3-11 historical thinkers) |
| `/scott:eos` | EOS (Entrepreneurial Operating System) advisor and facilitator |
| `/scott:human-nature` | Human behavior and emotional intelligence (Laws of Human Nature) |
| `/scott:mastery` | Personal and professional development (Mastery by Robert Greene) |
| `/scott:notebooklm` | Create NotebookLM audio deep dives on any topic |
| `/scott:power-laws` | Strategic awareness and power dynamics (48 Laws of Power) |
| `/scott:presentation` | Analyze and improve presentations, stories, and pitches |
| `/scott:research` | Multi-lens research dispatching 10 parallel subagents |
| `/scott:save-tweet` | Extract tweet/thread content into structured markdown |
| `/scott:war-strategies` | Strategic warfare and competitive tactics (33 Strategies of War) |

## Setup

```bash
cd ~/Scott/claude-os/skills-knowledge
./setup.sh
```

The setup script symlinks skills to `~/.claude/skills/` so Claude Code can find them.

## Future

These skills are candidates for migration into Eleanor's knowledge module (M3). The `category: knowledge` frontmatter tag marks them for future extraction.
