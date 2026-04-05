/**
 * Guard design contract tests.
 *
 * These verify the PROMISES each guard makes, not implementation details.
 * If a guard says "fail-closed", it must block when input is ambiguous.
 * If a guard says "blocks rm -rf", it must actually catch the variants.
 */

import { describe, expect, test } from "bun:test";
import { guardGitPush } from "../hooks/guards/git-push.js";
import { guardDestructive } from "../hooks/guards/destructive.js";
import { guardNpmInstall } from "../hooks/guards/npm-install.js";
import { guardPhaseCompletion } from "../hooks/guards/phase-completion.js";
import {
  guardProjectScaffolded,
  guardDesignApproved,
  guardChangesDrafted,
  guardReflectionComplete,
} from "../hooks/guards/workflow-gates.js";

// ---------------------------------------------------------------------------
// guardGitPush — "fail-closed: blocks git push"
// ---------------------------------------------------------------------------

describe("guardGitPush", () => {
  test("blocks simple git push", () => {
    const result = guardGitPush("git push", "{}");
    expect(result.allow).toBe(false);
  });

  test("blocks git push with remote and branch", () => {
    const result = guardGitPush("git push origin main", "{}");
    expect(result.allow).toBe(false);
  });

  test("blocks git push --force", () => {
    const result = guardGitPush("git push --force origin main", "{}");
    expect(result.allow).toBe(false);
  });

  test("blocks git push in a chain (&&)", () => {
    const result = guardGitPush(
      "git add -A && git commit -m 'wip' && git push",
      "{}"
    );
    expect(result.allow).toBe(false);
  });

  test("does NOT block git pull", () => {
    const result = guardGitPush("git pull origin main", "{}");
    expect(result.allow).toBe(true);
  });

  test("does NOT block echo containing 'git push'", () => {
    // "git push" inside a quoted string should be stripped
    const result = guardGitPush("echo 'git push is blocked'", "{}");
    expect(result.allow).toBe(true);
  });

  test("fail-closed: blocks when command is null but rawInput exists", () => {
    const result = guardGitPush(null, '{"something":"unparseable"}');
    expect(result.allow).toBe(false);
    expect(result.message).toContain("fail-closed");
  });

  test("allows when both command and rawInput are empty", () => {
    const result = guardGitPush(null, "");
    expect(result.allow).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// guardDestructive — "blocks hard-to-reverse operations"
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
// guardNpmInstall — "blocks installs, detects stack drift"
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

// ---------------------------------------------------------------------------
// guardPhaseCompletion — "blocks phase complete without closeout marker"
// ---------------------------------------------------------------------------

describe("guardPhaseCompletion", () => {
  test("allows non-phase-completion commands", () => {
    expect(guardPhaseCompletion("git commit -m 'done'").allow).toBe(true);
  });

  test("allows when command doesn't match GSD pattern", () => {
    expect(
      guardPhaseCompletion("echo 'phase complete'").allow
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Workflow gates — "gates block by default when marker files are missing"
// ---------------------------------------------------------------------------

describe("workflow gates", () => {
  const nonexistentDir = "/tmp/toolkit-test-nonexistent-" + Date.now();

  test("guardProjectScaffolded blocks when marker missing", () => {
    const result = guardProjectScaffolded(nonexistentDir);
    expect(result.allow).toBe(false);
    expect(result.message).toContain(".project-scaffolded");
  });

  test("guardDesignApproved blocks when marker missing", () => {
    const result = guardDesignApproved(nonexistentDir);
    expect(result.allow).toBe(false);
    expect(result.message).toContain(".design-approved");
  });

  test("guardChangesDrafted blocks when marker missing", () => {
    const result = guardChangesDrafted(nonexistentDir);
    expect(result.allow).toBe(false);
    expect(result.message).toContain(".changes-drafted");
  });

  test("guardReflectionComplete blocks when marker missing", () => {
    const result = guardReflectionComplete(nonexistentDir);
    expect(result.allow).toBe(false);
    expect(result.message).toContain(".reflection-complete");
  });
});
