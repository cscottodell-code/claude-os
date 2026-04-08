# Audit Round 2 Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the learning loop gap, fix stale references, consolidate marginal skills, standardize error file naming, and add archival strategy.

**Architecture:** Seven independent tasks organized by dependency. Tasks 1-3 fix live bugs. Tasks 4-5 close the learning loop. Task 6 consolidates skills. Task 7 standardizes error files and adds archival. Each task produces a working commit.

**Tech Stack:** Bun, TypeScript (hooks/tools), Markdown (skills/workflows/docs)

---

## Task 1: Fix stale .sh references in scott-bypass skill

The bypass skill references pre-v6.0 `.sh` hook filenames that no longer exist. Guards were migrated to TypeScript modules in v6.0 and are now imported by `pretooluse-router.ts`, not standalone scripts.

**Files:**
- Modify: `skills/scott-bypass/SKILL.md:28-35`

- [ ] **Step 1: Update the guard hook table**

Replace the table at lines 28-35 with current hook references:

```markdown
Known guards (all routed through `pretooluse-router.ts`):
| Guard | What it blocks | Module |
|-------|---------------|--------|
| git-push | `git push` commands | `hooks/guards/git-push.ts` |
| destructive | `rm -rf`, `git reset --hard`, etc. | `hooks/guards/destructive.ts` |
| claude-md | Edits to CLAUDE.md or MEMORY.md | `hooks/guards/claude-md.ts` |
| npm-install | `npm/pnpm/bun install` commands | `hooks/guards/npm-install.ts` |
| phase-completion | GSD phase complete without closeout | `hooks/guards/phase-completion.ts` |
| workflow-gates | Workflow phase prerequisites | `hooks/guards/workflow-gates.ts` |
```

- [ ] **Step 2: Update the bypass procedure**

Replace the Step 3 section (lines 43-54). Guards are now TypeScript modules imported by the router, not standalone scripts. The bypass approach needs to change:

```markdown
## 3. Execute the bypass

Since guards are TypeScript modules routed through `pretooluse-router.ts`,
bypass by temporarily renaming the guard file:

\`\`\`bash
# Disable the guard
mv ~/.claude/hooks/guards/[guard-name].ts ~/.claude/hooks/guards/[guard-name].ts.disabled

# Run the blocked command
[the exact command that was blocked]

# Re-enable the guard
mv ~/.claude/hooks/guards/[guard-name].ts.disabled ~/.claude/hooks/guards/[guard-name].ts
\`\`\`

**CRITICAL:** Always re-enable the guard, even if the command fails.
```

- [ ] **Step 3: Verify no other stale .sh references in this file**

Run: `grep '\.sh' skills/scott-bypass/SKILL.md`
Expected: No matches

- [ ] **Step 4: Commit**

```bash
git add skills/scott-bypass/SKILL.md
git commit -m "fix: update scott-bypass to reference TypeScript guards (not .sh)"
```

---

## Task 2: Fix stale .sh reference in scott-rebuild-metrics skill

The rebuild-metrics skill references `stack-metrics.sh` which was migrated to `stack-metrics.ts` in v6.0.

**Files:**
- Modify: `skills/scott-rebuild-metrics/SKILL.md:31`

- [ ] **Step 1: Fix the command reference**

Change line 31 from:
```
1. Run: `~/Sites/Global/scott-toolkit/tools/stack-metrics.sh --full-rebuild`
```
To:
```
1. Run: `bun run ~/Sites/Global/scott-toolkit/tools/stack-metrics.ts`
```

- [ ] **Step 2: Verify no other stale .sh references**

Run: `grep '\.sh' skills/scott-rebuild-metrics/SKILL.md`
Expected: No matches

- [ ] **Step 3: Commit**

```bash
git add skills/scott-rebuild-metrics/SKILL.md
git commit -m "fix: update scott-rebuild-metrics to reference .ts tool (not .sh)"
```

---

## Task 3: Add stale .sh skill references to banned patterns

