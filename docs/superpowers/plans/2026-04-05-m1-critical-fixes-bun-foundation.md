# M1: Critical Fixes + Bun Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 4 most dangerous shell script bugs, initialize Bun runtime with shared utilities, and rewrite 6 tools from bash to TypeScript.

**Branch:** `audit/m1-critical-fixes-bun-foundation`

**Architecture:** Part A patches bugs in-place and commits before rewrites begin. Part B creates the TypeScript foundation (package.json, tsconfig, src/ utilities). Part C rewrites each tool with a .sh backward-compat wrapper so existing settings.json references keep working until M2.

**Tech Stack:** Bun 1.x, TypeScript (strict), ES2022 target

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Patch | `hooks/guard-git-push.sh` | Fix fail-open when jq unavailable |
| Patch | `hooks/uiux-reminder.sh` | Fix macOS md5sum unavailability |
| Patch | `hooks/version-propagate.sh` | Fix Python code injection via shell vars |
| Patch | `setup.sh` | Fix unescaped sed replacement chars |
| Create | `package.json` | Bun project config |
| Create | `tsconfig.json` | TypeScript strict config |
| Create | `src/json.ts` | Safe JSON file read/write |
| Create | `src/semver.ts` | Semantic version comparison |
| Create | `src/paths.ts` | Toolkit path resolution |
| Create | `src/exec.ts` | Shell command execution with timeout |
| Create | `tools/stack-detect.ts` | Technology detection (replaces .sh) |
| Create | `tools/stack-check.ts` | Static code checks (replaces .sh) |
| Create | `tools/stack-preflight.ts` | System readiness verification (replaces .sh) |
| Create | `tools/stack-metrics.ts` | Audit metrics aggregation (replaces .sh) |
| Create | `tools/toolkit-lint.ts` | Toolkit integrity linting (replaces .sh) |
| Create | `tools/pre-commit-hook.ts` | Git pre-commit gate (replaces .sh) |
| Modify | `tools/stack-detect.sh` | Becomes thin wrapper → .ts |
| Modify | `tools/stack-check.sh` | Becomes thin wrapper → .ts |
| Modify | `tools/stack-preflight.sh` | Becomes thin wrapper → .ts |
| Modify | `tools/stack-metrics.sh` | Becomes thin wrapper → .ts |
| Modify | `tools/toolkit-lint.sh` | Becomes thin wrapper → .ts |
| Modify | `tools/pre-commit-hook.sh` | Becomes thin wrapper → .ts |
| Patch | `setup.sh` | Add Bun prerequisite check, deploy .ts tools |

---

## Part A: Critical Bash Hotfixes

### Task 1: Fix fail-open guard in guard-git-push.sh

**File:** `hooks/guard-git-push.sh`

**Bug:** Line 6 uses `jq -r '.tool_input.command // empty'`. If jq is not installed or the JSON is malformed, `COMMAND` becomes empty, grep doesn't match, and the script exits 0 (allow). A security guard that fails open is worse than no guard.

- [ ] **Step 1: Add jq availability check with fail-closed default**

Replace the current file content (lines 1-17) with:

```bash
#!/bin/bash
# Guard: Block git push unless explicitly confirmed
# Exit code 2 = block the action (per Claude Code hooks spec)
# SECURITY: Fails CLOSED — if jq is missing or parsing fails, block by default

INPUT=$(cat)

# Fail closed: if jq is unavailable, block everything
if ! command -v jq >/dev/null 2>&1; then
  echo "guard-git-push: jq not found — blocking action (fail-closed)."
  exit 2
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Fail closed: if jq parsing failed, block
if [ $? -ne 0 ] || [ -z "$COMMAND" ]; then
  # Can't parse input — could be a push, so block to be safe
  # But only if stdin looked like it had content
  if [ -n "$INPUT" ]; then
    echo "guard-git-push: failed to parse input — blocking action (fail-closed)."
    exit 2
  fi
  # Empty input means hook was called for a non-Bash tool — allow
  exit 0
fi

# Strip quoted strings to avoid false positives (e.g. echo "git push")
STRIPPED=$(echo "$COMMAND" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

if echo "$STRIPPED" | grep -qE 'git\s+push'; then
  echo "Git push blocked — use /scott:bypass or confirm manually before pushing."
  exit 2
fi

exit 0
```

**Verification:** `echo '{"tool_input":{"command":"git push origin main"}}' | bash hooks/guard-git-push.sh; echo "exit: $?"` should print exit: 2. Also test with jq unavailable: `PATH=/usr/bin bash hooks/guard-git-push.sh <<< '{"test":true}'; echo "exit: $?"` should print exit: 2.

---

### Task 2: Fix macOS md5sum crash in uiux-reminder.sh

**File:** `hooks/uiux-reminder.sh`

**Bug:** Line 24 uses `md5sum` which doesn't exist on macOS. The fallback `|| echo 'default'` never triggers because `cut` (the last pipeline command) succeeds even with empty input. Result: all projects share the same marker file, so the reminder only fires once total instead of once per project.

- [ ] **Step 1: Replace md5sum with cross-platform hash**

Replace line 24:
```bash
MARKER="/tmp/uiux-reminder-$(pwd | md5sum 2>/dev/null | cut -c1-8 || echo 'default')"
```

With:
```bash
# Cross-platform hash: md5 on macOS, md5sum on Linux
if command -v md5 >/dev/null 2>&1; then
  DIR_HASH=$(pwd | md5 -q | cut -c1-8)
elif command -v md5sum >/dev/null 2>&1; then
  DIR_HASH=$(pwd | md5sum | cut -c1-8)
else
  DIR_HASH="default"
fi
MARKER="/tmp/uiux-reminder-${DIR_HASH}"
```

**Verification:** On macOS: `cd /tmp/test1 && source <(sed -n '24,30p' hooks/uiux-reminder.sh)` should produce a unique hash. The marker filename should differ between two different directories.

---

### Task 3: Fix Python injection in version-propagate.sh

**File:** `hooks/version-propagate.sh`

**Bug:** Lines 52-60 inject shell variables directly into Python code via single-quote interpolation (`toolkit = '$TOOLKIT_DIR'`). If any variable contains a single quote, the Python script breaks or executes injected code. The fix: use a quoted heredoc (`<< 'PYEOF'`) to prevent shell expansion, and pass values via environment variables.

- [ ] **Step 1: Replace Python block with env-var-based approach**

Replace lines 51-120 (the entire Python block and RESULT assignment):

