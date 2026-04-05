#!/bin/bash
# Restore scott-toolkit to v5.3-pre-audit state
# Use this if audit remediation breaks anything
set -e

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
BACKUP_DIR="$TOOLKIT_DIR/backups/settings-v5.3"

echo "Scott-Toolkit Restore to v5.3"
echo "=============================="
echo ""

# --- Preflight checks ---
if ! git -C "$TOOLKIT_DIR" tag -l v5.3-pre-audit | grep -q v5.3-pre-audit; then
  echo "ERROR: Tag v5.3-pre-audit not found. Cannot restore."
  exit 1
fi

if [ ! -f "$BACKUP_DIR/settings.json" ]; then
  echo "ERROR: Settings backup not found at $BACKUP_DIR/settings.json"
  echo "       Cannot restore settings.json."
  exit 1
fi

echo "This will:"
echo "  1. Reset toolkit to v5.3-pre-audit tag"
echo "  2. Restore ~/.claude/settings.json from backup"
echo "  3. Restore ~/.claude/settings.local.json from backup"
echo "  4. Re-run setup.sh to redeploy symlinks"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# --- Step 1: Reset toolkit to tagged state ---
echo ""
echo "1. Resetting toolkit to v5.3-pre-audit..."
cd "$TOOLKIT_DIR"

# Save current branch name for reference
CURRENT_BRANCH=$(git branch --show-current)
echo "   Current branch: $CURRENT_BRANCH"

# Create a rescue branch with current state before resetting
RESCUE_BRANCH="rescue/pre-restore-$(date +%Y%m%d-%H%M%S)"
git branch "$RESCUE_BRANCH"
echo "   Rescue branch created: $RESCUE_BRANCH"

# Reset to the tagged state
git checkout v5.3-pre-audit
echo "   Checked out v5.3-pre-audit"

# --- Step 2: Restore settings ---
echo ""
echo "2. Restoring settings files..."
cp "$BACKUP_DIR/settings.json" "$HOME/.claude/settings.json"
echo "   -> settings.json restored"

if [ -f "$BACKUP_DIR/settings.local.json" ]; then
  cp "$BACKUP_DIR/settings.local.json" "$HOME/.claude/settings.local.json"
  echo "   -> settings.local.json restored"
fi

# --- Step 3: Redeploy ---
echo ""
echo "3. Redeploying toolkit..."
./setup.sh

echo ""
echo "Restore complete!"
echo ""
echo "You are now in detached HEAD at v5.3-pre-audit."
echo "Your previous state is saved on branch: $RESCUE_BRANCH"
echo ""
echo "To return to main: git checkout main"
echo "To permanently stay on v5.3: git checkout -b v5.3-stable"
