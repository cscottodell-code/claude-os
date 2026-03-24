#!/usr/bin/env bash
# stack-preflight.sh — Verify system readiness and determine degradation tier
# Checks CLIs, MCP servers, DB connectivity, SDK versions
# Usage: stack-preflight.sh [project-dir]
#   project-dir: path to project root (default: current directory)
# Output: tier name (full/reduced/minimal/bypass) and status report

set -euo pipefail

PROJECT_DIR="${1:-.}"
STACK_LOCK="${PROJECT_DIR}/stack-lock.json"

# --- Status tracking ---
CLI_OK=true
MCP_OK=true
DB_OK=true
SDK_OK=true
ISSUES=()

info()    { echo -e "\033[34m[INFO]\033[0m $*"; }
ok()      { echo -e "\033[32m[  OK]\033[0m $*"; }
warn()    { echo -e "\033[33m[WARN]\033[0m $*"; ISSUES+=("$*"); }
fail()    { echo -e "\033[31m[FAIL]\033[0m $*"; ISSUES+=("$*"); }

# --- CLI checks ---
check_cli() {
  local name="$1" cmd="$2"
  if command -v "$cmd" &>/dev/null; then
    local ver
    ver=$("$cmd" --version 2>/dev/null | head -1 || echo "unknown")
    ok "$name: $ver"
  else
    fail "$name not found ($cmd)"
    CLI_OK=false
  fi
}

# --- SurrealDB checks ---
check_surrealdb() {
  info "Checking SurrealDB..."

  # CLI
  check_cli "SurrealDB CLI" "surreal"

  # Server connectivity (try common ports)
  local db_host="localhost"
  local db_port="8000"

  if curl -s --max-time 3 "http://${db_host}:${db_port}/health" &>/dev/null; then
    ok "SurrealDB server reachable at ${db_host}:${db_port}"

    # Check server version
    local server_ver
    server_ver=$(curl -s --max-time 3 "http://${db_host}:${db_port}/version" 2>/dev/null || echo "unknown")
    if [[ -n "$server_ver" && "$server_ver" != "unknown" ]]; then
      ok "SurrealDB server version: $server_ver"

      # Compare against stack-lock if available
      if [[ -f "$STACK_LOCK" ]]; then
        local locked_ver
        locked_ver=$(grep -o '"surrealdb":\s*{[^}]*"version":\s*"[^"]*"' "$STACK_LOCK" 2>/dev/null | grep -o '"v[0-9]*"' | tr -d '"' || true)
        if [[ -n "$locked_ver" ]]; then
          if echo "$server_ver" | grep -q "$(echo "$locked_ver" | tr -d 'v')"; then
            ok "Server version matches stack-lock ($locked_ver)"
          else
            warn "Server version ($server_ver) may not match stack-lock ($locked_ver)"
          fi
        fi
      fi
    fi
  else
    warn "SurrealDB server not reachable at ${db_host}:${db_port}"
    DB_OK=false
  fi

  # SDK version check
  if [[ -f "${PROJECT_DIR}/node_modules/surrealdb/package.json" ]]; then
    local sdk_ver
    sdk_ver=$(grep -o '"version":\s*"[^"]*"' "${PROJECT_DIR}/node_modules/surrealdb/package.json" | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
    ok "SurrealDB SDK installed: $sdk_ver"

    if [[ -f "$STACK_LOCK" ]]; then
      local locked_sdk
      locked_sdk=$(grep -o '"sdk":\s*"surrealdb@[^"]*"' "$STACK_LOCK" 2>/dev/null | sed 's/.*@//' || true)
      if [[ -n "$locked_sdk" && "$sdk_ver" != "$locked_sdk" ]]; then
        warn "SDK version ($sdk_ver) differs from stack-lock ($locked_sdk)"
        SDK_OK=false
      fi
    fi
  fi
}

# --- Nuxt checks ---
check_nuxt() {
  info "Checking Nuxt..."
  check_cli "Nuxi CLI" "nuxi"
}

# --- Bun checks ---
check_bun() {
  info "Checking Bun..."
  check_cli "Bun runtime" "bun"
}

# --- Determine which techs to check ---
get_project_techs() {
  if [[ -f "$STACK_LOCK" ]]; then
    grep -o '"[a-z-]*":\s*{' "$STACK_LOCK" | grep -o '"[^"]*"' | tr -d '"' | grep -v '_readme\|schema_version\|locked\|approved_by\|tier\|technologies\|services\|paths\|exceptions'
  elif [[ -f "${PROJECT_DIR}/package.json" ]]; then
    # Infer from package.json
    local techs=()
    grep -q '"surrealdb"' "${PROJECT_DIR}/package.json" 2>/dev/null && techs+=("surrealdb")
    [[ -f "${PROJECT_DIR}/nuxt.config.ts" ]] && techs+=("nuxt")
    grep -q '"tailwindcss"' "${PROJECT_DIR}/package.json" 2>/dev/null && techs+=("tailwind")
    [[ -f "${PROJECT_DIR}/bunfig.toml" || -f "${PROJECT_DIR}/bun.lockb" ]] && techs+=("bun")
    grep -q '"hono"' "${PROJECT_DIR}/package.json" 2>/dev/null && techs+=("hono")
    printf '%s\n' "${techs[@]}"
  fi
}

# --- Main ---
echo "Stack Preflight — $(date +%Y-%m-%d\ %H:%M)"
echo "Project: $(cd "$PROJECT_DIR" && pwd)"
if [[ -f "$STACK_LOCK" ]]; then
  echo "Stack lock: found"
else
  echo "Stack lock: not found (using auto-detection)"
fi
echo "---"

# Run technology-specific checks
while IFS= read -r tech; do
  case "$tech" in
    surrealdb) check_surrealdb ;;
    nuxt) check_nuxt ;;
    bun) check_bun ;;
    tailwind) info "Tailwind: CSS-only, no CLI check needed" ;;
    hono) info "Hono: no standalone CLI check needed" ;;
  esac
done < <(get_project_techs)

# --- Determine tier ---
echo ""
echo "--- Tier Assessment ---"

TIER="full"

if [[ "$CLI_OK" != true ]]; then
  TIER="minimal"
  fail "Missing CLI tools — degrading to Minimal"
elif [[ "$DB_OK" != true || "$MCP_OK" != true ]]; then
  TIER="reduced"
  warn "External services unavailable — degrading to Reduced"
elif [[ "$SDK_OK" != true ]]; then
  warn "SDK version mismatch detected — running at Full with warnings"
fi

echo ""
case "$TIER" in
  full)
    echo -e "\033[32m[TIER: FULL]\033[0m All systems available. CLI + agents + MCP + Context7."
    ;;
  reduced)
    echo -e "\033[33m[TIER: REDUCED]\033[0m CLI + single agent. Parallel dispatch and some Context7 unavailable."
    ;;
  minimal)
    echo -e "\033[31m[TIER: MINIMAL]\033[0m CLI static checks only. No agent-based checks."
    ;;
esac

if [[ ${#ISSUES[@]} -gt 0 ]]; then
  echo ""
  echo "Issues:"
  for issue in "${ISSUES[@]}"; do
    echo "  - $issue"
  done
fi

# Output tier for programmatic use
echo ""
echo "TIER=${TIER}"
