# Handoff to Gary

## Metadata
- Last updated: 2026-02-27
- Version: 1.2
- Changelog:
  - v1.2: Add test coverage assessment with /gsd:add-tests (Phase 1)
  - v1.1: Add Superpowers two-stage code review to Phase 1, add test verification items to Phase 5 handoff checklist
  - v1.0: Initial workflow

## Purpose
Prepare a prototype for handoff to Gary (production developer at Advosy). This ensures
the code is clean, documented, and ready for someone else to pick up. Gary shouldn't
have to guess how things work or decode prototype shortcuts.

Use this when a prototype is ready to become a production app.

## Prerequisites
- Project is functionally complete (all milestones done)
- Scott has decided this project is going to Gary
- Code is committed and pushed to GitHub

## Instructions for Claude Code
Be thorough. Gary is a professional developer who will productionize this code. He needs
to understand the architecture, the decisions that were made, and any shortcuts or tech
debt. Don't hide problems — document them clearly.

## Phase 1: Code Review

### What this phase does
Review the entire codebase for quality, consistency, and completeness.

### Checks to perform
1. **Dead code:** Remove unused components, composables, or imports
2. **Console.logs:** Remove or convert to proper logging
3. **TODO comments:** Resolve or document in handoff notes
4. **Hardcoded values:** Move to config or environment variables
5. **Error handling:** Ensure all user-facing operations have error handling
6. **Type safety:** Fix any `any` types or missing type definitions
7. **Naming consistency:** File names, variable names, function names
8. **Component structure:** All components follow the project's conventions
9. **Superpowers code review:** Run `superpowers:requesting-code-review` for a
   two-stage review (spec compliance + code quality) of the entire codebase.
   Fix any Critical issues immediately and Important issues before proceeding.
10. **Test coverage:** Review test suite completeness. If critical business logic
    lacks tests, use `/gsd:add-tests` to fill gaps before handoff — Gary shouldn't
    have to write tests for prototype logic.

### Output
A list of issues found and fixed (from both manual checks and Superpowers review).
If any issues can't be fixed easily, document them.

### Done when
The codebase is clean and consistent.

## Phase 2: Documentation

### What this phase does
Ensure all documentation reflects what was ACTUALLY built (not what was planned).

### Checks to perform
1. **CLAUDE.md:** Update to reflect final state (schema, architecture, status)
2. **PRD.md:** Note any deviations from the original plan
3. **Code comments:** Add inline comments for complex logic
4. **SurrealDB schema:** Ensure schema.surql matches the actual database

### Output
Updated documentation files.

### Done when
A developer reading these docs could understand the project without asking questions.

## Phase 3: Architecture Summary

### What this phase does
Create a brief document explaining the app's architecture for Gary.

### Content to include
1. **How the app is structured:** High-level overview with key files
2. **Data flow:** How data moves from UI → backend → database → back
3. **Key design decisions:** Why things were built the way they were
4. **Known limitations:** What this prototype does NOT handle
5. **Tech debt:** Shortcuts taken that should be addressed in production
6. **External dependencies:** Third-party services, APIs, n8n workflows

### Output
An `ARCHITECTURE.md` file in the project repo.

### Done when
Gary could read this and understand how to work with the codebase.

## Phase 4: Setup Instructions

### What this phase does
Document how to clone, install, and run the project from scratch.

### Content to include
1. **Prerequisites:** What needs to be installed (with version numbers)
2. **Clone and install:**
   ```bash
   git clone [repo url]
   cd [project]
   pnpm install
   ```
3. **Database setup:** How to initialize SurrealDB and run the schema
4. **Run the app:** Commands for dev mode and production build
5. **Environment variables:** What needs to be configured (WITHOUT actual secrets)
6. **Testing:** How to run tests (if any)

### Verification
Run through the setup instructions yourself on a clean checkout to make sure they work.

### Output
Setup instructions in README.md or SETUP.md.

### Done when
The instructions work when followed from scratch.

## Phase 5: Handoff Checklist

### What this phase does
Final verification that everything is ready.

### Checklist
- [ ] Code is pushed to GitHub
- [ ] No hardcoded secrets or local paths in the code
- [ ] CLAUDE.md reflects final state
- [ ] PRD.md notes any deviations from plan
- [ ] ARCHITECTURE.md exists and is accurate
- [ ] Setup instructions work from scratch
- [ ] All database schema files are up to date
- [ ] All tests pass (`pnpm test`)
- [ ] Test coverage covers critical business logic
- [ ] Gary has access to the GitHub repo
- [ ] Known issues and tech debt are documented
- [ ] No unnecessary files committed (.env, node_modules, .DS_Store)

### Output
Confirmation that all checklist items pass.

### Done when
All checklist items are checked and Scott confirms the handoff is ready.

## Completion Checklist
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Architecture summary written
- [ ] Setup instructions verified
- [ ] Handoff checklist passed
- [ ] Scott confirms ready for Gary

- [ ] .claude-resume.md updated (workflow, phase, done, next, decisions)
