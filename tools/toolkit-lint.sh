#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
# Will be removed in M2 after settings.json references are updated
# Resolve through symlinks (deployed via symlink from ~/.claude/tools/)
REAL_PATH="$(python3 -c "import os; print(os.path.realpath('$0'))")"
SCRIPT_DIR="$(dirname "$REAL_PATH")"
exec bun run "$SCRIPT_DIR/toolkit-lint.ts" "$@"
