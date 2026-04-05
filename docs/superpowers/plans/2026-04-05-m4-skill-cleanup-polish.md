# M4: Skill Cleanup + Polish — Implementation Plan

**Date:** 2026-04-05
**Branch:** audit/m4-skill-cleanup-polish
**Spec:** docs/superpowers/specs/2026-04-05-toolkit-audit-remediation-design.md (M4 section)

---

## Execution Order

1. **Part A** — Split 5 oversized skills (bulk of work)
2. **Part B** — Fix stale references
3. **Part C** — Documentation updates
4. **Part D** — Final coherence audit

Commit after each part.

---

## Part A: Skill Splits

Pattern: SKILL.md keeps frontmatter, description, triggers, quick commands, and a reference pointer. Heavy workflow/protocol logic moves to references/.

| Skill | Current | Target SKILL.md | New reference files |
|-------|---------|-----------------|-------------------|
| skill-creator (479) | refs/schemas.md exists | ~50 lines | refs/workflow.md + refs/eval-guide.md |
| scott-research (442) | no refs/ dir | ~60 lines | refs/orchestration.md |
| scott-eos (331) | refs/eos-complete-reference.md exists | ~40 lines | absorb inline into existing ref |
| scott-council (312) | no refs/ dir | ~50 lines | refs/council-protocol.md |
| scott-notebooklm (266) | no refs/ dir | ~40 lines | refs/creation-workflow.md |

## Part B: Fix Stale References

- scott-surrealdb line 16: verify path is correct (already confirmed)
- Run toolkit-lint.ts, fix any issues

## Part C: Documentation Updates

- README.md: .ts files, Bun prerequisite
- CHANGELOG.md: v6.0 entry
- config/version-manifest.json: banned .sh patterns
- context/CLAUDE-MD-TEMPLATE.md: Bun prerequisite, new gates
- rules/claude-behavior.md: update hook filename refs if any

## Part D: Final Coherence Audit

- verify-toolkit.sh passes
- toolkit-lint.ts reports zero issues
