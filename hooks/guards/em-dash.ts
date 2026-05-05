#!/usr/bin/env bun
/**
 * Guard: Block Edit/Write that introduces em dashes (U+2014) into file content.
 *
 * Scott's rule: no em dashes in content other people will see (shipped app
 * code, public docs, PRs, READMEs). The agent has a strong training-data
 * bias toward them, so this guard exists as a backstop.
 *
 * Scope: blocks em dashes by default. Personal/internal zones are exempt.
 * Allowed prefixes (em dashes permitted): ~/Scott/growth-os/,
 * ~/Scott/claude-os/, ~/.claude/. Anything else, including
 * ~/Scott/claude-projects/, gets blocked.
 *
 * Exempt: text inside fenced code blocks (between ``` fences) is not scanned,
 * so source-code samples that contain a stray em dash are not blocked.
 *
 * Bypass: touch ~/.claude/.allow-em-dash creates a single-use marker that the
 * guard consumes on the next allowed edit. Default behavior (block) stays.
 */

import { existsSync, unlinkSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

import { readStdin, getFilePath } from "../lib/stdin.js";

const EM_DASH = "—";
const BYPASS_MARKER = resolve(homedir(), ".claude/.allow-em-dash");
const ALLOWED_PREFIXES = [
  resolve(homedir(), "Scott/growth-os"),
  resolve(homedir(), "Scott/claude-os"),
  resolve(homedir(), ".claude"),
];

function isAllowedPath(filePath: string | null | undefined): boolean {
  if (!filePath) return false;
  return ALLOWED_PREFIXES.some(
    (prefix) => filePath === prefix || filePath.startsWith(prefix + "/")
  );
}

function stripFencedCodeBlocks(text: string): string {
  // Remove ```...``` fenced regions (greedy across lines) before scanning.
  return text.replace(/```[\s\S]*?```/g, "");
}

function findOffendingLine(text: string): { line: number; preview: string } | null {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(EM_DASH)) {
      return { line: i + 1, preview: lines[i].trim().slice(0, 120) };
    }
  }
  return null;
}

async function main() {
  const result = await readStdin();
  if (!result.ok) {
    console.log("guard-em-dash: stdin parse failed; blocking (fail-closed).");
    process.exit(2);
  }

  const input = result.input;
  if (!input) process.exit(0);

  const tool = input.tool_name;
  if (tool !== "Edit" && tool !== "Write") process.exit(0);

  const toolInput = input.tool_input as Record<string, unknown> | undefined;
  if (!toolInput) process.exit(0);

  const filePath = getFilePath(input);
  if (isAllowedPath(filePath)) process.exit(0);

  const newContent =
    (toolInput.new_string as string | undefined) ??
    (toolInput.content as string | undefined);
  if (!newContent || typeof newContent !== "string") process.exit(0);

  const scanText = stripFencedCodeBlocks(newContent);
  if (!scanText.includes(EM_DASH)) process.exit(0);

  if (existsSync(BYPASS_MARKER)) {
    try {
      unlinkSync(BYPASS_MARKER);
    } catch {
      console.log(
        "guard-em-dash: bypass marker present but could not be consumed. Blocking."
      );
      process.exit(2);
    }
    console.log(
      "guard-em-dash: em dash allowed by single-use bypass marker. Marker consumed."
    );
    process.exit(0);
  }

  const offending = findOffendingLine(scanText);
  const location = offending
    ? `line ${offending.line}: "${offending.preview}"`
    : "(line unknown)";

  console.log(
    `Em dash (U+2014) detected in new content for ${filePath ?? "(unknown file)"} at ${location}. Identity rule says never use em dashes; replace with comma, period, semicolon, or restructure the sentence. To authorize a one-off em dash, touch ~/.claude/.allow-em-dash from your terminal.`
  );
  process.exit(2);
}

main();
