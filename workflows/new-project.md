---
name: scott:new-project
description: >-
  Start a new project from scratch using the scott-toolkit workflow.
  Walks Scott through 8 phases: Brain Dump, Clarify, Draft PRD, Finalize PRD,
  Create Repo, Design Proof, Build Milestone 1, and Milestone Review.
user_invocable: true
invocation_hint: /scott:new-project - Start a new project with the guided 8-phase workflow
---

# New Project

## Metadata
- Last updated: 2026-04-05
- Version: 1.9
- Changelog:
  - v1.9: Split Phase 3 into 3a/3b/3c (draft, approve, resolve conflicts). Add clear entry/exit criteria per sub-phase.
  - v1.8: Align Phase 7 to GSD+Superpowers integration pattern (GSD orchestrates, Superpowers provides discipline)
  - v1.7: Add follow-up clarifying questions to Phase 1 (from 2026-03-14 source review)
  - v1.6: Add API key model access verification to Phase 1 (from Eleanor M1 retro)
  - v1.5: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE])
  - v1.4: Add Global as 4th work context for cross-cutting projects (toolkit, shared references)
  - v1.3: Add post-build test coverage review with /gsd:add-tests (Phase 7)
  - v1.2: Integrate Superpowers plugin — git worktrees, TDD, subagent-driven development, and two-stage code review into Build (Phase 7) and Milestone Review (Phase 8) phases
  - v1.1: Replace binary Gary question with 3 work contexts (Personal/Advosy/Bresco), integrate Impeccable plugin into Design Proof (Phase 6), Build (Phase 7), and Milestone Review (Phase 8) phases
  - v1.0: Initial workflow

## Purpose
Start a brand new project from scratch. This is the most important workflow in the toolkit.
It replaces ad-hoc project kickoffs with a structured, guided process that produces a
complete PRD, project repo, and design proof before any features are built.

Use this whenever Scott says something like "let's start a new project" or "I want to build..."

## Prerequisites
- The toolkit repo exists at ~/Sites/Global/scott-toolkit/
- Scott has a rough idea of what he wants to build (doesn't need to be detailed)

## Instructions for Claude Code
Walk Scott through each phase one at a time. Do NOT skip ahead. At each phase:
1. Explain what this phase is about and why it matters
2. Ask the questions listed
3. Draft the output based on Scott's answers
4. Show it to Scott for approval before moving to the next phase

Be conversational. If Scott's answers are vague, ask follow-up questions. If he's
unsure about something, help him think through it. The goal is to pull the project
out of his head and into a structured document.

Do NOT start writing code until Phase 5 (Create Repository).

## Phase 1: Brain Dump [STOP]

### What this phase does
Get everything out of Scott's head. Capture the raw idea without organizing it yet.
This is intentionally unstructured — the goal is quantity over quality.

### Questions to ask Scott
1. What do you want to build? Describe it like you're explaining it to a friend.
2. Who is this for? (You? A team at Advosy? Brett? Customers?)
3. What problem does it solve? What's frustrating about the current situation?
4. What's the most important thing it needs to do? (The one feature it can't ship without)
5. Do you have any visual inspiration? (Apps you like the look of, screenshots, Figma files?)
6. Desktop app, web app, or both?
7. Which work context is this for?
   - **Global** — Cross-cutting project used by all contexts (toolkit, shared references, infrastructure)
   - **Personal** — Solo project, you deploy and maintain it yourself
   - **Advosy** — Work project, may hand off to Gary for production
   - **Bresco** — Co-developing with Brett, shared ownership
8. Anything else bouncing around in your head about this?
9. **API key check:** If the project uses AI APIs (Anthropic, Google, OpenAI, etc.),
   verify that your API key has access to the specific models you plan to use.
   Test each model ID with a simple API call before committing to it in the architecture.

### Follow-up
After the brain dump, ask 3-5 follow-up questions to fill gaps:
- What's the simplest version of this that would still be useful?
- What would make you stop using this after a week?
- Are there any technical unknowns you're worried about?
- Who else will touch this code? (Just you, Brett, Gary, a team?)
- Is there anything similar you've tried before that didn't work?

