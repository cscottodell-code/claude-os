# Toolkit Spa Day

## Metadata
- Last updated: 2026-03-24
- Version: 1.1
- Changelog:
  - v1.1: Add Phase 6 (Stack Review) for learning loop. Remove knowledge/ references (eliminated in v5). Add interfaces audit to Phase 3.
  - v1.0: Initial workflow

## Purpose
Periodic consolidation of rules, skills, and captured instincts. Over time, rules
and skills accumulate contradictions and bloat. Without cleanup, agents read 14+
files before starting work, causing context bloat that degrades performance.

Run monthly, or after every 3-4 retros, or whenever Scott notices performance
degradation that seems related to too many instructions.

## Prerequisites
- The toolkit repo at ~/Sites/Global/scott-toolkit/
- Optional: ~/.claude/instinct-candidates.md (from extract-instincts hook)

## Phase 1: Audit Current State [AUTO]

### Steps
1. Count all rules files: `~/Sites/Global/scott-toolkit/rules/*.md`
2. Count all skill files in `~/.claude/skills/*/SKILL.md`
3. Count all check files: `~/Sites/Global/scott-toolkit/checks/*.json`
4. Read `~/.claude/instinct-candidates.md` if it exists
5. Present a summary:
   | Category | Count | Total Lines |
   |----------|-------|-------------|
   | Rules | [n] | [lines] |
   | Skills | [n] | [lines] |
   | Check files | [n] | [lines] |
   | Instinct candidates | [n] | [lines] |

### Done when
Summary presented. No approval needed.

## Phase 2: Review Instinct Candidates [STOP]

### What this phase does
Review auto-captured session patterns and decide what to promote.

### Steps
1. For each candidate in `~/.claude/instinct-candidates.md`:
   - Is this already covered by an existing rule or skill?
   - Should it become a new rule (behavioral constraint)?
   - Should it become a new skill (recipe for how to do something)?
   - Should it be discarded (one-off, no longer relevant)?
2. Present each candidate to Scott with a recommendation
3. For approved promotions, note the target file

### Done when
All candidates reviewed. Scott has decided on each one.

## Phase 3: Scan for Contradictions [AUTO]

### Steps
1. Read all rules files
2. Read `config/interfaces.json` -- verify all operations still resolve correctly
3. Look for:
   - Contradictory guidance (e.g., "always do X" in one file, "never do X" in another)
   - Duplicate rules across files
   - Rules that are now obsolete (solved by Claude Code features)
   - Rules that are too vague to be actionable
   - Stale operation mappings in interfaces.json (renamed or removed commands)
4. Present findings to Scott

### Done when
Contradiction scan complete. Findings presented.

## Phase 4: Consolidate [STOP]

### Steps
1. For each contradiction or duplicate found:
   - Ask Scott for the correct resolution
   - Edit the files to resolve
2. For each promoted instinct candidate:
   - Add to the appropriate rule or skill file
3. Clear processed entries from `~/.claude/instinct-candidates.md`
4. Show Scott what changed

### Done when
All consolidations made and approved.

## Phase 5: Verify Context Budget [AUTO]

### Steps
1. Re-count all rules, skills, knowledge files
2. Compare to Phase 1 counts
3. If total lines increased: flag for Scott's awareness
4. If total lines decreased or stayed flat: good

### Done when
Budget check complete.

## Phase 6: Stack Review [DELEGATE]

### What this phase does
Run the learning loop dashboard to review check health and promote lessons.

### Steps
1. Invoke `/scott:stack-review`
2. The stack-review skill handles everything: aggregation, dashboard, and Scott's approvals

### Done when
Stack review complete (or skipped if no audit data exists yet).

## Completion Checklist
- [ ] Current state audited
- [ ] Instinct candidates reviewed
- [ ] Contradictions scanned
- [ ] Consolidations made
- [ ] Context budget verified
- [ ] Stack review completed (or noted as no data)