The toolkit-lint missed the `.sh` references in Tasks 1-2 because `version-manifest.json` only bans specific filenames. Add a broader pattern for `.sh` tool references inside skills.

**Files:**
- Modify: `config/version-manifest.json`

- [ ] **Step 1: Add banned pattern for .sh tool references in skills**

Add to the `banned` array in `cross_reference_patterns`:

```json
{ "pattern": "stack-metrics.sh", "replacement": "stack-metrics.ts", "reason": "Migrated to TypeScript in v6.0 (M1)" },
{ "pattern": "guard-git-push.sh", "replacement": "hooks/guards/git-push.ts", "reason": "Migrated to TypeScript in v6.0 (M2)" },
{ "pattern": "guard-destructive.sh", "replacement": "hooks/guards/destructive.ts", "reason": "Migrated to TypeScript in v6.0 (M2)" },
{ "pattern": "guard-claude-md.sh", "replacement": "hooks/guards/claude-md.ts", "reason": "Migrated to TypeScript in v6.0 (M2)" },
{ "pattern": "guard-npm-install.sh", "replacement": "hooks/guards/npm-install.ts", "reason": "Migrated to TypeScript in v6.0 (M2)" }
```

- [ ] **Step 2: Run toolkit-lint to verify it passes**

Run: `bun run tools/toolkit-lint.ts`
Expected: 0 issues found (since we already fixed the skills in Tasks 1-2)

- [ ] **Step 3: Commit**

```bash
git add config/version-manifest.json
git commit -m "fix: add .sh guard/tool references to banned patterns"
```

---

## Task 4: Inject lessons at phase start (close the learning loop)

The core learning loop gap: lessons are captured at phase end but never read at phase start. Extend the SurrealDB injection pattern to also inject relevant `[stack:*]` lessons when starting work on a project that has `tasks/lessons.md`.

**Files:**
- Create: `hooks/guards/lessons-inject.ts`
- Modify: `hooks/pretooluse-router.ts`
- Create: `tests/lessons-inject.test.ts`

- [ ] **Step 1: Write failing tests for the lessons injection guard**

Create `tests/lessons-inject.test.ts`:

```typescript
/**
 * Lessons injection guard design contract tests.
 *
 * The guard injects relevant lessons from tasks/lessons.md into context
 * when Claude starts working in a project with lessons.
 */

import { describe, expect, test } from "bun:test";
import { extractTaggedLessons, shouldInject } from "../hooks/guards/lessons-inject.js";

describe("extractTaggedLessons", () => {
  test("extracts [stack:surrealdb] tagged lessons", () => {
    const content = `# Lessons
- [stack:surrealdb] Always use type::record() not type::thing()
- [project] Update CLAUDE.md after each milestone
- [stack:nuxt] Use definePageMeta for route middleware`;
    const result = extractTaggedLessons(content, ["surrealdb"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("type::record");
  });

  test("extracts all [stack:*] lessons when no filter", () => {
    const content = `# Lessons
- [stack:surrealdb] Use type::record()
- [stack:nuxt] Use definePageMeta
- [project] Not a stack lesson`;
    const result = extractTaggedLessons(content, null);
    expect(result).toHaveLength(2);
  });

  test("returns empty array when no lessons match", () => {
    const content = `# Lessons
- [project] Not a stack lesson
- [prompt] Use neutral framing`;
    const result = extractTaggedLessons(content, ["surrealdb"]);
    expect(result).toHaveLength(0);
  });

  test("handles empty file", () => {
    expect(extractTaggedLessons("", null)).toEqual([]);
  });

  test("handles file with no tagged lessons", () => {
    const content = "# Lessons\nJust some notes without tags";
    expect(extractTaggedLessons(content, null)).toEqual([]);
  });

  test("extracts multiple technologies", () => {
    const content = `- [stack:surrealdb] Lesson A
