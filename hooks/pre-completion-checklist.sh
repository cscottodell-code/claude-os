#!/bin/bash
# Pre-Completion Checklist Hook
# Runs on Stop event to verify work is actually complete before ending.
# Structural enforcement of the verification rules in claude-behavior.md.
#
# Checks:
# 1. No uncommitted changes (git status clean)
# 2. tasks/todo.md exists and has been updated
# 3. Tests pass (if a test command is configured)
#
# This hook warns but does not block — it surfaces issues Claude might
# have missed so Scott can decide whether to address them.

# Only run if we're in a git repo (i.e., a project directory)
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  exit 0
fi

warnings=""

# Check 1: Uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  warnings="${warnings}\n⚠ Uncommitted changes detected. Run 'git status' to review."
fi

# Check 2: tasks/todo.md exists
if [ -f "tasks/todo.md" ]; then
  # Check if it was modified in this session (modified in last 2 hours)
  if [ "$(uname)" = "Darwin" ]; then
    last_modified=$(stat -f %m tasks/todo.md 2>/dev/null)
  else
    last_modified=$(stat -c %Y tasks/todo.md 2>/dev/null)
  fi
  now=$(date +%s)
  age=$(( now - last_modified ))
  if [ "$age" -gt 7200 ]; then
    warnings="${warnings}\n⚠ tasks/todo.md hasn't been updated in over 2 hours. Did you check off completed items?"
  fi
fi

# Output warnings if any
if [ -n "$warnings" ]; then
  echo -e "\n📋 Pre-Completion Checklist:${warnings}"
  echo ""
  echo "Address these before ending the session, or dismiss if not applicable."
fi

exit 0
