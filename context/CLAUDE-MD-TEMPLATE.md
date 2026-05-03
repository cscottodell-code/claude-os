# [Project Name]

<!--
WHAT THIS IS: This is Claude Code's instruction manual for this project. Claude Code
reads this file before doing any work. Think of it like onboarding notes for a new
team member: it tells them everything they need to know about the project.

HOW TO USE: Copy this template into your project repo as CLAUDE.md. Fill in the
project-specific sections. Leave the pre-filled sections (like Claude Code Behavior
Rules) as-is unless you have a specific reason to change them.

CUSTOMIZE: Sections marked [CUSTOMIZE] need your input. Sections marked [PRE-FILLED]
are the same for every project.
-->

## Project Context
<!-- [CUSTOMIZE] Basic project info. Copy from your PRD. -->

- **Project:** [name] - [one-line description]
- **PRD:** See PRD.md in this repo
- **Type:** Global / Personal / Advosy / Bresco
- **Target:** Desktop (Tauri) / Web / Both
- **PM Mode:** GSD + Superpowers
  - **GSD** = orchestration engine: **plan_phase** (planning), **execute_phase** (execution), **verify_work** (UAT), **add_tests** (coverage). State tracked in `.planning/`.
  - **Superpowers** = discipline layer: **git_worktree** (isolation), **tdd** (TDD during execution), **code_review** (after execution), **finish_branch** (merge/PR).
  - **Build loop:** Worktree -> Plan -> Execute with TDD -> Review -> Verify -> Finish branch
  - **Resolution:** Abstract operation names resolve via `~/Scott/claude-os/config/interfaces.json`

## Tech Stack
<!-- [PRE-FILLED] Scott's standard stack. Add project-specific items below. -->

| Technology | Version | Role |
|-----------|---------|------|
| Nuxt | 4 | Frontend framework |
| Nuxt UI | v4.3 | UI components (125+ components) |
| Tailwind CSS | v4 | Styling (CSS-first config) |
| TypeScript | latest | Type safety |
| Pinia | latest | State management |
| SurrealDB | v3 | Database |
| SurrealQL | - | Query language |

<!-- [CUSTOMIZE] Add any project-specific additions: -->
**Project-specific:**
- [additional libraries, tools, APIs]

## External References (Toolkit)
<!-- [CUSTOMIZE] List which skill files are relevant to THIS project. -->

Skills are discovered via the skill system (type `/scott:` to see available skills).
Skills live in `~/.claude/skills/` (symlinked from the toolkit's `skills/` directory).
<!-- [CUSTOMIZE] List which skills are relevant to THIS project: -->
<!-- - scott-surrealdb (for SurrealDB/SurrealQL projects) -->
<!-- - scott-n8n-reference (if using n8n) -->
<!-- - scott-uiux (for UI-heavy projects) -->
<!-- - advosy-crm (for Advosy CRM work) -->
<!-- - advosy-claimsforce (for Claimsforce/EspoCRM work) -->

## Project Architecture
<!-- [CUSTOMIZE] How this specific project is structured. -->

**High-level:**
[Describe how the app is structured. What talks to what.]

**Key directories:**
```
[project]/
├── app/
│   ├── pages/          # [what pages exist]
│   ├── components/     # [component organization]
│   ├── composables/    # [key composables]
│   └── layouts/        # [layouts used]
├── database/
│   ├── schema.surql    # [table overview]
│   └── seed.surql      # [dev data]
└── tasks/
    ├── todo.md         # Current milestone tasks
    └── lessons.md      # Mistakes log
```

**Data flow:**
[How does data get from the UI to the database and back? E.g., "Component calls
useDatabase composable → composable calls Tauri command → Rust handler queries
embedded SurrealDB → response flows back through the same chain"]

## Coding Conventions
<!-- [PRE-FILLED] Standard conventions. Customize only if needed. -->

- **Components:** `<script setup lang="ts">` with Composition API
- **File naming:** kebab-case for files, PascalCase for components
- **Component structure:** template → script → style (if any)
- **TypeScript:** Strict mode. Define interfaces for all data shapes.
- **SurrealQL:** Lowercase table names, snake_case field names
- **Error handling:** try/catch with toast.add() for user-facing errors
- **Comments:** Only for complex logic. Code should be self-explanatory.

## SurrealDB Schema
<!-- [CUSTOMIZE] Updated as the schema evolves during development. -->

```surql
-- Paste current schema here as it evolves
-- This helps Claude Code understand the data model without reading schema.surql every time
```

## Key Decisions Log
<!-- [CUSTOMIZE] Track architectural decisions so Claude Code doesn't undo them. -->

| Decision | Reason | Date |
|----------|--------|------|
| [what was decided] | [why] | [when] |

## Current Status
<!-- [CUSTOMIZE] Updated after each work session. -->

- **Current milestone:** [which one]
- **Last completed:** [what was just finished]
- **Next up:** [what's next]
- **Known issues:** [any bugs or problems]

## Boundaries
<!-- [CUSTOMIZE] Three-tier boundary system. Hooks enforce the hard limits,
     but this section gives Claude a quick mental model per project. -->

**Always:**
- [e.g., "Always use Nuxt UI components before custom HTML"]
- [e.g., "Always add loading states to async operations"]

**Ask first:**
- [e.g., "Ask before adding new dependencies"]
- [e.g., "Ask before changing the database schema"]

**Never:**
- [e.g., "Never use SSR in this Tauri project"]
- [e.g., "Never call SurrealDB directly from components - always go through useDatabase"]

<!-- Behavior rules loaded automatically from ~/.claude/rules/claude-behavior.md -->
