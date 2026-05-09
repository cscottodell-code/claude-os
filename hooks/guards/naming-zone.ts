#!/usr/bin/env bun
/**
 * Guard: Naming-zone enforcement (Phase 4 Rule 2 + 5; Phase 2 Rule 1).
 *
 * Wiki zone (six domains, Home.md, identity.md, system/ topic hubs at root):
 *   Title Case + spaces. Acronyms preserved all-caps.
 * Tooling zone (raw/, system/build-plans/, system/projects/, system/adrs/, claude-os/):
 *   lowercase-hyphen, with ADR-NNN- and phase-N- prefixes preserved, plus
 *   YYYY-MM-DD- dated artifact prefix.
 *
 * Standalone main(): fires on Write tool (file creation). Validates the
 * destination filename against zone-appropriate pattern.
 *
 * Exported guardNamingZoneCommand(): used by pretooluse-router.ts for Bash
 * mv and obsidian move commands. Validates the destination path of the move.
 *
 * Bypass: touch ~/.claude/.allow-naming-zone for single-use authorization.
 */

import { existsSync, readFileSync, unlinkSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

import { readStdin, getFilePath } from "../lib/stdin.js";

interface GuardResult {
  allow: boolean;
  message?: string;
}

const BYPASS_MARKER = resolve(homedir(), ".claude/.allow-naming-zone");
const CONFIG_PATH = resolve(
  homedir(),
  "Scott/claude-os/config/naming-zones.json"
);

interface NamingZonesConfig {
  classification_rules: {
    rules: Array<{ path_pattern: string; zone: "wiki" | "tooling" }>;
  };
  zone_filename_patterns: {
    wiki: { valid_pattern: string };
    tooling: { valid_patterns: string[] };
  };
  exempt_files: { path_prefixes: string[] };
  scope: { include_prefixes: string[] };
}

function loadConfig(): NamingZonesConfig | null {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as NamingZonesConfig;
  } catch {
    return null;
  }
}

function inScope(filePath: string, scope: NamingZonesConfig["scope"]): boolean {
  return scope.include_prefixes.some((p) => filePath.includes("/" + p));
}

function isExempt(
  filePath: string,
  exempt: NamingZonesConfig["exempt_files"]
): boolean {
  return exempt.path_prefixes.some((p) => filePath.includes("/" + p));
}

function classifyZone(
  filePath: string,
  config: NamingZonesConfig
): "wiki" | "tooling" | null {
  for (const rule of config.classification_rules.rules) {
    if (new RegExp(rule.path_pattern).test(filePath)) return rule.zone;
  }
  return null;
}

function validateFilename(
  filePath: string,
  zone: "wiki" | "tooling",
  config: NamingZonesConfig
): { ok: boolean; reason?: string } {
  const filename = filePath.split("/").pop() ?? "";
  if (zone === "wiki") {
    const re = new RegExp(config.zone_filename_patterns.wiki.valid_pattern);
    if (re.test(filename)) return { ok: true };
    return {
      ok: false,
      reason: `Wiki zone requires Title Case + spaces (e.g. "Cleanup Candidates.md"). Filename "${filename}" does not match.`,
    };
  }
  const patterns = config.zone_filename_patterns.tooling.valid_patterns;
  for (const p of patterns) {
    if (new RegExp(p).test(filename)) return { ok: true };
  }
  return {
    ok: false,
    reason: `Tooling zone requires lowercase-hyphen (e.g. "phase-2-framing.md", "ADR-004-name.md", "2026-05-08-name.md"). Filename "${filename}" does not match.`,
  };
}

export function checkPath(
  filePath: string
): { ok: boolean; message?: string; zone?: "wiki" | "tooling" } {
  const config = loadConfig();
  if (!config) return { ok: true };
  if (!inScope(filePath, config.scope)) return { ok: true };
  if (isExempt(filePath, config.exempt_files)) return { ok: true };
  const zone = classifyZone(filePath, config);
  if (!zone) return { ok: true };
  const result = validateFilename(filePath, zone, config);
  if (result.ok) return { ok: true, zone };
  return {
    ok: false,
    zone,
    message: `Naming-zone violation (${zone} zone): ${result.reason}`,
  };
}

const MV_PATTERN = /(?:^|\s|&&|\|;)\s*(?:mv|obsidian\s+move)\s+(.+?)\s+(.+?)(?:\s|$|;|&&|\|)/;

export function guardNamingZoneCommand(command: string): GuardResult {
  const match = command.match(MV_PATTERN);
  if (!match) return { allow: true };
  const dest = match[2].replace(/^['"]|['"]$/g, "").replace(/\s*;\s*$/, "");
  const destAbs = dest.startsWith("/") ? dest : resolve(process.cwd(), dest);
  const result = checkPath(destAbs);
  if (result.ok) return { allow: true };
  return {
    allow: false,
    message: `${result.message}\nTo authorize a one-off rename: touch ~/.claude/.allow-naming-zone`,
  };
}

async function main() {
  const result = await readStdin();
  if (!result.ok) {
    console.log("guard-naming-zone: stdin parse failed; blocking (fail-closed).");
    process.exit(2);
  }
  const input = result.input;
  if (!input) process.exit(0);

  const tool = input.tool_name;
  if (tool !== "Write") process.exit(0);

  const filePath = getFilePath(input);
  if (!filePath) process.exit(0);

  const check = checkPath(filePath);
  if (check.ok) process.exit(0);

  if (existsSync(BYPASS_MARKER)) {
    try {
      unlinkSync(BYPASS_MARKER);
    } catch {
      console.log("guard-naming-zone: bypass marker present but could not be consumed. Blocking.");
      process.exit(2);
    }
    console.log(
      `guard-naming-zone: write allowed by single-use bypass marker (${filePath}). Marker consumed.`
    );
    process.exit(0);
  }

  console.log(
    `${check.message}\nTo authorize a one-off filename: touch ~/.claude/.allow-naming-zone`
  );
  process.exit(2);
}

if (import.meta.main) {
  main();
}
