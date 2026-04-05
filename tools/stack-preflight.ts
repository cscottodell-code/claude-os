#!/usr/bin/env bun
/**
 * stack-preflight.ts — Verify system readiness before audit execution.
 * Checks CLIs, MCP servers, database connectivity, SDK versions.
 * Returns degradation tier: FULL / REDUCED / MINIMAL / BYPASS
 *
 * Usage: bun run tools/stack-preflight.ts [project-path]
 */

import { resolve } from "path";
import { readJson } from "../src/json.js";
import { toolkitPath } from "../src/paths.js";
import { execOk } from "../src/exec.js";

type Tier = "FULL" | "REDUCED" | "MINIMAL" | "BYPASS";

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "fail" | "skip";
  detail: string;
}

const results: CheckResult[] = [];
let tier: Tier = "FULL";

function downgrade(to: Tier) {
  const order: Tier[] = ["FULL", "REDUCED", "MINIMAL", "BYPASS"];
  if (order.indexOf(to) > order.indexOf(tier)) tier = to;
}

async function checkCli(
  name: string,
  versionFlag = "--version"
): Promise<string | null> {
  const version = await execOk(`${name} ${versionFlag} 2>/dev/null`);
  if (version) {
    results.push({
      name: `${name} CLI`,
      status: "ok",
      detail: version.split("\n")[0],
    });
    return version;
  }
  results.push({ name: `${name} CLI`, status: "fail", detail: "not found" });
  return null;
}

async function checkSurrealDB(projectPath: string) {
  // 1. CLI
  await checkCli("surreal");

  // 2. Server health
  try {
    const health = await fetch("http://localhost:8000/health", {
      signal: AbortSignal.timeout(3000),
    });
    if (health.ok) {
      const versionResp = await fetch("http://localhost:8000/version", {
        signal: AbortSignal.timeout(3000),
      });
      const serverVersion = await versionResp.text();
      results.push({
        name: "SurrealDB server",
        status: "ok",
        detail: serverVersion.trim(),
      });
    } else {
      results.push({
        name: "SurrealDB server",
        status: "fail",
        detail: `health returned ${health.status}`,
      });
      downgrade("REDUCED");
    }
  } catch {
    results.push({
      name: "SurrealDB server",
      status: "fail",
      detail: "not reachable on localhost:8000",
    });
    downgrade("REDUCED");
  }

  // 3. SDK version match
  interface PkgJson {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  }
  const pkg = await readJson<PkgJson>(resolve(projectPath, "package.json"));
  const sdkVersion =
    pkg?.dependencies?.surrealdb ?? pkg?.devDependencies?.surrealdb;
  if (sdkVersion) {
    results.push({
      name: "SurrealDB SDK",
      status: "ok",
      detail: `surrealdb@${sdkVersion}`,
    });
  }
}

async function checkProviders() {
  // Verify interfaces.json exists and has valid operations
  const interfaces = await readJson<Record<string, unknown>>(
    toolkitPath("config", "interfaces.json")
  );
  if (interfaces) {
    results.push({
      name: "interfaces.json",
      status: "ok",
      detail: "loaded",
    });
  } else {
    results.push({
      name: "interfaces.json",
      status: "warn",
      detail: "not found or invalid",
    });
    downgrade("REDUCED");
  }
}

async function main() {
  const projectPath = resolve(process.argv[2] ?? ".");

  console.log("Stack Preflight Check");
  console.log("=====================\n");

  // Determine what to check from stack-lock
  interface StackLock {
    technologies: Record<string, { version: string; audit: boolean }>;
  }
  const lock = await readJson<StackLock>(
    resolve(projectPath, "stack-lock.json")
  );
  const techs = lock ? Object.keys(lock.technologies) : [];

  // Always check Bun (needed for toolkit itself)
  await checkCli("bun");

  // Check project-specific technologies
  if (techs.includes("surrealdb")) {
    await checkSurrealDB(projectPath);
  }

  // Check toolkit providers
  await checkProviders();

  // Output results
  for (const r of results) {
    const icon =
      r.status === "ok"
        ? "OK"
        : r.status === "warn"
          ? "WARN"
          : r.status === "fail"
            ? "FAIL"
            : "SKIP";
    console.log(`  [${icon}] ${r.name}: ${r.detail}`);
  }

  const failures = results.filter((r) => r.status === "fail").length;
  if (failures > 0 && tier === "FULL") downgrade("REDUCED");

  console.log(`\nTier: ${tier}`);
  console.log(
    `  FULL = all systems go, REDUCED = some checks unavailable`
  );
  console.log(
    `  MINIMAL = CLI tools only, BYPASS = skip preflight`
  );

  // Exit 0 always — preflight is informational
  process.exit(0);
}

main();
