#!/usr/bin/env bun
/**
 * toolkit-lint.ts: comprehensive integrity checker for claude-os.
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

  interface BannedEntry {
    pattern: string;
    replacement: string;
    reason: string;
    // Default true. Set false to skip in batch lint while still letting the
    // per-edit hook (toolkit-coherence-check.ts) warn. Used for rules where
    // pre-existing violations should not be refactored proactively (e.g. em dashes).
    lint?: boolean;
  }
  interface VersionManifest {
    cross_reference_patterns?: {
      banned?: BannedEntry[];
    };
  }

  const manifest = await readJson<VersionManifest>(
    toolkitPath("config", "version-manifest.json")
  );

  const banned = manifest?.cross_reference_patterns?.banned;
  if (!banned || banned.length === 0) {
    console.log(
      "   SKIP: No cross_reference_patterns.banned in version-manifest.json"
    );
    return;
  }

  // Active scope: dirs Scott actively edits. Excludes archival
  // (decisions/, retros/, successes/, docs/, tasks/, references/) and
  // deletion-pending (workflows/, CHANGELOG.md). Mirrors the integrity-test scope.
  const activeDirs = [
    "rules",
    "context",
    "skills",
    "skills-knowledge/skills",
  ];
  const activeFiles = ["README.md"];

  const dirArgs = activeDirs
    .map((d) => toolkitPath(d))
    .filter(existsSync)
    .join(" ");
  const result = dirArgs
    ? await exec(
        `find ${dirArgs} -name '*.md' -not -path '*/node_modules/*' -not -path '*/.git/*'`,
        { timeout: 10_000 }
      )
    : { stdout: "" };

  const dirFiles = result.stdout.split("\n").filter(Boolean);
  const topFiles = activeFiles.map((f) => toolkitPath(f)).filter(existsSync);

  // Also check external CLAUDE.md files (Scott's identity layer)
  const externalFiles = [
    claudePath("CLAUDE.md"),
    resolve(toolkitPath(), "../../CLAUDE.md"),
  ].filter(existsSync);

  const allFiles = [...dirFiles, ...topFiles, ...externalFiles];

  for (const entry of banned) {
    if (entry.lint === false) continue;

    for (const filePath of allFiles) {
      try {
        const content = readFileSync(filePath, "utf-8");
        if (content.includes(entry.pattern)) {
          const display = relative(toolkitPath(), filePath) || filePath;
          issue(
            "patterns",
            `"${entry.pattern}" in ${display}: ${entry.reason}`
          );

          if (fixMode) {
            const updated = content.replaceAll(
              entry.pattern,
              entry.replacement
            );
            await Bun.write(filePath, updated);
            console.log(
              `         FIXED: replaced with "${entry.replacement}"`
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
        `${hookFile}: file not found`
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
        `settings.json uses direct toolkit path for '${hookFile}': should use $HOME/.claude/hooks/`
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