### Output
A raw brain dump document — bullet points, notes, and answers. Not organized yet.

### Done when
Scott says "I think that's everything" or "that covers it," and follow-up questions are answered.

## Phase 2: Clarify & Challenge [STOP]

### What this phase does
Review the brain dump with a critical eye. Poke holes. Find gaps. Challenge assumptions.
This is where vague ideas get sharpened into clear requirements.

### Questions to ask Scott
Based on the brain dump, identify and ask about:
1. **Gaps:** "You mentioned [X] but didn't say how [Y] would work. How do you see that?"
2. **Assumptions:** "It sounds like you're assuming [X]. Is that right? What if [Y]?"
3. **Scope:** "You mentioned [X], [Y], and [Z]. For v1, which of these are must-haves vs nice-to-haves?"
4. **Users:** "You said this is for [X]. Walk me through their typical day — when would they use this?"
5. **Data:** "What are the main 'things' in this app? What information does each one have?"
6. **Conflicts:** "You said [X] earlier but also [Y] — those seem to conflict. Which takes priority?"

### Output
A cleaned-up version of the brain dump with gaps filled and contradictions resolved.

### Done when
Scott has answered all clarifying questions and no major gaps remain.

## Phase 3a: Draft PRD [AUTO]

### What this phase does
Load the PRD template and draft all sections using the brain dump answers.

### Steps

1. Read ~/Sites/Global/scott-toolkit/context/PRD-TEMPLATE.md
2. For each section (1-11):
   a. Draft the content using the brain dump and clarification answers
   b. Use the template's guidance comments to inform each section
3. Pay special attention to:
   - Section 3 (Features): Push Scott to prioritize ruthlessly
   - Section 4 (User Flows): Make these concrete and step-by-step
   - Section 5 (Data Model): Get the tables and relationships right
   - Section 8 (Milestones): Milestone 1 = data model + basic CRUD always

### Output
A complete PRD draft with all 11 sections filled in.

### Done when
All 11 sections have been drafted.

## Phase 3b: Approve PRD [STOP]

### What this phase does
Present the PRD draft to Scott for section-by-section review and approval.

### Steps

1. Present each section to Scott, one at a time
2. For each section:
   a. Explain what this section covers and why it matters
   b. Show the drafted content
   c. Get Scott's approval or make changes
   d. Move to the next section
3. If Scott wants changes, revise and re-present that section before moving on

### Output
A Scott-approved PRD with all 11 sections confirmed.

### Done when
Scott has approved every section of the PRD.

## Phase 3c: Resolve Conflicts [AUTO]

### What this phase does
If an existing PRD.md exists in the project directory (e.g., from a prior attempt or
a different branch), reconcile it with the newly approved PRD.

### Steps

1. Check if a PRD.md already exists in the target project directory
2. **If no existing PRD:** Skip this phase (nothing to resolve)
3. **If existing PRD found:**
   a. Diff the existing PRD against the new one
   b. Identify conflicts (sections that differ substantively)
   c. For each conflict, prefer the newly approved version unless the existing one has information the new one lacks
   d. Merge any unique content from the old PRD into the new one
   e. Present the merged result to Scott for a final check

### Output
A single, reconciled PRD.md ready to be saved.

### Done when
PRD conflicts resolved (or skipped if no existing PRD).

## Phase 4: Finalize PRD [STOP]

### What this phase does
Review the complete PRD as a whole. Check for internal contradictions, gaps,
and unrealistic scope.

### Checks to perform
1. Do the features in Section 3 match the user flows in Section 4?
2. Does the data model in Section 5 support all the features?
3. Do the milestones in Section 8 cover all the features?
4. Is Section 3 scoped realistically for v1?
5. Are there any technical concerns based on the deployment target?
6. Do the user flows cover empty states and error states?