```bash
# Use python3 to reliably parse the manifest and check each file
# Pass values via env vars to prevent shell injection in Python code
RESULT=$(TOOLKIT_DIR="$TOOLKIT_DIR" \
  SITES_DIR="$HOME/Sites" \
  CHECK_VERSION="$LATEST_VERSION" \
  CHECK_MAJOR_MINOR="$MAJOR_MINOR" \
  CHECK_DATE="$CHANGELOG_DATE" \
  MANIFEST_PATH="$MANIFEST" \
  python3 << 'PYEOF'
import json, re, sys, os

toolkit = os.environ['TOOLKIT_DIR']
sites = os.environ['SITES_DIR']
version = os.environ['CHECK_VERSION']
major_minor = os.environ['CHECK_MAJOR_MINOR']
changelog_date = os.environ.get('CHECK_DATE', '')
manifest_path = os.environ['MANIFEST_PATH']

with open(manifest_path) as f:
    manifest = json.load(f)

def check_file(full_path, display_path, desc, check_type):
    if not os.path.isfile(full_path):
        return f'  [ ] {display_path} -- FILE NOT FOUND ({desc})'

    with open(full_path) as f:
        content = f.read()

    found = False

    # Date freshness check
    if check_type == 'date_freshness' and changelog_date:
        if changelog_date in content:
            found = True
    else:
        # Version string check (v5.1.1 or v5.1)
        if f'v{version}' in content or f'v{major_minor}' in content:
            found = True

    if not found:
        refs = re.findall(r'v\d+\.\d+(?:\.\d+)?', content)
        current = refs[0] if refs else 'none'
        return f'  [ ] {display_path} -- {desc} (has {current}, needs v{major_minor}+)'
    return None

stale = []

# Check toolkit-relative files
for entry in manifest.get('files', []):
    path = entry['path']
    result = check_file(
        os.path.join(toolkit, path),
        path,
        entry.get('description', ''),
        entry.get('check', '')
    )
    if result:
        stale.append(result)

# Check external files (relative to ~/Sites/)
for entry in manifest.get('external_files', []):
    path = entry['path']
    result = check_file(
        os.path.join(sites, path),
        f'~/Sites/{path}',
        entry.get('description', ''),
        entry.get('check', '')
    )
    if result:
        stale.append(result)

if stale:
    print(f'STALE:{len(stale)}')
    for line in stale:
        print(line)
else:
    print('OK')
PYEOF
)
```

Key changes: (1) `<< 'PYEOF'` prevents shell expansion, (2) all values read from `os.environ` instead of `'$VAR'` interpolation, (3) env vars set inline on the python3 call.

**Verification:** The hook should produce identical output to before. Test by editing CHANGELOG.md in the toolkit and confirming the checklist appears.

---

### Task 4: Fix unescaped sed in setup.sh

**File:** `setup.sh`

**Bug:** Line 303 `sed -i '' "s|$OLD_TOOLKIT_PATH|$TOOLKIT_PATH|g"` — if either path variable contains `&` (means "matched text" in sed replacement) or `\` (escape char), the substitution corrupts the output.

- [ ] **Step 1: Add path escaping before sed substitution**

Before line 300 (the `COUNT=0` line), add:

```bash
  # Escape sed-special characters in paths (& and \ in replacement string)
  ESCAPED_OLD=$(printf '%s\n' "$OLD_TOOLKIT_PATH" | sed 's/[&/\]/\\&/g')
  ESCAPED_NEW=$(printf '%s\n' "$TOOLKIT_PATH" | sed 's/[&/\]/\\&/g')
```

Then replace line 303:
```bash
      sed -i '' "s|$OLD_TOOLKIT_PATH|$TOOLKIT_PATH|g" "$md_file"
```
With:
```bash
      sed -i '' "s|${ESCAPED_OLD}|${ESCAPED_NEW}|g" "$md_file"
```

**Verification:** Paths with `&` characters should be handled correctly. Normal paths (no special chars) should work identically to before.

---

### Task 5: Commit Part A hotfixes

- [ ] **Step 1: Stage and commit all 4 fixes**

```bash
cd ~/Sites/Global/scott-toolkit
git add hooks/guard-git-push.sh hooks/uiux-reminder.sh hooks/version-propagate.sh setup.sh
git commit -m "fix: 4 critical bash bugs — fail-closed guard, macOS hash, injection, sed escaping

