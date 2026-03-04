#!/bin/bash
# Hook: Stop — Resume File + Documentation Reminder
# Reminds Claude to write the resume file and update project docs.
# Non-blocking: outputs a reminder only.

PROJECT_DIR="$(pwd)"

# Only run in projects with CLAUDE.md
if [ ! -f "$PROJECT_DIR/CLAUDE.md" ]; then
  exit 0
fi

echo "Session ending — before closing:"
echo "  1. Write/update .claude-resume.md (workflow, phase, done, next, decisions)"
echo "  2. Update CLAUDE.md Current Status"
echo "  3. Mark completed tasks in tasks/todo.md"

exit 0
