#!/bin/bash
# Router: Single entry point for all Bash PreToolUse hooks
# Reads stdin once, dispatches to relevant guards based on command pattern.
# Reduces 7 subprocess spawns to 1 (plus targeted delegates).
#
# Exit code 2 = block the action (per Claude Code hooks spec)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# If jq fails or command is empty, pass through
if [ -z "$COMMAND" ]; then
  exit 0
fi

# --- Always: Log the command ---
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $COMMAND" >> ~/.claude/bash-commands.log

# Strip quoted strings for pattern matching (prevents false positives)
STRIPPED=$(echo "$COMMAND" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

# --- Guard: git push ---
if echo "$STRIPPED" | grep -qE '(^|\s|&&|\|)git\s+push(\s|$)'; then
  echo "$INPUT" | "$HOME/.claude/hooks/guard-git-push.sh"
  exit_code=$?
  [ $exit_code -ne 0 ] && exit $exit_code
fi

# --- Guard: destructive operations ---
if echo "$STRIPPED" | grep -qE 'rm\s+-rf|git\s+reset\s+--hard|git\s+checkout\s+--\s|git\s+clean\s+-f|DROP\s+(TABLE|DATABASE)'; then
  echo "$INPUT" | "$HOME/.claude/hooks/guard-destructive.sh"
  exit_code=$?
  [ $exit_code -ne 0 ] && exit $exit_code
fi

# --- Guard: npm/pnpm install ---
if echo "$STRIPPED" | grep -qE '(npm|pnpm|bun)\s+(install|add|i\s)'; then
  echo "$INPUT" | "$HOME/.claude/hooks/guard-npm-install.sh"
  exit_code=$?
  [ $exit_code -ne 0 ] && exit $exit_code
fi

# --- Guard: phase completion ---
if echo "$COMMAND" | grep -qE 'phase.*(complete|done|finish)|gsd.*phase.*complete'; then
  echo "$INPUT" | "$HOME/.claude/hooks/guard-phase-completion.sh"
  exit_code=$?
  [ $exit_code -ne 0 ] && exit $exit_code
fi

# --- Guard: git commit validation (GSD) ---
if echo "$STRIPPED" | grep -qE '(^|\s|&&|\|)git\s+commit'; then
  echo "$INPUT" | bash "$HOME/.claude/hooks/gsd-validate-commit.sh"
  exit_code=$?
  [ $exit_code -ne 0 ] && exit $exit_code
fi

# --- SurrealDB skill injection (file-touch based, has its own dedup) ---
if echo "$COMMAND" | grep -qiE 'surreal|\.surql|surrealdb|surrealmcp'; then
  echo "$INPUT" | "$HOME/.claude/hooks/inject-surrealdb-skill.sh"
  # Don't exit on non-zero; injection is advisory, not blocking
fi

exit 0
