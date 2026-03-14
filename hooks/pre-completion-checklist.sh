#!/bin/bash
# Pre-Completion Checklist Hook (Stop event)
# Structural enforcement of verification rules. Runs every time a session ends.
#
# Checks:
# 1. Uncommitted changes in git
# 2. tasks/todo.md freshness (updated within 2 hours)
# 3. Resume file exists (.claude-resume.md)
# 4. Lessons file updated if it exists (tasks/lessons.md)
#
# This hook warns strongly but does NOT block. Exit 0 always.

# Only run if we're in a git repo (i.e., a project directory)
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  exit 0
fi

warnings=""
count=0

# Check 1: Uncommitted changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  warnings="${warnings}\n  [ ] Uncommitted changes — run 'git status' and commit or stash"
  count=$((count + 1))
fi

# Check 2: tasks/todo.md freshness
if [ -f "tasks/todo.md" ]; then
  if [ "$(uname)" = "Darwin" ]; then
    last_modified=$(stat -f %m tasks/todo.md 2>/dev/null)
  else
    last_modified=$(stat -c %Y tasks/todo.md 2>/dev/null)
  fi
  now=$(date +%s)
  age=$(( now - last_modified ))
  if [ "$age" -gt 7200 ]; then
    warnings="${warnings}\n  [ ] tasks/todo.md not updated in 2+ hours — check off completed items"
    count=$((count + 1))
  fi
fi

# Check 3: Resume file exists
if [ ! -f ".claude-resume.md" ]; then
  warnings="${warnings}\n  [ ] No .claude-resume.md — write one so next session knows where to pick up"
  count=$((count + 1))
fi

# Check 4: Lessons file updated (only if it exists)
if [ -f "tasks/lessons.md" ]; then
  if [ "$(uname)" = "Darwin" ]; then
    lessons_modified=$(stat -f %m tasks/lessons.md 2>/dev/null)
  else
    lessons_modified=$(stat -c %Y tasks/lessons.md 2>/dev/null)
  fi
  now=${now:-$(date +%s)}
  lessons_age=$(( now - lessons_modified ))
  # Only warn if lessons.md hasn't been touched in 4+ hours (less aggressive)
  if [ "$lessons_age" -gt 14400 ]; then
    warnings="${warnings}\n  [ ] tasks/lessons.md not updated recently — any lessons worth capturing?"
    count=$((count + 1))
  fi
fi

# Output warnings if any
if [ -n "$warnings" ]; then
  echo ""
  echo "=========================================="
  echo "  PRE-COMPLETION CHECKLIST ($count items)"
  echo "=========================================="
  echo -e "$warnings"
  echo ""
  echo "  Address these before ending, or confirm they're not applicable."
  echo "=========================================="
fi

exit 0