- [stack:nuxt] Lesson B
- [stack:tailwind] Lesson C`;
    const result = extractTaggedLessons(content, ["surrealdb", "nuxt"]);
    expect(result).toHaveLength(2);
  });
});

describe("shouldInject", () => {
  test("returns true when lessons file exists and has stack lessons", () => {
    // This test uses the actual filesystem, so it depends on cwd
    // We test the logic, not the file access
    expect(shouldInject(true, 3)).toBe(true);
  });

  test("returns false when no lessons file", () => {
    expect(shouldInject(false, 0)).toBe(false);
  });

  test("returns false when lessons file exists but no stack lessons", () => {
    expect(shouldInject(true, 0)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test tests/lessons-inject.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement the lessons injection guard**

Create `hooks/guards/lessons-inject.ts`:

```typescript
/**
 * Guard (advisory): Inject relevant [stack:*] lessons from tasks/lessons.md
 * into context at the start of work sessions. Closes the learning loop by
 * ensuring past mistakes are surfaced before new work begins.
 *
 * Non-blocking — always returns allow: true, may output additionalContext.
 * Deduplicates per session via /tmp marker file (same pattern as surrealdb-inject).
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { GuardResult } from "./git-push.js";
import { readJson } from "../../src/json.js";

/** Extract lessons tagged with [stack:tech] from lessons.md content */
export function extractTaggedLessons(
  content: string,
  techFilter: string[] | null
): string[] {
  const lines = content.split("\n");
  const lessons: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[stack:(\w+)\]\s*(.+)/);
    if (!match) continue;

    const tech = match[1];
    const lesson = match[0].trim();

    if (techFilter === null || techFilter.includes(tech)) {
      lessons.push(lesson);
    }
  }

  return lessons;
}

/** Determine if injection should happen */
export function shouldInject(fileExists: boolean, lessonCount: number): boolean {
  return fileExists && lessonCount > 0;
}

/** Detect technologies from stack-lock.json */
async function detectTechnologies(cwd: string): Promise<string[]> {
  interface StackLock {
    technologies?: Record<string, unknown>;
  }
  const lock = await readJson<StackLock>(resolve(cwd, "stack-lock.json"));
  if (!lock?.technologies) return [];
  return Object.keys(lock.technologies);
}

