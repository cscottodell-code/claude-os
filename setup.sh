#!/bin/bash
# Scott-Toolkit v7 Setup Script
# Deploys the toolkit to ~/.claude/ using symlinks where possible.
# Run after cloning: ./setup.sh
# On other machines: ./setup.sh --toolkit-path /path/to/scott-toolkit

set -e

# --- Parse arguments ---
TOOLKIT_PATH="$(cd "$(dirname "$0")" && pwd)"

UPDATE_PATHS=false
OLD_TOOLKIT_PATH=""
VERIFY_ONLY=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --toolkit-path) TOOLKIT_PATH="$2"; shift ;;
    --update-paths)
      UPDATE_PATHS=true
      OLD_TOOLKIT_PATH="$2"
      shift
      ;;
    --verify-only)
      VERIFY_ONLY=true
      ;;
    --help|-h)
      echo "Usage: ./setup.sh [--toolkit-path /path/to/scott-toolkit] [--update-paths /old/path] [--verify-only]"
      echo ""
      echo "Deploys scott-toolkit to ~/.claude/ configuration."
      echo "Default toolkit path: directory containing this script."
      echo ""
      echo "Options:"
      echo "  --toolkit-path PATH   Set toolkit location (default: script directory)"
      echo "  --update-paths OLD    Replace OLD path with current path in all .md files"
      echo "  --verify-only         Skip deployment, only run verification checks"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

# --- Check prerequisites ---
if ! command -v bun >/dev/null 2>&1; then
  echo ""
  echo "WARNING: Bun is not installed."
  echo "  TypeScript tools require Bun. Install: https://bun.sh"
  echo "  Shell fallbacks will be used where available."
  echo ""
fi

CLAUDE_DIR="$HOME/.claude"
HOOKS_DIR="$CLAUDE_DIR/hooks"
RULES_DIR="$CLAUDE_DIR/rules"
SKILLS_DIR="$CLAUDE_DIR/skills"
TOOLS_DIR="$CLAUDE_DIR/tools"
CONFIG_DIR="$CLAUDE_DIR/config"

echo "Scott-Toolkit v7 Setup"
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

if [ "$VERIFY_ONLY" != true ]; then

# --- Create directories ---
mkdir -p "$HOOKS_DIR" "$RULES_DIR" "$SKILLS_DIR" "$TOOLS_DIR" "$CONFIG_DIR"

# --- 1. Deploy hooks (symlinks) ---
echo "1. Deploying hooks..."
for hook_file in "$TOOLKIT_PATH"/hooks/*.ts; do
  [ -f "$hook_file" ] || continue
  hook_name="$(basename "$hook_file")"
  target="$HOOKS_DIR/$hook_name"

  if [ -e "$target" ] || [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$hook_file" "$target"
  echo "   -> $hook_name"
done

# Deploy hook subdirectories (lib/, guards/)
for subdir in lib guards; do
  src_dir="$TOOLKIT_PATH/hooks/$subdir"
  [ -d "$src_dir" ] || continue
  deploy_dir="$HOOKS_DIR/$subdir"
  mkdir -p "$deploy_dir"

  for ts_file in "$src_dir"/*.ts; do
    [ -f "$ts_file" ] || continue
    ts_name="$(basename "$ts_file")"
    target="$deploy_dir/$ts_name"

    if [ -e "$target" ] || [ -L "$target" ]; then
      rm "$target"
    fi

    ln -s "$ts_file" "$target"
    echo "   -> $subdir/$ts_name"
  done
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

# --- 3. Deploy skills (symlinks) ---
# All skills (including workflow-backed ones) live in skills/ as either
# direct SKILL.md files or symlinks to workflow files. No more stub generation.
echo "3. Deploying skills..."
for skill_dir in "$TOOLKIT_PATH"/skills/*/; do
  skill_name="$(basename "$skill_dir")"
  target_dir="$SKILLS_DIR/$skill_name"

  mkdir -p "$target_dir"

  # Always force-symlink SKILL.md so toolkit repo is source of truth
  ln -sf "$skill_dir/SKILL.md" "$target_dir/SKILL.md"
  echo "   -> $skill_name"

  # Symlink all additional files (references, code examples, etc.)
  find "$skill_dir" -type f ! -name "SKILL.md" | while read src_file; do
    rel_path="${src_file#$skill_dir}"
    dest_file="$target_dir/$rel_path"
    mkdir -p "$(dirname "$dest_file")"
    ln -sf "$src_file" "$dest_file"
  done
done

