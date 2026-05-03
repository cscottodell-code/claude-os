#!/usr/bin/env bun
/**
 * toolkit-sync.ts -- Auto-sync generated sections in toolkit docs.
 *
 * Reads skill frontmatter as source of truth and updates:
 *   - README.md command table
 *   - docs/user-guide.md command tables (grouped by section)
 *
 * Generated sections are delimited by marker comments:
 *   <!-- AUTO:name -->...<!-- /AUTO:name -->
 *
 * Usage:
 *   bun run tools/toolkit-sync.ts          # Sync all targets
 *   bun run tools/toolkit-sync.ts --check  # Check if targets are current (exit 1 if stale)
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { toolkitPath } from "../src/paths.js";

const TOOLKIT = toolkitPath();

// --- Skill Discovery ---

interface SkillInfo {
  dirName: string;
  name: string;
  description: string;
  userInvocable: boolean;
  invocationHint: string;
  section: string;
  category: string;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fields: Record<string, string> = {};
  const lines = match[1].split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fieldMatch = line.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (!fieldMatch) continue;

    const key = fieldMatch[1];
    let value = fieldMatch[2].trim();

    // Handle multi-line values (| or >- or >)
    if (value === "|" || value === ">" || value === ">-") {
      const multiLines: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^\S/) && !lines[j].startsWith("  ")) break;
        multiLines.push(lines[j].replace(/^  /, ""));
        i = j;
      }
      value = multiLines.join(" ").trim();
    }

    // Strip surrounding quotes
    value = value.replace(/^["']|["']$/g, "");

    fields[key] = value;
  }

  return fields;
}

function discoverSkills(): SkillInfo[] {
  const skillsDir = resolve(TOOLKIT, "skills");
  const skills: SkillInfo[] = [];

  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const skillMd = resolve(skillsDir, entry.name, "SKILL.md");
    if (!existsSync(skillMd)) continue;

    // Follow symlinks to read actual content
    const content = readFileSync(skillMd, "utf-8");
    const fields = parseFrontmatter(content);

    if (!fields.name) continue;

    // Extract short description (first sentence or line)
    let desc = fields.description || "";
    // Take first sentence, trim to reasonable length
    const firstSentence = desc.match(/^[^.!?]+[.!?]/);
    if (firstSentence) desc = firstSentence[0].replace(/\.\s*$/, "");
    if (desc.length > 80) desc = desc.slice(0, 77) + "...";

    // Extract command from invocation_hint
    // Formats: "/scott:debug - Description" or "/scott:save-tweet <url> - Description"
    let command = "";
    let shortDesc = desc;
    if (fields.invocation_hint) {
      const hintMatch = fields.invocation_hint.match(/^(\/[\w:.-]+)(?:\s+<[^>]+>)?\s*-\s*(.+)$/);
      if (hintMatch) {
        command = hintMatch[1];
        shortDesc = hintMatch[2].trim();
      }
    }
    // Clean up trailing periods from descriptions
    shortDesc = shortDesc.replace(/\.\s*$/, "");

    // Fallback command from name
    if (!command && fields.name) {
      const name = fields.name.includes(":") ? fields.name : fields.name.replace("-", ":");
      command = `/${name}`;
    }

    skills.push({
      dirName: entry.name,
      name: fields.name,
      description: shortDesc || desc,
      userInvocable: fields.user_invocable === "true",
      invocationHint: fields.invocation_hint || "",
      section: fields.section || "other",
      category: fields.category || "",
    });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

// --- Section Replacement ---

function replaceSection(content: string, marker: string, newContent: string): string {
  const startTag = `<!-- AUTO:${marker} -->`;
  const endTag = `<!-- /AUTO:${marker} -->`;
  const startIdx = content.indexOf(startTag);
  const endIdx = content.indexOf(endTag);

  if (startIdx === -1 || endIdx === -1) {
    console.warn(`  WARNING: Marker <!-- AUTO:${marker} --> not found`);
    return content;
  }

  return (
    content.slice(0, startIdx + startTag.length) +
    "\n" +
    newContent +
    "\n" +
    content.slice(endIdx)
  );
}

// --- Generators ---

function generateReadmeTable(skills: SkillInfo[]): string {
  const invocable = skills.filter((s) => s.userInvocable);

  const lines = [
    "| Command | What it does |",
    "|---------|-------------|",
  ];

  for (const s of invocable) {
    const cmd = s.invocationHint
      ? s.invocationHint.match(/^(\/\S+)/)?.[1] ?? s.name
      : s.name;
    lines.push(`| \`${cmd}\` | ${s.description} |`);
  }

  return lines.join("\n");
}

function generateUserGuideSection(skills: SkillInfo[], section: string): string {
  const filtered = skills.filter((s) => s.userInvocable && s.section === section);
  if (filtered.length === 0) return "_No commands in this section._";

  const lines = [
    "| Command | When to use it |",
    "|---------|---------------|",
  ];

  for (const s of filtered) {
    const cmd = s.invocationHint
      ? s.invocationHint.match(/^(\/\S+)/)?.[1] ?? s.name
      : s.name;
    lines.push(`| \`${cmd}\` | ${s.description} |`);
  }

  return lines.join("\n");
}

// --- Main ---

async function main() {
  const checkOnly = process.argv.includes("--check");
  const skills = discoverSkills();
  let stale = false;

  console.log(`Discovered ${skills.length} skills (${skills.filter((s) => s.userInvocable).length} user-invocable)\n`);

  // 1. README.md
  const readmePath = resolve(TOOLKIT, "README.md");
  const readmeOrig = readFileSync(readmePath, "utf-8");
  const readmeNew = replaceSection(readmeOrig, "commands", generateReadmeTable(skills));

  if (readmeNew !== readmeOrig) {
    if (checkOnly) {
      console.log("  STALE: README.md command table");
      stale = true;
    } else {
      writeFileSync(readmePath, readmeNew, "utf-8");
      console.log("  UPDATED: README.md command table");
    }
  } else {
    console.log("  OK: README.md command table");
  }

  // 2. docs/user-guide.md
  const guidePath = resolve(TOOLKIT, "docs/user-guide.md");
  let guideContent = readFileSync(guidePath, "utf-8");
  const guideOrig = guideContent;

  const sections = ["project", "stack", "learning", "reference", "tools", "business"];
  for (const section of sections) {
    guideContent = replaceSection(
      guideContent,
      `commands-${section}`,
      generateUserGuideSection(skills, section)
    );
  }

  if (guideContent !== guideOrig) {
    if (checkOnly) {
      console.log("  STALE: docs/user-guide.md command tables");
      stale = true;
    } else {
      writeFileSync(guidePath, guideContent, "utf-8");
      console.log("  UPDATED: docs/user-guide.md command tables");
    }
  } else {
    console.log("  OK: docs/user-guide.md command tables");
  }

  if (checkOnly && stale) {
    console.log("\nSync check failed. Run 'bun run tools/toolkit-sync.ts' to fix.");
    process.exit(1);
  }

  if (!checkOnly) {
    console.log("\nSync complete.");
  }
}

main();
