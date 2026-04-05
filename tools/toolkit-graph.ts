#!/usr/bin/env bun
/**
 * toolkit-graph.ts — Build and query the toolkit dependency graph in SurrealDB.
 *
 * Usage:
 *   bun run tools/toolkit-graph.ts rebuild     # Full scan + rebuild graph
 *   bun run tools/toolkit-graph.ts impact <file>  # Show what's affected by changing <file>
 *   bun run tools/toolkit-graph.ts check        # Verify graph matches disk
 *   bun run tools/toolkit-graph.ts stats        # Show graph statistics
 */

import { readdirSync, readFileSync, existsSync, statSync } from "fs";
import { resolve, relative, basename, extname, dirname } from "path";
import { createHash } from "crypto";
import { getDb, closeDb, query } from "../src/db.js";
import { readJson } from "../src/json.js";
import { toolkitPath, claudePath } from "../src/paths.js";

const TOOLKIT = toolkitPath();

// --- File Discovery ---

interface ToolkitFile {
  path: string; // relative to toolkit root
  name: string;
  fileType: string;
  contentHash: string;
}

function classifyFile(relPath: string): string | null {
  if (relPath.startsWith("hooks/guards/")) return "guard";
  if (relPath.startsWith("hooks/lib/")) return "lib";
  if (relPath.startsWith("hooks/")) return "hook";
  if (relPath.startsWith("tools/")) return "tool";
  if (relPath.startsWith("src/")) return "lib";
  if (relPath.startsWith("config/")) return "config";
  if (relPath.startsWith("checks/") && relPath.endsWith(".json")) return "schema";
  if (relPath.startsWith("rules/")) return "rule";
  if (relPath.startsWith("skills/")) return "skill";
  if (relPath.startsWith("workflows/")) return "workflow";
  if (relPath.startsWith("context/")) return "context";
  if (relPath.startsWith("references/")) return "reference";
  if (relPath.startsWith("docs/")) return "doc";
  if (relPath === "README.md" || relPath === "CHANGELOG.md") return "doc";
  if (relPath === "setup.sh") return "config";
  if (relPath === "package.json" || relPath === "tsconfig.json") return "config";
  return null;
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function walkDir(dir: string, extensions: Set<string>): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  function walk(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = resolve(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (extensions.has(extname(entry.name))) {
        results.push(full);
      }
    }
  }

  walk(dir);
  return results;
}

function discoverFiles(): ToolkitFile[] {
  const extensions = new Set([".ts", ".md", ".json", ".sh", ".surql"]);
  const files: ToolkitFile[] = [];

  // Walk relevant directories
  const dirs = [
    "hooks", "tools", "src", "config", "checks", "rules",
    "workflows", "context", "docs", "references",
  ];

  for (const dir of dirs) {
    const fullDir = resolve(TOOLKIT, dir);
    for (const fullPath of walkDir(fullDir, extensions)) {
      const relPath = relative(TOOLKIT, fullPath);
      const fileType = classifyFile(relPath);
      if (!fileType) continue;

      const content = readFileSync(fullPath, "utf-8");
      files.push({
        path: relPath,
        name: basename(fullPath),
        fileType,
        contentHash: hashContent(content),
      });
    }
  }

  // Add root-level files
  for (const rootFile of ["README.md", "CHANGELOG.md", "setup.sh", "package.json", "tsconfig.json"]) {
    const fullPath = resolve(TOOLKIT, rootFile);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      files.push({
        path: rootFile,
        name: rootFile,
        fileType: classifyFile(rootFile) ?? "config",
        contentHash: hashContent(content),
      });
    }
  }

  // Walk skills (just SKILL.md files, not everything)
  const skillsDir = resolve(TOOLKIT, "skills");
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skillMd = resolve(skillsDir, entry.name, "SKILL.md");
      if (existsSync(skillMd)) {
        const content = readFileSync(skillMd, "utf-8");
        files.push({
          path: `skills/${entry.name}/SKILL.md`,
          name: "SKILL.md",
          fileType: "skill",
          contentHash: hashContent(content),
        });
      }
    }
  }

  return files;
}

