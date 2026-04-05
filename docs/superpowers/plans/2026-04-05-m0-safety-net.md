# M0: Safety Net — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a complete rollback path before any audit remediation work begins.

**Architecture:** Git tag snapshots the codebase, backup script copies settings files, restore script can revert everything to pre-audit state, verify script confirms toolkit health after each milestone.

**Tech Stack:** Bash (restore and verify scripts stay bash since they must work before Bun is available)

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `restore-v5.3.sh` | One-command rollback to pre-audit state |
| Create | `verify-toolkit.sh` | Post-milestone health check |
| Create | `backups/settings-v5.3/settings.json` | Backup of current settings |
| Create | `backups/settings-v5.3/settings.local.json` | Backup of current local settings |

---

### Task 1: Git Tag the Current State

**Files:**
- None (git operations only)

- [ ] **Step 1: Create annotated tag**

```bash
cd ~/Sites/Global/scott-toolkit
git tag -a v5.3-pre-audit -m "Pre-audit snapshot: last known working state before audit remediation (v5.3 -> v6.0)"
```

- [ ] **Step 2: Push tag to origin**

```bash
cd ~/Sites/Global/scott-toolkit
git push origin v5.3-pre-audit
```

Expected: Tag `v5.3-pre-audit` visible on GitHub.

- [ ] **Step 3: Verify tag exists**

```bash
cd ~/Sites/Global/scott-toolkit
git tag -l 'v5.3-pre-audit'
```

Expected output: `v5.3-pre-audit`

---

### Task 2: Backup Settings Files

**Files:**
- Create: `backups/settings-v5.3/settings.json`
- Create: `backups/settings-v5.3/settings.local.json`

- [ ] **Step 1: Create backup directory**

```bash
mkdir -p ~/Sites/Global/scott-toolkit/backups/settings-v5.3
```

- [ ] **Step 2: Copy settings files**

```bash
cp ~/.claude/settings.json ~/Sites/Global/scott-toolkit/backups/settings-v5.3/settings.json
cp ~/.claude/settings.local.json ~/Sites/Global/scott-toolkit/backups/settings-v5.3/settings.local.json
```

- [ ] **Step 3: Verify copies are identical**

```bash
diff ~/.claude/settings.json ~/Sites/Global/scott-toolkit/backups/settings-v5.3/settings.json && echo "settings.json: OK"
diff ~/.claude/settings.local.json ~/Sites/Global/scott-toolkit/backups/settings-v5.3/settings.local.json && echo "settings.local.json: OK"
```

Expected: Both print "OK" with no diff output.

- [ ] **Step 4: Add backups to .gitignore**

Append to `~/Sites/Global/scott-toolkit/.gitignore`:

```
# Settings backups (machine-specific, not portable)
backups/
```

- [ ] **Step 5: Commit backup directory structure**

```bash
cd ~/Sites/Global/scott-toolkit
git add .gitignore
git commit -m "chore: add backups/ to .gitignore for audit remediation settings snapshots"
```

Note: The actual backup files won't be committed (gitignored). The directory and .gitignore entry are committed so the pattern is documented.

---

### Task 3: Create restore-v5.3.sh

**Files:**
- Create: `restore-v5.3.sh`

- [ ] **Step 1: Write the restore script**

Create `~/Sites/Global/scott-toolkit/restore-v5.3.sh`:

```bash
#!/bin/bash
# Restore scott-toolkit to v5.3-pre-audit state
# Use this if audit remediation breaks anything
set -e

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
BACKUP_DIR="$TOOLKIT_DIR/backups/settings-v5.3"

echo "Scott-Toolkit Restore to v5.3"
echo "=============================="
echo ""

# --- Preflight checks ---
if ! git -C "$TOOLKIT_DIR" tag -l v5.3-pre-audit | grep -q v5.3-pre-audit; then
  echo "ERROR: Tag v5.3-pre-audit not found. Cannot restore."
  exit 1
fi

if [ ! -f "$BACKUP_DIR/settings.json" ]; then
  echo "ERROR: Settings backup not found at $BACKUP_DIR/settings.json"
  echo "       Cannot restore settings.json."
  exit 1
fi

echo "This will:"
echo "  1. Reset toolkit to v5.3-pre-audit tag"
echo "  2. Restore ~/.claude/settings.json from backup"
echo "  3. Restore ~/.claude/settings.local.json from backup"
echo "  4. Re-run setup.sh to redeploy symlinks"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# --- Step 1: Reset toolkit to tagged state ---
echo ""
echo "1. Resetting toolkit to v5.3-pre-audit..."
cd "$TOOLKIT_DIR"

# Save current branch name for reference
CURRENT_BRANCH=$(git branch --show-current)
echo "   Current branch: $CURRENT_BRANCH"

# Create a rescue branch with current state before resetting
RESCUE_BRANCH="rescue/pre-restore-$(date +%Y%m%d-%H%M%S)"
git branch "$RESCUE_BRANCH"
echo "   Rescue branch created: $RESCUE_BRANCH"

# Reset to the tagged state
git checkout v5.3-pre-audit
echo "   Checked out v5.3-pre-audit"

# --- Step 2: Restore settings ---
echo ""
echo "2. Restoring settings files..."
cp "$BACKUP_DIR/settings.json" "$HOME/.claude/settings.json"
echo "   -> settings.json restored"

if [ -f "$BACKUP_DIR/settings.local.json" ]; then
  cp "$BACKUP_DIR/settings.local.json" "$HOME/.claude/settings.local.json"
  echo "   -> settings.local.json restored"
fi

# --- Step 3: Redeploy ---
echo ""
echo "3. Redeploying toolkit..."
./setup.sh

echo ""
echo "Restore complete!"
echo ""
echo "You are now in detached HEAD at v5.3-pre-audit."
echo "Your previous state is saved on branch: $RESCUE_BRANCH"
echo ""
echo "To return to main: git checkout main"
echo "To permanently stay on v5.3: git checkout -b v5.3-stable"
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/Sites/Global/scott-toolkit/restore-v5.3.sh
```