/** Main guard function */
export async function guardLessonsInject(
  cwd: string
): Promise<GuardResult & { additionalContext?: string }> {
  // Dedup: one injection per session
  const dedupFile = `/tmp/lessons-injected-${process.env.CLAUDE_SESSION_ID ?? process.pid}`;
  if (existsSync(dedupFile)) return { allow: true };

  const lessonsPath = resolve(cwd, "tasks/lessons.md");
  if (!existsSync(lessonsPath)) return { allow: true };

  const content = readFileSync(lessonsPath, "utf-8");

  // Get project technologies for filtering
  const techs = await detectTechnologies(cwd);
  const lessons = extractTaggedLessons(content, techs.length > 0 ? techs : null);

  if (!shouldInject(true, lessons.length)) return { allow: true };

  // Mark as injected
  await Bun.write(dedupFile, "");

  const header = `[Lessons Auto-Loaded] ${lessons.length} past lesson(s) for this project's stack. Review before writing code:\n`;
  const body = lessons.map((l) => `  ${l}`).join("\n");

  return {
    allow: true,
    additionalContext: `${header}${body}`,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test tests/lessons-inject.test.ts`
Expected: PASS (all 8 tests)

- [ ] **Step 5: Wire the guard into pretooluse-router.ts**

Add import at the top of `hooks/pretooluse-router.ts`:

```typescript
import { guardLessonsInject } from "./guards/lessons-inject.js";
```

Add invocation after the existing guards (near the end of the guard dispatch section, before the final return). The lessons guard runs once per session on the first Bash command:

```typescript
// --- Lessons injection (advisory, once per session) ---
const lessonsResult = await guardLessonsInject(process.cwd());
if (lessonsResult.additionalContext) {
  console.log(lessonsResult.additionalContext);
}
```

- [ ] **Step 6: Run full test suite**

Run: `bun test`
Expected: All tests pass (392 existing + 8 new = 400)

- [ ] **Step 7: Commit**

```bash
git add hooks/guards/lessons-inject.ts hooks/pretooluse-router.ts tests/lessons-inject.test.ts
git commit -m "feat: inject [stack:*] lessons at session start to close learning loop"
```

---

## Task 5: Rename old-format error files to NNN-description format

Seven error files use the old `error-001.md` format. The metadata specifies `NNN-short-description.md`. Rename them for consistency and future automation.

**Files:**
- Rename: `errors/error-001.md` through `errors/error-007.md`

- [ ] **Step 1: Read each file to determine a short description**

Read lines 1-5 of each file to extract the title/description for the new filename. The pattern is `# Error #N: [Description]`.

Run: `head -1 errors/error-00*.md`

- [ ] **Step 2: Rename all 7 files**

```bash
cd ~/Sites/Global/scott-toolkit
git mv errors/error-001.md errors/001-stale-job-title-in-config.md
git mv errors/error-002.md errors/002-bun-sdk-string-coercion.md
git mv errors/error-003.md errors/003-code-review-skipped.md
git mv errors/error-004.md errors/004-surrealdb-schema-mismatch.md
git mv errors/error-005.md errors/005-review-skipped-again.md
git mv errors/error-006.md errors/006-missing-delivery-address.md
git mv errors/error-007.md errors/007-missing-tenant-id.md
```

(Adjust descriptions based on actual file content from Step 1)

- [ ] **Step 3: Verify no broken references**

Run: `grep -r "error-00[1-7]" . --include="*.md" --include="*.ts" --include="*.json" | grep -v CHANGELOG | grep -v '.git/'`
Expected: No matches in active files (CHANGELOG references are historical, leave as-is)

- [ ] **Step 4: Commit**

```bash
git add errors/
git commit -m "refactor: rename error files 001-007 to NNN-description format"
```

---

## Task 6: Consolidate marginal skills

Three skills are candidates for elimination: `scott-rebuild-metrics` (40 lines, single CLI command), `scott-bypass` (60 lines, operational procedure), and `scott-automation-guide` (210 lines, generic overlap with n8n-reference).

**Files:**
- Delete: `skills/scott-rebuild-metrics/SKILL.md`
- Delete: `skills/scott-bypass/SKILL.md`
- Modify: `skills/scott-automation-guide/SKILL.md` (move useful content to n8n-reference)
- Modify: `skills/scott-n8n-reference/references/` (absorb automation-guide content)
- Modify: `docs/architecture.md` (add bypass procedure)
- Modify: `skills/scott-stack-review/SKILL.md` (add rebuild-metrics instructions)

- [ ] **Step 1: Absorb rebuild-metrics into stack-review**

Read `skills/scott-stack-review/SKILL.md`. Add a "Recovery" section at the end:

```markdown
## Recovery: Rebuild Metrics

If `checks/metrics.json` is missing, corrupted, or out of sync:

1. Run: `bun run ~/Sites/Global/scott-toolkit/tools/stack-metrics.ts`
2. Verify the output JSON has valid structure
3. Report: "Metrics rebuilt. Found N projects, N audit files, N checks tracked."
```

- [ ] **Step 2: Move bypass procedure to docs/architecture.md**

Read `docs/architecture.md`. Add a section under the hooks documentation:

```markdown
### How to Bypass a Guard

When Scott explicitly approves a blocked action:

1. Identify the guard from the hook error message
2. Temporarily rename it: `mv ~/.claude/hooks/guards/[name].ts ~/.claude/hooks/guards/[name].ts.disabled`
3. Run the blocked command
4. Re-enable: `mv ~/.claude/hooks/guards/[name].ts.disabled ~/.claude/hooks/guards/[name].ts`

**Always re-enable the guard, even if the command fails.**
```

- [ ] **Step 3: Extract useful automation-guide content into n8n-reference**

Read `skills/scott-automation-guide/SKILL.md` fully. Extract the platform-agnostic sections (idempotency, error handling patterns, validation) that apply to n8n workflows. Create `skills/scott-n8n-reference/references/reliability-patterns.md` with the extracted content.

- [ ] **Step 4: Delete the 3 skills**

```bash
rm -r skills/scott-rebuild-metrics
rm -r skills/scott-bypass
rm -r skills/scott-automation-guide
```

- [ ] **Step 5: Run toolkit-sync to update README and docs**

Run: `bun run tools/toolkit-sync.ts`
Expected: README and user-guide updated (3 fewer skills in command tables)

- [ ] **Step 6: Run toolkit-lint**

Run: `bun run tools/toolkit-lint.ts`
Expected: 0 issues

- [ ] **Step 7: Run tests**

Run: `bun test`
Expected: All pass (test count may decrease slightly due to fewer skills scanned)

- [ ] **Step 8: Commit**

```bash
git add skills/ docs/architecture.md README.md docs/user-guide.md
git commit -m "refactor: consolidate 3 marginal skills (rebuild-metrics, bypass, automation-guide)"
```

---

## Task 7: Add archival strategy and resolved field to error/success logs

Add `resolved: true/false` frontmatter to error logs and document an archival strategy in `toolkit-spa-day.md`.

**Files:**
- Modify: `workflows/toolkit-spa-day.md` (add archival phase)
- Modify: `errors/_metadata.json` (add resolved field documentation)

- [ ] **Step 1: Update _metadata.json with resolved field spec**

Add to `errors/_metadata.json`:

```json
{
  "next_id": 29,
  "description": "Counter for error log IDs. Incremented by /scott:phase-closeout reflect phase.",
  "naming": "NNN-short-description.md (e.g., 011-missed-context-window.md).",
  "fields": {
    "resolved": "Boolean frontmatter field. Set to true when the root cause has been fixed and a check/guard prevents recurrence. Resolved errors older than 90 days are archived during toolkit-spa-day."
  }
}
```

- [ ] **Step 2: Read toolkit-spa-day.md to find insertion point**

Read `workflows/toolkit-spa-day.md` to identify the current phase count and find where to add the archival phase.

- [ ] **Step 3: Add archival phase to toolkit-spa-day**

Add a new phase after the existing phases:

```markdown
## Phase N: Archive Resolved Logs [AUTO]

### What this phase does
Move resolved error and success logs older than 90 days to archive subdirectories.
Keeps the active directories focused on current, actionable items.

### Steps
1. Scan `errors/` for files with `resolved: true` in frontmatter AND last modified > 90 days ago
2. Move matching files to `errors/archive/`
3. Scan `successes/` for files last modified > 90 days ago
4. Move matching files to `successes/archive/`
5. Update `_metadata.json` if needed (next_id doesn't change)
6. Report: "Archived N error logs and N success logs"

### Done when
Active directories contain only current, unresolved items.
```

- [ ] **Step 4: Create archive directories**

```bash
mkdir -p errors/archive successes/archive
touch errors/archive/.gitkeep successes/archive/.gitkeep
```

- [ ] **Step 5: Add resolved frontmatter to the 7 oldest error files (001-007)**

These are the oldest errors (from Bresco Phase 1-2). Add YAML frontmatter to each:

```yaml
---
resolved: true
---
```

Only mark as resolved if the error has been addressed by a check, guard, or skill update. Read each file to verify before marking.

- [ ] **Step 6: Commit**

```bash
git add errors/ successes/ workflows/toolkit-spa-day.md
git commit -m "feat: add error archival strategy with resolved field and 90-day retention"
```

---

## Post-Plan: Update CHANGELOG and Docs

After all 7 tasks are complete:

- [ ] **Update CHANGELOG.md** with a v6.2.0 entry summarizing all changes
- [ ] **Update README.md** skill count (21 -> 18 after consolidation)
- [ ] **Update docs/architecture.md** skill count
- [ ] **Run full verification**:

```bash
bun test
bun run tools/toolkit-lint.ts
bun run tools/toolkit-sync.ts --check
bun run tools/toolkit-graph.ts check
```

- [ ] **Final commit**

```bash
git add CHANGELOG.md README.md docs/
git commit -m "docs: v6.2.0 changelog and updated skill counts"
```
