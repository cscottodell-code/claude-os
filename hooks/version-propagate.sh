#!/usr/bin/env bash
# version-propagate.sh — PostToolUse hook
# Fires when CHANGELOG.md in the toolkit is edited.
# Extracts the latest version, then checks all files in version-manifest.json
# for stale version references. Outputs a checklist of what needs updating.
#
# This hook REMINDS (non-blocking). Content updates need Claude's reasoning,
# so the hook produces the checklist and Claude does the actual edits.

set -euo pipefail

TOOLKIT_DIR="${SCOTT_TOOLKIT_DIR:-$HOME/Sites/Global/scott-toolkit}"
MANIFEST="${TOOLKIT_DIR}/config/version-manifest.json"
CHANGELOG="${TOOLKIT_DIR}/CHANGELOG.md"

# Get the file that was just edited
EDITED_FILE="${CLAUDE_TOOL_ARG_FILE_PATH:-${CLAUDE_TOOL_ARG_file_path:-}}"

# Only trigger for CHANGELOG.md edits in the toolkit
if [[ -z "$EDITED_FILE" ]]; then
  exit 0
fi

# Resolve to absolute path for comparison
REAL_EDITED=$(cd "$(dirname "$EDITED_FILE")" 2>/dev/null && echo "$(pwd)/$(basename "$EDITED_FILE")" || echo "$EDITED_FILE")
REAL_CHANGELOG=$(cd "$(dirname "$CHANGELOG")" 2>/dev/null && echo "$(pwd)/$(basename "$CHANGELOG")" || echo "$CHANGELOG")

if [[ "$REAL_EDITED" != "$REAL_CHANGELOG" ]]; then
  exit 0
fi

# Verify manifest exists
if [[ ! -f "$MANIFEST" ]]; then
  echo "VERSION-PROPAGATE: version-manifest.json not found. Skipping."
  exit 0
fi

# Extract latest version from CHANGELOG (first ## v line)
LATEST_VERSION=$(grep -m1 '^## v' "$CHANGELOG" | sed -E 's/^## v([0-9]+\.[0-9]+\.[0-9]+).*/\1/')
if [[ -z "$LATEST_VERSION" ]]; then
  echo "VERSION-PROPAGATE: Could not extract version from CHANGELOG.md"
  exit 0
fi

# Extract major.minor for partial matches
MAJOR_MINOR=$(echo "$LATEST_VERSION" | sed -E 's/([0-9]+\.[0-9]+)\..*/\1/')

# Extract the date from the latest changelog entry
CHANGELOG_DATE=$(grep -m1 '^## v' "$CHANGELOG" | sed -E 's/^## v[0-9.]+ - ([0-9]{4}-[0-9]{2}-[0-9]{2}).*/\1/')

# Use python3 to reliably parse the manifest and check each file
RESULT=$(python3 -c "
import json, re, sys, os

toolkit = '$TOOLKIT_DIR'
sites = os.path.expanduser('~/Sites')
version = '$LATEST_VERSION'
major_minor = '$MAJOR_MINOR'
changelog_date = '$CHANGELOG_DATE'

with open('$MANIFEST') as f:
    manifest = json.load(f)

def check_file(full_path, display_path, desc, check_type):
    if not os.path.isfile(full_path):
        return f'  [ ] {display_path} -- FILE NOT FOUND ({desc})'

    with open(full_path) as f:
        content = f.read()

    found = False

    # Date freshness check
    if check_type == 'date_freshness' and changelog_date:
        if changelog_date in content:
            found = True
    else:
        # Version string check (v5.1.1 or v5.1)
        if f'v{version}' in content or f'v{major_minor}' in content:
            found = True

    if not found:
        refs = re.findall(r'v\d+\.\d+(?:\.\d+)?', content)
        current = refs[0] if refs else 'none'
        return f'  [ ] {display_path} -- {desc} (has {current}, needs v{major_minor}+)'
    return None

stale = []

# Check toolkit-relative files
for entry in manifest.get('files', []):
    path = entry['path']
    result = check_file(
        os.path.join(toolkit, path),
        path,
        entry.get('description', ''),
        entry.get('check', '')
    )
    if result:
        stale.append(result)

# Check external files (relative to ~/Sites/)
for entry in manifest.get('external_files', []):
    path = entry['path']
    result = check_file(
        os.path.join(sites, path),
        f'~/Sites/{path}',
        entry.get('description', ''),
        entry.get('check', '')
    )
    if result:
        stale.append(result)

if stale:
    print(f'STALE:{len(stale)}')
    for line in stale:
        print(line)
else:
    print('OK')
" 2>&1)

# Parse result
if [[ "$RESULT" == "OK" ]]; then
  # All files are up to date, no output needed
  exit 0
fi

if [[ "$RESULT" == STALE:* ]]; then
  STALE_COUNT=$(echo "$RESULT" | head -1 | sed 's/STALE://')
  CHECKLIST=$(echo "$RESULT" | tail -n +2)

  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  VERSION PROPAGATION CHECK -- v${LATEST_VERSION}                        ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  CHANGELOG.md updated. ${STALE_COUNT} file(s) need version updates:     ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo "$CHECKLIST"
  echo ""
  echo "  Update these files to reference v${MAJOR_MINOR}+ before committing."
  echo "  Content changes (new feature descriptions) need your reasoning."
  echo "  Mechanical changes (version strings, dates) can be find-replaced."
  echo ""
fi

exit 0
