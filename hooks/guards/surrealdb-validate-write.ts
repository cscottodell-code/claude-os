/**
 * PostToolUse guard: Validate SurrealQL syntax against live SurrealDB instance
 * when .surql files are written or edited.
 *
 * Also fires on .ts files containing surql template tags to remind about
 * Context7 verification.
 *
 * Non-blocking (advisory) — outputs warnings as additionalContext.
 */

import { existsSync, readFileSync } from "fs";

interface HookInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    command?: string;
    content?: string;
  };
}

function parseStdin(raw: string): HookInput | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const chunks: string[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(new TextDecoder().decode(chunk));
  }
  const input = parseStdin(chunks.join(""));
  if (!input) {
    process.exit(0);
    return;
  }

  const filePath = input.tool_input?.file_path ?? "";

  // --- .surql files: validate syntax against live SurrealDB ---
  if (filePath.endsWith(".surql")) {
    if (!existsSync(filePath)) {
      process.exit(0);
      return;
    }

    const sql = readFileSync(filePath, "utf-8");

    // Strip EVENT blocks (they reference localhost:3200 which may not be running)
    const cleaned = sql.replace(
      /DEFINE EVENT OVERWRITE[\s\S]*?THEN\s*\{[\s\S]*?\};\s*/g,
      ""
    );

    // Try to parse via live SurrealDB using a throwaway namespace
    try {
      const resp = await fetch("http://localhost:8000/sql", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          Accept: "application/json",
          NS: "___surql_validate",
          DB: "___surql_validate",
          Authorization:
            "Basic " + btoa("root:root"),
        },
        body: `-- Syntax validation only (throwaway namespace)\n${cleaned}`,
        signal: AbortSignal.timeout(5000),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.log(
          JSON.stringify({
            additionalContext: [
              `[SURQL VALIDATION FAILED] ${filePath}`,
              `SurrealDB returned HTTP ${resp.status}: ${text.slice(0, 200)}`,
              "",
              "Fix the SurrealQL syntax before proceeding. Verify against Context7:",
              "  mcp__context7__query-docs with libraryId=/surrealdb/docs.surrealdb.com",
            ].join("\n"),
          })
        );
      } else {
        const results = (await resp.json()) as Array<{
          status: string;
          result?: string;
        }>;
        const errors = results.filter((r) => r.status === "ERR");
        if (errors.length > 0) {
          const errorMsgs = errors
            .map((e) => `  - ${e.result}`)
            .slice(0, 5)
            .join("\n");
          console.log(
            JSON.stringify({
              additionalContext: [
                `[SURQL VALIDATION ERRORS] ${filePath}`,
                `${errors.length} statement(s) failed against live SurrealDB:`,
                errorMsgs,
                "",
                "Fix these before proceeding. Verify syntax against Context7:",
                "  mcp__context7__query-docs with libraryId=/surrealdb/docs.surrealdb.com",
                "",
                "Common v3 gotchas: single-field FULLTEXT only, TYPE object FLEXIBLE (not FLEXIBLE TYPE),",
                "IF condition { expr } ELSE { expr } (not IF/THEN/END), RELATE needs LET for dynamic IDs.",
              ].join("\n"),
            })
          );
        }
      }

      // Clean up validation namespace
      await fetch("http://localhost:8000/sql", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
          NS: "___surql_validate",
          DB: "___surql_validate",
          Authorization: "Basic " + btoa("root:root"),
        },
        body: "REMOVE DATABASE ___surql_validate;",
        signal: AbortSignal.timeout(2000),
      }).catch(() => {});
    } catch {
      // SurrealDB not running or timeout — skip validation silently
    }

    process.exit(0);
    return;
  }

  // --- .ts files with surql imports: remind about Context7 verification ---
  if (filePath.endsWith(".ts") && existsSync(filePath)) {
    const content = readFileSync(filePath, "utf-8");
    if (
      content.includes("from 'surrealdb'") ||
      content.includes('from "surrealdb"') ||
      content.includes("surql`")
    ) {
      // Dedup: only remind once per session per file
      const dedupFile = `/tmp/surql-ctx7-reminded-${process.env.CLAUDE_SESSION_ID ?? process.pid}-${filePath.replace(/\//g, "_")}`;
      if (!existsSync(dedupFile)) {
        await Bun.write(dedupFile, "");
        console.log(
          JSON.stringify({
            additionalContext: [
              `[SURQL CONTEXT7 REMINDER] This file uses SurrealDB (surql template tag detected).`,
              "Before writing SurrealQL: verify syntax against Context7 docs, NOT general knowledge.",
              "  Library ID: /surrealdb/docs.surrealdb.com",
              "  Also test queries against the live SurrealDB MCP server when possible.",
            ].join("\n"),
          })
        );
      }
    }
  }

  process.exit(0);
}

main();
