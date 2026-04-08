/**
 * Guard (advisory): Inject relevant [stack:*] lessons from tasks/lessons.md
 * into context at the start of work sessions. Closes the learning loop by
 * ensuring past mistakes are surfaced before new work begins.
 *
 * Non-blocking -- always returns allow: true, may output additionalContext.
 * Deduplicates per session via /tmp marker file (same pattern as surrealdb-inject).
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { GuardResult } from "./git-push.js";
import { readJson } from "../../src/json.js";

/** Extract lessons tagged with [stack:tech] from lessons.md content */
export function extractTaggedLessons(
  content: string,
  techFilter: string[] | null
): string[] {
  const lines = content.split("\n");
  const lessons: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[stack:(\w+)\]\s*(.+)/);
    if (!match) continue;

    const tech = match[1];
    const lesson = match[0].trim();

    if (techFilter === null || techFilter.includes(tech)) {
      lessons.push(lesson);
    }
  }

  return lessons;
}

/** Determine if injection should happen */
export function shouldInject(fileExists: boolean, lessonCount: number): boolean {
  return fileExists && lessonCount > 0;
}

/** Detect technologies from stack-lock.json */
async function detectTechnologies(cwd: string): Promise<string[]> {
  interface StackLock {
    technologies?: Record<string, unknown>;
  }
  const lock = await readJson<StackLock>(resolve(cwd, "stack-lock.json"));
  if (!lock?.technologies) return [];
  return Object.keys(lock.technologies);
}

/** Main guard function */
export async function guardLessonsInject(
  cwd: string
): Promise<GuardResult & { additionalContext?: string }> {
  // Dedup: one injection per session
  const dedupFile = `/tmp/lessons-injected-${process.env.CLAUDE_SESSION_ID ?? process.pid}`;
  if (existsSync(dedupFile)) return { allow: true };

  const lessonsPath = resolve(cwd, "tasks/lessons.md");
  if (!existsSync(lessonsPath)) return { allow: true };

  const content = readFileSync(lessonsPath, "utf-8");

  // Get project technologies for filtering
  const techs = await detectTechnologies(cwd);
  const lessons = extractTaggedLessons(content, techs.length > 0 ? techs : null);

  if (!shouldInject(true, lessons.length)) return { allow: true };

  // Mark as injected
  await Bun.write(dedupFile, "");

  const header = `[Lessons Auto-Loaded] ${lessons.length} past lesson(s) for this project's stack. Review before writing code:\n`;
  const body = lessons.map((l) => `  ${l}`).join("\n");

  return {
    allow: true,
    additionalContext: `${header}${body}`,
  };
}