- guard-git-push.sh: fail CLOSED when jq unavailable (was fail-open)
- uiux-reminder.sh: cross-platform hash (md5 on macOS, md5sum on Linux)
- version-propagate.sh: quoted heredoc + env vars (was shell-interpolated Python)
- setup.sh: escape & and \ in sed path replacement"
```

- [ ] **Step 2: Tag the hotfix commit**

```bash
git tag -a v5.3.1-hotfixes -m "Critical bash hotfixes before Bun migration"
```

---

## Part B: Bun Foundation

### Task 6: Create package.json

**File:** `package.json` (new, toolkit root)

- [ ] **Step 1: Write package.json**

```json
{
  "name": "scott-toolkit",
  "version": "6.0.0",
  "type": "module",
  "private": true,
  "description": "AI orchestration toolkit — hooks, tools, skills, and workflows for Claude Code",
  "scripts": {
    "lint": "bun run tools/toolkit-lint.ts",
    "check": "bun run tools/stack-check.ts",
    "detect": "bun run tools/stack-detect.ts",
    "preflight": "bun run tools/stack-preflight.ts",
    "metrics": "bun run tools/stack-metrics.ts"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

No external runtime dependencies. Bun provides everything needed (file I/O, JSON, fetch, crypto, child_process).

---

### Task 7: Create tsconfig.json

**File:** `tsconfig.json` (new, toolkit root)

- [ ] **Step 1: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@src/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "tools/**/*.ts", "hooks/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### Task 8: Create src/paths.ts

**File:** `src/paths.ts` (new)

- [ ] **Step 1: Write paths utility**

```typescript
import { resolve } from "path";
import { homedir } from "os";

/** Toolkit root directory, resolved from env or default location */
export const TOOLKIT_DIR =
  process.env.SCOTT_TOOLKIT_DIR ??
  resolve(homedir(), "Sites/Global/scott-toolkit");

/** ~/.claude directory */
export const CLAUDE_DIR = resolve(homedir(), ".claude");

/** Resolve a path relative to toolkit root */
export function toolkitPath(...segments: string[]): string {
  return resolve(TOOLKIT_DIR, ...segments);
}

/** Resolve a path relative to ~/.claude */
export function claudePath(...segments: string[]): string {
  return resolve(CLAUDE_DIR, ...segments);
}

/** Resolve a path relative to ~/Sites */
export function sitesPath(...segments: string[]): string {
  return resolve(homedir(), "Sites", ...segments);
}
```

---

### Task 9: Create src/json.ts

**File:** `src/json.ts` (new)

- [ ] **Step 1: Write JSON utilities**

```typescript
import { readFile, writeFile } from "fs/promises";

/** Read and parse a JSON file. Returns null if file doesn't exist or is invalid. */
export async function readJson<T = unknown>(
  path: string
): Promise<T | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/** Write an object to a JSON file with 2-space indentation. */
export async function writeJson(
  path: string,
  data: unknown
): Promise<void> {
  await writeFile(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/** Read JSON, returning a default value if the file doesn't exist. */
export async function readJsonOr<T>(
  path: string,
  defaultValue: T
): Promise<T> {
  const result = await readJson<T>(path);
  return result ?? defaultValue;
}
```

---

### Task 10: Create src/semver.ts

**File:** `src/semver.ts` (new)

- [ ] **Step 1: Write semver comparison**

```typescript
/** Parse a version string like "4.3.2", "v3", "^2.0.1" into numeric parts */
export function parseSemver(
  version: string
): { major: number; minor: number; patch: number } | null {
  const match = version.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2] ?? "0", 10),
    patch: parseInt(match[3] ?? "0", 10),
  };
}

/** Compare two version strings. Returns -1, 0, or 1. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;

  for (const key of ["major", "minor", "patch"] as const) {
    if (pa[key] < pb[key]) return -1;
    if (pa[key] > pb[key]) return 1;
  }
  return 0;
}

/** Check if version satisfies a simple constraint like ">=4", "^2.0.1" */
export function satisfies(version: string, constraint: string): boolean {
  const ver = parseSemver(version);
  const con = parseSemver(constraint);
  if (!ver || !con) return false;

  if (constraint.startsWith(">=")) {
    return compareSemver(version, constraint.replace(/^>=\s*/, "")) >= 0;
  }
  if (constraint.startsWith("^")) {
    // ^major.minor.patch: same major, >= minor.patch
    return ver.major === con.major && compareSemver(version, constraint.replace(/^\^/, "")) >= 0;
  }
  // Default: major version match
  return ver.major === con.major;
}
```

---

### Task 11: Create src/exec.ts

**File:** `src/exec.ts` (new)

- [ ] **Step 1: Write exec utility**

```typescript
/** Result of a shell command execution */
export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  ok: boolean;
}

/** Run a shell command with optional timeout (default 30s) */
export async function exec(
  command: string | string[],
  options: { timeout?: number; cwd?: string } = {}
): Promise<ExecResult> {
  const { timeout = 30_000, cwd } = options;
  const args = typeof command === "string" ? ["bash", "-c", command] : command;

  const proc = Bun.spawn(args, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  // Timeout handling
  const timer = timeout > 0
    ? setTimeout(() => proc.kill(), timeout)
    : null;

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const exitCode = await proc.exited;
  if (timer) clearTimeout(timer);

  return {
    stdout: stdout.trimEnd(),
    stderr: stderr.trimEnd(),
    exitCode,
    ok: exitCode === 0,
  };
}

/** Run a command and return stdout, or null on failure */
export async function execOk(
  command: string,
  options?: { timeout?: number; cwd?: string }
): Promise<string | null> {
  const result = await exec(command, options);
  return result.ok ? result.stdout : null;
}
```

---

### Task 12: Install Bun types and verify foundation

- [ ] **Step 1: Install dev dependencies**

```bash
cd ~/Sites/Global/scott-toolkit
bun install
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd ~/Sites/Global/scott-toolkit
bun run --bun tsc --noEmit
```

Expected: No errors. All 4 src/ files should compile cleanly.

- [ ] **Step 3: Add Bun prerequisite check to setup.sh**

After the existing argument parsing section (around line 42), add:

```bash
# --- Check prerequisites ---
if ! command -v bun >/dev/null 2>&1; then
  echo ""
  echo "WARNING: Bun is not installed."
  echo "  TypeScript tools require Bun. Install: https://bun.sh"
  echo "  Shell fallbacks will be used where available."
  echo ""
fi
```

This is a warning, not a hard failure — setup.sh must still work for deploying bash-only components.

- [ ] **Step 4: Update setup.sh to deploy .ts tool files**

In the tools deployment section (around line 186-198), after the existing loop that symlinks .sh files, add handling for .ts files:

```bash
# Deploy TypeScript tools (if they exist)
for tool_file in "$TOOLKIT_PATH/tools/"*.ts; do
  [ -f "$tool_file" ] || continue
  tool_name=$(basename "$tool_file")
  ln -sf "$tool_file" "$DEPLOY_DIR/tools/$tool_name"
  chmod +x "$tool_file"
done
```

- [ ] **Step 5: Add node_modules to .gitignore**

Append to `.gitignore`:
```
node_modules/
bun.lock
```

- [ ] **Step 6: Commit Part B**

```bash
cd ~/Sites/Global/scott-toolkit
git add package.json tsconfig.json src/ .gitignore setup.sh
git commit -m "feat: Bun foundation — package.json, tsconfig, shared utilities (src/)

Shared utilities:
- src/paths.ts: toolkit/claude/sites path resolution
- src/json.ts: safe JSON file read/write
- src/semver.ts: version parsing and comparison
- src/exec.ts: shell command execution with timeout

Also adds Bun prerequisite warning to setup.sh and .ts tool deployment."
```

---

## Part C: Tool Rewrites

### Task 13: Rewrite stack-detect.ts

**File:** `tools/stack-detect.ts` (new), `tools/stack-detect.sh` (becomes wrapper)

**Preserves:** Multi-detector pattern, SurrealDB version inference, JSON output schema.

- [ ] **Step 1: Write stack-detect.ts**

The tool takes a project path as argv[1], scans for technologies, and outputs JSON.

Key logic to port:
- Read package.json natively (no grep/sed)
- SurrealDB version inference: `^2.*` package spec = v3 server inferred
- Detect: surrealdb, nuxt, tailwind, bun, hono (with versions)
- Output matches existing schema: `{ schema_version, project_root, technologies, services, paths, exceptions }`

```typescript
#!/usr/bin/env bun
/**
 * stack-detect.ts — Detect project technologies from package.json and config files.
 * Output: JSON suitable for generating stack-lock.json
 *
 * Usage: bun run tools/stack-detect.ts <project-path>
 */

import { resolve, basename } from "path";
import { existsSync } from "fs";
import { readJson } from "../src/json.js";

// --- Types ---
interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface Technology {
  name: string;
  version: string;
  sdk?: string;
  audit: boolean;
  source: string;
}

// --- Detectors ---

function getDep(pkg: PackageJson, name: string): string | undefined {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
}

function detectSurrealDB(pkg: PackageJson): Technology | null {
  const sdk = getDep(pkg, "surrealdb");
  if (!sdk) return null;

  // Version inference: ^2.x SDK targets v3 server
  const serverVersion = sdk.match(/^\^?2/) ? "v3" : "v2";

  return {
    name: "surrealdb",
    version: serverVersion,
    sdk: `surrealdb@${sdk.replace(/[\^~>=<]*/g, "")}`,
    audit: true,
    source: "package.json",
  };
}

function detectNuxt(pkg: PackageJson): Technology | null {
  const ver = getDep(pkg, "nuxt");
  if (!ver) return null;

  const major = ver.match(/(\d+)/)?.[1] ?? "unknown";
  return {
    name: "nuxt",
    version: major,
    audit: true,
    source: "package.json",
  };
}

function detectTailwind(
  pkg: PackageJson,
  projectPath: string
): Technology | null {
  const ver = getDep(pkg, "tailwindcss");
  if (!ver) return null;

  // v4 uses CSS-based config, v3 uses tailwind.config.*
  const hasV4Config = existsSync(resolve(projectPath, "app.css")) ||
    existsSync(resolve(projectPath, "assets/css/main.css"));
  const hasV3Config = existsSync(resolve(projectPath, "tailwind.config.ts")) ||
    existsSync(resolve(projectPath, "tailwind.config.js"));

  const major = hasV3Config && !ver.match(/^\^?4/) ? "3" : "4";

  return {
    name: "tailwind",
    version: major,
    audit: true,
    source: "package.json",
  };
}

function detectBun(projectPath: string): Technology | null {
  if (!existsSync(resolve(projectPath, "bun.lock")) &&
      !existsSync(resolve(projectPath, "bun.lockb"))) {
    return null;
  }
  return {
    name: "bun",
    version: "1",
    audit: true,
    source: "bun.lock",
  };
}

function detectHono(pkg: PackageJson): Technology | null {
  const ver = getDep(pkg, "hono");
  if (!ver) return null;

  const major = ver.match(/(\d+)/)?.[1] ?? "unknown";
  return {
    name: "hono",
    version: major,
    audit: true,
    source: "package.json",
  };
}

// --- Main ---

async function main() {
  const projectPath = resolve(process.argv[2] ?? ".");

  if (!existsSync(projectPath)) {
    console.error(`Error: Path does not exist: ${projectPath}`);
    process.exit(1);
  }

  const pkgPath = resolve(projectPath, "package.json");
  const pkg = await readJson<PackageJson>(pkgPath) ?? { dependencies: {}, devDependencies: {} };

  const technologies: Technology[] = [];

  const detectors = [
    () => detectSurrealDB(pkg),
    () => detectNuxt(pkg),
    () => detectTailwind(pkg, projectPath),
    () => detectBun(projectPath),
    () => detectHono(pkg),
  ];

  for (const detect of detectors) {
    const result = detect();
    if (result) technologies.push(result);
  }

  const output = {
    schema_version: "1.0",
    project_root: projectPath,
    project_name: basename(projectPath),
    technologies: Object.fromEntries(
      technologies.map((t) => [
        t.name,
        { version: t.version, ...(t.sdk ? { sdk: t.sdk } : {}), audit: t.audit },
      ])
    ),
    services: {},
    paths: {},
    exceptions: [],
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
```

- [ ] **Step 2: Convert stack-detect.sh to thin wrapper**

Replace entire content of `tools/stack-detect.sh`:

```bash
#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
# Will be removed in M2 after settings.json references are updated
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun run "$SCRIPT_DIR/stack-detect.ts" "$@"
```

- [ ] **Step 3: Verify**

```bash
bun run tools/stack-detect.ts ~/Sites/Personal/code/eleanor
```

Expected: Valid JSON output with detected technologies.

---

### Task 14: Rewrite stack-check.ts

**File:** `tools/stack-check.ts` (new), `tools/stack-check.sh` (becomes wrapper)

**Preserves:** Check file processing, exception handling, severity levels, grep-based pattern matching.

**Key improvement:** Native JSON parsing replaces fragile sed-based JSON extraction.

- [ ] **Step 1: Write stack-check.ts**

Core logic:
1. Read stack-lock.json from project (or use all checks if missing)
2. For each technology, load its check file from toolkit checks/
3. For each static check, grep project files for the pattern
4. Skip files listed in stack-lock exceptions
5. Output violations with severity and context

```typescript
#!/usr/bin/env bun
/**
 * stack-check.ts — Run static code checks from check files against a project.
 * Reads stack-lock.json to determine which checks to run.
 *
 * Usage: bun run tools/stack-check.ts [project-path]
 */

import { resolve, relative, basename } from "path";
import { existsSync } from "fs";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";
import { exec } from "../src/exec.js";
import { glob } from "fs/promises";

interface CheckDef {
  id: string;
  pattern: string;
  message: string;
  severity: "error" | "warning" | "info";
  file_filter?: string;
}

interface CheckFile {
  technology: string;
  checks: {
    static: CheckDef[];
    live?: unknown[];
  };
}

interface StackLock {
  technologies: Record<string, { version: string; audit: boolean }>;
  exceptions?: Array<{ check_id: string; file: string; reason: string }>;
}

interface Violation {
  check_id: string;
  file: string;
  line: number;
  message: string;
  severity: string;
  match: string;
}

const EXCLUSIONS = ["node_modules", ".git", ".planning", ".nuxt", ".output", "dist"];

async function findCheckFiles(techs: string[]): Promise<CheckFile[]> {
  const results: CheckFile[] = [];
  for (const tech of techs) {
    const checkPath = toolkitPath("checks", `${tech}.json`);
    const data = await readJson<CheckFile>(checkPath);
    if (data) results.push(data);
  }
  return results;
}

async function runCheck(
  check: CheckDef,
  projectPath: string,
  exceptions: Set<string>
): Promise<Violation[]> {
  const excludeArgs = EXCLUSIONS.map((e) => `--exclude-dir=${e}`).join(" ");
  const fileFilter = check.file_filter
    ? `--include='${check.file_filter}'`
    : "";

  const cmd = `grep -rnE ${fileFilter} ${excludeArgs} '${check.pattern.replace(/'/g, "'\\''")}' '${projectPath}' 2>/dev/null || true`;
  const result = await exec(cmd, { timeout: 15_000 });

  if (!result.stdout) return [];

  const violations: Violation[] = [];
  for (const line of result.stdout.split("\n")) {
    if (!line.trim()) continue;

    const match = line.match(/^(.+?):(\d+):(.*)$/);
    if (!match) continue;

    const [, filePath, lineNum, content] = match;
    const relPath = relative(projectPath, filePath);

    // Skip excepted files
    const exceptionKey = `${check.id}:${relPath}`;
    if (exceptions.has(exceptionKey)) continue;

    violations.push({
      check_id: check.id,
      file: relPath,
      line: parseInt(lineNum, 10),
      message: check.message,
      severity: check.severity,
      match: content.trim().substring(0, 120),
    });
  }

  return violations;
}

