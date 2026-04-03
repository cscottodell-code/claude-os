#!/usr/bin/env bash
# pre-commit-hook.sh — Git pre-commit hook for the scott-toolkit repo.
# Symlink to .git/hooks/pre-commit:
#   ln -sf ../../tools/pre-commit-hook.sh .git/hooks/pre-commit

set -euo pipefail

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"

echo "[pre-commit] Running toolkit-lint.sh..."
if ! "$TOOLKIT_DIR/tools/toolkit-lint.sh"; then
  echo ""
  echo "[pre-commit] BLOCKED: Stale cross-references found."
  echo "Run: tools/toolkit-lint.sh --fix  to auto-fix simple patterns."
  exit 1
fi

echo "[pre-commit] Lint passed."
