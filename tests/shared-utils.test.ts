/**
 * Shared utility design contract tests.
 *
 * These verify the foundational utilities that hooks, guards, and tools depend on.
 * A bug here cascades everywhere.
 */

import { describe, expect, test } from "bun:test";
import { parseSemver, compareSemver, satisfies } from "../src/semver.js";
import { readJson, readJsonOr, writeJson } from "../src/json.js";
import { toolkitPath, claudePath, TOOLKIT_DIR } from "../src/paths.js";
import { getFilePath, getCommand, stripQuoted, type HookInput } from "../hooks/lib/stdin.js";
import { shortHash, fileMtime, dateStr, daysBetween } from "../hooks/lib/platform.js";
import { resolve } from "path";
import { homedir } from "os";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";

// ---------------------------------------------------------------------------
// semver — "parse, compare, and constraint-match version strings"
// ---------------------------------------------------------------------------

describe("parseSemver", () => {
  test("parses full semver", () => {
    expect(parseSemver("4.3.2")).toEqual({ major: 4, minor: 3, patch: 2 });
  });

  test("parses major-only", () => {
    expect(parseSemver("3")).toEqual({ major: 3, minor: 0, patch: 0 });
  });

  test("parses major.minor", () => {
    expect(parseSemver("4.3")).toEqual({ major: 4, minor: 3, patch: 0 });
  });

  test("strips v prefix", () => {
    expect(parseSemver("v3")).toEqual({ major: 3, minor: 0, patch: 0 });
  });

  test("strips caret prefix", () => {
    expect(parseSemver("^2.0.1")).toEqual({ major: 2, minor: 0, patch: 1 });
  });

  test("strips >= prefix", () => {
    expect(parseSemver(">=4")).toEqual({ major: 4, minor: 0, patch: 0 });
  });

  test("returns null for empty string", () => {
    expect(parseSemver("")).toBeNull();
  });

  test("returns null for non-version string", () => {
    expect(parseSemver("latest")).toBeNull();
  });
});

describe("compareSemver", () => {
  test("equal versions", () => {
    expect(compareSemver("4.3.2", "4.3.2")).toBe(0);
  });

  test("greater major", () => {
    expect(compareSemver("5.0.0", "4.0.0")).toBe(1);
  });

  test("lesser minor", () => {
    expect(compareSemver("4.2.0", "4.3.0")).toBe(-1);
  });

  test("greater patch", () => {
    expect(compareSemver("4.3.3", "4.3.2")).toBe(1);
  });

  test("returns 0 when either is unparseable", () => {
    expect(compareSemver("latest", "4.0.0")).toBe(0);
  });
});

describe("satisfies", () => {
  test(">= constraint: version equals minimum", () => {
    expect(satisfies("4.0.0", ">=4")).toBe(true);
  });

  test(">= constraint: version exceeds minimum", () => {
    expect(satisfies("5.1.0", ">=4")).toBe(true);
  });

  test(">= constraint: version below minimum", () => {
    expect(satisfies("3.9.9", ">=4")).toBe(false);
  });

  test("caret constraint: same major, higher minor", () => {
    expect(satisfies("2.1.0", "^2.0.1")).toBe(true);
  });

  test("caret constraint: same major, same version", () => {
    expect(satisfies("2.0.1", "^2.0.1")).toBe(true);
  });

  test("caret constraint: same major, lower patch", () => {
    expect(satisfies("2.0.0", "^2.0.1")).toBe(false);
  });

  test("caret constraint: different major rejects", () => {
    expect(satisfies("3.0.0", "^2.0.1")).toBe(false);
  });

  test("bare version: major match", () => {
    expect(satisfies("4.5.2", "4")).toBe(true);
  });

  test("bare version: major mismatch", () => {
    expect(satisfies("3.5.2", "4")).toBe(false);
  });

  test("returns false when either is unparseable", () => {
    expect(satisfies("latest", ">=4")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// json — "read/write JSON with graceful failure"
// ---------------------------------------------------------------------------

describe("readJson", () => {
  test("returns null for nonexistent file", async () => {
    const result = await readJson("/tmp/does-not-exist-" + Date.now() + ".json");
    expect(result).toBeNull();
  });

  test("returns null for invalid JSON and logs error", async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), "toolkit-test-"));
    const path = resolve(tmpDir, "bad.json");
    await writeFile(path, "not json {{{", "utf-8");

    // Capture stderr to verify the warning is logged
    const origError = console.error;
    let logged = "";
    console.error = (msg: string) => { logged = msg; };
    const result = await readJson(path);
    console.error = origError;

    expect(result).toBeNull();
    expect(logged).toContain("JSON parse error");
    expect(logged).toContain("bad.json");
    await rm(tmpDir, { recursive: true });
  });

  test("returns null silently for nonexistent file (no log)", async () => {
    const origError = console.error;
    let logged = false;
    console.error = () => { logged = true; };
    await readJson("/tmp/does-not-exist-" + Date.now() + ".json");
    console.error = origError;

    expect(logged).toBe(false);
  });

  test("parses valid JSON", async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), "toolkit-test-"));
    const path = resolve(tmpDir, "good.json");
    await writeFile(path, '{"key": "value"}', "utf-8");
    const result = await readJson<{ key: string }>(path);
    expect(result).toEqual({ key: "value" });
    await rm(tmpDir, { recursive: true });
  });
});

