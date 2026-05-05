# Project Catalog

## Metadata
- Last updated: 2026-05-02
- Version: 5.0
- Note: Restructured 2026-05-02. ~/Sites demolished, replaced with ~/Scott/{claude-os, claude-projects, growth-os}.

## Folder Structure

```
~/Scott/
  claude-os/         # Claude Code config (hooks, skills, rules)
  claude-projects/   # All coded apps (flat, org metadata in this catalog)
  growth-os/         # Knowledge wiki (six domains + system + raw sources)
```

Knowledge lives in `~/Scott/growth-os/` (`wiki/` for compiled, `raw/` for sources).
Each project has its own CLAUDE.md inside the project folder.

## Active Code Projects

| Keywords | Project | Org | Path | Status |
|----------|---------|-----|------|--------|
| advosy sales, sales hub, kpi | Advosy Sales | Advosy | ~/Scott/claude-projects/advosy-sales/ | Active build, consolidation target |
| advosy crm, crm reference, mockups | Advosy CRM Reference | Advosy | ~/Scott/claude-projects/advosy-crm/ | Reference bench (CRM design specs, mockups, screenshots) |
| payroll, pay, d2d pay | D2D Payroll | Advosy | ~/Scott/claude-projects/d2d-payroll/ | Being replaced by Advosy Sales |
| spotio, sf, webhook sync | Spotio-CF | Advosy | ~/Scott/claude-projects/spotio-cf/ | Code complete |
| d2d apps, d2d tools, sales tools | D2D Apps | Advosy | ~/Scott/claude-projects/d2d-apps/ | Prototype, winding down |
| automations, n8n workflows | Automations | Advosy | ~/Scott/claude-projects/automations/ | n8n workflow docs |
| savvynth, platform, saas | Savvynth Platform | Savvynth (was Bresco) | ~/Scott/claude-projects/savvynth-platform/ | Turbo monorepo (apps/web, apps/api, packages/) |
| automation business | Automation Business | Savvynth | ~/Scott/claude-projects/automation-business/ | Standalone Nuxt app |
| eleanor, ellie, assistant, chief of staff | Eleanor | Personal | ~/Scott/claude-projects/eleanor/ | Active build (Tauri desktop) |
| life os, life, habits, reviews, bops | Life OS | Personal | ~/Scott/claude-projects/life-os/ | Bug fixes only (Eleanor replacing) |
| supplementiq | SupplementIQ | Personal | ~/Scott/claude-projects/supplementiq/ | Active |
| surrealdb, local db, dev db | SurrealDB Local | Infra | ~/Scott/claude-projects/surrealdb-local/ | Local dev SurrealDB instance (start.sh, data/, README) |

## Knowledge (six domains in growth-os/wiki/)

| Domain | Path | Contents |
|--------|------|----------|
| Church | ~/Scott/growth-os/wiki/Church/ | Faith, scripture, principles |
| Health | ~/Scott/growth-os/wiki/Health/ | Recomp plan, food, supplements, training, weekly summary |
| People | ~/Scott/growth-os/wiki/People/ | One file per person (role, context, notes) |
| Knowledge | ~/Scott/growth-os/wiki/Knowledge/ | Frameworks (`frameworks/`), study aids (`study-aids/`), context engineering, sales methodology, technical refs |
| Work | ~/Scott/growth-os/wiki/Work/ | `Work/Advosy/` (Advosy company docs, EOS, CRM context); `Work/Savvynth/` (Savvynth platform docs, brand) |
| Finances | ~/Scott/growth-os/wiki/Finances/ | (placeholder) |
| system | ~/Scott/growth-os/wiki/system/ | Capture pipeline, knowledge engine, ADRs, project specs (`system/projects/`) |

Plus root: `Home.md` (index), `identity.md` (LLM identity layer).

Raw sources: ~/Scott/growth-os/raw/ (research, sources, synthesis, inbox, staging — immutable).

## People Directory

All people files: ~/Scott/growth-os/wiki/People/ (Title Case `.md` files, flat)
- Brett Arrington, Brett Ray, Gary Fenn, Brandon Cruz, Chandler Ricks, Josh Williamson, Kris Davis, Melissa Lunt, Wesley Hathcock, Jeramy Hubbard, Scott O'Dell

## Research & Decisions

| Type | Path |
|------|------|
| ADR decisions | ~/Scott/growth-os/wiki/system/ (ADR-001-*.md, ADR-002-*.md, ADR-003-*.md) |
| Toolkit decisions (post-restructure) | ~/Scott/claude-os/decisions/ |
| Context-engineering sources | ~/Scott/growth-os/raw/sources/context-engineering/ |
| Context-engineering synthesis | ~/Scott/growth-os/raw/synthesis/context-engineering-2026-03/ |

## Learning Materials

~/Scott/growth-os/wiki/Knowledge/ (Title Case `.md` files)

- Frameworks (`Knowledge/Frameworks/`): Atomic Habits, Background Ops, Greene Mastery, Greene 33 Strategies of War, Greene 48 Laws of Power, Greene Laws of Human Nature, Master Storytelling, Eleanor Eternal Wisdom, Eleanor Temporal Wisdom
- Study aids (`Knowledge/Study Aids/`): Study Flashcards, Study Quizzes, Study Audio Prompts, Study Content Creation Prompts, Study Reference Tables
- Knowledge root (flat): Claude API and Tool Use, MCP Server Development, Knowledge Engineering, Agentic Workflow Patterns, Structured Prompt Engineering, UIUX, PKM Architecture, Era of Personal Knowledge Assistants, 100M Leads Offers Models
- Sales methodology: `Knowledge/Sales Methodology/` (multi-folder repo, content reshape pending)
- Context engineering: `Knowledge/Context Engineering/` (index.md + synthesis.md + principles.md)

## GitHub Repos

Note: GitHub repo names not yet renamed post-restructure. Local dirs are the new names; GitHub remotes still use old names. Plan to rename at Phase 11 follow-up.

| Repo | Project | Local path |
|------|---------|------------|
| cscottodell-code/life-os | Life OS | ~/Scott/claude-projects/life-os/ |
| cscottodell-code/automation-business | Automation Business | ~/Scott/claude-projects/automation-business/ |
| cscottodell-code/d2d-payroll | D2D Payroll | ~/Scott/claude-projects/d2d-payroll/ |
| cscottodell-code/advosy-context | Advosy CRM Reference (rename pending) | ~/Scott/claude-projects/advosy-crm/ |
| cscottodell-code/advosy-knowledge | (orphaned, to be archived) | (content merged into wiki) |
| cscottodell-code/scott-toolkit | Claude OS (rename pending) | ~/Scott/claude-os/ |
| cscottodell-code/scott-context | Growth OS (rename pending) | ~/Scott/growth-os/ |
| cscottodell-code/bresco-platform | Savvynth Platform (rename pending) | ~/Scott/claude-projects/savvynth-platform/ |
| advosy-hq/advosy-sales | Advosy Sales (company remote) | ~/Scott/claude-projects/advosy-sales/ |
| cscottodell-code/advosy-sales | Advosy Sales (personal remote) | ~/Scott/claude-projects/advosy-sales/ |
