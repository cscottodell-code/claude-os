#!/usr/bin/env bun
/**
 * stack-detect.ts — Detect project technologies from package.json and config files.
 * Output: JSON suitable for generating stack-lock.json
 *
 * Usage: bun run tools/stack-detect.ts <project-path>
 */

import { resolve, basename } from "path";
import { existsSync } from "fs";
import { readJson } from "../src/json.js";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface Technology {
  name: string;
  version: string;
  sdk?: string;
  audit: boolean;
  source: string;
}

function getDep(pkg: PackageJson, name: string): string | undefined {
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
}

function detectSurrealDB(pkg: PackageJson): Technology | null {
  const sdk = getDep(pkg, "surrealdb");
  if (!sdk) return null;

  // Version inference: ^2.x SDK targets v3 server
  const serverVersion = sdk.match(/^\^?2/) ? "v3" : "v2";

  return {
    name: "surrealdb",
    version: serverVersion,
    sdk: `surrealdb@${sdk.replace(/[\^~>=<]*/g, "")}`,
    audit: true,
    source: "package.json",
  };
}

function detectNuxt(pkg: PackageJson): Technology | null {
  const ver = getDep(pkg, "nuxt");
  if (!ver) return null;

  const major = ver.match(/(\d+)/)?.[1] ?? "unknown";
  return {
    name: "nuxt",
    version: major,
    audit: true,
    source: "package.json",
  };
}

function detectTailwind(
  pkg: PackageJson,
  projectPath: string
): Technology | null {
  const ver = getDep(pkg, "tailwindcss");
  if (!ver) return null;

  // v4 uses CSS-based config, v3 uses tailwind.config.*
  const hasV3Config =
    existsSync(resolve(projectPath, "tailwind.config.ts")) ||
    existsSync(resolve(projectPath, "tailwind.config.js"));

  const major = hasV3Config && !ver.match(/^\^?4/) ? "3" : "4";

  return {
    name: "tailwind",
    version: major,
    audit: true,
    source: "package.json",
  };
}

function detectBun(projectPath: string): Technology | null {
  if (
    !existsSync(resolve(projectPath, "bun.lock")) &&
    !existsSync(resolve(projectPath, "bun.lockb"))
  ) {
    return null;
  }
  return {
    name: "bun",
    version: "1",
    audit: true,
    source: "bun.lock",
  };
}

function detectHono(pkg: PackageJson): Technology | null {
  const ver = getDep(pkg, "hono");
  if (!ver) return null;

  const major = ver.match(/(\d+)/)?.[1] ?? "unknown";
  return {
    name: "hono",
    version: major,
    audit: true,
    source: "package.json",
  };
}

async function main() {
  const projectPath = resolve(process.argv[2] ?? ".");

  if (!existsSync(projectPath)) {
    console.error(`Error: Path does not exist: ${projectPath}`);
    process.exit(1);
  }

  const pkgPath = resolve(projectPath, "package.json");
  const pkg = (await readJson<PackageJson>(pkgPath)) ?? {};

  const technologies: Technology[] = [];

  const detectors = [
    () => detectSurrealDB(pkg),
    () => detectNuxt(pkg),
    () => detectTailwind(pkg, projectPath),
    () => detectBun(projectPath),
    () => detectHono(pkg),
  ];

  for (const detect of detectors) {
    const result = detect();
    if (result) technologies.push(result);
  }

  const output = {
    schema_version: "1.0",
    project_root: projectPath,
    project_name: basename(projectPath),
    technologies: Object.fromEntries(
      technologies.map((t) => [
        t.name,
        {
          version: t.version,
          ...(t.sdk ? { sdk: t.sdk } : {}),
          audit: t.audit,
        },
      ])
    ),
    services: {},
    paths: {},
    exceptions: [],
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