describe("readJsonOr", () => {
  test("returns default for nonexistent file", async () => {
    const result = await readJsonOr(
      "/tmp/does-not-exist-" + Date.now() + ".json",
      { fallback: true }
    );
    expect(result).toEqual({ fallback: true });
  });
});

describe("writeJson", () => {
  test("writes and reads back JSON", async () => {
    const tmpDir = await mkdtemp(resolve(tmpdir(), "toolkit-test-"));
    const path = resolve(tmpDir, "out.json");
    await writeJson(path, { hello: "world", count: 42 });
    const result = await readJson<{ hello: string; count: number }>(path);
    expect(result).toEqual({ hello: "world", count: 42 });
    await rm(tmpDir, { recursive: true });
  });
});

// ---------------------------------------------------------------------------
// paths — "canonical path resolution"
// ---------------------------------------------------------------------------

describe("paths", () => {
  test("TOOLKIT_DIR resolves to expected location", () => {
    const expected =
      process.env.CLAUDE_OS_DIR ??
      resolve(homedir(), "Scott/claude-os");
    expect(TOOLKIT_DIR).toBe(expected);
  });

  test("toolkitPath joins segments", () => {
    expect(toolkitPath("hooks", "lib", "stdin.ts")).toBe(
      resolve(TOOLKIT_DIR, "hooks/lib/stdin.ts")
    );
  });

  test("claudePath resolves to ~/.claude", () => {
    expect(claudePath("settings.json")).toBe(
      resolve(homedir(), ".claude/settings.json")
    );
  });
});

// ---------------------------------------------------------------------------
// stdin — "parse Claude Code hook input correctly"
// ---------------------------------------------------------------------------

describe("stdin helpers", () => {
  const bashInput: HookInput = {
    tool_name: "Bash",
    tool_input: {
      command: "git push origin main",
    },
  };

  const editInput: HookInput = {
    tool_name: "Edit",
    tool_input: {
      file_path: "/Users/scott/project/CLAUDE.md",
    },
  };

  const writeInput: HookInput = {
    tool_name: "Write",
    tool_input: {
      path: "/Users/scott/project/output.json",
      content: "{}",
    },
  };

  test("getCommand extracts Bash command", () => {
    expect(getCommand(bashInput)).toBe("git push origin main");
  });

  test("getCommand returns null for non-Bash tools", () => {
    expect(getCommand(editInput)).toBeNull();
  });

  test("getFilePath extracts file_path", () => {
    expect(getFilePath(editInput)).toBe("/Users/scott/project/CLAUDE.md");
  });

  test("getFilePath falls back to path field", () => {
    expect(getFilePath(writeInput)).toBe("/Users/scott/project/output.json");
  });

  test("getFilePath returns null when neither field exists", () => {
    expect(getFilePath(bashInput)).toBeNull();
  });

  test("getCommand returns null for empty input", () => {
    expect(getCommand({})).toBeNull();
  });

  test("getFilePath returns null for empty input", () => {
    expect(getFilePath({})).toBeNull();
  });
});

describe("stripQuoted", () => {
  test("strips single-quoted strings", () => {
    expect(stripQuoted("echo 'git push'")).toBe("echo ");
  });

  test("strips double-quoted strings", () => {
    expect(stripQuoted('echo "rm -rf /"')).toBe("echo ");
  });

  test("strips multiple quoted sections", () => {
    expect(stripQuoted("cmd 'a' arg 'b'")).toBe("cmd  arg ");
  });

  test("leaves unquoted content intact", () => {
    expect(stripQuoted("git push origin main")).toBe("git push origin main");
  });

  test("handles empty string", () => {
    expect(stripQuoted("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// platform — "cross-platform date and hash utilities"
// ---------------------------------------------------------------------------

describe("platform utilities", () => {
  test("shortHash returns consistent hex string", () => {
    const h1 = shortHash("test");
    const h2 = shortHash("test");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(8);
    expect(h1).toMatch(/^[0-9a-f]+$/);
  });

  test("shortHash returns different hashes for different input", () => {
    expect(shortHash("a")).not.toBe(shortHash("b"));
  });

  test("shortHash respects custom length", () => {
    expect(shortHash("test", 4)).toHaveLength(4);
    expect(shortHash("test", 16)).toHaveLength(16);
  });

  test("fileMtime returns number for existing file", () => {
    const mtime = fileMtime(resolve(TOOLKIT_DIR, "README.md"));
    expect(mtime).toBeNumber();
    expect(mtime).toBeGreaterThan(0);
  });

  test("fileMtime returns null for nonexistent file", () => {
    expect(fileMtime("/tmp/nonexistent-" + Date.now())).toBeNull();
  });

  test("dateStr returns YYYY-MM-DD format", () => {
    expect(dateStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("dateStr formats specific date correctly", () => {
    expect(dateStr(new Date("2026-04-05T12:00:00Z"))).toBe("2026-04-05");
  });

  test("daysBetween calculates correctly", () => {
    const a = new Date("2026-01-01");
    const b = new Date("2026-01-31");
    expect(daysBetween(a, b)).toBe(30);
  });

  test("daysBetween is absolute (order doesn't matter)", () => {
    const a = new Date("2026-01-01");
    const b = new Date("2026-01-31");
    expect(daysBetween(a, b)).toBe(daysBetween(b, a));
  });

  test("daysBetween returns 0 for same date", () => {
    const d = new Date("2026-04-05");
    expect(daysBetween(d, d)).toBe(0);
  });
});
