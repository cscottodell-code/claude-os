# New Feature

## Metadata
- Last updated: 2026-03-14
- Version: 2.2
- Changelog:
  - v2.2: Add clarifying questions step to Phase 1 (from 2026-03-14 source review)
  - v2.1: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE]) and PM mode conditional (GSD/BMAD) in Phase 4
  - v2.0: Slim to orchestrator — delegate build to GSD + Superpowers, keep discovery phases
  - v1.3: Add post-build test coverage review with /gsd:add-tests (Phase 4)
  - v1.2: Integrate Superpowers plugin — git worktrees, TDD, subagent-driven development, two-stage code review, and branch merging into Build phase (Phase 4)
  - v1.1: Add optional Impeccable design review step (critique + polish) to Build phase for UI-heavy features
  - v1.0: Initial workflow

## Purpose
Add a new feature to an existing project. This is a lighter version of the new-project
workflow — instead of building a full PRD, you create a mini-PRD for just the new feature.

Use this when Scott says "I want to add [X] to [project]" or "let's build a new feature."

## Prerequisites
- The project already exists with a CLAUDE.md and PRD.md
- The project is in a working state (not mid-milestone)

## Instructions for Claude Code
Read the project's CLAUDE.md and PRD.md first to understand the current state.
Then walk Scott through each phase. Keep it lightweight — this shouldn't feel
as heavy as starting a new project.

## Phase 1: Feature Description [STOP]

### What this phase does
Understand what the new feature is and why it's needed.

### Questions to ask Scott
1. What's the feature? Describe it in one or two sentences.
2. Who needs this? (Same users as the main app, or different?)
3. Why is this needed now? What triggered this request?
4. How urgent is it? (Blocking other work, or a nice enhancement?)

### Follow-up
After Scott answers the initial questions, ask 3-5 clarifying questions about:
- Scope boundaries (what's explicitly NOT included?)
- Edge cases (what happens when data is missing, invalid, or unexpected?)
- Constraints (performance requirements, accessibility needs, mobile support?)
- Integration points (how does this connect to existing features?)

### Output
A clear, one-paragraph feature description with scope and edge cases identified.

### Done when
Scott has clearly described what the feature is, why it matters, and clarifying questions are answered.

## Phase 2: Impact Assessment [STOP]

### What this phase does
Figure out what existing parts of the app this feature touches. New features
rarely exist in isolation — they usually affect data models, existing pages,
navigation, etc.

### Questions to ask Scott
1. Does this feature need new data (new tables or fields in SurrealDB)?
2. Does it change any existing data structures?
3. Which existing pages will be affected?
4. Does it need a new page or just additions to existing ones?
5. Any new dependencies or external services needed?
6. Could this break anything that currently works?

### Checks to perform
- Review the SurrealDB schema section of CLAUDE.md
- Review the current file structure
- Check for components that might need modification

### Output
A list of files and systems that will be affected, with the nature of each change.

### Done when
The full scope of impact is understood.

## Phase 3: Mini-PRD [STOP]

### What this phase does
Create a lightweight PRD for just this feature. Not the full 11-section template —
just the essentials.

### Sections to include
1. **Feature name and description** (from Phase 1)
2. **User flow** — step-by-step walkthrough of how the user interacts with this feature
3. **Data changes** — new tables, new fields, modified relationships
4. **Acceptance criteria** — how do you know this feature is "done"?
5. **Edge cases** — what happens when things go wrong or data is missing?

### Output
A mini-PRD document (can be added to the project's PRD.md as an appendix or kept separate).

### Done when
Scott approves the mini-PRD.

## Phase 4: Build (Delegated) [DELEGATE]

### What this phase does
Implement the feature using GSD for execution and Superpowers for methodology.

### Steps

**Both modes:**
1. Create a git worktree for this feature using `superpowers:using-git-worktrees`

**If PM Mode is GSD:**
2. Plan the build using `/gsd:plan-phase` — feed it the mini-PRD from Phase 3
3. Execute the plan using `/gsd:execute-phase` — this handles:
   - Task breakdown and dependency tracking
   - TDD is enforced via `superpowers:test-driven-development`
   - Each task gets atomic commits
4. After execution, verify with `/gsd:verify-work`
5. If test coverage is thin, use `/gsd:add-tests` for critical logic

**If PM Mode is BMAD:**
2. Create epics and stories using `/bmad-bmm-create-epics-and-stories`
3. Implement each story using `/bmad-bmm-dev-story`
4. Code review each story using `/bmad-bmm-code-review`

**Both modes:**
6. Design review (if significant UI changes):
   - Run `/impeccable:critique` for visual quality feedback
   - Run `/impeccable:polish` as a final detail pass
7. Code review using `superpowers:requesting-code-review`
   — fix Critical issues immediately, Important issues before proceeding
8. Merge using `superpowers:finishing-a-development-branch`

### Output
Working feature, verified, tested, and code-reviewed.

### Done when
All acceptance criteria from the mini-PRD are met.

## Phase 5: Update CLAUDE.md [AUTO]

### What this phase does
Keep the project's living documentation current.

### Updates to make
1. **SurrealDB Schema** section: Add any new tables or field changes
2. **Key Decisions Log**: Record any architectural decisions made
3. **Current Status**: Update what was last completed and what's next
4. **Constraints & Rules**: Add any new rules that emerged from this feature

### Output
Updated CLAUDE.md reflecting the new feature.

### Done when
CLAUDE.md accurately reflects the current state of the project.

## Completion Checklist
- [ ] Feature clearly described
- [ ] Impact on existing code assessed
- [ ] Mini-PRD written and approved
- [ ] Feature built and verified (via GSD + Superpowers)
- [ ] Design review completed (if UI-heavy feature)
- [ ] CLAUDE.md updated
- [ ] tasks/todo.md updated
- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
