#!/usr/bin/env bun
/**
 * version-propagate.ts — PostToolUse: detect CHANGELOG.md edits,
 * extract version, and output checklist of stale references.
 * Pure TypeScript — no Python heredoc, no injection risk.
 */

import { existsSync, readFileSync } from "fs";
import { resolve, relative } from "path";
import { homedir } from "os";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";

// Get the edited file from env vars (PostToolUse pattern)
const editedFile =
  process.env.CLAUDE_TOOL_ARG_FILE_PATH ??
  process.env.CLAUDE_TOOL_ARG_file_path ??
  "";

if (!editedFile) process.exit(0);

const TOOLKIT_DIR = toolkitPath();
const CHANGELOG = toolkitPath("CHANGELOG.md");

// Resolve both to absolute paths for comparison
function realPath(p: string): string {
  try {
    const dir = resolve(p, "..");
    return resolve(dir, p.split("/").pop()!);
  } catch {
    return p;
  }
}

if (realPath(editedFile) !== realPath(CHANGELOG)) process.exit(0);
if (!existsSync(CHANGELOG)) process.exit(0);

// Extract latest version from CHANGELOG
const changelog = readFileSync(CHANGELOG, "utf-8");
const versionMatch = changelog.match(/^## v(\d+\.\d+\.\d+)/m);
if (!versionMatch) {
  console.log("VERSION-PROPAGATE: Could not extract version from CHANGELOG.md");
  process.exit(0);
}

const version = versionMatch[1];
const majorMinor = version.replace(/\.\d+$/, "");
const dateMatch = changelog.match(
  /^## v[\d.]+ - (\d{4}-\d{2}-\d{2})/m
);
const changelogDate = dateMatch?.[1] ?? "";

// Read manifest
interface ManifestEntry {
  path: string;
  description?: string;
  check?: string;
}

interface Manifest {
  files?: ManifestEntry[];
  external_files?: ManifestEntry[];
}

const manifest = await readJson<Manifest>(
  toolkitPath("config", "version-manifest.json")
);

if (!manifest) {
  console.log("VERSION-PROPAGATE: version-manifest.json not found.");
  process.exit(0);
}

function checkFile(
  fullPath: string,
  displayPath: string,
  desc: string,
  checkType: string
): string | null {
  if (!existsSync(fullPath)) {
    return `  [ ] ${displayPath} -- FILE NOT FOUND (${desc})`;
  }

  const content = readFileSync(fullPath, "utf-8");

  if (checkType === "date_freshness" && changelogDate) {
    if (content.includes(changelogDate)) return null;
  } else {
    if (
      content.includes(`v${version}`) ||
      content.includes(`v${majorMinor}`)
    ) {
      return null;
    }
  }

  const refs = content.match(/v\d+\.\d+(?:\.\d+)?/g);
  const current = refs?.[0] ?? "none";
  return `  [ ] ${displayPath} -- ${desc} (has ${current}, needs v${majorMinor}+)`;
}

const stale: string[] = [];

// Check toolkit-relative files
for (const entry of manifest.files ?? []) {
  const result = checkFile(
    resolve(TOOLKIT_DIR, entry.path),
    entry.path,
    entry.description ?? "",
    entry.check ?? ""
  );
  if (result) stale.push(result);
}

// Check external files
const sitesDir = resolve(homedir(), "Sites");
for (const entry of manifest.external_files ?? []) {
  const result = checkFile(
    resolve(sitesDir, entry.path),
    `~/Sites/${entry.path}`,
    entry.description ?? "",
    entry.check ?? ""
  );
  if (result) stale.push(result);
}

if (stale.length === 0) process.exit(0);

console.log("");
console.log("=".repeat(60));
console.log(`  VERSION PROPAGATION CHECK -- v${version}`);
console.log("=".repeat(60));
console.log(
  `  CHANGELOG.md updated. ${stale.length} file(s) need version updates:`
);
console.log("-".repeat(60));
for (const line of stale) console.log(line);
console.log("");
console.log(
  `  Update these files to reference v${majorMinor}+ before committing.`
);
console.log(
  "  Content changes need your reasoning. Version strings can be find-replaced."
);
console.log("");

process.exit(0);
