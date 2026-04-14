/**
 * Guard A (advisory): Warn when running tests in a project with SurrealDB
 * migrations but no integration tests against a live instance.
 *
 * Guard B (blocking): Block phase completion if the phase modified SurrealDB
 * files but no integration tests exist or pass.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { resolve, join } from "path";
import type { GuardResult } from "./git-push.js";

/** Check if the project has SurrealDB migrations */
function hasSurrealMigrations(cwd: string): boolean {
  const migrationsDir = resolve(cwd, "server/migrations");
  if (!existsSync(migrationsDir)) return false;
  try {
    return readdirSync(migrationsDir).some((f) => f.endsWith(".surql"));
  } catch {
    return false;
  }
}

/** Check if integration tests exist that use db-setup (live SurrealDB) */
function hasLiveIntegrationTests(cwd: string): boolean {
  const integrationDir = resolve(cwd, "tests/integration");
  if (!existsSync(integrationDir)) return false;
  try {
    const files = readdirSync(integrationDir).filter((f) =>
      f.endsWith(".test.ts")
    );
    // At least one test file must import db-setup (the live DB harness)
    return files.some((f) => {
      try {
        const content = readFileSync(join(integrationDir, f), "utf-8");
        return content.includes("db-setup") || content.includes("setup()");
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

/** Check if a phase modified SurrealDB-related files */
function phaseModifiedSurrealFiles(cwd: string, phaseNum: string): boolean {
  const phasesDir = resolve(cwd, ".planning/phases");
  if (!existsSync(phasesDir)) return false;

  // Find the phase directory
  try {
    const dirs = readdirSync(phasesDir);
    const padded = phaseNum.padStart(2, "0");
    const phaseDir = dirs.find(
      (d) =>
        d === phaseNum ||
        d.startsWith(`${phaseNum}-`) ||
        d === padded ||
        d.startsWith(`${padded}-`)
    );
    if (!phaseDir) return false;

    // Check SUMMARY.md files for .surql or surrealdb-related files
    const fullPhaseDir = resolve(phasesDir, phaseDir);
    const summaries = readdirSync(fullPhaseDir).filter((f) =>
      f.endsWith("-SUMMARY.md")
    );

    for (const summary of summaries) {
      try {
        const content = readFileSync(join(fullPhaseDir, summary), "utf-8");
        if (
          content.includes(".surql") ||
          content.includes("encryption.ts") ||
          content.includes("entity-types.ts") ||
          content.includes("surql`") ||
          content.includes("surrealdb")
        ) {
          return true;
        }
      } catch {
        // Skip unreadable summaries
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Advisory guard: fires on vitest/test commands.
 * Returns additionalContext warning if SurrealDB migrations exist but
 * no live integration tests are found.
 */
export function guardSurrealTestAdvisory(
  command: string,
  cwd: string
): GuardResult & { additionalContext?: string } {
  // Only fire on test commands
  if (!/vitest|test/.test(command)) return { allow: true };

  if (!hasSurrealMigrations(cwd)) return { allow: true };

  if (hasLiveIntegrationTests(cwd)) return { allow: true };

  return {
    allow: true, // advisory, never blocks
    additionalContext: [
      "[SURREAL-TEST WARNING] This project has SurrealDB migrations but no live integration tests.",
      "Mock tests do NOT verify SurrealQL syntax, schema ASSERTs, or field constraints.",
      "",
      "Create tests/integration/db-setup.ts and write integration tests that run against",
      "a live SurrealDB instance. See Eleanor's tests/integration/ for the pattern.",
      "",
      "Bugs hidden by mocks in the past: invalid ASSERT values, unsupported multi-field",
      "FULLTEXT indexes, missing FLEXIBLE keyword, invalid IF/THEN/ELSE syntax.",
    ].join("\n"),
  };
}

/**
 * Blocking guard: fires on phase completion.
 * Blocks if the phase modified SurrealDB files but no integration tests exist.
 */
export function guardSurrealPhaseComplete(
  command: string,
  cwd: string
): GuardResult {
  // Only fire on phase completion commands
  if (!/gsd-tools.*phase\s+complete/.test(command)) return { allow: true };

  // Extract phase number
  const phaseMatch = command.match(/phase\s+complete\s+"?([0-9.]+)"?/);
  if (!phaseMatch) return { allow: true };

  const phaseNum = phaseMatch[1];

  // Only enforce if this phase touched SurrealDB files
  if (!phaseModifiedSurrealFiles(cwd, phaseNum)) return { allow: true };

  // Check that live integration tests exist
  if (!hasLiveIntegrationTests(cwd)) {
    return {
      allow: false,
      message: [
        `BLOCKED: Phase ${phaseNum} modified SurrealDB files but no live integration tests found.`,
        "",
        "Every phase that touches SurrealDB schemas or queries MUST have integration tests",
        "that run against a live SurrealDB instance. Mock tests hide schema bugs.",
        "",
        "Required:",
        "  1. Create tests/integration/db-setup.ts (live DB connect + migrate + teardown)",
        "  2. Write tests/integration/ tests that import db-setup and verify real queries",
        "  3. Run: npx vitest run tests/integration/",
        "",
        "To bypass (not recommended): rename this guard to .ts.disabled temporarily.",
      ].join("\n"),
    };
  }

  return { allow: true };
}
