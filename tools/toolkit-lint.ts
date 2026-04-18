#!/usr/bin/env bun
/**
 * toolkit-lint.ts — Comprehensive integrity checker for scott-toolkit.
 * Three sections: stale patterns, skill integrity, hook integrity.
 *
 * Usage: bun run tools/toolkit-lint.ts [--section=patterns|skills|hooks] [--fix]
 *
 * Exit codes: 0 = clean, 1 = issues found
 */

import { resolve, basename, relative } from "path";
import {
  existsSync,
  readdirSync,
  readFileSync,
  lstatSync,
  readlinkSync,
} from "fs";
import { readJson } from "../src/json.js";
import { toolkitPath, claudePath } from "../src/paths.js";
import { exec } from "../src/exec.js";

// --- Args ---
const args = process.argv.slice(2);
const sectionFilter = args
  .find((a) => a.startsWith("--section="))
  ?.split("=")[1];
const fixMode = args.includes("--fix");

let issueCount = 0;

function issue(section: string, msg: string) {
  issueCount++;
  console.log(`  [${section}] ${msg}`);
}

// --- Section 1: Stale Patterns ---

async function checkStalePatterns() {
  console.log("1. Checking stale patterns...");

  interface VersionManifest {
    banned_patterns?: Array<{
      pattern: string;
      replacement: string;
      description: string;
    }>;
  }

  const manifest = await readJson<VersionManifest>(
    toolkitPath("config", "version-manifest.json")
  );

  if (!manifest?.banned_patterns) {
    console.log("   SKIP: No banned_patterns in version-manifest.json");
    return;
  }

  // Scan all .md files in toolkit
  const result = await exec(
    `find ${toolkitPath()} -name '*.md' -not -path '*/node_modules/*' -not -path '*/.git/*'`,
    { timeout: 10_000 }
  );

  const mdFiles = result.stdout.split("\n").filter(Boolean);

  // Also check external CLAUDE.md files
  const externalFiles = [
    claudePath("CLAUDE.md"),
    resolve(toolkitPath(), "../../CLAUDE.md"),
  ].filter(existsSync);

  const allFiles = [...mdFiles, ...externalFiles];

  for (const banned of manifest.banned_patterns) {
    for (const filePath of allFiles) {
      try {
        const content = readFileSync(filePath, "utf-8");
        if (content.includes(banned.pattern)) {
          const display = relative(toolkitPath(), filePath) || filePath;
          issue(
            "patterns",
            `"${banned.pattern}" in ${display} — ${banned.description}`
          );

          if (fixMode) {
            const updated = content.replaceAll(
              banned.pattern,
              banned.replacement
            );
            await Bun.write(filePath, updated);
            console.log(
              `         FIXED: replaced with "${banned.replacement}"`
            );
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
}

// --- Section 2: Skill Integrity ---

async function checkSkillIntegrity() {
  console.log("\n2. Checking skill integrity...");

  const skillsSource = toolkitPath("skills");
  const skillsDeploy = claudePath("skills");

  if (!existsSync(skillsSource)) {
    console.log("   SKIP: No skills/ directory");
    return;
  }

  // Check each skill directory has SKILL.md
  const skillDirs = readdirSync(skillsSource, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of skillDirs) {
    const skillMd = resolve(skillsSource, dir, "SKILL.md");
    if (!existsSync(skillMd)) {
      issue("skills", `${dir}/ missing SKILL.md`);
    }
  }

  // Check for orphaned deployments
  if (existsSync(skillsDeploy)) {
    const deployed = readdirSync(skillsDeploy, { withFileTypes: true })
      .filter((d) => d.isDirectory() || d.isSymbolicLink())
      .map((d) => d.name);

    for (const dep of deployed) {
      const depPath = resolve(skillsDeploy, dep);
      try {
        if (
          lstatSync(depPath).isSymbolicLink() &&
          !existsSync(depPath)
        ) {
          issue(
            "skills",
            `Orphaned symlink: ~/.claude/skills/${dep} -> ${readlinkSync(depPath)}`
          );
        }
      } catch {
        // Skip if stat fails
      }
    }
  }

  // Check workflow-generated skills have source workflows
  const workflowsDir = toolkitPath("workflows");
  if (existsSync(workflowsDir)) {
    const workflows = readdirSync(workflowsDir).filter((f) =>
      f.endsWith(".md")
    );

    for (const dir of skillDirs) {
      const skillMd = resolve(skillsSource, dir, "SKILL.md");
      if (!existsSync(skillMd)) continue;

      const content = readFileSync(skillMd, "utf-8");
      if (content.includes("workflow-generated")) {
        const workflowName = dir.replace("scott-", "") + ".md";
        const hasWorkflow = workflows.some(
          (w) => w === workflowName || w === dir + ".md"
        );
        if (!hasWorkflow) {
          issue(
            "skills",
            `${dir}/ marked workflow-generated but no matching workflow found`
          );
        }
      }
    }
  }
}

// --- Section 3: Hook Integrity ---

async function checkHookIntegrity() {
  console.log("\n3. Checking hook integrity...");

  const settingsPath = claudePath("settings.json");
  // Settings hooks are nested: { PreToolUse: [{ matcher, hooks: [{ type, command }] }] }
  interface HookEntry {
    type?: string;
    command: string;
  }
  interface HookGroup {
    matcher?: string;
    hooks?: HookEntry[];
    // Some entries may be flat { command: string }
    command?: string;
  }
  interface Settings {
    hooks?: Record<string, HookGroup[]>;
  }

  const settings = await readJson<Settings>(settingsPath);
  if (!settings?.hooks) {
    console.log("   SKIP: No hooks in settings.json");
    return;
  }

  const hooksDir = claudePath("hooks");

  // 3a. Check hooks on disk are registered
  // Extract all command strings from the nested hooks structure
  const registeredCommands: string[] = [];
  for (const groups of Object.values(settings.hooks)) {
    for (const group of groups) {
      if (group.command) registeredCommands.push(group.command);
      if (group.hooks) {
        for (const h of group.hooks) {
          if (h.command) registeredCommands.push(h.command);
        }
      }
    }
  }

  // Scan top-level .ts hooks (guards/ and lib/ are sub-modules, not standalone hooks)
  const hooksOnDisk = existsSync(toolkitPath("hooks"))
    ? readdirSync(toolkitPath("hooks")).filter(
        (f) => f.endsWith(".sh") || f.endsWith(".ts")
      )
    : [];

  for (const hookName of hooksOnDisk) {
    // Match by filename or by stem (e.g., pretooluse-router.ts is the source for pretooluse-router.cjs)
    const stem = hookName.replace(/\.[^.]+$/, "");
    const isRegistered = registeredCommands.some((cmd) =>
      cmd.includes(hookName) || cmd.includes(stem)
    );
    if (!isRegistered) {
      issue(
        "hooks",
        `Hook '${hookName}' exists on disk but is NOT registered in settings.json`
      );
    }
  }

  // 3b. Check registered hooks exist on disk (skip GSD-owned)
  for (const cmd of registeredCommands) {
    const pathMatch = cmd.match(
      /(?:\$HOME|~|\/Users\/\w+)(\/\.claude\/hooks\/[^\s"]+\.(?:sh|ts|js))/
    );
    if (!pathMatch) continue;

    const hookFile = basename(pathMatch[1]);

    // Skip GSD-owned hooks
    if (hookFile.startsWith("gsd-")) continue;

    const fullPath = resolve(
      process.env.HOME!,
      pathMatch[1].slice(1)
    );

    if (!existsSync(fullPath)) {
      issue(
        "hooks",
        `${hookFile} — file not found`
      );
    }
  }

  // 3c. Path consistency: should use ~/.claude/hooks/ form
  for (const cmd of registeredCommands) {
    if (cmd.includes("Sites/Global/scott-toolkit/hooks/")) {
      const hookFile =
        cmd.match(/([^/]+\.(?:sh|ts))/)?.[ 1] ?? "unknown";
      issue(
        "hooks",
        `settings.json uses direct toolkit path for '${hookFile}' — should use $HOME/.claude/hooks/`
      );
    }
  }

  // 3d. Dangling symlinks in ~/.claude/hooks/
  if (existsSync(hooksDir)) {
    for (const file of readdirSync(hooksDir)) {
      const fullPath = resolve(hooksDir, file);
      try {
        if (
          lstatSync(fullPath).isSymbolicLink() &&
          !existsSync(fullPath)
        ) {
          issue(
            "hooks",
            `Dangling symlink: ~/.claude/hooks/${file}`
          );
        }
      } catch {
        // Skip if stat fails
      }
    }
  }

  // 3e. Dangling symlinks in ~/.claude/skills/
  const skillsDeploy = claudePath("skills");
  if (existsSync(skillsDeploy)) {
    for (const item of readdirSync(skillsDeploy)) {
      const fullPath = resolve(skillsDeploy, item);
      try {
        if (
          lstatSync(fullPath).isSymbolicLink() &&
          !existsSync(fullPath)
        ) {
          issue(
            "hooks",
            `Dangling symlink: ~/.claude/skills/${item}`
          );
        }
      } catch {
        // Skip
      }
    }
  }
}

// --- Main ---

async function main() {
  console.log("Toolkit Lint");
  console.log("============\n");

  if (!sectionFilter || sectionFilter === "patterns")
    await checkStalePatterns();
  if (!sectionFilter || sectionFilter === "skills")
    await checkSkillIntegrity();
  if (!sectionFilter || sectionFilter === "hooks")
    await checkHookIntegrity();

  console.log(`\n============`);
  if (issueCount === 0) {
    console.log("0 issues found");
    process.exit(0);
  } else {
    console.log(`${issueCount} issue(s) found`);
    process.exit(1);
  }
}

main();
