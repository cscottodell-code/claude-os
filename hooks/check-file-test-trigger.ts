#!/usr/bin/env bun
/**
 * check-file-test-trigger.ts — PostToolUse: auto-test check files
 * when checks/*.json files are modified.
 */

import { existsSync, readdirSync } from "fs";
import { basename, resolve } from "path";
import { readStdin, getFilePath } from "./lib/stdin.js";
import { toolkitPath } from "../src/paths.js";
import { exec } from "../src/exec.js";

const input = await readStdin();
if (!input) process.exit(0);

const filePath = getFilePath(input) ?? process.env.CLAUDE_TOOL_ARG_FILE_PATH ?? process.env.CLAUDE_TOOL_ARG_file_path;
if (!filePath) process.exit(0);

// Only trigger on .json files in checks/ directory
if (!filePath.includes("/checks/") || !filePath.endsWith(".json")) process.exit(0);

const fileName = basename(filePath);
if (fileName === "metrics.json" || fileName === "stack-lock.schema.json") process.exit(0);

const tech = fileName.replace(".json", "");
const fixturesDir = toolkitPath("checks", "fixtures", tech);

if (!existsSync(fixturesDir)) {
  console.log(`check-file-test: No fixtures for ${tech}. Create checks/fixtures/${tech}/{good,bad}/ to enable auto-testing.`);
  process.exit(0);
}

console.log(`\ncheck-file-test: Testing ${tech} check file...\n`);

let passed = 0;
let failed = 0;

// Test "good" fixtures (expect PASS = 0 violations)
const goodDir = resolve(fixturesDir, "good");
if (existsSync(goodDir)) {
  const result = await exec(
    `bun run ${toolkitPath("tools", "stack-check.ts")} "${goodDir}"`,
    { timeout: 15_000 }
  );
  if (result.stdout.includes("0 issues")) {
    console.log(`  PASS: good fixtures — no violations (expected)`);
    passed++;
  } else {
    console.log(`  WARN: good fixtures produced violations (false positives)`);
    failed++;
  }
}

// Test "bad" fixtures (expect FAIL = violations found)
const badDir = resolve(fixturesDir, "bad");
if (existsSync(badDir)) {
  const result = await exec(
    `bun run ${toolkitPath("tools", "stack-check.ts")} "${badDir}"`,
    { timeout: 15_000 }
  );
  if (!result.stdout.includes("0 issues")) {
    console.log(`  PASS: bad fixtures — violations found (expected)`);
    passed++;
  } else {
    console.log(`  WARN: bad fixtures produced no violations (false negatives)`);
    failed++;
  }
}

console.log(`\n  Results: ${passed} passed, ${failed} warnings\n`);

process.exit(0);
