#!/bin/bash
# Scott-Toolkit v2 Setup Script
# Deploys the toolkit to ~/.claude/ using symlinks where possible.
# Run after cloning: ./setup.sh
# On other machines: ./setup.sh --toolkit-path /path/to/scott-toolkit

set -e

# --- Parse arguments ---
TOOLKIT_PATH="$(cd "$(dirname "$0")" && pwd)"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --toolkit-path) TOOLKIT_PATH="$2"; shift ;;
    --help|-h)
      echo "Usage: ./setup.sh [--toolkit-path /path/to/scott-toolkit]"
      echo ""
      echo "Deploys scott-toolkit to ~/.claude/ configuration."
      echo "Default toolkit path: directory containing this script."
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

CLAUDE_DIR="$HOME/.claude"
HOOKS_DIR="$CLAUDE_DIR/hooks"
RULES_DIR="$CLAUDE_DIR/rules"
SKILLS_DIR="$CLAUDE_DIR/skills"

echo "Scott-Toolkit v2 Setup"
echo "======================"
echo "Toolkit path: $TOOLKIT_PATH"
echo "Claude dir:   $CLAUDE_DIR"
echo ""

# --- Verify toolkit path ---
if [ ! -f "$TOOLKIT_PATH/README.md" ]; then
  echo "ERROR: $TOOLKIT_PATH does not look like the scott-toolkit repo."
  echo "       Expected to find README.md. Check your --toolkit-path."
  exit 1
fi

# --- Create directories ---
mkdir -p "$HOOKS_DIR" "$RULES_DIR" "$SKILLS_DIR"

# --- 1. Deploy hooks (symlinks) ---
echo "1. Deploying hooks..."
for hook_file in "$TOOLKIT_PATH"/hooks/*.sh; do
  hook_name="$(basename "$hook_file")"
  target="$HOOKS_DIR/$hook_name"

  # Remove existing file/symlink
  if [ -e "$target" ] || [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$hook_file" "$target"
  echo "   -> $hook_name"
done

# --- 2. Deploy rules (symlinks) ---
echo "2. Deploying rules..."
for rule_file in "$TOOLKIT_PATH"/rules/*.md; do
  rule_name="$(basename "$rule_file")"
  target="$RULES_DIR/$rule_name"

  if [ -e "$target" ] || [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$rule_file" "$target"
  echo "   -> $rule_name"
done

# --- 3. Deploy workflow skills ---
echo "3. Deploying workflow skills..."

# Map of workflow file -> skill folder name
deploy_workflow_skill() {
  local workflow_file="$1"
  local skill_name="$2"
  local description="$3"
  local invocation="$4"
  local skill_dir="$SKILLS_DIR/$skill_name"

  mkdir -p "$skill_dir"

  cat > "$skill_dir/SKILL.md" << SKILLEOF
---
name: ${skill_name/scott-/scott:}
description: |
  $description
user_invocable: true
invocation_hint: /${skill_name/scott-/scott:} - $invocation
---

# $(head -1 "$TOOLKIT_PATH/workflows/$workflow_file" | sed 's/^# //')

Read the full workflow file: \`$TOOLKIT_PATH/workflows/$workflow_file\`
and follow it phase by phase, exactly as written.

Also read the current project's CLAUDE.md and tasks/lessons.md for context.
SKILLEOF

  echo "   -> $skill_name"
}

deploy_workflow_skill "new-project.md" "scott-new-project" \
  "Start a new project from scratch using the scott-toolkit workflow.
  Walks Scott through 8 phases: Brain Dump, Clarify, Draft PRD, Finalize PRD,
  Create Repo, Design Proof, Build Milestone 1, and Milestone Review." \
  "Start a new project with the guided 8-phase workflow"

deploy_workflow_skill "resume-project.md" "scott-resume" \
  "Resume work on an existing project using the scott-toolkit workflow.
  Walks through 4 phases: Read Context, Summarize State, Confirm Direction,
  and Resume Work. Delegates to GSD for .planning/ state recovery." \
  "Pick up where you left off on a project"

deploy_workflow_skill "new-feature.md" "scott-new-feature" \
  "Add a new feature to an existing project using the scott-toolkit workflow.
  Walks through 5 phases: Feature Description, Impact Assessment, Mini-PRD,
  Build (delegated to GSD + Superpowers), and Update CLAUDE.md." \
  "Add a feature to the current project with guided workflow"

deploy_workflow_skill "retro.md" "scott-retro" \
  "Run a project retrospective using the scott-toolkit workflow.
  Walks through 5 phases: Gather Context, Guided Reflection, Generate Retro
  Document, Identify Toolkit Updates, and Apply Updates." \
  "Run a retrospective on the current project"

deploy_workflow_skill "handoff-to-gary.md" "scott-handoff" \
  "Prepare a project for handoff to Gary (production developer) using the
  scott-toolkit workflow. Walks through 5 phases: Code Review, Documentation,
  Architecture Summary, Setup Instructions, and Handoff Checklist." \
  "Prepare project for handoff to Gary"

deploy_workflow_skill "toolkit-update.md" "scott-toolkit-update" \
  "Update the scott-toolkit itself using the guided workflow.
  Walks through 6 phases: Review Trigger, Identify Files, Draft Changes,
  Update CHANGELOG, Update Instructions & PDF, and Commit & Push." \
  "Update the scott-toolkit with new lessons or patterns"

deploy_workflow_skill "log-success.md" "scott-log-success" \
  "Log a success or win from the current session while context is fresh.
  Walks through 4 phases: Review Context, Interview Scott, Trace the Trigger,
  and Log It." \
  "Capture a win or successful pattern for future reference"

deploy_workflow_skill "log-error.md" "scott-log-error" \
  "Log an error or mistake from the current session while context is fresh.
  Walks through 4 phases: Review Context, Interview Scott, Trace the Trigger,
  and Log It." \
  "Capture a mistake or failure for future reference"

deploy_workflow_skill "compare-sources.md" "scott-compare-sources" \
  "Compare context engineering sources against the current toolkit configuration.
  Walks through 6 phases: Scan & Refresh Raw Sources, Revise Sources, Build Comparison
  Inventory, Run Comparison Analysis (subagent), Generate Review & Act, and Archive Processed Sources." \
  "Compare new sources against your toolkit and surface what's actionable"

# --- 4. Deploy standalone skills (symlinks) ---
echo "4. Deploying standalone skills..."
for skill_dir in "$TOOLKIT_PATH"/skills/scott-*/; do
  skill_name="$(basename "$skill_dir")"
  target_dir="$SKILLS_DIR/$skill_name"

  mkdir -p "$target_dir"

  # Only symlink if not already generated by deploy_workflow_skill above
  if [ ! -f "$target_dir/SKILL.md" ]; then
    ln -sf "$skill_dir/SKILL.md" "$target_dir/SKILL.md"
    echo "   -> $skill_name (symlinked)"
  else
    echo "   -> $skill_name (already deployed)"
  fi
