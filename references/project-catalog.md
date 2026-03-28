# Project Catalog

## Metadata
- Last updated: 2026-03-26
- Version: 3.0
- Note: Paths updated after Sites folder reorganization (Option B: Org-First Hybrid)

## Folder Structure Convention
Every org follows the same pattern:
```
[Org]/
  code/        # Git repos, Nuxt apps, code projects
  knowledge/   # Business context, notes, reference docs
  planning/    # Roadmaps, specs, phase docs
  research/    # Deep dives, analysis, competitive intel
  tasks/       # Todos, action items
```

## Active Code Projects

| Keywords | Project | Org | Path | Status |
|----------|---------|-----|------|--------|
| advosy sales, sales hub, kpi | Advosy Sales | Advosy | ~/Sites/Advosy/code/advosy-sales/ | Active build, consolidation target |
| advosy sales ui, overhaul | Advosy Sales UI Overhaul | Advosy | ~/Sites/Advosy/code/advosy-sales-ui-overhaul/ | UI overhaul branch |
| b2b, affiliate, ghl | B2B Sales Pipeline | Advosy | ~/Sites/Advosy/code/b2b/ | Active |
| payroll, pay, d2d pay | D2D Payroll | Advosy | ~/Sites/Advosy/code/d2d-payroll/ | Being replaced by Advosy Sales |
| spotio, sf, webhook sync | Spotio-CF | Advosy | ~/Sites/Advosy/code/spotio-cf/ | Code complete |
| d2d apps, d2d tools, sales tools | D2D Apps | Advosy | ~/Sites/Advosy/code/d2d-apps/ | Prototype, winding down |
| claimsforce, cf dashboard | Claimsforce Tools | Advosy | ~/Sites/Advosy/code/claimsforce/ | Dashboards + API scripts |
| bresco, platform, saas | Bresco Platform | Bresco | ~/Sites/Bresco/code/platform/ | Turbo monorepo (apps/web, apps/api, packages/) |
| bresco automation, automation business | Bresco Automation | Bresco | ~/Sites/Bresco/code/automation-business/ | Standalone Nuxt app |
| eleanor, ellie, assistant, chief of staff | Eleanor | Personal | ~/Sites/Personal/code/eleanor/ | Active build (Tauri desktop) |
| life os, life, habits, reviews, bops | Life OS | Personal | ~/Sites/Personal/code/life-os/ | Bug fixes only (Eleanor replacing) |
| toolkit, skills, hooks, rules | Scott Toolkit | Global | ~/Sites/Global/scott-toolkit/ | Active |
| context engineering, ce, synthesis | Context Engineering | Global | ~/Sites/Global/context-engineering/ | Complete (reference) |

## Knowledge Folders (non-code context per org)

| Org | Path | Contents |
|-----|------|----------|
| Advosy | ~/Sites/Advosy/knowledge/ | Corporate structure, leadership, CRM specs, CF docs, subsidiaries, systems landscape |
| Bresco | ~/Sites/Bresco/knowledge/ | Platform overview, financial model, competitive landscape, decisions, product content |
| Personal | ~/Sites/Personal/knowledge/ | Eleanor notes, Life OS notes, Background Ops philosophy, church, vision framework |
| Global | ~/Sites/Global/knowledge/ | Infrastructure notes, context engineering notes, toolkit notes, Home.md (vault index) |

## People Directory
All people notes: ~/Sites/Global/people/
(Brett Arrington, Brett Ray, Gary Fenn, Brandon Cruz, Chandler Ricks, Josh Williamson, Kris Davis, Melissa Lunt, Wesley Hathcock, Jeramy Hubbard, Scott O'Dell)

## Research & Decisions

| Type | Path | Contents |
|------|------|----------|
| Global research | ~/Sites/Global/research/ | Sales psychology, tech stack analysis |
| Global decisions | ~/Sites/Global/decisions/ | ADR-001 (schema bridge), ADR-002 (migrations), ADR-003 (infrastructure) |
| Bresco research | ~/Sites/Bresco/research/ | PRD, NotebookLM analysis, competitive research |
| Bresco planning | ~/Sites/Bresco/planning/ | PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, phases/ |

## Learning Materials
~/Sites/Personal/learning/
- 01-claude-api-and-tool-use.md
- 02-mcp-server-development.md
- 03-knowledge-engineering.md
- 04-agentic-workflow-patterns.md
- 05-structured-prompt-engineering.md
- study/ (flashcards, quizzes, audio notes)
- notebooklm-toolkit-deep-dive/ (toolkit analysis)

## Archived (~/Sites/Archive/)

| Item | What It Was |
|------|-------------|
| BMAD-METHOD/ | Open-source AI agile framework (no longer used) |
| BOPs/ | Background ops metrics HTML/PDF |
| cowork-setup/ | Outdated Cowork context files |
| global-inactive/ | d2d-income-tool, bops-guides, membership-docs, notebooklm-context |
| surreal-data-v1/ | SurrealDB v1 data backup |
| surreal-data-v2-backup/ | SurrealDB v2 data backup |
| CLAUDE-CODE-PROMPT.md | Old prompt doc (superseded by CLAUDE.md) |

## GitHub Repos

| Repo | Project |
|------|---------|
| cscottodell-code/life-os | Life OS |
| cscottodell-code/automation-business | Bresco Platform |
| cscottodell-code/d2d-payroll | D2D Payroll |
| cscottodell-code/advosy-context | Advosy Context |
| cscottodell-code/scott-toolkit | Scott Toolkit |
