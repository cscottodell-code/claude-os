/**
 * Guard design contract tests.
 *
 * These verify the PROMISES each guard makes, not implementation details.
 * If a guard says "fail-closed", it must block when input is ambiguous.
 * If a guard says "blocks rm -rf", it must actually catch the variants.
 */

import { describe, expect, test } from "bun:test";
import { guardDestructive } from "../hooks/guards/destructive.js";
import { guardNpmInstall } from "../hooks/guards/npm-install.js";

// ---------------------------------------------------------------------------
// guardDestructive -- "blocks hard-to-reverse operations"
// ---------------------------------------------------------------------------

describe("guardDestructive", () => {
  test("blocks rm -rf", () => {
    expect(guardDestructive("rm -rf /tmp/foo").allow).toBe(false);
  });

  test("blocks rm -rf with path", () => {
    expect(guardDestructive("rm -rf ./node_modules").allow).toBe(false);
  });

  test("blocks git reset --hard", () => {
    expect(guardDestructive("git reset --hard HEAD~1").allow).toBe(false);
  });

  test("blocks git checkout -- (discard changes)", () => {
    expect(guardDestructive("git checkout -- src/main.ts").allow).toBe(false);
  });

  test("blocks git clean -f", () => {
    expect(guardDestructive("git clean -f").allow).toBe(false);
  });

  test("does NOT block rm without -rf", () => {
    expect(guardDestructive("rm file.txt").allow).toBe(true);
  });

  test("does NOT block git reset without --hard", () => {
    expect(guardDestructive("git reset HEAD file.txt").allow).toBe(true);
  });

  test("does NOT block git checkout (branch switch)", () => {
    expect(guardDestructive("git checkout feature-branch").allow).toBe(true);
  });

  test("ignores destructive patterns inside quoted strings", () => {
    expect(
      guardDestructive("echo 'rm -rf is dangerous'").allow
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// guardNpmInstall -- "blocks installs, detects stack drift"
// ---------------------------------------------------------------------------

describe("guardNpmInstall", () => {
  test("blocks npm install <package>", () => {
    const result = guardNpmInstall("npm install lodash");
    expect(result.allow).toBe(false);
    expect(result.message).toContain("lodash");
  });

  test("blocks npm i <package> (short form)", () => {
    expect(guardNpmInstall("npm i lodash").allow).toBe(false);
  });

  test("blocks bare npm install", () => {
    expect(guardNpmInstall("npm install").allow).toBe(false);
  });

  test("blocks pnpm add", () => {
    const result = guardNpmInstall("pnpm add zod");
    expect(result.allow).toBe(false);
    expect(result.message).toContain("zod");
  });

  test("blocks bun add", () => {
    const result = guardNpmInstall("bun add elysia");
    expect(result.allow).toBe(false);
    expect(result.message).toContain("elysia");
  });

  test("does NOT block npm run", () => {
    expect(guardNpmInstall("npm run dev").allow).toBe(true);
  });

  test("does NOT block npm test", () => {
    expect(guardNpmInstall("npm test").allow).toBe(true);
  });

  test("does NOT block pnpm run", () => {
    expect(guardNpmInstall("pnpm run build").allow).toBe(true);
  });

  test("does NOT block bun run", () => {
    expect(guardNpmInstall("bun run dev").allow).toBe(true);
  });

  test("ignores install inside quoted strings", () => {
    expect(
      guardNpmInstall("echo 'npm install lodash'").allow
    ).toBe(true);
  });
});
