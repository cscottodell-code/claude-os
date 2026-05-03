/**
 * Toolkit integrity design contract tests.
 *
 * These verify the structural promises the toolkit makes:
 * - Skills exist and have valid frontmatter
 * - interfaces.json operations map to real commands
 * - The dependency graph between files is consistent
 *
 * Think of these as the tests that prevent the toolkit from lying about itself.
 */

import { describe, expect, test } from "bun:test";
import {
  readdirSync,
  readFileSync,
  existsSync,
  lstatSync,
  readlinkSync,
} from "fs";
import { resolve, basename } from "path";
import { toolkitPath, claudePath } from "../src/paths.js";
import { readJson } from "../src/json.js";

// ---------------------------------------------------------------------------
// Skill integrity — "every skill has valid SKILL.md with frontmatter"
// ---------------------------------------------------------------------------

describe("skill integrity", () => {
  const skillsDir = toolkitPath("skills");
  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  test("skills directory exists and has skills", () => {
    expect(skillDirs.length).toBeGreaterThan(0);
  });

  for (const dir of skillDirs) {
    describe(dir, () => {
      const skillMd = resolve(skillsDir, dir, "SKILL.md");

      test("has SKILL.md", () => {
        expect(existsSync(skillMd)).toBe(true);
      });

      test("SKILL.md has YAML frontmatter", () => {
        if (!existsSync(skillMd)) return;

        // If symlink, resolve it first
        let content: string;
        const stat = lstatSync(skillMd);
        if (stat.isSymbolicLink()) {
          const target = readlinkSync(skillMd);
          const resolvedTarget = resolve(skillsDir, dir, target);
          expect(existsSync(resolvedTarget)).toBe(true);
          content = readFileSync(resolvedTarget, "utf-8");
        } else {
          content = readFileSync(skillMd, "utf-8");
        }

        // Must start with --- and have a closing ---
        expect(content.startsWith("---")).toBe(true);
        const secondDash = content.indexOf("---", 3);
        expect(secondDash).toBeGreaterThan(3);

        // Extract frontmatter and verify required fields
        const frontmatter = content.slice(3, secondDash);
        expect(frontmatter).toContain("name:");
        expect(frontmatter).toContain("description:");
      });
    });
  }
});

// ---------------------------------------------------------------------------
// interfaces.json -- "operations map to real providers"
// ---------------------------------------------------------------------------

describe("interfaces.json", () => {
  const interfacesPath = toolkitPath("config", "interfaces.json");

  interface Operation {
    command: string;
    provider: string;
    type: "command" | "skill";
    description: string;
  }

  interface Interfaces {
    schema_version: string;
    operations: Record<string, Operation>;
    plugins: Record<string, unknown>;
    lenses: Record<string, unknown>;
  }

  let data: Interfaces;

  test("file exists and is valid JSON", async () => {
    data = (await readJson<Interfaces>(interfacesPath))!;
    expect(data).not.toBeNull();
  });

  test("has schema_version", async () => {
    data = (await readJson<Interfaces>(interfacesPath))!;
    expect(data.schema_version).toBeString();
  });

  test("has operations section", async () => {
    data = (await readJson<Interfaces>(interfacesPath))!;
    expect(Object.keys(data.operations).length).toBeGreaterThan(0);
  });

  test("every operation has required fields", async () => {
    data = (await readJson<Interfaces>(interfacesPath))!;
    for (const [, op] of Object.entries(data.operations)) {
      expect(op.command).toBeString();
      expect(op.provider).toBeString();
      expect(["command", "skill"]).toContain(op.type);
      expect(op.description).toBeString();
    }
  });

  test("toolkit-provided operations have matching skills", async () => {
    data = (await readJson<Interfaces>(interfacesPath))!;
    for (const [, op] of Object.entries(data.operations)) {
      if (op.provider !== "toolkit") continue;

      const skillName = op.command.replace("/scott:", "scott-");
      const skillPath = toolkitPath("skills", skillName, "SKILL.md");
      expect(existsSync(skillPath)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// version-manifest.json — "banned patterns are valid"
// ---------------------------------------------------------------------------

describe("version-manifest.json", () => {
  const manifestPath = toolkitPath("config", "version-manifest.json");

  interface Manifest {
    cross_reference_patterns?: {
      banned?: Array<{
        pattern: string;
        replacement: string;
        reason: string;
      }>;
    };
  }

  test("banned patterns have required fields", async () => {
    const data = await readJson<Manifest>(manifestPath);
    expect(data).not.toBeNull();

    const banned = data!.cross_reference_patterns?.banned ?? [];
    for (const entry of banned) {
      expect(entry.pattern).toBeString();
      expect(entry.pattern.length).toBeGreaterThan(0);
      expect(entry.replacement).toBeString();
      expect(entry.reason).toBeString();
    }
  });

  test("banned patterns do not appear in active toolkit files", async () => {
    const data = await readJson<Manifest>(manifestPath);
    const banned = data!.cross_reference_patterns?.banned ?? [];

    // Check only active code files, not historical docs or design specs
    const dirsToCheck = ["rules", "context"];
    const skipFiles = new Set([
      "v5-unified-design.md",
      "v4-file-audit.md",
      "v5-comparison-table.md",
      "CHANGELOG.md",
    ]);

    for (const dir of dirsToCheck) {
      const fullDir = toolkitPath(dir);
      if (!existsSync(fullDir)) continue;

      const files = readdirSync(fullDir).filter(
        (f) => f.endsWith(".md") && !skipFiles.has(f)
      );

      for (const file of files) {
        const content = readFileSync(
          resolve(fullDir, file),
          "utf-8"
        );
        for (const entry of banned) {
          if (content.includes(entry.pattern)) {
            // Fail with actionable message
            throw new Error(
              `Stale pattern "${entry.pattern}" found in ${dir}/${file}. ` +
                `Replace with "${entry.replacement}". Reason: ${entry.reason}`
            );
          }
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Deployment consistency — "~/.claude symlinks point back to toolkit"
// ---------------------------------------------------------------------------

describe("deployment symlinks", () => {
  const checks = [
    { deployed: claudePath("hooks", "pretooluse-router.ts"), label: "pretooluse-router.ts" },
    { deployed: claudePath("hooks", "session-start.ts"), label: "session-start.ts" },
    { deployed: claudePath("rules", "claude-behavior.md"), label: "claude-behavior.md" },
    { deployed: claudePath("config", "interfaces.json"), label: "interfaces.json" },
  ];

  for (const { deployed } of checks) {
    test(`${basename(deployed)} is symlinked`, () => {
      if (!existsSync(deployed)) {
        // Skip if not deployed (CI environment)
        return;
      }
      const stat = lstatSync(deployed);
      expect(stat.isSymbolicLink()).toBe(true);
    });

    test(`${basename(deployed)} symlink resolves to toolkit`, () => {
      if (!existsSync(deployed)) return;
      const stat = lstatSync(deployed);
      if (!stat.isSymbolicLink()) return;

      const target = readlinkSync(deployed);
      expect(target).toContain("claude-os");
    });
  }
});