- [ ] **Step 3: Test the preflight checks (without actually restoring)**

```bash
cd ~/Sites/Global/scott-toolkit
# Verify it detects the tag and prompts correctly (answer "n" to abort)
echo "n" | bash restore-v5.3.sh 2>&1 | head -20
```

Expected: Should show the "This will:" message and then "Aborted." when it reads "n". If tag is missing, it should error before the prompt.

- [ ] **Step 4: Commit**

```bash
cd ~/Sites/Global/scott-toolkit
git add restore-v5.3.sh
git commit -m "feat: add restore-v5.3.sh for audit remediation rollback"
```

---

### Task 4: Create verify-toolkit.sh

**Files:**
- Create: `verify-toolkit.sh`

- [ ] **Step 1: Write the verification script**

Create `~/Sites/Global/scott-toolkit/verify-toolkit.sh`:

```bash
#!/bin/bash
# Verify scott-toolkit health after each audit milestone
# Run this after every milestone merge to confirm working state
set -e

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
CLAUDE_DIR="$HOME/.claude"
ERRORS=0
WARNINGS=0

echo "Scott-Toolkit Health Check"
echo "=========================="
echo ""

# --- 1. Setup verification ---
echo "1. Running setup.sh --verify-only..."
if "$TOOLKIT_DIR/setup.sh" --verify-only 2>&1 | grep -q "WARNING"; then
  echo "   WARN: setup.sh reported warnings (see above)"
  WARNINGS=$((WARNINGS + 1))
else
  echo "   OK"
fi

# --- 2. Toolkit lint ---
echo ""
echo "2. Running toolkit lint..."
# Use .ts version if it exists (post-M1), fall back to .sh
if [ -f "$TOOLKIT_DIR/tools/toolkit-lint.ts" ] && command -v bun >/dev/null 2>&1; then
  LINT_CMD="bun run $TOOLKIT_DIR/tools/toolkit-lint.ts"
elif [ -f "$TOOLKIT_DIR/tools/toolkit-lint.sh" ]; then
  LINT_CMD="bash $TOOLKIT_DIR/tools/toolkit-lint.sh"
else
  echo "   SKIP: No lint tool found"
  LINT_CMD=""
fi

if [ -n "$LINT_CMD" ]; then
  if $LINT_CMD 2>&1 | tail -3 | grep -q "0 issue"; then
    echo "   OK: No lint issues"
  else
    echo "   WARN: Lint issues found (run toolkit-lint manually for details)"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# --- 3. Hook resolution ---
echo ""
echo "3. Checking hook file resolution..."
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

if [ ! -f "$SETTINGS_FILE" ]; then
  echo "   ERROR: $SETTINGS_FILE not found"
  ERRORS=$((ERRORS + 1))
else
  # Extract all hook command paths from settings.json
  # Handles both "$HOME/.claude/hooks/foo.sh" and "bun run $HOME/.claude/hooks/foo.ts" formats
  HOOK_PATHS=$(grep '"command"' "$SETTINGS_FILE" | \
    sed 's/.*"command"[[:space:]]*:[[:space:]]*"//' | \
    sed 's/".*//' | \
    grep -oE '\$HOME/[^ "]+\.(sh|ts|js)' | \
    sed "s|\\\$HOME|$HOME|g" | \
    sort -u)

  HOOK_COUNT=0
  HOOK_MISSING=0
  while IFS= read -r hook_path; do
    [ -z "$hook_path" ] && continue
    HOOK_COUNT=$((HOOK_COUNT + 1))
    if [ ! -f "$hook_path" ] && [ ! -L "$hook_path" ]; then
      echo "   ERROR: Hook not found: $hook_path"
      HOOK_MISSING=$((HOOK_MISSING + 1))
      ERRORS=$((ERRORS + 1))
    fi
  done <<< "$HOOK_PATHS"

  if [ "$HOOK_MISSING" -eq 0 ]; then
    echo "   OK: All $HOOK_COUNT hooks resolve to real files"
  else
    echo "   $HOOK_MISSING of $HOOK_COUNT hooks missing"
  fi
fi

# --- 4. Symlink health ---
echo ""
echo "4. Checking symlink health..."
BROKEN_LINKS=0

for dir in hooks rules skills checks tools config; do
  target_dir="$CLAUDE_DIR/$dir"
  [ -d "$target_dir" ] || continue

  while IFS= read -r -d '' link; do
    if [ -L "$link" ] && [ ! -e "$link" ]; then
      echo "   ERROR: Broken symlink: $link -> $(readlink "$link")"
      BROKEN_LINKS=$((BROKEN_LINKS + 1))
      ERRORS=$((ERRORS + 1))
    fi
  done < <(find "$target_dir" -type l -print0 2>/dev/null)
done

if [ "$BROKEN_LINKS" -eq 0 ]; then
  echo "   OK: No broken symlinks"
fi

# --- 5. Bun availability (post-M1) ---
echo ""
echo "5. Checking Bun availability..."
if command -v bun >/dev/null 2>&1; then
  BUN_VERSION=$(bun --version 2>/dev/null)
  echo "   OK: Bun $BUN_VERSION available"
else
  # Check if any .ts hooks/tools exist (post-M1 state)
  if find "$TOOLKIT_DIR/hooks" "$TOOLKIT_DIR/tools" -name "*.ts" 2>/dev/null | grep -q .; then
    echo "   ERROR: .ts files exist but Bun is not installed"
    ERRORS=$((ERRORS + 1))
  else
    echo "   SKIP: No .ts files yet (pre-M1 state)"
  fi
fi

# --- Summary ---
echo ""
echo "=========================="
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo "PASS: All checks passed"
  exit 0
elif [ "$ERRORS" -eq 0 ]; then
  echo "WARN: $WARNINGS warning(s), 0 errors"
  exit 0
else
  echo "FAIL: $ERRORS error(s), $WARNINGS warning(s)"
  exit 1
fi
```

