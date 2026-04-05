#!/usr/bin/env bun
/**
 * pre-commit-hook.ts — Git pre-commit hook for scott-toolkit repo.
 * Runs sync, lint, and graph rebuild on every commit.
 */

import { exec } from "../src/exec.js";
import { toolkitPath } from "../src/paths.js";

async function main() {
  // Auto-sync generated sections (README, user-guide, setup.sh) from skill frontmatter
  const syncResult = await exec(
    `bun run ${toolkitPath("tools", "toolkit-sync.ts")}`,
    { timeout: 15_000 }
  );
  if (syncResult.ok) {
    // If sync updated files, stage them so they're included in the commit
    const hasUpdates = syncResult.stdout?.includes("UPDATED");
    if (hasUpdates) {
      await exec("git add README.md docs/user-guide.md setup.sh", {
        timeout: 5_000,
      });
      console.log("Docs synced and staged.");
    } else {
      console.log("Docs in sync.");
    }
  }

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
