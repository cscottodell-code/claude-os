#!/bin/bash
# Scott-Knowledge Setup Script
# Deploys knowledge skills to ~/.claude/skills/ using symlinks.

set -e

REPO_PATH="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"

echo "Scott-Knowledge Setup"
echo "====================="
echo "Repo path:  $REPO_PATH"
echo "Skills dir: $SKILLS_DIR"
echo ""

mkdir -p "$SKILLS_DIR"

echo "Deploying skills..."
for skill_dir in "$REPO_PATH"/skills/*/; do
  [ -d "$skill_dir" ] || continue
  skill_name="$(basename "$skill_dir")"
  target_dir="$SKILLS_DIR/$skill_name"

  mkdir -p "$target_dir"

  # Symlink SKILL.md
  ln -sf "$skill_dir/SKILL.md" "$target_dir/SKILL.md"
  echo "  -> $skill_name"

  # Symlink all additional files (references, evals, etc.)
  find "$skill_dir" -type f ! -name "SKILL.md" | while read src_file; do
    rel_path="${src_file#$skill_dir}"
    dest_file="$target_dir/$rel_path"
    mkdir -p "$(dirname "$dest_file")"
    ln -sf "$src_file" "$dest_file"
  done
done

echo ""
echo "Verifying..."
ERRORS=0
for skill_dir in "$REPO_PATH"/skills/*/; do
  skill_name="$(basename "$skill_dir")"
  if [ -f "$SKILLS_DIR/$skill_name/SKILL.md" ]; then
    : # OK
  else
    echo "  WARNING: Skill $skill_name not deployed"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ $ERRORS -eq 0 ]; then
  echo "  All skills deployed!"
else
  echo "  $ERRORS warnings found."
fi

echo ""
echo "Done. Skills are available via /scott:<name> in Claude Code."
