# Project Catalog

## Metadata
- Last updated: 2026-04-14
- Version: 4.0
- Note: Paths updated after machine cleanup (Phases 1-4). Knowledge centralized in scott-context.

## Folder Structure
```
Sites/
  Advosy/          # Work projects (repos flat at root)
  Bresco/          # SaaS business (repos flat at root)
  Personal/        # Personal projects (repos flat at root)
  Global/          # Cross-org tools and knowledge
    scott-context/ # Centralized knowledge (Karpathy LLM Wiki)
    scott-toolkit/ # Claude Code config (skills, hooks, rules)
```

Knowledge is centralized in `~/Sites/Global/scott-context/` (wiki/ for compiled, raw/ for sources).

## Active Code Projects

| Keywords | Project | Org | Path | Status |
|----------|---------|-----|------|--------|
| advosy sales, sales hub, kpi | Advosy Sales | Advosy | ~/Sites/Advosy/advosy-sales/ | Active build, consolidation target |
| payroll, pay, d2d pay | D2D Payroll | Advosy | ~/Sites/Advosy/d2d-payroll/ | Being replaced by Advosy Sales |
| spotio, sf, webhook sync | Spotio-CF | Advosy | ~/Sites/Advosy/spotio-cf/ | Code complete |
| d2d apps, d2d tools, sales tools | D2D Apps | Advosy | ~/Sites/Advosy/d2d-apps/ | Prototype, winding down |
| bresco, platform, saas | Bresco Platform | Bresco | ~/Sites/Bresco/platform/ | Turbo monorepo (apps/web, apps/api, packages/) |
| bresco automation, automation business | Bresco Automation | Bresco | ~/Sites/Bresco/automation-business/ | Standalone Nuxt app |
| eleanor, ellie, assistant, chief of staff | Eleanor | Personal | ~/Sites/Personal/eleanor/ | Active build (Tauri desktop) |
| life os, life, habits, reviews, bops | Life OS | Personal | ~/Sites/Personal/life-os/ | Bug fixes only (Eleanor replacing) |
| sales methodology, sales training | Sales Methodology | Personal | ~/Sites/Personal/sales-methodology/ | Active |
| supplementiq | SupplementIQ | Personal | ~/Sites/Personal/supplementiq/ | Active |
| toolkit, skills, hooks, rules | Scott Toolkit | Global | ~/Sites/Global/scott-toolkit/ | Active |
| context engineering, ce, synthesis | Context Engineering | Global | ~/Sites/Global/context-engineering/ | Complete (reference) |
| knowledge skills, books, research, council | Scott Knowledge | Personal | ~/Sites/Personal/scott-knowledge/ | Active (bridge to Eleanor M3) |
| wiki, knowledge base, scott-context | Scott Context (Wiki) | Global | ~/Sites/Global/scott-context/ | Active (Karpathy LLM Wiki) |

## Knowledge (centralized in scott-context)

| Section | Path | Contents |
|---------|------|----------|
| Advosy | ~/Sites/Global/scott-context/wiki/advosy/ | Corporate structure, leadership, CRM specs, CF docs, EOS, systems |
| Bresco | ~/Sites/Global/scott-context/wiki/bresco/ | Platform overview, financial model, competitive landscape, decisions |
| Personal | ~/Sites/Global/scott-context/wiki/personal/ | Eleanor notes, Life OS, BOPs, learning guides, study materials |
| Global | ~/Sites/Global/scott-context/wiki/global/ | People, ADR decisions, infrastructure, toolkit, context engineering |
| Raw sources | ~/Sites/Global/scott-context/raw/ | Research, transcripts, artifacts (immutable, never edit) |

## People Directory
All people notes: ~/Sites/Global/scott-context/wiki/global/people/
(Brett Arrington, Brett Ray, Gary Fenn, Brandon Cruz, Chandler Ricks, Josh Williamson, Kris Davis, Melissa Lunt, Wesley Hathcock, Jeramy Hubbard, Scott O'Dell)

## Research & Decisions

| Type | Path |
|------|------|
| Global research | ~/Sites/Global/scott-context/raw/research/global/ |
| ADR decisions | ~/Sites/Global/scott-context/wiki/global/decisions/ |
| Bresco research | ~/Sites/Global/scott-context/raw/research/bresco-research/ |
| Bresco v1 planning | ~/Sites/Global/scott-context/raw/research/bresco-v1-planning/ |
| Deep research | ~/Sites/Global/scott-context/raw/research/deep-research/ |

## Learning Materials
~/Sites/Global/scott-context/wiki/personal/learning/
- 01-claude-api-and-tool-use.md
- 02-mcp-server-development.md
- 03-knowledge-engineering.md
- 04-agentic-workflow-patterns.md
- 05-structured-prompt-engineering.md
- study/ (flashcards, quizzes, audio notes)

## GitHub Repos

| Repo | Project |
|------|---------|
| cscottodell-code/life-os | Life OS |
| cscottodell-code/automation-business | Bresco Automation |
| cscottodell-code/d2d-payroll | D2D Payroll |
| cscottodell-code/advosy-context | Advosy Context (knowledge git repo) |
| cscottodell-code/scott-toolkit | Scott Toolkit |
| cscottodell-code/scott-context | Scott Context (LLM Wiki) |
| advosy-hq/advosy-sales | Advosy Sales (company remote) |
| cscottodell-code/advosy-sales | Advosy Sales (personal remote) |
