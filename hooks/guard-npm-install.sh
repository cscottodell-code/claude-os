#!/bin/bash
# Guard: Block npm/pnpm install + stack-lock drift detection
# Exit code 2 = block the action (per Claude Code hooks spec)

# --- Stack-lock drift detection ---
# Called when an install is about to happen. Warns if the package
# conflicts with the locked stack (e.g., wrong SurrealDB SDK version).
check_stack_drift() {
  local packages="$1"
  local stack_lock="$(pwd)/stack-lock.json"

  if [ ! -f "$stack_lock" ]; then
    return 0
  fi

  # Check for SurrealDB SDK version conflicts
  if echo "$packages" | grep -q "surrealdb"; then
    local locked_sdk
    locked_sdk=$(grep -o '"sdk":\s*"surrealdb@[^"]*"' "$stack_lock" 2>/dev/null | sed -E 's/.*@//' || true)
    if [ -n "$locked_sdk" ]; then
      local requested_ver
      requested_ver=$(echo "$packages" | grep -oE 'surrealdb@[0-9.]+' | sed 's/surrealdb@//' || true)
      if [ -n "$requested_ver" ] && [ "$requested_ver" != "$locked_sdk" ]; then
        echo ""
        echo "STACK DRIFT: stack-lock.json locks surrealdb SDK to @${locked_sdk}"
        echo "  Requested: @${requested_ver}"
        echo "  Update stack-lock.json if this change is intentional."
        echo ""
      fi
    fi
  fi

  # Check for Nuxt UI version conflicts
  if echo "$packages" | grep -q "@nuxt/ui"; then
    local locked_nuxt
    locked_nuxt=$(grep -o '"sdk":\s*"@nuxt/ui@[^"]*"' "$stack_lock" 2>/dev/null | sed -E 's/.*@nuxt\/ui@//' || true)
    if [ -n "$locked_nuxt" ]; then
      echo "Note: stack-lock.json has Nuxt UI locked. Verify compatibility after install."
    fi
  fi
}

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Strip quoted strings to avoid false positives
STRIPPED=$(echo "$COMMAND" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")

# Match "npm install" or "npm i" followed by packages
if echo "$STRIPPED" | grep -qE 'npm\s+(install|i)\s'; then
  PACKAGES=$(echo "$COMMAND" | sed -E 's/.*npm\s+(install|i)\s+//')
  check_stack_drift "$PACKAGES"
  echo "npm install blocked — packages to install: $PACKAGES. Confirm with Scott before adding new dependencies."
  exit 2
fi

# Also catch bare "npm install" or "npm i" (no packages)
if echo "$STRIPPED" | grep -qE 'npm\s+(install|i)$'; then
  echo "npm install blocked — this would install all dependencies from package.json. Use 'npm ci' for clean installs, or confirm with Scott."
  exit 2
fi

# Match "pnpm add" followed by packages
if echo "$STRIPPED" | grep -qE 'pnpm\s+add\s'; then
  PACKAGES=$(echo "$COMMAND" | sed -E 's/.*pnpm\s+add\s+//')
  check_stack_drift "$PACKAGES"
  echo "pnpm add blocked — packages to add: $PACKAGES. Confirm with Scott before adding new dependencies."
  exit 2
fi

exit 0
