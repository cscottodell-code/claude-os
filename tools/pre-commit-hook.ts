#!/usr/bin/env bun
/**
 * pre-commit-hook.ts — Git pre-commit hook for scott-toolkit repo.
 * Gates commits on toolkit-lint passing.
 */

import { exec } from "../src/exec.js";
import { toolkitPath } from "../src/paths.js";

async function main() {
  console.log("Running toolkit lint...");
  const result = await exec(
    `bun run ${toolkitPath("tools", "toolkit-lint.ts")}`,
    { timeout: 30_000 }
  );

  if (!result.ok) {
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
    console.error(
      "\nCommit blocked: toolkit-lint found issues. Fix them before committing."
    );
    process.exit(1);
  }

  console.log("Lint clean — commit allowed.");

  // Auto-rebuild dependency graph so impact analysis stays current
  const graphResult = await exec(
    `bun run ${toolkitPath("tools", "toolkit-graph.ts")} rebuild`,
    { timeout: 15_000 }
  );
  if (graphResult.ok) {
    console.log("Graph rebuilt.");
  }

  process.exit(0);
}

main();
