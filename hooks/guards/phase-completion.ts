/**
 * Guard: Block GSD phase completion unless post-execution sequence was completed.
 * Checks for .post-execution-complete marker file.
 */

import { existsSync, readdirSync } from "fs";
import { resolve } from "path";
import { stripQuoted } from "../lib/stdin.js";
import type { GuardResult } from "./git-push.js";

export function guardPhaseCompletion(command: string): GuardResult {
  const stripped = stripQuoted(command);

  // Only intercept GSD phase completion commands
  if (!/gsd-tools.*phase\s+complete/.test(stripped)) {
    return { allow: true };
  }

  // Extract phase number
  const phaseMatch = stripped.match(
    /phase\s+complete\s+"?([0-9.]+)"?/
  );
  if (!phaseMatch) {
    // Can't determine phase number, let it through
    return { allow: true };
  }

  const phaseNum = phaseMatch[1];
  const phasesDir = resolve(process.cwd(), ".planning/phases");

  // Not a GSD project?
  if (!existsSync(phasesDir)) {
    return { allow: true };
  }

  // Find phase directory (handles "1", "01", "1.1" formats)
  let phaseDir: string | null = null;
  try {
    const dirs = readdirSync(phasesDir);

    // Try exact match first
    phaseDir =
      dirs.find((d) => d === phaseNum || d.startsWith(`${phaseNum}-`)) ??
      null;

    // Try zero-padded
    if (!phaseDir) {
      const padded = phaseNum.includes(".")
        ? phaseNum
        : phaseNum.padStart(2, "0");
      phaseDir =
        dirs.find(
          (d) => d === padded || d.startsWith(`${padded}-`)
        ) ?? null;
    }
  } catch {
    return { allow: true };
  }

  if (!phaseDir) {
    // Phase directory not found, let gsd-tools handle the error
    return { allow: true };
  }

  // Check for completion marker
  const markerPath = resolve(phasesDir, phaseDir, ".post-execution-complete");
  if (existsSync(markerPath)) {
    return { allow: true };
  }

  return {
    allow: false,
    message: [
      `BLOCKED: Post-execution sequence not completed for phase ${phaseNum}.`,
      "",
      "Run /scott:phase-closeout first. It handles verify, review, reflect, and gate.",
      "The marker file is created automatically when phase-closeout completes.",
      "To bypass: /scott:bypass",
    ].join("\n"),
  };
}
