#!/usr/bin/env bun
/**
 * Guard: Lock-state enforcement on construction-process artifacts (Phase 4 Rule 4).
 *
 * Edits to Phase Plans (phase-status: locked) and ADRs (status: Accepted or
 * Decided-Conditional) require a revision-history entry dated today, added in
 * the same edit. The guard reads the pre-edit file content, checks the
 * lock-state field, and if locked, requires the new content to contain a
 * today-dated revision-history entry.
 *
 * Bypass: touch ~/.claude/.allow-lock-state for one-off authorization.
 * The marker is consumed (single-use) on the next allowed edit.
 *
 * TODAY override: set CLAUDE_LOCK_STATE_TODAY=YYYY-MM-DD to override the
 * "today" date. Used for verification testing against past commits.
 */

import { existsSync, readFileSync, unlinkSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

import { readStdin, getFilePath } from "../lib/stdin.js";
import { extractFrontmatter } from "../lib/frontmatter.js";

const BYPASS_MARKER = resolve(homedir(), ".claude/.allow-lock-state");
const CONFIG_PATH = resolve(homedir(), "Scott/claude-os/config/lock-states.json");

interface ArtifactType {
  path_pattern: string;
  lock_field: string;
  locked_values: string[];
}

interface LockStatesConfig {
  artifact_types: Record<string, ArtifactType>;
  revision_history: {
    today_entry_pattern: string;
    today_format: string;
  };
}

function getToday(): string {
  const override = process.env.CLAUDE_LOCK_STATE_TODAY;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  return new Date().toISOString().slice(0, 10);
}

function loadConfig(): LockStatesConfig | null {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as LockStatesConfig;
  } catch {
    return null;
  }
}

function classifyArtifact(
  filePath: string,
  config: LockStatesConfig
): { name: string; spec: ArtifactType } | null {
  for (const [name, spec] of Object.entries(config.artifact_types)) {
    const re = new RegExp(spec.path_pattern);
    if (re.test(filePath)) return { name, spec };
  }
  return null;
}

function isLocked(content: string, spec: ArtifactType): boolean {
  const fm = extractFrontmatter(content);
  if (!fm) return false;
  const value = fm.fields[spec.lock_field];
  if (typeof value !== "string") return false;
  return spec.locked_values.includes(value);
}

function hasTodayRevisionEntry(
  text: string,
  today: string,
  patternTemplate: string
): boolean {
  const pattern = patternTemplate.replace(/\{TODAY\}/g, today);
  const re = new RegExp(pattern);
  return re.test(text);
}

async function main() {
  const result = await readStdin();
  if (!result.ok) {
    console.log("guard-lock-state: stdin parse failed; blocking (fail-closed).");
    process.exit(2);
  }
  const input = result.input;
  if (!input) process.exit(0);

  const tool = input.tool_name;
  if (tool !== "Edit" && tool !== "Write") process.exit(0);

  const filePath = getFilePath(input);
  if (!filePath) process.exit(0);

  const config = loadConfig();
  if (!config) process.exit(0);

  const classified = classifyArtifact(filePath, config);
  if (!classified) process.exit(0);

  let preEditContent: string | null = null;
  try {
    preEditContent = readFileSync(filePath, "utf-8");
  } catch {
    if (tool === "Edit") process.exit(0);
  }

  if (preEditContent && !isLocked(preEditContent, classified.spec)) {
    process.exit(0);
  }

  const toolInput = input.tool_input as Record<string, unknown> | undefined;
  if (!toolInput) process.exit(0);

  const newText =
    (toolInput.new_string as string | undefined) ??
    (toolInput.content as string | undefined) ??
    "";

  if (tool === "Write" && newText) {
    if (!isLocked(newText, classified.spec)) process.exit(0);
  }

  const today = getToday();
  const patternTemplate = config.revision_history.today_entry_pattern;
  if (hasTodayRevisionEntry(newText, today, patternTemplate)) process.exit(0);

  if (tool === "Write" && preEditContent) {
    const preLocked = isLocked(preEditContent, classified.spec);
    const newLocked = isLocked(newText, classified.spec);
    if (preLocked && !newLocked) {
      console.log(
        `guard-lock-state: ${filePath} lock-state field is being unset by Write. ` +
          `If unlocking, add a revision-history entry dated ${today} in the same edit.`
      );
      process.exit(2);
    }
  }

  if (existsSync(BYPASS_MARKER)) {
    try {
      unlinkSync(BYPASS_MARKER);
    } catch {
      console.log(
        "guard-lock-state: bypass marker present but could not be consumed. Blocking."
      );
      process.exit(2);
    }
    console.log(
      `guard-lock-state: edit allowed by single-use bypass marker (${filePath}). Marker consumed.`
    );
    process.exit(0);
  }

  console.log(
    `Edit to locked ${classified.name} ${filePath} blocked. ` +
      `Phase 4 Rule 4 requires a revision-history entry dated ${today} added in the same edit. ` +
      `Add a line like "- **${today}.** <change summary>" under the "## Revision history" section. ` +
      `To authorize a one-off edit without revision history: touch ~/.claude/.allow-lock-state`
  );
  process.exit(2);
}

main();
