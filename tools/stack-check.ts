#!/usr/bin/env bun
/**
 * stack-check.ts — Run static code checks from check files against a project.
 * Reads stack-lock.json to determine which checks to run.
 *
 * Usage: bun run tools/stack-check.ts [project-path]
 */

import { resolve, relative } from "path";
import { existsSync, readdirSync } from "fs";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";
import { exec } from "../src/exec.js";

interface CheckDef {
  id: string;
  pattern: string;
  message: string;
  severity: "error" | "warning" | "info";
  file_filter?: string;
}

interface CheckFile {
  technology: string;
  checks: {
    static: CheckDef[];
    live?: unknown[];
  };
}

interface StackLock {
  technologies: Record<string, { version: string; audit: boolean }>;
  exceptions?: Array<{ check_id: string; file: string; reason: string }>;
}

interface Violation {
  check_id: string;
  file: string;
  line: number;
  message: string;
  severity: string;
  match: string;
}

const EXCLUSIONS = [
  "node_modules",
  ".git",
  ".planning",
  ".nuxt",
  ".output",
  "dist",
];

async function findCheckFiles(techs: string[]): Promise<CheckFile[]> {
  const results: CheckFile[] = [];
  for (const tech of techs) {
    const checkPath = toolkitPath("checks", `${tech}.json`);
    const data = await readJson<CheckFile>(checkPath);
    if (data) results.push(data);
  }
  return results;
}

async function runCheck(
  check: CheckDef,
  projectPath: string,
  exceptions: Set<string>
): Promise<Violation[]> {
  const excludeArgs = EXCLUSIONS.map((e) => `--exclude-dir=${e}`).join(" ");
  const fileFilter = check.file_filter
    ? `--include='${check.file_filter}'`
    : "";

  // Escape single quotes in pattern for shell safety
  const escapedPattern = check.pattern.replace(/'/g, "'\\''");
  const cmd = `grep -rnE ${fileFilter} ${excludeArgs} '${escapedPattern}' '${projectPath}' 2>/dev/null || true`;
  const result = await exec(cmd, { timeout: 15_000 });

  if (!result.stdout) return [];

  const violations: Violation[] = [];
  for (const line of result.stdout.split("\n")) {
    if (!line.trim()) continue;

    const match = line.match(/^(.+?):(\d+):(.*)$/);
    if (!match) continue;

    const [, filePath, lineNum, content] = match;
    const relPath = relative(projectPath, filePath);

    // Skip excepted files
    const exceptionKey = `${check.id}:${relPath}`;
    if (exceptions.has(exceptionKey)) continue;

    violations.push({
      check_id: check.id,
      file: relPath,
      line: parseInt(lineNum, 10),
      message: check.message,
      severity: check.severity,
      match: content.trim().substring(0, 120),
    });
  }

  return violations;
}

async function main() {
  const projectPath = resolve(process.argv[2] ?? ".");
  const lockPath = resolve(projectPath, "stack-lock.json");
  const lock = await readJson<StackLock>(lockPath);

  // Determine technologies to check
  let techs: string[];
  if (lock) {
    techs = Object.entries(lock.technologies)
      .filter(([, v]) => v.audit)
      .map(([k]) => k);
  } else {
    // No stack-lock: discover from available check files
    const skipFiles = new Set(["metrics.json", "stack-lock.schema.json"]);
    techs = readdirSync(toolkitPath("checks"))
      .filter((f) => f.endsWith(".json") && !skipFiles.has(f))
      .map((f) => f.replace(".json", ""));
  }

  // Build exceptions set
  const exceptions = new Set<string>();
  if (lock?.exceptions) {
    for (const ex of lock.exceptions) {
      exceptions.add(`${ex.check_id}:${ex.file}`);
    }
  }

  // Load and run checks
  const checkFiles = await findCheckFiles(techs);
  const allViolations: Violation[] = [];

  for (const cf of checkFiles) {
    for (const check of cf.checks.static) {
      const violations = await runCheck(check, projectPath, exceptions);
      allViolations.push(...violations);
    }
  }

  // Output
  const errors = allViolations.filter((v) => v.severity === "error");
  const warnings = allViolations.filter((v) => v.severity === "warning");

  if (allViolations.length === 0) {
    console.log(`stack-check: ${techs.join(", ")} — 0 issues found`);
    process.exit(0);
  }

  console.log(`stack-check: ${allViolations.length} issue(s) found\n`);
  for (const v of allViolations) {
    const icon = v.severity === "error" ? "ERROR" : "WARN";
    console.log(`  [${icon}] ${v.check_id}: ${v.file}:${v.line}`);
    console.log(`         ${v.message}`);
    console.log(`         ${v.match}`);
    console.log("");
  }

  console.log(
    `Summary: ${errors.length} error(s), ${warnings.length} warning(s)`
  );
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
