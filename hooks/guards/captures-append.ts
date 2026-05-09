#!/usr/bin/env bun
/**
 * Guard: Append-only set-preservation under "## Captures" in daily notes
 * (Phase 4 Rule 2; current expression Item 3; Phase 3b Rule 2).
 *
 * The daily note's "## Captures" section is set-preservation append-only:
 *   - Pre-edit lines under "## Captures" (set L) must appear verbatim post-edit.
 *   - New post-edit lines (L' \ L) must all follow the existing lines.
 *   - Lines outside "## Captures" are unconstrained by this rule.
 *
 * Bypass: touch ~/.claude/.allow-captures-append for single-use authorization
 * (rare; redaction or correction).
 */

import { existsSync, readFileSync, unlinkSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

import { readStdin, getFilePath } from "../lib/stdin.js";

const BYPASS_MARKER = resolve(homedir(), ".claude/.allow-captures-append");
const DAILY_NOTE_PATTERN = /\/Scott\/growth-os\/daily\/.+\.md$/;
const CAPTURES_HEADING = /^##\s+Captures\s*$/;
const NEXT_HEADING = /^##\s+\S/;

function extractCapturesLines(content: string): string[] | null {
  const lines = content.split(/\r?\n/);
  let inSection = false;
  const captured: string[] = [];
  for (const line of lines) {
    if (!inSection) {
      if (CAPTURES_HEADING.test(line)) {
        inSection = true;
      }
      continue;
    }
    if (NEXT_HEADING.test(line)) break;
    if (line.trim() === "") continue;
    captured.push(line);
  }
  if (!inSection) return null;
  return captured;
}

function isSetPreservingAppend(pre: string[], post: string[]): { ok: true } | { ok: false; reason: string } {
  if (post.length < pre.length) {
    return { ok: false, reason: `Captures section shrank (${pre.length} non-empty lines pre, ${post.length} post). Set-preservation requires existing lines to remain.` };
  }
  for (let i = 0; i < pre.length; i++) {
    if (post[i] !== pre[i]) {
      return {
        ok: false,
        reason: `Existing captures line at position ${i + 1} changed. Pre: "${pre[i].slice(0, 80)}". Post: "${post[i].slice(0, 80)}". Set-preservation requires verbatim preservation of existing lines.`,
      };
    }
  }
  return { ok: true };
}

async function main() {
  const result = await readStdin();
  if (!result.ok) {
    console.log("guard-captures-append: stdin parse failed; blocking (fail-closed).");
    process.exit(2);
  }
  const input = result.input;
  if (!input) process.exit(0);

  const tool = input.tool_name;
  if (tool !== "Edit" && tool !== "Write") process.exit(0);

  const filePath = getFilePath(input);
  if (!filePath || !DAILY_NOTE_PATTERN.test(filePath)) process.exit(0);

  let preEditContent: string;
  try {
    preEditContent = readFileSync(filePath, "utf-8");
  } catch {
    process.exit(0);
  }

  const preCaptures = extractCapturesLines(preEditContent);
  if (preCaptures === null) process.exit(0);

  const toolInput = input.tool_input as Record<string, unknown> | undefined;
  if (!toolInput) process.exit(0);

  let postEditContent: string;
  if (tool === "Write") {
    postEditContent = (toolInput.content as string | undefined) ?? "";
  } else {
    const oldStr = (toolInput.old_string as string | undefined) ?? "";
    const newStr = (toolInput.new_string as string | undefined) ?? "";
    if (oldStr === "") process.exit(0);
    if (!preEditContent.includes(oldStr)) process.exit(0);
    postEditContent = preEditContent.replace(oldStr, newStr);
  }

  const postCaptures = extractCapturesLines(postEditContent);
  if (postCaptures === null) {
    console.log(
      `guard-captures-append: ${filePath} edit removes the "## Captures" section. Section is structurally protected (Phase 3b Rule 2; Phase 4 Item 3). To authorize: touch ~/.claude/.allow-captures-append`
    );
    process.exit(2);
  }

  const check = isSetPreservingAppend(preCaptures, postCaptures);
  if (check.ok) process.exit(0);

  if (existsSync(BYPASS_MARKER)) {
    try {
      unlinkSync(BYPASS_MARKER);
    } catch {
      console.log("guard-captures-append: bypass marker present but could not be consumed. Blocking.");
      process.exit(2);
    }
    console.log(
      `guard-captures-append: edit allowed by single-use bypass marker (${filePath}). Marker consumed.`
    );
    process.exit(0);
  }

  console.log(
    `guard-captures-append: ${filePath} violates set-preservation: ${check.reason}\n` +
      `Captures are append-only during the day; classification and routing happen at Stage 2 nightly ingest.\n` +
      `To authorize a one-off (redaction or correction): touch ~/.claude/.allow-captures-append`
  );
  process.exit(2);
}

main();