### Output
A finalized PRD saved as `PRD.md` in the project repo.

### Done when
Scott confirms the PRD is complete and accurate.

## Phase 5: Create Repository [AUTO]

### What this phase does
Set up the project repo with the proper file structure and configuration files.

### Steps
1. Create the project directory based on work context:
   - Global → ~/Sites/Global/[project-name]
   - Personal → ~/Sites/Personal/[project-name]
   - Advosy → ~/Sites/Advosy/[project-name]
   - Bresco → ~/Sites/Bresco/[project-name]
2. Initialize git
3. Read ~/Sites/Global/scott-toolkit/context/FILE-STRUCTURE-TEMPLATE.md
4. Create the directory structure matching the deployment target (web/desktop/both)
5. Generate CLAUDE.md from ~/Sites/Global/scott-toolkit/context/CLAUDE-MD-TEMPLATE.md:
   - Fill in project context from the PRD
   - Fill in tech stack (standard + any project-specific additions)
   - List relevant toolkit skill files in External References
   - Fill in project architecture based on deployment target
   - Fill in constraints and rules from the PRD
6. Save the finalized PRD as PRD.md
7. Create tasks/todo.md with Milestone 1 tasks
8. Create tasks/lessons.md (empty, with header)
9. Generate `stack-lock.json` using `stack-detect.ts`:
   - Run `bun run ~/Sites/Global/scott-toolkit/tools/stack-detect.ts .`
   - Review the auto-detected technologies with Scott
   - Scott approves or adjusts, then change `approved_by` from "pending" to "scott"
   - Change `tier` from "experiment" to "full" for production projects
10. Generate `.claude/settings.json` for plugin tuning:
   - If the project does NOT use Vercel (no `next`/`vercel` in stack-lock.json technologies):
     ```json
     {
       "enabledPlugins": {
         "vercel@claude-plugins-official": false
       }
     }
     ```
   - If the project DOES use Vercel, skip this step (all plugins active by default)
   - This saves ~52K tokens per session on non-Vercel projects
11. Create initial commit

### Output
A fully initialized project repo with CLAUDE.md, PRD.md, stack-lock.json, .claude/settings.json (if needed), directory structure, and task tracking files.

### Done when
The repo exists, has proper structure, and initial commit is made.

**Gate:** Write `.project-scaffolded` marker in the project root after initial commit.

## Phase 6: Design Proof [STOP]

### What this phase does
Before building any features, establish the visual design. This prevents building
10 pages and then realizing the look is wrong.

### Steps
1. Run `/impeccable:teach-impeccable` — one-time design context setup that scans the codebase,
   asks about brand and aesthetic direction, and writes design context to CLAUDE.md
2. Read the PRD's Design Intent section (Section 9)
3. If a Design Intent document exists, read it
4. If Scott provided reference screenshots or URLs:
   - Analyze them for design patterns (color palettes, spacing rhythms, typography, layout structures)
   - Use these to inform design token choices
5. If Figma wireframes were provided:
   - Use the Figma MCP integration to read them
   - Extract layout patterns and component structures
6. Generate design tokens:
   - Tailwind CSS custom properties (colors, spacing, typography) in the CSS config
   - Nuxt UI theme configuration in app.config.ts
7. Build ONE representative page using `/impeccable:frontend-design`:
   - Usually the most important page (often the main list or dashboard view)
   - Include real-looking sample data (not lorem ipsum)
   - Apply all design tokens
8. Run `/impeccable:critique` for UX feedback — assess visual hierarchy, information
   architecture, and overall design quality
9. Iterate with Scott — offer these adjustment tools as needed:
   - `/impeccable:bolder` — amplify safe or boring designs for more visual impact
   - `/impeccable:quieter` — tone down overly bold or aggressive designs
   - `/impeccable:colorize` — add strategic color to monochromatic areas
10. Get Scott's approval — once approved, this design system applies to all subsequent pages

