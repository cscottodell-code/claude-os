#!/usr/bin/env bun
/**
 * validate-stack-lock.ts — Validate a project's stack-lock.json against the schema
 * and check that referenced technologies have matching check files.
 *
 * Usage: bun run tools/validate-stack-lock.ts [project-path]
 *
 * Called by session-start.ts and stack-detect.ts.
 * Exit 0 = valid, Exit 1 = errors found, Exit 2 = file not found.
 */

import { resolve } from "path";
import { existsSync } from "fs";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";

interface StackLockTech {
  version: string;
  sdk?: string;
  audit: boolean;
}

interface StackLock {
  schema_version?: string;
  locked?: string;
  last_reviewed?: string;
  approved_by?: string;
  tier?: string;
  technologies?: Record<string, StackLockTech>;
  exceptions?: Array<{ check_id: string; file: string; reason: string }>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const REQUIRED_FIELDS = [
  "schema_version",
  "locked",
  "approved_by",
  "tier",
  "technologies",
] as const;

const VALID_SCHEMA_VERSIONS = ["1.0", "1.1"];
const VALID_TIERS = ["full", "experiment"];
const STALENESS_DAYS = 30;

function validateStructure(data: StackLock): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate schema_version
  if (
    data.schema_version &&
    !VALID_SCHEMA_VERSIONS.includes(data.schema_version)
  ) {
    errors.push(
      `Invalid schema_version "${data.schema_version}". Expected one of: ${VALID_SCHEMA_VERSIONS.join(", ")}`
    );
  }

  // Validate tier
  if (data.tier && !VALID_TIERS.includes(data.tier)) {
    errors.push(
      `Invalid tier "${data.tier}". Expected one of: ${VALID_TIERS.join(", ")}`
    );
  }

  // Validate date fields
  for (const field of ["locked", "last_reviewed"] as const) {
    if (data[field] && !/^\d{4}-\d{2}-\d{2}$/.test(data[field]!)) {
      errors.push(
        `Invalid date format for ${field}: "${data[field]}". Expected YYYY-MM-DD.`
      );
    }
  }

  // Validate technologies have required subfields
  if (data.technologies && typeof data.technologies === "object") {
    for (const [name, tech] of Object.entries(data.technologies)) {
      if (!tech.version) {
        errors.push(`Technology "${name}" is missing required field: version`);
      }
      if (tech.audit === undefined) {
        errors.push(`Technology "${name}" is missing required field: audit`);
      }
    }
  }

  // Validate exceptions structure
  if (data.exceptions && Array.isArray(data.exceptions)) {
    for (let i = 0; i < data.exceptions.length; i++) {
      const exc = data.exceptions[i];
      if (!exc.check_id) errors.push(`Exception [${i}] missing check_id`);
      if (!exc.file) errors.push(`Exception [${i}] missing file`);
      if (!exc.reason) errors.push(`Exception [${i}] missing reason`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

function checkStaleness(data: StackLock): string | null {
  const reviewDate = data.last_reviewed ?? data.locked;
  if (!reviewDate) return null;

  const reviewed = new Date(reviewDate);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - reviewed.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince > STALENESS_DAYS) {
    return `Stack lock last reviewed ${daysSince} days ago (${reviewDate}). Consider running stack-preflight to verify your environment is current.`;
  }
  return null;
}

function checkTechFiles(
  technologies: Record<string, StackLockTech>
): { missing: string[]; found: string[] } {
  const missing: string[] = [];
  const found: string[] = [];

  for (const [name, tech] of Object.entries(technologies)) {
    if (!tech.audit) continue;
    const checkPath = toolkitPath("checks", `${name}.json`);
    if (existsSync(checkPath)) {
      found.push(name);
    } else {
      missing.push(name);
    }
  }

  return { missing, found };
}

async function main() {
  const projectPath = process.argv[2] ?? process.cwd();
  const stackLockPath = resolve(projectPath, "stack-lock.json");

  if (!existsSync(stackLockPath)) {
    console.log(`No stack-lock.json found at ${stackLockPath}`);
    process.exit(2);
  }

  const data = await readJson<StackLock>(stackLockPath);
  if (!data) {
    console.log(`Failed to parse ${stackLockPath}`);
    process.exit(1);
  }

  // Structure validation
  const result = validateStructure(data);

  // Staleness check
  const staleWarning = checkStaleness(data);
  if (staleWarning) result.warnings.push(staleWarning);

  // Check file coverage
  if (data.technologies) {
    const { missing, found } = checkTechFiles(data.technologies);
    if (missing.length > 0) {
      result.warnings.push(
        `No check files for audited technologies: ${missing.join(", ")}`
      );
    }
    if (found.length > 0) {
      console.log(`Check files found for: ${found.join(", ")}`);
    }
  }

  // Report
  if (result.errors.length > 0) {
    console.log("\n❌ Validation errors:");
    for (const err of result.errors) console.log(`  - ${err}`);
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    for (const warn of result.warnings) console.log(`  - ${warn}`);
  }

  if (result.errors.length === 0) {
    console.log("\n✅ stack-lock.json is valid");
  }

  process.exit(result.errors.length > 0 ? 1 : 0);
}

main();
