#!/usr/bin/env bun
/**
 * toolkit-graph.ts — Build and query the toolkit dependency graph.
 *
 * Stores the graph as config/toolkit-graph.json (no external DB required).
 *
 * Usage:
 *   bun run tools/toolkit-graph.ts rebuild     # Full scan + rebuild graph
 *   bun run tools/toolkit-graph.ts impact <file>  # Show what's affected by changing <file>
 *   bun run tools/toolkit-graph.ts check        # Verify graph matches disk
 *   bun run tools/toolkit-graph.ts stats        # Show graph statistics
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { resolve, relative, basename, extname, dirname } from "path";
import { createHash } from "crypto";
import { readJson, writeJson } from "../src/json.js";
import { toolkitPath, claudePath } from "../src/paths.js";

const TOOLKIT = toolkitPath();
const GRAPH_PATH = resolve(TOOLKIT, "config/toolkit-graph.json");

// --- Graph Data Model ---

interface ToolkitFile {
  path: string;
  name: string;
  fileType: string;
  contentHash: string;
}

interface Reference {
  from: string;
  to: string;
  refType: string;
  line?: number;
  context?: string;
}

interface SettingsEntry {
  hookPath: string;
  event: string;
  matcher: string | null;
  command: string;
}

interface GraphData {
  files: ToolkitFile[];
  references: Reference[];
  settingsEntries: SettingsEntry[];
  lastRebuilt: string;
}

// --- File Discovery ---

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

  // Root-level files
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

  // Skills (just SKILL.md files)
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

function detectReferences(
  files: ToolkitFile[],
  allPaths: Set<string>
): Reference[] {
  const refs: Reference[] = [];
  const pathsByName = new Map<string, string[]>();

  for (const f of files) {
    const names = pathsByName.get(f.name) ?? [];
    names.push(f.path);
    pathsByName.set(f.name, names);

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

      // TypeScript imports
      const importMatch = line.match(/from\s+["']([^"']+)["']/);
      if (importMatch) {
        const resolved = resolveImport(file.path, importMatch[1]);
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

      // File path references
      const pathMatches = line.matchAll(
        /(?:hooks|tools|src|config|checks|rules|skills|workflows|docs|references)\/[\w\-./]+\.\w+/g
      );
      for (const match of pathMatches) {
        let refPath = match[0];
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

      // settings.json command references
      const cmdMatch = line.match(
        /\.claude\/hooks\/([^\s"']+\.(?:ts|sh|js))/
      );
      if (cmdMatch) {
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

// --- Graph Storage ---

async function loadGraph(): Promise<GraphData | null> {
  return readJson<GraphData>(GRAPH_PATH);
}

async function saveGraph(graph: GraphData): Promise<void> {
  await writeJson(GRAPH_PATH, graph);
}

// --- Commands ---

async function rebuild() {
  console.log("Rebuilding toolkit dependency graph...\n");

  const files = discoverFiles();
  console.log(`Discovered ${files.length} toolkit files`);

  const allPaths = new Set(files.map((f) => f.path));
  const references = detectReferences(files, allPaths);
  console.log(`Detected ${references.length} reference edges`);

  const settingsEntries = await parseSettings();
  console.log(`Parsed ${settingsEntries.length} settings entries`);

  const graph: GraphData = {
    files,
    references,
    settingsEntries,
    lastRebuilt: new Date().toISOString(),
  };

  await saveGraph(graph);
  console.log(`\nGraph saved to ${relative(TOOLKIT, GRAPH_PATH)}`);

  // Summary
  console.log("\n--- Graph Summary ---");
  console.log(`Files: ${files.length}`);
  console.log(`References: ${references.length}`);
  console.log(`Settings entries: ${settingsEntries.length}`);

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

  const graph = await loadGraph();
  if (!graph) {
    console.error("ERROR: No graph data found. Run 'toolkit-graph.ts rebuild' first.");
    process.exit(1);
  }

  console.log(`Impact analysis for: ${relPath}\n`);

  // Direct references TO this file
  const directDeps = graph.references.filter((r) => r.to === relPath);

  if (directDeps.length > 0) {
    console.log(`Files that REFERENCE this file (${directDeps.length}):`);
    for (const d of directDeps) {
      const lineInfo = d.line ? `:${d.line}` : "";
      console.log(`  [${d.refType}] ${d.from}${lineInfo}`);
      if (d.context) console.log(`         ${d.context.slice(0, 100)}`);
    }
  } else {
    console.log("No files reference this file directly.");
  }

  // Files this file REFERENCES
  const dependencies = graph.references.filter((r) => r.from === relPath);

  if (dependencies.length > 0) {
    console.log(`\nFiles this file DEPENDS ON (${dependencies.length}):`);
    for (const d of dependencies) {
      console.log(`  [${d.refType}] ${d.to}`);
    }
  }

  // Settings registration
  const settingsInfo = graph.settingsEntries.filter((s) =>
    s.hookPath.includes(basename(relPath))
  );

  if (settingsInfo.length > 0) {
    console.log(`\nSettings.json registration:`);
    for (const s of settingsInfo) {
      console.log(`  ${s.event}${s.matcher ? ` (${s.matcher})` : ""}: ${s.command}`);
    }
  }

  // Transitive: 2-hop dependents
  const directDepFiles = new Set(directDeps.map((d) => d.from));
  const transitive = graph.references
    .filter((r) => directDepFiles.has(r.to) && r.from !== relPath && !directDepFiles.has(r.from))
    .map((r) => r.from);
  const uniqueTransitive = [...new Set(transitive)].sort();

  if (uniqueTransitive.length > 0) {
    console.log(`\nTransitive dependents (2-hop, ${uniqueTransitive.length}):`);
    for (const t of uniqueTransitive) {
      console.log(`  ${t}`);
    }
  }
}

async function check() {
  console.log("Checking graph consistency...\n");

  const graph = await loadGraph();
  if (!graph) {
    console.error("ERROR: No graph data found. Run 'toolkit-graph.ts rebuild' first.");
    process.exit(1);
  }

  let issues = 0;

  // Check all files in graph still exist on disk
  for (const f of graph.files) {
    if (!existsSync(resolve(TOOLKIT, f.path))) {
      console.log(`  MISSING: ${f.path} (in graph but not on disk)`);
      issues++;
    }
  }

  // Check all toolkit files on disk are in graph
  const diskFiles = discoverFiles();
  const graphPaths = new Set(graph.files.map((f) => f.path));
  for (const f of diskFiles) {
    if (!graphPaths.has(f.path)) {
      console.log(`  UNTRACKED: ${f.path} (on disk but not in graph)`);
      issues++;
    }
  }

  // Check content hashes
  for (const f of graph.files) {
    const fullPath = resolve(TOOLKIT, f.path);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, "utf-8");
    const currentHash = hashContent(content);
    if (currentHash !== f.contentHash) {
      console.log(`  STALE: ${f.path} (content changed since last scan)`);
      issues++;
    }
  }

  if (issues === 0) {
    console.log("Graph is consistent with disk.");
  } else {
    console.log(`\n${issues} issue(s) found. Run 'toolkit-graph.ts rebuild' to fix.`);
  }
}

async function stats() {
  const graph = await loadGraph();
  if (!graph) {
    console.error("ERROR: No graph data found. Run 'toolkit-graph.ts rebuild' first.");
    process.exit(1);
  }

  console.log("Toolkit Graph Statistics");
  console.log("=======================\n");
  console.log(`Files: ${graph.files.length}`);
  console.log(`References: ${graph.references.length}`);
  console.log(`Settings entries: ${graph.settingsEntries.length}`);
  console.log(`Last rebuilt: ${graph.lastRebuilt}`);

  // By type
  const byType = new Map<string, number>();
  for (const f of graph.files) {
    byType.set(f.fileType, (byType.get(f.fileType) ?? 0) + 1);
  }
  console.log("\nFiles by type:");
  for (const [type, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  // Most referenced files
  const refCounts = new Map<string, number>();
  for (const r of graph.references) {
    refCounts.set(r.to, (refCounts.get(r.to) ?? 0) + 1);
  }
  const mostReferenced = [...refCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (mostReferenced.length > 0) {
    console.log("\nMost referenced files:");
    for (const [path, refs] of mostReferenced) {
      console.log(`  ${refs} refs <- ${path}`);
    }
  }

  // Most dependent files
  const depCounts = new Map<string, number>();
  for (const r of graph.references) {
    depCounts.set(r.from, (depCounts.get(r.from) ?? 0) + 1);
  }
  const mostDependent = [...depCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (mostDependent.length > 0) {
    console.log("\nMost dependent files (import the most):");
    for (const [path, deps] of mostDependent) {
      console.log(`  ${deps} deps -> ${path}`);
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
      console.log("  rebuild        Full scan + rebuild graph as JSON");
      console.log("  impact <file>  Show what's affected by changing a file");
      console.log("  check          Verify graph matches disk");
      console.log("  stats          Show graph statistics");
      process.exit(1);
  }
}

main();