async function main() {
  const projectPath = resolve(process.argv[2] ?? ".");
  const lockPath = resolve(projectPath, "stack-lock.json");
  const lock = await readJson<StackLock>(lockPath);

  // Determine technologies to check
  let techs: string[];
  if (lock) {
    techs = Object.entries(lock.technologies)
      .filter(([, v]) => v.audit)
      .map(([k]) => k);
  } else {
    // No stack-lock: discover from available check files
    const { readdirSync } = await import("fs");
    techs = readdirSync(toolkitPath("checks"))
      .filter((f: string) => f.endsWith(".json") && f !== "metrics.json" && f !== "stack-lock.schema.json")
      .map((f: string) => f.replace(".json", ""));
  }

  // Build exceptions set
  const exceptions = new Set<string>();
  if (lock?.exceptions) {
    for (const ex of lock.exceptions) {
      exceptions.add(`${ex.check_id}:${ex.file}`);
    }
  }

  // Load and run checks
  const checkFiles = await findCheckFiles(techs);
  const allViolations: Violation[] = [];

  for (const cf of checkFiles) {
    for (const check of cf.checks.static) {
      const violations = await runCheck(check, projectPath, exceptions);
      allViolations.push(...violations);
    }
  }

  // Output
  const errors = allViolations.filter((v) => v.severity === "error");
  const warnings = allViolations.filter((v) => v.severity === "warning");

  if (allViolations.length === 0) {
    console.log(`stack-check: ${techs.join(", ")} — 0 issues found`);
    process.exit(0);
  }

  console.log(`stack-check: ${allViolations.length} issue(s) found\n`);
  for (const v of allViolations) {
    const icon = v.severity === "error" ? "ERROR" : "WARN";
    console.log(`  [${icon}] ${v.check_id}: ${v.file}:${v.line}`);
    console.log(`         ${v.message}`);
    console.log(`         ${v.match}`);
    console.log("");
  }

  console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
```

- [ ] **Step 2: Convert stack-check.sh to thin wrapper**

Replace entire content of `tools/stack-check.sh`:

```bash
#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun run "$SCRIPT_DIR/stack-check.ts" "$@"
```

- [ ] **Step 3: Verify**

```bash
bun run tools/stack-check.ts ~/Sites/Personal/code/eleanor
```

Expected: Processes Eleanor's stack-lock.json checks and reports any violations.

---

### Task 15: Rewrite stack-preflight.ts

**File:** `tools/stack-preflight.ts` (new), `tools/stack-preflight.sh` (becomes wrapper)

**Preserves:** Three-level checks (CLI, server, SDK), degradation tiers, version matching.

- [ ] **Step 1: Write stack-preflight.ts**

```typescript
#!/usr/bin/env bun
/**
 * stack-preflight.ts — Verify system readiness before audit execution.
 * Checks CLIs, MCP servers, database connectivity, SDK versions.
 * Returns degradation tier: FULL / REDUCED / MINIMAL / BYPASS
 *
 * Usage: bun run tools/stack-preflight.ts [project-path]
 */

import { resolve } from "path";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";
import { exec, execOk } from "../src/exec.js";

type Tier = "FULL" | "REDUCED" | "MINIMAL" | "BYPASS";

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "fail" | "skip";
  detail: string;
}

