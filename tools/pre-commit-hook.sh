#!/bin/bash
# Backward-compat wrapper — delegates to TypeScript version
# Will be removed in M2 after settings.json references are updated
# Resolve through symlinks (this file is symlinked from .git/hooks/pre-commit)
REAL_PATH="$(python3 -c "import os; print(os.path.realpath('$0'))")"
SCRIPT_DIR="$(dirname "$REAL_PATH")"
exec bun run "$SCRIPT_DIR/pre-commit-hook.ts" "$@"