// --- Reference Detection ---

interface Reference {
  from: string; // path of file containing the reference
  to: string; // path of file being referenced
  refType: string;
  line?: number;
  context?: string;
}

function detectReferences(
  files: ToolkitFile[],
  allPaths: Set<string>
): Reference[] {
  const refs: Reference[] = [];
  const pathsByName = new Map<string, string[]>();

  // Build name -> paths index for fuzzy matching
  for (const f of files) {
    const names = pathsByName.get(f.name) ?? [];
    names.push(f.path);
    pathsByName.set(f.name, names);

    // Also index without extension for .sh/.ts matching
    const noExt = f.name.replace(/\.(ts|sh|js)$/, "");
    const noExtNames = pathsByName.get(noExt) ?? [];
    noExtNames.push(f.path);
    pathsByName.set(noExt, noExtNames);
  }

  for (const file of files) {
    const fullPath = resolve(TOOLKIT, file.path);
    const content = readFileSync(fullPath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // TypeScript imports: from "./foo.js" or from "../src/json.js"
      const importMatch = line.match(/from\s+["']([^"']+)["']/);
      if (importMatch) {
        const importPath = importMatch[1];
        // Resolve relative import to toolkit path
        const resolved = resolveImport(file.path, importPath);
        if (resolved && allPaths.has(resolved)) {
          refs.push({
            from: file.path,
            to: resolved,
            refType: "import",
            line: lineNum,
            context: line.trim().slice(0, 120),
          });
        }
      }

      // File path references in any file: hooks/foo.ts, tools/bar.ts, etc.
      const pathMatches = line.matchAll(
        /(?:hooks|tools|src|config|checks|rules|skills|workflows|docs|references)\/[\w\-./]+\.\w+/g
      );
      for (const match of pathMatches) {
        let refPath = match[0];
        // Normalize .js -> .ts for import references
        refPath = refPath.replace(/\.js$/, ".ts");
        if (allPaths.has(refPath) && refPath !== file.path) {
          refs.push({
            from: file.path,
            to: refPath,
            refType: file.path.endsWith(".md") ? "doc_mention" : "grep_match",
            line: lineNum,
            context: line.trim().slice(0, 120),
          });
        }
      }

      // settings.json command references (in settings backup or docs)
      const cmdMatch = line.match(
        /\.claude\/hooks\/([^\s"']+\.(?:ts|sh|js))/
      );
      if (cmdMatch) {
        // Map deployed path back to toolkit source
        const hookName = cmdMatch[1];
        const candidates = [
          `hooks/${hookName}`,
          `hooks/guards/${hookName}`,
          `hooks/lib/${hookName}`,
        ];
        for (const candidate of candidates) {
          if (allPaths.has(candidate) && candidate !== file.path) {
            refs.push({
              from: file.path,
              to: candidate,
              refType: "settings_command",
              line: lineNum,
              context: line.trim().slice(0, 120),
            });
          }
        }
      }
    }
  }

  return deduplicateRefs(refs);
}

function resolveImport(fromPath: string, importPath: string): string | null {
  const fromDir = dirname(fromPath);
  let resolved = resolve(TOOLKIT, fromDir, importPath);
  resolved = relative(TOOLKIT, resolved);
  // .js -> .ts
  resolved = resolved.replace(/\.js$/, ".ts");
  return resolved;
}

function deduplicateRefs(refs: Reference[]): Reference[] {
  const seen = new Set<string>();
  return refs.filter((r) => {
    const key = `${r.from}|${r.to}|${r.refType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- Settings.json Parsing ---

interface SettingsEntry {
  hookPath: string;
  event: string;
  matcher: string | null;
  command: string;
}

async function parseSettings(): Promise<SettingsEntry[]> {
  interface HookEntry { type?: string; command: string }
  interface HookGroup { matcher?: string; hooks?: HookEntry[]; command?: string }
  interface Settings { hooks?: Record<string, HookGroup[]> }

  const settings = await readJson<Settings>(claudePath("settings.json"));
  if (!settings?.hooks) return [];

  const entries: SettingsEntry[] = [];

  for (const [event, groups] of Object.entries(settings.hooks)) {
    for (const group of groups) {
      const matcher = group.matcher ?? null;
      const commands: string[] = [];
      if (group.command) commands.push(group.command);
      if (group.hooks) {
        for (const h of group.hooks) {
          if (h.command) commands.push(h.command);
        }
      }

      for (const command of commands) {
        // Extract hook path from command
        const pathMatch = command.match(
          /\.claude\/hooks\/([^\s"']+\.(?:ts|sh|js))/
        );
        if (pathMatch) {
          entries.push({
            hookPath: pathMatch[1],
            event,
            matcher,
            command,
          });
        }
      }
    }
  }

  return entries;
}

// --- SurrealDB Operations ---

async function rebuild() {
  const db = await getDb();
  if (!db) {
    console.error("ERROR: Cannot connect to SurrealDB on localhost:8000");
    console.error("Start it with: ~/Sites/Global/scott-toolkit/start-surreal.sh");
    process.exit(1);
  }

  console.log("Rebuilding toolkit dependency graph...\n");

  // Drop and recreate tables (clean slate)
  await db.query("REMOVE TABLE IF EXISTS references;");
  await db.query("REMOVE TABLE IF EXISTS settings_entry;");
  await db.query("REMOVE TABLE IF EXISTS file;");

  // Apply schema
  const schema = readFileSync(resolve(TOOLKIT, "config/toolkit-graph.surql"), "utf-8");
  // Run each statement separately to avoid multi-statement issues
  for (const stmt of schema.split(";").map((s) => s.trim()).filter((s) => s && !s.startsWith("--"))) {
    await db.query(stmt + ";");
  }

  // Discover files
  const files = discoverFiles();
  console.log(`Discovered ${files.length} toolkit files`);

  const allPaths = new Set(files.map((f) => f.path));

  // Insert files
  for (const f of files) {
    await db.query(
      `CREATE file SET
        path = $path,
        name = $name,
        file_type = $file_type,
        content_hash = $hash,
        last_scanned = time::now()`,
      { path: f.path, name: f.name, file_type: f.fileType, hash: f.contentHash }
    );
  }
  console.log(`Inserted ${files.length} file records`);

  // Detect and insert references
  const refs = detectReferences(files, allPaths);
  let refCount = 0;
  for (const r of refs) {
    await db.query(
      `LET $from = (SELECT id FROM file WHERE path = $from_path)[0].id;
       LET $to = (SELECT id FROM file WHERE path = $to_path)[0].id;
       IF $from AND $to {
         RELATE $from->references->$to SET
           ref_type = $ref_type,
           line = $line,
           context = $context;
       };`,
      {
        from_path: r.from,
        to_path: r.to,
        ref_type: r.refType,
        line: r.line ?? null,
        context: r.context ?? null,
      }
    );
    refCount++;
  }
  console.log(`Inserted ${refCount} reference edges`);

  // Parse and insert settings entries
  const settings = await parseSettings();
  for (const s of settings) {
    // Omit matcher field entirely when null (SurrealDB v3: option<string> doesn't accept NULL)
    const matcherClause = s.matcher ? ", matcher = $matcher" : "";
    const vars: Record<string, unknown> = {
      hook_path: s.hookPath,
      event: s.event,
      command: s.command,
    };
    if (s.matcher) vars.matcher = s.matcher;
    await db.query(
      `CREATE settings_entry SET
        hook_path = $hook_path,
        event = $event${matcherClause},
        command = $command`,
      vars
    );
  }
  console.log(`Inserted ${settings.length} settings entries`);

  // Summary
  console.log("\n--- Graph Summary ---");
  console.log(`Files: ${files.length}`);
  console.log(`References: ${refCount}`);
  console.log(`Settings entries: ${settings.length}`);

  const byType = new Map<string, number>();
  for (const f of files) {
    byType.set(f.fileType, (byType.get(f.fileType) ?? 0) + 1);
  }
  console.log("\nBy type:");
  for (const [type, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }
}

async function impact(filePath: string) {
  const relPath = filePath.startsWith("/")
    ? relative(TOOLKIT, filePath)
    : filePath;

  console.log(`Impact analysis for: ${relPath}\n`);

  // Direct references TO this file (what would break)
  const directDeps = await query<{
    path: string;
    ref_type: string;
    line: number;
    context: string;
  }>(
    `SELECT
      in.path AS path,
      ref_type,
      line,
      context
    FROM references
    WHERE out.path = $path
    ORDER BY in.path`,
    { path: relPath }
  );

  if (directDeps && directDeps.length > 0) {
    console.log(`Files that REFERENCE this file (${directDeps.length}):`);
    for (const d of directDeps) {
      const lineInfo = d.line ? `:${d.line}` : "";
      console.log(`  [${d.ref_type}] ${d.path}${lineInfo}`);
      if (d.context) console.log(`         ${d.context.slice(0, 100)}`);
    }
  } else {
    console.log("No files reference this file directly.");
  }

  // Files this file REFERENCES (what it depends on)
  const dependencies = await query<{
    path: string;
    ref_type: string;
  }>(
    `SELECT
      out.path AS path,
      ref_type
    FROM references
    WHERE in.path = $path
    ORDER BY out.path`,
    { path: relPath }
  );

  if (dependencies && dependencies.length > 0) {
    console.log(`\nFiles this file DEPENDS ON (${dependencies.length}):`);
    for (const d of dependencies) {
      console.log(`  [${d.ref_type}] ${d.path}`);
    }
  }

  // Settings registration
  const settingsInfo = await query<{
    event: string;
    matcher: string;
    command: string;
  }>(
    `SELECT event, matcher, command FROM settings_entry WHERE hook_path CONTAINS $name`,
    { name: basename(relPath) }
  );

  if (settingsInfo && settingsInfo.length > 0) {
    console.log(`\nSettings.json registration:`);
    for (const s of settingsInfo) {
      console.log(`  ${s.event}${s.matcher ? ` (${s.matcher})` : ""}: ${s.command}`);
    }
  }

  // Transitive: 2-hop dependents (files that reference files that reference this)
  const transitive = await query<{ path: string }>(
    `SELECT in.path AS path
     FROM references
     WHERE out.id IN (
       SELECT in.id FROM references WHERE out.path = $path
     )
     AND in.path != $path
     GROUP BY in.path`,
    { path: relPath }
  );

  if (transitive && transitive.length > 0) {
    console.log(`\nTransitive dependents (2-hop, ${transitive.length}):`);
    for (const t of transitive) {
      console.log(`  ${t.path}`);
    }
  }
}

async function check() {
  console.log("Checking graph consistency...\n");

  const db = await getDb();
  if (!db) {
    console.error("ERROR: Cannot connect to SurrealDB");
    process.exit(1);
  }

  let issues = 0;

  // Check all files in graph still exist on disk
  const dbFiles = await query<{ path: string }>("SELECT path FROM file");
  if (dbFiles) {
    for (const f of dbFiles) {
      if (!existsSync(resolve(TOOLKIT, f.path))) {
        console.log(`  MISSING: ${f.path} (in graph but not on disk)`);
        issues++;
      }
    }
  }

  // Check all toolkit files on disk are in graph
  const diskFiles = discoverFiles();
  const graphPaths = new Set(dbFiles?.map((f) => f.path) ?? []);
  for (const f of diskFiles) {
    if (!graphPaths.has(f.path)) {
      console.log(`  UNTRACKED: ${f.path} (on disk but not in graph)`);
      issues++;
    }
  }

  // Check content hashes (detect stale graph entries)
  const dbHashes = await query<{ path: string; content_hash: string }>(
    "SELECT path, content_hash FROM file"
  );
  if (dbHashes) {
    for (const f of dbHashes) {
      const fullPath = resolve(TOOLKIT, f.path);
      if (!existsSync(fullPath)) continue;
      const content = readFileSync(fullPath, "utf-8");
      const currentHash = hashContent(content);
      if (currentHash !== f.content_hash) {
        console.log(`  STALE: ${f.path} (content changed since last scan)`);
        issues++;
      }
    }
  }

  if (issues === 0) {
    console.log("Graph is consistent with disk.");
  } else {
    console.log(`\n${issues} issue(s) found. Run 'toolkit-graph.ts rebuild' to fix.`);
  }
}

async function stats() {
  const db = await getDb();
  if (!db) {
    console.error("ERROR: Cannot connect to SurrealDB");
    process.exit(1);
  }

  const fileCount = await query<{ count: number }>("SELECT count() AS count FROM file GROUP ALL");
  const refCount = await query<{ count: number }>("SELECT count() AS count FROM references GROUP ALL");
  const settingsCount = await query<{ count: number }>("SELECT count() AS count FROM settings_entry GROUP ALL");

  console.log("Toolkit Graph Statistics");
  console.log("=======================\n");
  console.log(`Files: ${fileCount?.[0]?.count ?? 0}`);
  console.log(`References: ${refCount?.[0]?.count ?? 0}`);
  console.log(`Settings entries: ${settingsCount?.[0]?.count ?? 0}`);

  // By type
  const byType = await query<{ file_type: string; count: number }>(
    "SELECT file_type, count() AS count FROM file GROUP BY file_type ORDER BY count DESC"
  );
  if (byType && byType.length > 0) {
    console.log("\nFiles by type:");
    for (const t of byType) {
      console.log(`  ${t.file_type}: ${t.count}`);
    }
  }

  // Most referenced files
  const mostReferenced = await query<{ path: string; refs: number }>(
    `SELECT out.path AS path, count() AS refs
     FROM references
     GROUP BY out.path
     ORDER BY refs DESC
     LIMIT 10`
  );
  if (mostReferenced && mostReferenced.length > 0) {
    console.log("\nMost referenced files:");
    for (const f of mostReferenced) {
      console.log(`  ${f.refs} refs <- ${f.path}`);
    }
  }

  // Most dependent files (reference the most other files)
  const mostDependent = await query<{ path: string; deps: number }>(
    `SELECT in.path AS path, count() AS deps
     FROM references
     GROUP BY in.path
     ORDER BY deps DESC
     LIMIT 10`
  );
  if (mostDependent && mostDependent.length > 0) {
    console.log("\nMost dependent files (import the most):");
    for (const f of mostDependent) {
      console.log(`  ${f.deps} deps -> ${f.path}`);
    }
  }
}

// --- Main ---

async function main() {
  const command = process.argv[2];

  switch (command) {
    case "rebuild":
      await rebuild();
      break;
    case "impact":
      if (!process.argv[3]) {
        console.error("Usage: toolkit-graph.ts impact <file-path>");
        process.exit(1);
      }
      await impact(process.argv[3]);
      break;
    case "check":
      await check();
      break;
    case "stats":
      await stats();
      break;
    default:
      console.log("Usage: bun run tools/toolkit-graph.ts <command>");
      console.log("");
      console.log("Commands:");
      console.log("  rebuild        Full scan + rebuild graph in SurrealDB");
      console.log("  impact <file>  Show what's affected by changing a file");
      console.log("  check          Verify graph matches disk");
      console.log("  stats          Show graph statistics");
      process.exit(1);
  }

  await closeDb();
}

main();
