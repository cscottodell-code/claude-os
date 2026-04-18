/**
 * Guard (advisory): Auto-inject SurrealDB skill when touching SurrealDB files.
 * Non-blocking — always returns allow: true, but outputs additionalContext.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import type { GuardResult } from "./git-push.js";

const SKILL_FILE = resolve(
  homedir(),
  ".claude/skills/scott-surrealdb/SKILL.md"
);

const FILE_PATTERNS = [
  /\.surql$/,
  /\/db\.ts$/,
  /surreal/i,
  /surrealdb/i,
  /surreal.*schema/i,
  /surreal.*migration/i,
];

const COMMAND_PATTERN =
  /surreal|surrealdb|surql|localhost:800[0-9]/i;

/** Check if the current invocation touches SurrealDB */
export function matchesSurrealDB(
  filePath: string | null,
  command: string | null
): boolean {
  if (filePath) {
    for (const pattern of FILE_PATTERNS) {
      if (pattern.test(filePath)) return true;
    }
  }
  if (command && COMMAND_PATTERN.test(command)) return true;
  return false;
}

/** Inject SurrealDB skill as additionalContext. Returns null if no injection needed. */
export async function injectSurrealDB(
  filePath: string | null,
  command: string | null
): Promise<string | null> {
  if (!matchesSurrealDB(filePath, command)) return null;

  // Dedup: check marker file
  const dedupFile = `/tmp/surrealdb-skill-injected-${process.env.CLAUDE_SESSION_ID ?? process.pid}`;
  if (existsSync(dedupFile)) return null;

  if (!existsSync(SKILL_FILE)) return null;

  // Mark as injected
  writeFileSync(dedupFile, "");

  // Read skill content, strip YAML frontmatter
  let content = readFileSync(SKILL_FILE, "utf-8");
  const frontmatterEnd = content.indexOf("---", content.indexOf("---") + 3);
  if (frontmatterEnd !== -1) {
    content = content.slice(frontmatterEnd + 3).trim();
  }

  // Health check (non-blocking, 2s timeout)
  let healthWarning = "";
  try {
    const resp = await fetch("http://localhost:8000/health", {
      signal: AbortSignal.timeout(2000),
    });
    if (!resp.ok) throw new Error("unhealthy");
  } catch {
    healthWarning =
      "[WARNING] SurrealDB server is NOT running on localhost:8000. Start it with: ~/Sites/Global/scott-toolkit/start-surreal.sh\n\n";
  }

  const verifyProtocol = [
    "",
    "[MANDATORY VERIFICATION PROTOCOL]",
    "NEVER write SurrealQL from general knowledge or training data.",
    "BEFORE writing any SurrealQL or JS SDK code:",
    "  1. Query Context7: mcp__context7__query-docs with libraryId=/surrealdb/docs.surrealdb.com",
    "  2. If MCP server available: test queries against live SurrealDB via mcp__surrealdb__query",
    "  3. Copy syntax from verified docs or existing working migrations, never from memory",
    "Known v3 gotchas: single-field FULLTEXT only, TYPE object FLEXIBLE, IF { } ELSE { } (not THEN/END),",
    "RELATE needs LET for dynamic IDs, ORDER BY only supports field refs (use computed AS fields).",
  ].join("\n");

  return `${healthWarning}[SurrealDB Skill Auto-Loaded] ${content}${verifyProtocol}`;
}

/** GuardResult wrapper for the router (always allows, may have context) */
export async function guardSurrealdbInject(
  filePath: string | null,
  command: string | null
): Promise<GuardResult & { additionalContext?: string }> {
  const context = await injectSurrealDB(filePath, command);
  if (context) {
    return { allow: true, additionalContext: context };
  }
  return { allow: true };
}