### Output
- Impeccable design context established in CLAUDE.md
- Design tokens configured (Tailwind CSS + Nuxt UI theme)
- One representative page built as a visual proof
- Design critique reviewed and addressed
- Scott's approval to proceed with this design

### Done when
Scott approves the visual design of the representative page.

**Gate:** Write `.design-approved` marker in the project root after Scott approves.

## Phase 7: Build Milestone 1 [DELEGATE]

### What this phase does
Begin building the first milestone (usually data model + basic CRUD).

### Steps

1. **Worktree isolation** — **git_worktree** operation
   Create a worktree for this milestone, isolating work on a separate branch
2. Read tasks/todo.md for the milestone tasks
3. Read tasks/lessons.md (may be empty for first milestone)
4. **Plan the work** — **plan_phase** operation
   Feed the milestone tasks into GSD for structured task breakdown and dependency tracking
5. **Execute the plan** — **execute_phase** operation
   GSD orchestrates execution. TDD discipline from the **tdd** operation
   applies to every task (write failing test, implement, refactor).
   Update tasks/todo.md as you go.
   After each execution step, `stack-check.ts` runs static checks on changed files.
   Fix any errors before proceeding to the next step.
6. Work autonomously on implementation — don't ask Scott for permission to fix bugs or write code
7. When building pages with significant UI, use `/impeccable:frontend-design` for high-quality output
8. For error/edge case hardening on key pages, use `/impeccable:harden`
9. **Review test coverage** — after all milestone tasks are complete:
    - Run the project's test suite to verify all tests pass
    - If coverage is thin on critical business logic, use the **add_tests** operation
    - Focus on data model operations and key user flows
10. **Code review** — **code_review** operation
    Two-stage review (spec compliance + code quality). Fix Critical issues immediately,
    Important issues before proceeding.
11. **Verify** — **verify_work** operation for UAT against acceptance criteria
12. **Finish branch** — **finish_branch** operation
    Merge the worktree back to main
13. Check in at the end of the milestone for review

### Output
A working first milestone with all tasks completed and verified.

### Done when
All Milestone 1 tasks are complete and the app runs without errors.

## Phase 8: Milestone Review [STOP]

### What this phase does
Demo what was built and get Scott's feedback before proceeding.

### Steps
1. Run `/impeccable:audit` — comprehensive quality check across accessibility,
   performance, theming, responsive design, and AI slop detection
2. Run `/impeccable:polish` — final detail pass for alignment, spacing, consistency,
   and interaction states
3. Summarize what was built in Milestone 1
4. Present audit results alongside the milestone summary
5. Show the current state of the app (describe what Scott would see)
6. List any issues or concerns discovered during the build
7. Get Scott's feedback
8. Update CLAUDE.md's Current Status section
9. Discuss next milestone or scope adjustments

**Note:** Code review and branch merging happen in Phase 7 (Build) as part of the
GSD+Superpowers build loop. By the time Phase 8 starts, code is already reviewed
and merged to main.

### Output
- Updated CLAUDE.md with current status
- Clear direction for next milestone

### Done when
Scott confirms the milestone is acceptable and gives direction for what's next.

## Completion Checklist
- [ ] Brain dump captured
- [ ] Clarifying questions answered
- [ ] PRD drafted (all 11 sections) (Phase 3a)
- [ ] PRD approved by Scott (Phase 3b)
- [ ] PRD conflicts resolved or skipped (Phase 3c)
- [ ] PRD reviewed for consistency (Phase 4)
- [ ] Project repo created with proper structure
- [ ] CLAUDE.md generated and populated
- [ ] tasks/todo.md created with Milestone 1 tasks
- [ ] tasks/lessons.md created
- [ ] Impeccable design context established (teach-impeccable)
- [ ] Design tokens configured
- [ ] Design proof page built and approved
- [ ] Design critique reviewed and addressed
- [ ] Milestone 1 built and verified
- [ ] Design audit completed (Phase 8)
- [ ] Polish pass completed (Phase 8)
- [ ] Milestone review completed
- [ ] CLAUDE.md updated with current status

- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
