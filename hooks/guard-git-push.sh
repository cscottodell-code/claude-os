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