# --- 4. Deploy tools (symlinks, ensure executable) ---
echo "4. Deploying tools..."
for tool_file in "$TOOLKIT_PATH"/tools/*.ts; do
  [ -f "$tool_file" ] || continue
  tool_name="$(basename "$tool_file")"
  target="$TOOLS_DIR/$tool_name"

  if [ -e "$target" ] || [ -L "$target" ]; then
    rm "$target"
  fi

  ln -s "$tool_file" "$target"
  chmod +x "$tool_file"
  echo "   -> $tool_name"
done

# --- 5. Deploy config (symlinks) ---
echo "5. Deploying config..."
if [ -d "$TOOLKIT_PATH/config" ]; then
  for config_file in "$TOOLKIT_PATH"/config/*; do
    [ -f "$config_file" ] || continue
    config_name="$(basename "$config_file")"
    target="$CONFIG_DIR/$config_name"

    if [ -e "$target" ] || [ -L "$target" ]; then
      rm "$target"
    fi

    ln -s "$config_file" "$target"
    echo "   -> $config_name"
  done
else
  echo "   (no config/ directory yet)"
fi

fi # end VERIFY_ONLY skip

# --- 8. Verify deployment ---
if [ "$VERIFY_ONLY" = true ]; then
  echo "Verify-only mode — skipping deployment"
  echo ""
fi
echo "6. Verifying deployment..."

ERRORS=0

# Check hooks (scan directory dynamically — .ts files post-M2)
for hook_file in "$TOOLKIT_PATH"/hooks/*.ts; do
  [ -f "$hook_file" ] || continue
  hook_name="$(basename "$hook_file")"
  if [ -L "$HOOKS_DIR/$hook_name" ] && [ -e "$HOOKS_DIR/$hook_name" ]; then
    : # OK
  else
    echo "   WARNING: Hook $hook_name not properly linked"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check rules (scan directory dynamically)
for rule_file in "$TOOLKIT_PATH"/rules/*.md; do
  rule_name="$(basename "$rule_file")"
  if [ -L "$RULES_DIR/$rule_name" ] && [ -e "$RULES_DIR/$rule_name" ]; then
    : # OK
  else
    echo "   WARNING: Rule $rule_name not properly linked"
    ERRORS=$((ERRORS + 1))
  fi
done

# Check skills (scan deployed skills)
for skill_dir in "$TOOLKIT_PATH"/skills/*/; do
  skill_name="$(basename "$skill_dir")"
  if [ -f "$SKILLS_DIR/$skill_name/SKILL.md" ]; then
    : # OK
  else
    echo "   WARNING: Skill $skill_name not deployed"
    ERRORS=$((ERRORS + 1))
  fi
done
# Check tools (scan directory dynamically — .ts files post-M1)
for tool_file in "$TOOLKIT_PATH"/tools/*.ts; do
  [ -f "$tool_file" ] || continue
  tool_name="$(basename "$tool_file")"
  if [ -L "$TOOLS_DIR/$tool_name" ] && [ -e "$TOOLS_DIR/$tool_name" ]; then
    : # OK
  else
    echo "   WARNING: Tool $tool_name not properly linked"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "   All checks passed!"
else
  echo "   $ERRORS warnings found. Review above."
fi

# --- 9. Update paths (if --update-paths was used) ---
if [ "$VERIFY_ONLY" != true ] && [ "$UPDATE_PATHS" = true ] && [ -n "$OLD_TOOLKIT_PATH" ]; then
  echo ""
  echo "7. Updating paths: $OLD_TOOLKIT_PATH -> $TOOLKIT_PATH"
  # Escape sed-special characters in paths (& and \ in replacement string)
  ESCAPED_OLD=$(printf '%s\n' "$OLD_TOOLKIT_PATH" | sed 's/[&/\]/\\&/g')
  ESCAPED_NEW=$(printf '%s\n' "$TOOLKIT_PATH" | sed 's/[&/\]/\\&/g')
  COUNT=0
  while IFS= read -r -d '' md_file; do
    if grep -q "$OLD_TOOLKIT_PATH" "$md_file" 2>/dev/null; then
      sed -i '' "s|${ESCAPED_OLD}|${ESCAPED_NEW}|g" "$md_file"
      echo "   -> $(basename "$md_file")"
      COUNT=$((COUNT + 1))
    fi
  done < <(find "$TOOLKIT_PATH" -name "*.md" -print0)
  echo "   Updated $COUNT files."
fi

echo ""
echo "Setup complete!"
echo ""
echo "NOTE: settings.json hooks must be configured separately."
echo "The hook scripts are deployed, but settings.json registration"
echo "is machine-specific and should be done manually or via sync."
echo ""

# --- Check SCOTT_TOOLKIT_DIR environment variable ---
if [ -z "$SCOTT_TOOLKIT_DIR" ]; then
  echo "Recommended: Add to your shell profile (~/.zshrc):"
  echo "  export SCOTT_TOOLKIT_DIR=\"$TOOLKIT_PATH\""
  echo ""
elif [ "$SCOTT_TOOLKIT_DIR" != "$TOOLKIT_PATH" ]; then
  echo "WARNING: SCOTT_TOOLKIT_DIR is set to $SCOTT_TOOLKIT_DIR but toolkit is at $TOOLKIT_PATH"
  echo ""
fi

echo "Next steps:"
echo "  1. Verify hooks work: start a new Claude Code session"
echo "  2. Test a workflow: /scott:resume or /scott:new-feature"
echo "  3. Pull updates anytime: cd $TOOLKIT_PATH && git pull"
