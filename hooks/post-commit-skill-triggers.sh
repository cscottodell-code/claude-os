#!/bin/bash
# Post-Commit Skill Triggers Hook (PostToolUse, Bash matcher)
# Detects git commits and suggests appropriate skills based on context.
#
# Triggers:
#   - Commit message contains "fix", "bug", "debug", "error" → check tasks/lessons.md
#   - Commit message contains "complete", "finish", "done" on a milestone/phase → /scott:phase-closeout
#   - GSD phase completion detected → /scott:phase-closeout
#   - All error/success/retro logging handled by /scott:phase-closeout
#
# Reads tool_input from stdin (JSON). Only acts on git commit commands.

# Read stdin (tool input JSON)
input=$(cat)

# Extract the command that was run
command=$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Only care about git commit commands
if ! echo "$command" | grep -q 'git commit'; then
  exit 0
fi

# Get the last commit message from git (most reliable, works regardless of -m format)
commit_msg=""
if git rev-parse --is-inside-work-tree &>/dev/null; then
  commit_msg=$(git log -1 --pretty=%B 2>/dev/null || true)
fi

# Lowercase for matching
msg_lower=$(echo "$commit_msg" | tr '[:upper:]' '[:lower:]')

triggers=""

# --- Trigger: Bug fix → ensure lesson was captured ---
if echo "$msg_lower" | grep -qE '\b(fix|bug|debug|error|crash|broke|broken|hotfix|patch)\b'; then
  triggers="${triggers}\n  → Bug fix committed. If this was a code bug, verify scott-debug Phase 5 captured the lesson in tasks/lessons.md. Claude/toolkit mistakes are captured during /scott:phase-closeout."
fi

# --- Trigger: Milestone/phase completion → retro ---
if echo "$msg_lower" | grep -qE '\b(milestone|phase|complete|completed|finish|finished|ship|shipped|release|v[0-9])\b'; then
  triggers="${triggers}\n  → Milestone/phase completion detected. MUST invoke /scott:phase-closeout."
fi

# --- Trigger: GSD phase directory exists with VERIFICATION.md → phase done ---
if [ -d ".planning" ]; then
  # Check if any phase has a fresh VERIFICATION.md (modified in last 10 min)
  recent_verification=$(find .planning -name "VERIFICATION.md" -mmin -10 2>/dev/null | head -1)
  if [ -n "$recent_verification" ]; then
    triggers="${triggers}\n  → GSD phase verification complete. MUST invoke /scott:phase-closeout."
  fi
fi

# --- Trigger: Any commit → consider log-success ---
if [ -z "$triggers" ]; then
  # Only suggest log-success if nothing else triggered (avoid noise)
  triggers="${triggers}\n  → Commit landed. Notable wins are captured during /scott:phase-closeout."
fi

# Output triggers
if [ -n "$triggers" ]; then
  echo ""
  echo "--- Skill Auto-Triggers ---"
  echo -e "$triggers"
  echo "----------------------------"
fi

exit 0
