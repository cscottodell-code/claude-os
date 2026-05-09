#!/usr/bin/env bun
/**
 * toolkit-coherence-check.ts: PostToolUse hook that validates cross-references
 * when toolkit files are modified. Reads banned patterns from
 * config/banned-patterns.json (filtered by scope harness|both) and warns on
 * any matches in the edited file. The companion vault guard
 * (hooks/guards/coherence-check-vault.ts) reads the same file filtered by
 * scope vault|both.
 */

import { readFileSync } from "fs";
import { readStdinSimple, getFilePath } from "./lib/stdin.js";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";

const input = await readStdinSimple();
if (!input) process.exit(0);

const filePath = getFilePath(input);
if (!filePath || !filePath.includes("claude-os")) process.exit(0);

interface BannedPatternsConfig {
  banned?: Array<{
    pattern: string;
    reason: string;
    replacement: string;
    scope: "harness" | "vault" | "both";
  }>;
}

const config = await readJson<BannedPatternsConfig>(
  toolkitPath("config", "banned-patterns.json")
);

const banned = (config?.banned ?? []).filter(
  (entry) => entry.scope === "harness" || entry.scope === "both"
);
if (banned.length === 0) process.exit(0);

try {
  const content = readFileSync(filePath, "utf-8");
  const warnings: string[] = [];

  for (const entry of banned) {
    if (content.includes(entry.pattern)) {
      warnings.push(
        `  "${entry.pattern}": ${entry.reason}\n  Replace with: ${entry.replacement}`
      );
    }
  }

  if (warnings.length > 0) {
    console.log(
      `\nToolkit coherence: ${warnings.length} banned pattern(s) in edited file:\n`
    );
    console.log(warnings.join("\n\n"));
    console.log("");
  }
} catch {
  // File not readable, skip
}

process.exit(0);