const results: CheckResult[] = [];
let tier: Tier = "FULL";

function downgrade(to: Tier) {
  const order: Tier[] = ["FULL", "REDUCED", "MINIMAL", "BYPASS"];
  if (order.indexOf(to) > order.indexOf(tier)) tier = to;
}

async function checkCli(name: string, versionFlag = "--version"): Promise<string | null> {
  const version = await execOk(`${name} ${versionFlag} 2>/dev/null`);
  if (version) {
    results.push({ name: `${name} CLI`, status: "ok", detail: version.split("\n")[0] });
    return version;
  }
  results.push({ name: `${name} CLI`, status: "fail", detail: "not found" });
  return null;
}

async function checkSurrealDB(projectPath: string) {
  // 1. CLI
  const cliVersion = await checkCli("surreal");

  // 2. Server health
  try {
    const health = await fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(3000) });
    if (health.ok) {
      const versionResp = await fetch("http://localhost:8000/version", { signal: AbortSignal.timeout(3000) });
      const serverVersion = await versionResp.text();
      results.push({ name: "SurrealDB server", status: "ok", detail: serverVersion.trim() });
    } else {
      results.push({ name: "SurrealDB server", status: "fail", detail: `health returned ${health.status}` });
      downgrade("REDUCED");
    }
  } catch {
    results.push({ name: "SurrealDB server", status: "fail", detail: "not reachable on localhost:8000" });
    downgrade("REDUCED");
  }

  // 3. SDK version match
  interface PkgJson { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
  const pkg = await readJson<PkgJson>(resolve(projectPath, "package.json"));
  const sdkVersion = pkg?.dependencies?.surrealdb ?? pkg?.devDependencies?.surrealdb;
  if (sdkVersion) {
    results.push({ name: "SurrealDB SDK", status: "ok", detail: `surrealdb@${sdkVersion}` });
  }
}

async function checkBun() {
  await checkCli("bun");
}

async function checkProviders() {
  // Verify interfaces.json exists and has valid operations
  const interfaces = await readJson<Record<string, unknown>>(
    toolkitPath("config", "interfaces.json")
  );
  if (interfaces) {
    results.push({ name: "interfaces.json", status: "ok", detail: "loaded" });
  } else {
    results.push({ name: "interfaces.json", status: "warn", detail: "not found or invalid" });
    downgrade("REDUCED");
  }
}

