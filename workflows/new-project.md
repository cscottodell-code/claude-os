# New Project

## Metadata
- Last updated: 2026-03-14
- Version: 1.7
- Changelog:
  - v1.7: Add follow-up clarifying questions to Phase 1 (from 2026-03-14 source review)
  - v1.6: Add API key model access verification to Phase 1 (from Eleanor M1 retro)
  - v1.5: Add phase auto-advancement tags ([STOP]/[AUTO]/[DELEGATE]) and PM mode conditionals (GSD/BMAD) in Phase 3 and Phase 7
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

## Phase 3: Draft PRD [STOP]

### What this phase does
Load the PRD template from ~/Sites/Global/scott-toolkit/templates/PRD-TEMPLATE.md and walk through
it section by section, using the brain dump answers as the starting material.

### How to do it

**If PM Mode is GSD:**
1. Read ~/Sites/Global/scott-toolkit/templates/PRD-TEMPLATE.md
2. For each section (1-11):
   a. Explain what this section is about (use the template's guidance comments)
   b. Draft the content using the brain dump and clarification answers
   c. Present the draft to Scott
   d. Get Scott's approval or make changes
   e. Move to the next section
3. Pay special attention to:
   - Section 3 (Features): Push Scott to prioritize ruthlessly
   - Section 4 (User Flows): Make these concrete and step-by-step
   - Section 5 (Data Model): Get the tables and relationships right
   - Section 8 (Milestones): Milestone 1 = data model + basic CRUD always

**If PM Mode is BMAD:**
1. Use `/bmad-bmm-create-prd` to generate the PRD through BMAD's guided process
2. Review the generated PRD with Scott section by section
3. Pay special attention to the same areas (features, user flows, data model, milestones)

### Output
A complete PRD draft with all 11 sections filled in.

### Done when
Scott has approved every section of the PRD.

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
3. Read ~/Sites/Global/scott-toolkit/templates/FILE-STRUCTURE-TEMPLATE.md
4. Create the directory structure matching the deployment target (web/desktop/both)
5. Generate CLAUDE.md from ~/Sites/Global/scott-toolkit/templates/CLAUDE-MD-TEMPLATE.md:
   - Fill in project context from the PRD
   - Fill in tech stack (standard + any project-specific additions)
   - List relevant toolkit skill files in External References
   - Fill in project architecture based on deployment target
   - Fill in constraints and rules from the PRD
6. Save the finalized PRD as PRD.md
7. Create tasks/todo.md with Milestone 1 tasks
8. Create tasks/lessons.md (empty, with header)
9. Create initial commit

### Output
A fully initialized project repo with CLAUDE.md, PRD.md, directory structure, and task tracking files.

### Done when
The repo exists, has proper structure, and initial commit is made.

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

## Phase 7: Build Milestone 1 [DELEGATE]

### What this phase does
Begin building the first milestone (usually data model + basic CRUD).

### Steps

**Both modes:**
1. Set up a git worktree for this milestone using `superpowers:using-git-worktrees`
   — this isolates milestone work on a separate branch without affecting main
2. Read tasks/todo.md for the milestone tasks
3. Read tasks/lessons.md (may be empty for first milestone)

**If PM Mode is GSD:**
4. Break milestone tasks into small (2-5 minute) chunks using `superpowers:writing-plans`
5. Execute each task using `superpowers:subagent-driven-development`:
   - Each task gets a fresh subagent with focused context
   - TDD is enforced automatically via `superpowers:test-driven-development`
     (write failing test → implement → refactor)
   - Each task gets a two-stage code review before completion
   - Update tasks/todo.md as you go

**If PM Mode is BMAD:**
4. Create epics and stories using `/bmad-bmm-create-epics-and-stories`
5. Plan the sprint using `/bmad-bmm-sprint-planning`
6. Implement each story using `/bmad-bmm-dev-story`
7. Code review each story using `/bmad-bmm-code-review`

**Both modes:**
8. Work autonomously on implementation — don't ask Scott for permission to fix bugs or write code
9. When building pages with significant UI, use `/impeccable:frontend-design` for high-quality output
10. For error/edge case hardening on key pages, use `/impeccable:harden`
11. After all milestone tasks are complete, review test coverage:
    - Run the project's test suite to verify all tests pass
    - If coverage is thin on critical business logic, use `/gsd:add-tests` to generate
      additional tests for the completed milestone
    - Focus on data model operations and key user flows
12. Check in at the end of the milestone for review

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
3. Run `superpowers:requesting-code-review` — two-stage code review (spec compliance +
   code quality) of the entire milestone. Fix any Critical issues immediately and
   Important issues before proceeding
4. Use `superpowers:finishing-a-development-branch` to merge the worktree back to main
5. Summarize what was built in Milestone 1
6. Present audit and code review results alongside the milestone summary
7. Show the current state of the app (describe what Scott would see)
8. List any issues or concerns discovered during the build
9. Get Scott's feedback
10. Update CLAUDE.md's Current Status section
11. Discuss next milestone or scope adjustments

### Output
- Updated CLAUDE.md with current status
- Clear direction for next milestone

### Done when
Scott confirms the milestone is acceptable and gives direction for what's next.

## Completion Checklist
- [ ] Brain dump captured
- [ ] Clarifying questions answered
- [ ] PRD complete (all 11 sections)
- [ ] PRD reviewed for consistency
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