done

# --- 5. Verify deployment ---
echo ""
echo "4. Verifying deployment..."

ERRORS=0

# Check hooks
for hook in guard-git-push.sh guard-destructive.sh guard-claude-md.sh guard-npm-install.sh session-start.sh pre-compact.sh session-end.sh; do
  if [ -L "$HOOKS_DIR/$hook" ] && [ -e "$HOOKS_DIR/$hook" ]; then
    : # OK
  else
    echo "   WARNING: Hook $hook not properly linked"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check rules
for rule in claude-behavior.md code-style.md n8n-sync.md; do
  if [ -L "$RULES_DIR/$rule" ] && [ -e "$RULES_DIR/$rule" ]; then
    : # OK
  else
    echo "   WARNING: Rule $rule not properly linked"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check skills
for skill in scott-new-project scott-resume scott-new-feature scott-retro scott-handoff scott-toolkit-update scott-log-success scott-log-error scott-compare-sources scott-bypass; do
  if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
    : # OK
  else
    echo "   WARNING: Skill $skill not deployed"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "   All checks passed!"
else
  echo "   $ERRORS warnings found. Review above."
fi

echo ""
echo "Setup complete!"
echo ""
echo "NOTE: settings.json hooks must be configured separately."
echo "The hook scripts are deployed, but settings.json registration"
echo "is machine-specific and should be done manually or via sync."
echo ""
echo "Next steps:"
echo "  1. Verify hooks work: start a new Claude Code session"
echo "  2. Test a workflow: /scott:resume or /scott:new-feature"
echo "  3. Pull updates anytime: cd $TOOLKIT_PATH && git pull"