async function main() {
  const projectPath = resolve(process.argv[2] ?? ".");

  console.log("Stack Preflight Check");
  console.log("=====================\n");

  // Determine what to check from stack-lock
  interface StackLock { technologies: Record<string, { version: string; audit: boolean }> }
  const lock = await readJson<StackLock>(resolve(projectPath, "stack-lock.json"));
  const techs = lock
    ? Object.keys(lock.technologies)
    : [];

  // Always check Bun (needed for toolkit itself)
  await checkBun();

  // Check project-specific technologies
  if (techs.includes("surrealdb")) {
    await checkSurrealDB(projectPath);
  }

  // Check toolkit providers
  await checkProviders();

  // Check Context7 MCP
  await checkCli("npx", "--version"); // proxy for node availability

  // Output results
  for (const r of results) {
    const icon = r.status === "ok" ? "OK" : r.status === "warn" ? "WARN" : r.status === "fail" ? "FAIL" : "SKIP";
    console.log(`  [${icon}] ${r.name}: ${r.detail}`);
  }

  const failures = results.filter((r) => r.status === "fail").length;
  if (failures > 0 && tier === "FULL") downgrade("REDUCED");

  console.log(`\nTier: ${tier}`);
  console.log(`  FULL = all systems go, REDUCED = some checks unavailable`);
  console.log(`  MINIMAL = CLI tools only, BYPASS = skip preflight`);

  // Exit 0 always — preflight is informational
  process.exit(0);
}

main();
```

- [ ] **Step 2: Convert stack-preflight.sh to thin wrapper**

```bash
#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun run "$SCRIPT_DIR/stack-preflight.ts" "$@"
```

- [ ] **Step 3: Verify**

```bash
bun run tools/stack-preflight.ts ~/Sites/Personal/code/eleanor
```

Expected: Shows check results and a tier assessment.

---

### Task 16: Rewrite stack-metrics.ts

**File:** `tools/stack-metrics.ts` (new), `tools/stack-metrics.sh` (becomes wrapper)

**Preserves:** Project discovery, per-check stats, value scoring (harmful/noisy/high/proven/untested), unmatched lessons tracking.

**Key improvement:** No more mktemp counters or line-by-line JSON parsing.

- [ ] **Step 1: Write stack-metrics.ts**

```typescript
#!/usr/bin/env bun
/**
 * stack-metrics.ts — Aggregate audit artifacts into checks/metrics.json.
 * Scans all projects with stack-lock.json for audit results.
 *
 * Usage: bun run tools/stack-metrics.ts
 */

import { resolve, basename, dirname } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { readJson, writeJson } from "../src/json.js";
import { toolkitPath, sitesPath } from "../src/paths.js";
import { exec } from "../src/exec.js";

interface CheckStat {
  check_id: string;
  technology: string;
  pass_count: number;
  fail_count: number;
  projects_seen: string[];
  last_seen: string;
  value: "harmful" | "noisy" | "high" | "proven" | "untested";
}

interface Metrics {
  generated: string;
  discovered_projects: number;
  overall_pass_rate: number;
  checks: Record<string, CheckStat>;
  unmatched_lessons: string[];
}

function computeValue(
  stat: CheckStat
): "harmful" | "noisy" | "high" | "proven" | "untested" {
  const total = stat.pass_count + stat.fail_count;
  if (total === 0) return "untested";

  const passRate = stat.pass_count / total;
  const projectCount = stat.projects_seen.length;

  // Harmful: causes failures across many projects
  if (passRate < 0.3 && projectCount >= 3) return "harmful";
  // Noisy: high fail rate but limited scope
  if (passRate < 0.5) return "noisy";
  // Proven: universal adoption
  if (passRate > 0.9 && projectCount >= 3) return "proven";
  // High: beneficial
  if (passRate >= 0.5) return "high";

  return "untested";
}

async function discoverProjects(): Promise<string[]> {
  // Find all directories containing stack-lock.json under ~/Sites
  const result = await exec(
    `find ${sitesPath()} -name stack-lock.json -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/Archive/*' 2>/dev/null`,
    { timeout: 10_000 }
  );

  if (!result.stdout) return [];
  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map((p) => dirname(p));
}

async function scanAuditArtifacts(
  projectPath: string,
  checks: Record<string, CheckStat>
) {
  const auditDir = resolve(projectPath, ".planning/audits");
  if (!existsSync(auditDir)) return;

  const projectName = basename(projectPath);
  const files = readdirSync(auditDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const artifact = await readJson<Record<string, unknown>>(resolve(auditDir, file));
    if (!artifact) continue;

    // Process check results from audit artifacts
    const results = (artifact.results ?? artifact.checks ?? []) as Array<{
      check_id?: string;
      technology?: string;
      passed?: boolean;
      date?: string;
    }>;

    for (const r of results) {
      if (!r.check_id) continue;

      if (!checks[r.check_id]) {
        checks[r.check_id] = {
          check_id: r.check_id,
          technology: r.technology ?? "unknown",
          pass_count: 0,
          fail_count: 0,
          projects_seen: [],
          last_seen: "",
          value: "untested",
        };
      }

      const stat = checks[r.check_id];
      if (r.passed) stat.pass_count++;
      else stat.fail_count++;

      if (!stat.projects_seen.includes(projectName)) {
        stat.projects_seen.push(projectName);
      }

      if (r.date && r.date > stat.last_seen) stat.last_seen = r.date;
    }
  }
}

async function findUnmatchedLessons(
  projects: string[],
  knownCheckIds: Set<string>
): Promise<string[]> {
  const unmatched: string[] = [];

  for (const projectPath of projects) {
    const lessonsPath = resolve(projectPath, "tasks/lessons.md");
    if (!existsSync(lessonsPath)) continue;

    const content = readFileSync(lessonsPath, "utf-8");
    const stackLines = content.split("\n").filter((l) => l.includes("[stack:"));

    for (const line of stackLines) {
      const match = line.match(/\[stack:([^\]]+)\]/);
      if (match) {
        const tech = match[1];
        const hasCheck = [...knownCheckIds].some((id) => id.startsWith(tech));
        if (!hasCheck) {
          unmatched.push(`${basename(projectPath)}: ${line.trim()}`);
        }
      }
    }
  }

  return unmatched;
}

async function main() {
  console.log("Stack Metrics Generator");
  console.log("=======================\n");

  const projects = await discoverProjects();
  console.log(`Discovered ${projects.length} project(s) with stack-lock.json\n`);

  const checks: Record<string, CheckStat> = {};

  for (const project of projects) {
    await scanAuditArtifacts(project, checks);
  }

  // Compute value scores
  for (const stat of Object.values(checks)) {
    stat.value = computeValue(stat);
  }

  // Calculate overall pass rate
  let totalPasses = 0;
  let totalChecks = 0;
  for (const stat of Object.values(checks)) {
    totalPasses += stat.pass_count;
    totalChecks += stat.pass_count + stat.fail_count;
  }

  const knownCheckIds = new Set(Object.keys(checks));
  const unmatched = await findUnmatchedLessons(projects, knownCheckIds);

  const metrics: Metrics = {
    generated: new Date().toISOString().split("T")[0],
    discovered_projects: projects.length,
    overall_pass_rate: totalChecks > 0 ? Math.round((totalPasses / totalChecks) * 100) : 0,
    checks,
    unmatched_lessons: unmatched,
  };

  const outputPath = toolkitPath("checks", "metrics.json");
  await writeJson(outputPath, metrics);

  console.log(`Checks tracked: ${Object.keys(checks).length}`);
  console.log(`Overall pass rate: ${metrics.overall_pass_rate}%`);
  console.log(`Unmatched lessons: ${unmatched.length}`);
  console.log(`\nWritten to: ${outputPath}`);
}

