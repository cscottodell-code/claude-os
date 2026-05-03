#!/usr/bin/env bun
/**
 * session-start.ts — SessionStart hook: smart project detection + startup tasks.
 * 1. Sync config from GitHub
 * 2. Rotate bash-commands.log
 * 3. Rebuild ACTIVE-PROJECTS.md
 * 4. Stack-lock staleness check
 * 5. Plugin-project alignment check
 * 6. Project state detection + workflow suggestion
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve, basename, dirname } from "path";
import { homedir } from "os";
import { exec } from "../src/exec.js";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";
import { fileMtime, daysBetween, dateStr } from "./lib/platform.js";

const SITES_DIR = resolve(homedir(), "Sites");
const PROJECT_DIR = process.cwd();

// --- 0. Sync down from GitHub ---
const syncScript = resolve(homedir(), ".claude-config/sync-down.sh");
if (existsSync(syncScript)) {
  const syncResult = await exec(`bash "${syncScript}"`, { timeout: 30_000 });
  if (syncResult.stdout) console.log(syncResult.stdout);
  if (syncResult.exitCode === 2) {
    console.log(
      "SYNC-DIRTY: Local config changes found that aren't in GitHub. Run /scott:sync-up to push them first, or say 'force sync-down' to overwrite."
    );
  }
}

// --- 0b. Log rotation ---
const bashLog = resolve(homedir(), ".claude/bash-commands.log");
if (existsSync(bashLog)) {
  const content = readFileSync(bashLog, "utf-8");
  const lines = content.split("\n");
  if (lines.length > 1000) {
    writeFileSync(bashLog, lines.slice(-500).join("\n"));
  }
}

// --- 1. Rebuild ACTIVE-PROJECTS.md ---
const activeProjectsPath = resolve(
  SITES_DIR,
  "Global/scott-context/wiki/global/ACTIVE-PROJECTS.md"
);

const rows: string[] = [];
const resumeGlobs = [
  `${SITES_DIR}/*/.claude-resume.md`,
  `${SITES_DIR}/*/*/.claude-resume.md`,
  `${SITES_DIR}/*/*/*/.claude-resume.md`,
];

// Use find to get all resume files (more reliable than glob)
const findResult = await exec(
  `find "${SITES_DIR}" -maxdepth 4 -name .claude-resume.md -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/Archive/*' 2>/dev/null`,
  { timeout: 10_000 }
);

const resumeFiles = findResult.stdout
  .split("\n")
  .filter(Boolean);

for (const resumeFile of resumeFiles) {
  const projDir = dirname(resumeFile);
  const projName = basename(projDir);

  // Get last modified date
  const mtime = fileMtime(resumeFile);
  const lastMod = mtime
    ? new Date(mtime * 1000).toISOString().split("T")[0]
    : "unknown";

  // Extract status
  const content = readFileSync(resumeFile, "utf-8");
  let status = "";

  const whereMatch = content.match(/## Where we are\n(.+)/);
  if (whereMatch) {
    status = whereMatch[1].trim();
  }
  if (!status) {
    const workflowMatch = content.match(/^(?:Workflow|Current):\s*(.+)/m);
    if (workflowMatch) status = workflowMatch[1].trim();
  }
  if (!status) status = "In progress";
  if (status.length > 60) status = status.slice(0, 57) + "...";

  rows.push(`| ${projName} | ${lastMod} | ${status} | ${projDir} |`);
}

const table = [
  "# Active Projects",
  `_Auto-generated at ${dateStr()} ${new Date().toTimeString().slice(0, 5)}. Do not edit manually._`,
  "",
  "| Project | Last Worked | Status | Path |",
  "|---------|-------------|--------|------|",
  ...(rows.length > 0
    ? rows
    : ["| _(none)_ | | No active projects found | |"]),
].join("\n");

await Bun.write(activeProjectsPath, table + "\n");

// --- 1b. Stack-lock staleness check ---
const stackLockPath = resolve(PROJECT_DIR, "stack-lock.json");
if (existsSync(stackLockPath)) {
  interface StackLock {
    last_reviewed?: string;
    locked?: string;
  }
  const lock = await readJson<StackLock>(stackLockPath);
  const reviewDate = lock?.last_reviewed ?? lock?.locked;

  if (reviewDate) {
    const days = daysBetween(new Date(reviewDate), new Date());
    if (days > 30) {
      console.log(
        `Stack checks last reviewed ${days} days ago (${reviewDate}). Consider running stack-preflight to verify.`
      );
    }
  }
}

// --- 1c. Plugin-project alignment check ---
const VERCEL_PLUGIN_ID = "vercel@claude-plugins-official";

if (PROJECT_DIR !== homedir()) {
  // Check Vercel plugin state
  let vercelActive = false;

  interface PluginSettings {
    enabledPlugins?: Record<string, boolean>;
  }

  const globalSettings = await readJson<PluginSettings>(
    resolve(homedir(), ".claude/settings.json")
  );
  if (globalSettings?.enabledPlugins?.[VERCEL_PLUGIN_ID]) {
    vercelActive = true;
  }

  const projectSettings = await readJson<PluginSettings>(
    resolve(PROJECT_DIR, ".claude/settings.json")
  );
  if (projectSettings?.enabledPlugins) {
    if (VERCEL_PLUGIN_ID in projectSettings.enabledPlugins) {
      vercelActive = projectSettings.enabledPlugins[VERCEL_PLUGIN_ID];
    }
  }

  // Detect if project uses Vercel
  let usesVercel = false;
  const projLock = await readJson<Record<string, unknown>>(stackLockPath);
  if (projLock) {
    const techs = projLock.technologies as Record<string, unknown> | undefined;
    if (techs && ("vercel" in techs || "nextjs" in techs)) {
      usesVercel = true;
    }
  }
  // Path-based fallback
  if (
    PROJECT_DIR.startsWith(resolve(SITES_DIR, "Bresco")) ||
    PROJECT_DIR.startsWith(resolve(SITES_DIR, "Advosy"))
  ) {
    usesVercel = true;
  }

  if (vercelActive && !usesVercel) {
    console.log(
      "PLUGIN MISMATCH: Vercel plugin is active but this project doesn't use Vercel (~52K tokens overhead)."
    );
  } else if (!vercelActive && usesVercel) {
    console.log(
      "PLUGIN MISMATCH: Vercel plugin is disabled but this project uses Vercel."
    );
  }
}

// --- 2. Detect current project state ---
const claudeMd = resolve(PROJECT_DIR, "CLAUDE.md");

// Detect category from path
let category = "";
if (PROJECT_DIR.includes("/Global")) category = "Global";
else if (PROJECT_DIR.includes("/Personal")) category = "Personal";
else if (PROJECT_DIR.includes("/Advosy")) category = "Advosy";
else if (PROJECT_DIR.includes("/Bresco")) category = "Bresco";

const tag = category ? ` [${category}]` : "";

if (existsSync(claudeMd)) {
  const resumePath = resolve(PROJECT_DIR, ".claude-resume.md");
  const planningDir = resolve(PROJECT_DIR, ".planning");

  if (existsSync(resumePath)) {
    console.log(
      `AUTO-RESUME${tag}: Resume file found. You MUST invoke /scott:resume before doing any work. Read .claude-resume.md and tasks/todo.md to restore context.`
    );
  } else if (existsSync(planningDir)) {
    console.log(
      `GSD PROJECT${tag}: .planning/ directory found. You MUST invoke /scott:resume to check project state before doing any work.`
    );
  } else {
    console.log(
      `Project detected${tag} (CLAUDE.md found). No resume file. If Scott asks to continue prior work, invoke /scott:resume.`
    );
  }
} else if (PROJECT_DIR === homedir()) {
  const count = rows.length;
  if (count > 0) {
    console.log(
      `Active projects (${count}): see ~/Scott/growth-os/wiki/global/ACTIVE-PROJECTS.md`
    );
  }
}

process.exit(0);