- [ ] **Step 2: Make executable**

```bash
chmod +x ~/Sites/Global/scott-toolkit/verify-toolkit.sh
```

- [ ] **Step 3: Run it against current v5.3 state**

```bash
cd ~/Sites/Global/scott-toolkit
./verify-toolkit.sh
```

Expected: Should pass with 0 errors (may show warnings for the pre-existing lint issues with GSD hooks). The important thing is no broken symlinks and all hook paths resolve.

- [ ] **Step 4: Commit**

```bash
cd ~/Sites/Global/scott-toolkit
git add verify-toolkit.sh
git commit -m "feat: add verify-toolkit.sh for post-milestone health checks"
```

---

### Task 5: Create Audit Branch Strategy

**Files:**
- None (git operations only)

- [ ] **Step 1: Create M1 branch**

```bash
cd ~/Sites/Global/scott-toolkit
git checkout -b audit/m1-critical-fixes-bun-foundation
```

This is where M1 work will happen. The branch gets merged to main after M1 verification passes.

- [ ] **Step 2: Verify branch exists**

```bash
git branch --list 'audit/*'
```

Expected: `* audit/m1-critical-fixes-bun-foundation`

---

### Task 6: Final M0 Verification

**Files:**
- None (verification only)

- [ ] **Step 1: Switch back to main**

```bash
cd ~/Sites/Global/scott-toolkit
git checkout main
```

- [ ] **Step 2: Run full verification**

```bash
cd ~/Sites/Global/scott-toolkit
./verify-toolkit.sh
```

Expected: PASS (or WARN with known pre-existing issues only).

- [ ] **Step 3: Verify all M0 deliverables exist**

```bash
cd ~/Sites/Global/scott-toolkit
echo "--- Tag ---"
git tag -l 'v5.3-pre-audit'
echo "--- Backup ---"
ls -la backups/settings-v5.3/
echo "--- Scripts ---"
ls -la restore-v5.3.sh verify-toolkit.sh
echo "--- Branch ---"
git branch --list 'audit/*'
```

Expected:
- Tag: `v5.3-pre-audit`
- Backup: `settings.json` and `settings.local.json` present
- Scripts: Both executable
- Branch: `audit/m1-critical-fixes-bun-foundation`

- [ ] **Step 4: Commit any final changes and confirm clean state**

```bash
cd ~/Sites/Global/scott-toolkit
git status
```

Expected: `nothing to commit, working tree clean`
