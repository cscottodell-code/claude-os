#!/bin/bash
# Auto-Format Hook (PostToolUse on Write|Edit)
# Runs Prettier on written/edited files if the project has Prettier configured.
# Only formats: .js, .ts, .vue, .css, .json
# Outputs a notice when formatting changes are made so Claude knows to re-read.

# Read tool input from stdin
input=$(cat)

# Extract file path from tool input
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Skip if no file path or file doesn't exist
if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# Check file extension — only format supported types
ext="${file_path##*.}"
case "$ext" in
  js|ts|vue|css|json) ;;
  *) exit 0 ;;
esac

# Find project root (git root, or fall back to file's directory)
project_dir=$(cd "$(dirname "$file_path")" && git rev-parse --show-toplevel 2>/dev/null || dirname "$file_path")

# Check if Prettier is configured in this project
has_prettier=false
for config in .prettierrc .prettierrc.json .prettierrc.js .prettierrc.yml .prettierrc.yaml prettier.config.js prettier.config.mjs prettier.config.cjs; do
  if [ -f "$project_dir/$config" ]; then
    has_prettier=true
    break
  fi
done

# Also check package.json for prettier dependency
if [ "$has_prettier" = false ] && [ -f "$project_dir/package.json" ]; then
  if jq -e '.devDependencies.prettier // .dependencies.prettier' "$project_dir/package.json" &>/dev/null; then
    has_prettier=true
  fi
fi

# No Prettier configured — skip silently
if [ "$has_prettier" = false ]; then
  exit 0
fi

# Save file hash before formatting
before=$(md5 -q "$file_path" 2>/dev/null || md5sum "$file_path" | cut -d' ' -f1)

# Run Prettier using local binary (faster than npx)
if [ -x "$project_dir/node_modules/.bin/prettier" ]; then
  "$project_dir/node_modules/.bin/prettier" --write "$file_path" &>/dev/null
elif command -v prettier &>/dev/null; then
  prettier --write "$file_path" &>/dev/null
else
  # No prettier binary found — skip
  exit 0
fi

# Check if file changed
after=$(md5 -q "$file_path" 2>/dev/null || md5sum "$file_path" | cut -d' ' -f1)

if [ "$before" != "$after" ]; then
  echo "Auto-formatted $(basename "$file_path") with Prettier. Re-read before next edit."
fi

exit 0
