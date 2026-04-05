#!/usr/bin/env bun
/**
 * stack-metrics.ts — Aggregate audit artifacts into checks/metrics.json.
 * Scans all projects with stack-lock.json for audit results.
 *
 * Usage: bun run tools/stack-metrics.ts
 */

import { resolve, basename, dirname } from "path";
import { existsSync, readdirSync, readFileSync } from "fs";
import { readJson, writeJson } from "../src/json.js";
import { toolkitPath, sitesPath } from "../src/paths.js";
import { exec } from "../src/exec.js";

interface CheckStat {
  check_id: string;
  technology: string;
  pass_count: number;
  fail_count: number;
  projects_seen: string[];
  last_seen: string;
  value: "harmful" | "noisy" | "high" | "proven" | "untested";
}

interface Metrics {
  generated: string;
  discovered_projects: number;
  overall_pass_rate: number;
  checks: Record<string, CheckStat>;
  unmatched_lessons: string[];
}

function computeValue(
  stat: CheckStat
): "harmful" | "noisy" | "high" | "proven" | "untested" {
  const total = stat.pass_count + stat.fail_count;
  if (total === 0) return "untested";

  const passRate = stat.pass_count / total;
  const projectCount = stat.projects_seen.length;

  if (passRate < 0.3 && projectCount >= 3) return "harmful";
  if (passRate < 0.5) return "noisy";
  if (passRate > 0.9 && projectCount >= 3) return "proven";
  if (passRate >= 0.5) return "high";

  return "untested";
}

async function discoverProjects(): Promise<string[]> {
  const result = await exec(
    `find ${sitesPath()} -name stack-lock.json -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/Archive/*' 2>/dev/null`,
    { timeout: 10_000 }
  );

  if (!result.stdout) return [];
  return result.stdout
    .split("\n")
    .filter(Boolean)
    .map((p) => dirname(p));
}

async function scanAuditArtifacts(
  projectPath: string,
  checks: Record<string, CheckStat>
) {
  const auditDir = resolve(projectPath, ".planning/audits");
  if (!existsSync(auditDir)) return;

  const projectName = basename(projectPath);
  let files: string[];
  try {
    files = readdirSync(auditDir).filter((f) => f.endsWith(".json"));
  } catch {
    return;
  }

  for (const file of files) {
    const artifact = await readJson<Record<string, unknown>>(
      resolve(auditDir, file)
    );
    if (!artifact) continue;

    const results = (artifact.results ?? artifact.checks ?? []) as Array<{
      check_id?: string;
      technology?: string;
      passed?: boolean;
      date?: string;
    }>;

    for (const r of results) {
      if (!r.check_id) continue;

      if (!checks[r.check_id]) {
        checks[r.check_id] = {
          check_id: r.check_id,
          technology: r.technology ?? "unknown",
          pass_count: 0,
          fail_count: 0,
          projects_seen: [],
          last_seen: "",
          value: "untested",
        };
      }

      const stat = checks[r.check_id];
      if (r.passed) stat.pass_count++;
      else stat.fail_count++;

      if (!stat.projects_seen.includes(projectName)) {
        stat.projects_seen.push(projectName);
      }

      if (r.date && r.date > stat.last_seen) stat.last_seen = r.date;
    }
  }
}

async function findUnmatchedLessons(
  projects: string[],
  knownCheckIds: Set<string>
): Promise<string[]> {
  const unmatched: string[] = [];

  for (const projectPath of projects) {
    const lessonsPath = resolve(projectPath, "tasks/lessons.md");
    if (!existsSync(lessonsPath)) continue;

    const content = readFileSync(lessonsPath, "utf-8");
    const stackLines = content
      .split("\n")
      .filter((l) => l.includes("[stack:"));

    for (const line of stackLines) {
      const match = line.match(/\[stack:([^\]]+)\]/);
      if (match) {
        const tech = match[1];
        const hasCheck = [...knownCheckIds].some((id) =>
          id.startsWith(tech)
        );
        if (!hasCheck) {
          unmatched.push(`${basename(projectPath)}: ${line.trim()}`);
        }
      }
    }
  }

  return unmatched;
}

async function main() {
  console.log("Stack Metrics Generator");
  console.log("=======================\n");

  const projects = await discoverProjects();
  console.log(
    `Discovered ${projects.length} project(s) with stack-lock.json\n`
  );

  const checks: Record<string, CheckStat> = {};

  for (const project of projects) {
    await scanAuditArtifacts(project, checks);
  }

  // Compute value scores
  for (const stat of Object.values(checks)) {
    stat.value = computeValue(stat);
  }

  // Calculate overall pass rate
  let totalPasses = 0;
  let totalChecks = 0;
  for (const stat of Object.values(checks)) {
    totalPasses += stat.pass_count;
    totalChecks += stat.pass_count + stat.fail_count;
  }

  const knownCheckIds = new Set(Object.keys(checks));
  const unmatched = await findUnmatchedLessons(projects, knownCheckIds);

  const metrics: Metrics = {
    generated: new Date().toISOString().split("T")[0],
    discovered_projects: projects.length,
    overall_pass_rate:
      totalChecks > 0
        ? Math.round((totalPasses / totalChecks) * 100)
        : 0,
    checks,
    unmatched_lessons: unmatched,
  };

  const outputPath = toolkitPath("checks", "metrics.json");
  await writeJson(outputPath, metrics);

  console.log(`Checks tracked: ${Object.keys(checks).length}`);
  console.log(`Overall pass rate: ${metrics.overall_pass_rate}%`);
  console.log(`Unmatched lessons: ${unmatched.length}`);
  console.log(`\nWritten to: ${outputPath}`);
}

main();
