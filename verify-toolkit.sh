#!/bin/bash
# Verify scott-toolkit health after each audit milestone
# Run this after every milestone merge to confirm working state
set -e

TOOLKIT_DIR="${CLAUDE_OS_DIR:-$HOME/Sites/Global/scott-toolkit}"
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