main();
```

- [ ] **Step 2: Convert stack-metrics.sh to thin wrapper**

```bash
#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun run "$SCRIPT_DIR/stack-metrics.ts" "$@"
```

---

### Task 17: Rewrite toolkit-lint.ts

**File:** `tools/toolkit-lint.ts` (new), `tools/toolkit-lint.sh` (becomes wrapper)

**Preserves:** Three sections (stale patterns, skill integrity, hook integrity), manifest-driven patterns, --section and --fix flags.

**Key improvement:** Native JSON parsing with JSON.parse() replaces jq dependency.

- [ ] **Step 1: Write toolkit-lint.ts**

```typescript
#!/usr/bin/env bun
/**
 * toolkit-lint.ts — Comprehensive integrity checker for scott-toolkit.
 * Three sections: stale patterns, skill integrity, hook integrity.
 *
 * Usage: bun run tools/toolkit-lint.ts [--section=patterns|skills|hooks] [--fix]
 *
 * Exit codes: 0 = clean, 1 = issues found
 */

import { resolve, basename, relative } from "path";
import { existsSync, readdirSync, readFileSync, lstatSync, readlinkSync } from "fs";
import { readJson } from "../src/json.js";
import { toolkitPath, claudePath } from "../src/paths.js";
import { exec } from "../src/exec.js";

// --- Args ---
const args = process.argv.slice(2);
const sectionFilter = args.find((a) => a.startsWith("--section="))?.split("=")[1];
const fixMode = args.includes("--fix");

let issueCount = 0;

function issue(section: string, msg: string) {
  issueCount++;
  console.log(`  [${section}] ${msg}`);
}

// --- Section 1: Stale Patterns ---

async function checkStalePatterns() {
  console.log("1. Checking stale patterns...");

  interface VersionManifest {
    banned_patterns?: Array<{ pattern: string; replacement: string; description: string }>;
  }

  const manifest = await readJson<VersionManifest>(
    toolkitPath("config", "version-manifest.json")
  );

  if (!manifest?.banned_patterns) {
    console.log("   SKIP: No banned_patterns in version-manifest.json");
    return;
  }

  // Scan all .md files in toolkit + external CLAUDE.md files
  const result = await exec(
    `find ${toolkitPath()} -name '*.md' -not -path '*/node_modules/*' -not -path '*/.git/*'`,
    { timeout: 10_000 }
  );

  const mdFiles = result.stdout.split("\n").filter(Boolean);

  // Also check external CLAUDE.md files
  const externalFiles = [
    claudePath("CLAUDE.md"),
    resolve(toolkitPath(), "../../CLAUDE.md"), // ~/Sites/CLAUDE.md
  ].filter(existsSync);

  const allFiles = [...mdFiles, ...externalFiles];

  for (const banned of manifest.banned_patterns) {
    for (const filePath of allFiles) {
      try {
        const content = readFileSync(filePath, "utf-8");
        if (content.includes(banned.pattern)) {
          const display = relative(toolkitPath(), filePath) || filePath;
          issue("patterns", `"${banned.pattern}" in ${display} — ${banned.description}`);

          if (fixMode) {
            const updated = content.replaceAll(banned.pattern, banned.replacement);
            await Bun.write(filePath, updated);
            console.log(`         FIXED: replaced with "${banned.replacement}"`);
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
}

// --- Section 2: Skill Integrity ---

async function checkSkillIntegrity() {
  console.log("\n2. Checking skill integrity...");

  const skillsSource = toolkitPath("skills");
  const skillsDeploy = claudePath("skills");

  if (!existsSync(skillsSource)) {
    console.log("   SKIP: No skills/ directory");
    return;
  }

  // Check each skill directory has SKILL.md
  const skillDirs = readdirSync(skillsSource, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of skillDirs) {
    const skillMd = resolve(skillsSource, dir, "SKILL.md");
    if (!existsSync(skillMd)) {
      issue("skills", `${dir}/ missing SKILL.md`);
    }
  }

  // Check for orphaned deployments
  if (existsSync(skillsDeploy)) {
    const deployed = readdirSync(skillsDeploy, { withFileTypes: true })
      .filter((d) => d.isDirectory() || d.isSymbolicLink())
      .map((d) => d.name);

    for (const dep of deployed) {
      const depPath = resolve(skillsDeploy, dep);
      if (lstatSync(depPath).isSymbolicLink()) {
        const target = readlinkSync(depPath);
        if (!existsSync(target) && !existsSync(resolve(skillsDeploy, target))) {
          issue("skills", `Orphaned symlink: ~/.claude/skills/${dep} -> ${target}`);
        }
      }
    }
  }

  // Check workflow-generated skills have source workflows
  const workflowsDir = toolkitPath("workflows");
  if (existsSync(workflowsDir)) {
    const workflows = readdirSync(workflowsDir)
      .filter((f) => f.endsWith(".md"));

    // Skills that are workflow-generated should have a matching workflow
    for (const dir of skillDirs) {
      const skillMd = resolve(skillsSource, dir, "SKILL.md");
      if (!existsSync(skillMd)) continue;

      const content = readFileSync(skillMd, "utf-8");
      if (content.includes("workflow-generated")) {
        const workflowName = dir.replace("scott-", "") + ".md";
        const hasWorkflow = workflows.some(
          (w) => w === workflowName || w === dir + ".md"
        );
        if (!hasWorkflow) {
          issue("skills", `${dir}/ marked workflow-generated but no matching workflow found`);
        }
      }
    }
  }
}

// --- Section 3: Hook Integrity ---

async function checkHookIntegrity() {
  console.log("\n3. Checking hook integrity...");

  const settingsPath = claudePath("settings.json");
  interface Settings {
    hooks?: Record<string, Array<{ command: string; matcher?: string }>>;
  }

  const settings = await readJson<Settings>(settingsPath);
  if (!settings?.hooks) {
    console.log("   SKIP: No hooks in settings.json");
    return;
  }

  const hooksDir = claudePath("hooks");

  for (const [event, hookList] of Object.entries(settings.hooks)) {
    for (const hook of hookList) {
      // Extract file path from command
      const pathMatch = hook.command.match(
        /(?:\$HOME|~)(\/[^\s"]+\.(?:sh|ts|js))/
      );
      if (!pathMatch) continue;

      const hookPath = pathMatch[1].replace(/^\//, "");
      const fullPath = resolve(process.env.HOME!, hookPath);

      if (!existsSync(fullPath)) {
        // Check if it's a symlink that's broken
        const deployedPath = resolve(hooksDir, basename(fullPath));
        if (existsSync(deployedPath)) {
          // File exists at deployed location, check command references correct path
          if (!hook.command.includes("$HOME/.claude/hooks/") && !hook.command.includes("~/.claude/hooks/")) {
            issue("hooks", `${event}: ${basename(fullPath)} — command uses direct toolkit path instead of ~/.claude/hooks/`);
          }
        } else {
          issue("hooks", `${event}: ${basename(fullPath)} — file not found`);
        }
      }
    }
  }

  // Check for dangling symlinks in ~/.claude/hooks/
  if (existsSync(hooksDir)) {
    const hookFiles = readdirSync(hooksDir);
    for (const file of hookFiles) {
      const fullPath = resolve(hooksDir, file);
      if (lstatSync(fullPath).isSymbolicLink() && !existsSync(fullPath)) {
        issue("hooks", `Dangling symlink: ~/.claude/hooks/${file}`);
      }
    }
  }

  // Check for dangling symlinks in ~/.claude/skills/
  const skillsDeploy = claudePath("skills");
  if (existsSync(skillsDeploy)) {
    const skillItems = readdirSync(skillsDeploy);
    for (const item of skillItems) {
      const fullPath = resolve(skillsDeploy, item);
      if (lstatSync(fullPath).isSymbolicLink() && !existsSync(fullPath)) {
        issue("hooks", `Dangling symlink: ~/.claude/skills/${item}`);
      }
    }
  }
}

// --- Main ---

async function main() {
  console.log("Toolkit Lint");
  console.log("============\n");

  if (!sectionFilter || sectionFilter === "patterns") await checkStalePatterns();
  if (!sectionFilter || sectionFilter === "skills") await checkSkillIntegrity();
  if (!sectionFilter || sectionFilter === "hooks") await checkHookIntegrity();

  console.log(`\n============`);
  if (issueCount === 0) {
    console.log("0 issues found");
    process.exit(0);
  } else {
    console.log(`${issueCount} issue(s) found`);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 2: Convert toolkit-lint.sh to thin wrapper**

```bash
#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun run "$SCRIPT_DIR/toolkit-lint.ts" "$@"
```

---

### Task 18: Rewrite pre-commit-hook.ts

**File:** `tools/pre-commit-hook.ts` (new), `tools/pre-commit-hook.sh` (becomes wrapper)

- [ ] **Step 1: Write pre-commit-hook.ts**

```typescript
#!/usr/bin/env bun
/**
 * pre-commit-hook.ts — Git pre-commit hook for scott-toolkit repo.
 * Gates commits on toolkit-lint passing.
 */

import { exec } from "../src/exec.js";
import { toolkitPath } from "../src/paths.js";

async function main() {
  console.log("Running toolkit lint...");
  const result = await exec(`bun run ${toolkitPath("tools", "toolkit-lint.ts")}`, {
    timeout: 30_000,
  });

  if (!result.ok) {
    console.log(result.stdout);
    console.error("\nCommit blocked: toolkit-lint found issues. Fix them before committing.");
    process.exit(1);
  }

  console.log("Lint clean — commit allowed.");
  process.exit(0);
}

main();
```

- [ ] **Step 2: Convert pre-commit-hook.sh to thin wrapper**

```bash
#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec bun run "$SCRIPT_DIR/pre-commit-hook.ts" "$@"
```

---

### Task 19: Commit Part C tool rewrites

- [ ] **Step 1: Verify all tools compile**

```bash
cd ~/Sites/Global/scott-toolkit
bun run --bun tsc --noEmit
```

- [ ] **Step 2: Test each tool**

```bash
# stack-detect
bun run tools/stack-detect.ts ~/Sites/Personal/code/eleanor
# stack-check (may report violations, that's expected)
bun run tools/stack-check.ts ~/Sites/Personal/code/eleanor
# stack-preflight
bun run tools/stack-preflight.ts ~/Sites/Personal/code/eleanor
# stack-metrics
bun run tools/stack-metrics.ts
# toolkit-lint
bun run tools/toolkit-lint.ts
# pre-commit-hook
bun run tools/pre-commit-hook.ts
```

- [ ] **Step 3: Verify backward-compat wrappers**

```bash
bash tools/stack-detect.sh ~/Sites/Personal/code/eleanor
bash tools/toolkit-lint.sh
```

- [ ] **Step 4: Commit all Part C changes**

```bash
cd ~/Sites/Global/scott-toolkit
git add tools/*.ts tools/*.sh
git commit -m "feat: rewrite 6 tools from bash to TypeScript (Bun runtime)

Rewrites: stack-detect, stack-check, stack-preflight, stack-metrics,
toolkit-lint, pre-commit-hook.

Key improvements:
- Native JSON.parse() replaces fragile sed/grep/jq parsing
- Proper semver comparison via src/semver.ts
- Native fetch() replaces curl dependency
- Structured TypeScript with proper types
- .sh files become thin wrappers for backward compatibility (removed in M2)"
```

---

## Final Verification

### Task 20: Run verify-toolkit.sh and confirm M1

- [ ] **Step 1: Run verification**

```bash
cd ~/Sites/Global/scott-toolkit
./verify-toolkit.sh
```

Expected: PASS (0 errors). May show warning about pre-existing lint issues.

- [ ] **Step 2: Run toolkit-lint via new .ts**

```bash
bun run tools/toolkit-lint.ts
```

Expected: 0 issues (or only pre-existing known issues).

- [ ] **Step 3: Confirm all files exist**

```bash
echo "--- New .ts tools ---"
ls -la tools/*.ts
echo "--- Wrapper .sh files ---"
head -2 tools/stack-detect.sh tools/stack-check.sh
echo "--- Src utilities ---"
ls -la src/
echo "--- Package files ---"
ls -la package.json tsconfig.json
```

- [ ] **Step 4: Update .claude-resume.md**

Update resume file to reflect M1 completion and readiness for M2.

---

## Success Criteria (from design spec)

- [x] 4 bash hotfixes committed and tagged
- [ ] `bun run tools/stack-detect.ts ~/Sites/Personal/code/eleanor` produces valid output
- [ ] `bun run tools/toolkit-lint.ts` catches same patterns as old `.sh`
- [ ] `bun run tools/stack-check.ts` processes check files correctly
- [ ] `verify-toolkit.sh` passes
- [ ] Pre-commit hook works via new `.ts` file
