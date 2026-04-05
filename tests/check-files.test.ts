/**
 * Check file design contract tests.
 *
 * Check files are the single source of truth for technology-specific enforcement.
 * If a check file has a broken regex, invalid structure, or missing required fields,
 * the entire stack enforcement system gives wrong results silently.
 *
 * These tests verify every check file on disk, not a hardcoded list — so adding
 * a new technology automatically gets tested.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { toolkitPath } from "../src/paths.js";

const CHECKS_DIR = toolkitPath("checks");
const FIXTURES_DIR = resolve(CHECKS_DIR, "fixtures");

interface StaticCheck {
  id: string;
  pattern: string;
  message: string;
  severity: "error" | "warning" | "info";
  condition?: string;
  file_filter?: string;
}

interface CheckFile {
  technology: string;
  golden_version: string;
  checks: {
    static: StaticCheck[];
    live?: unknown[];
  };
  [key: string]: unknown;
}

// Discover all check files dynamically
const checkFiles = readdirSync(CHECKS_DIR)
  .filter(
    (f) =>
      f.endsWith(".json") &&
      f !== "stack-lock.schema.json" &&
      f !== "metrics.json"
  )
  .map((f) => ({
    name: f,
    path: resolve(CHECKS_DIR, f),
  }));

// ---------------------------------------------------------------------------
// Structural validity — "every check file must be well-formed"
// ---------------------------------------------------------------------------

describe("check file structure", () => {
  for (const { name, path } of checkFiles) {
    describe(name, () => {
      let data: CheckFile;

      test("is valid JSON", () => {
        const raw = readFileSync(path, "utf-8");
        data = JSON.parse(raw) as CheckFile;
        expect(data).toBeDefined();
      });

      test("has required top-level fields", () => {
        const raw = readFileSync(path, "utf-8");
        data = JSON.parse(raw) as CheckFile;
        expect(data.technology).toBeString();
        expect(data.golden_version).toBeString();
        expect(data.checks).toBeDefined();
        expect(data.checks.static).toBeArray();
      });

      test("technology name matches filename", () => {
        const raw = readFileSync(path, "utf-8");
        data = JSON.parse(raw) as CheckFile;
        const expected = name.replace(".json", "");
        // Handle hyphenated names (trigger-dev -> trigger-dev)
        expect(data.technology).toBe(expected);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Pattern validity — "every regex pattern must compile and match its target"
// ---------------------------------------------------------------------------

describe("static check patterns", () => {
  for (const { name, path } of checkFiles) {
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as CheckFile;

    for (const check of data.checks.static) {
      describe(`${name} > ${check.id}`, () => {
        test("pattern compiles as valid regex", () => {
          expect(() => new RegExp(check.pattern)).not.toThrow();
        });

        test("has a non-empty message", () => {
          expect(check.message).toBeString();
          expect(check.message.length).toBeGreaterThan(0);
        });

        test("severity is error, warning, or info", () => {
          expect(["error", "warning", "info"]).toContain(check.severity);
        });

        test("id is unique within the file", () => {
          const ids = data.checks.static.map((c) => c.id);
          const duplicates = ids.filter(
            (id, i) => ids.indexOf(id) !== i
          );
          expect(duplicates).not.toContain(check.id);
        });
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Fixture validation — "good fixtures pass, bad fixtures fail"
// ---------------------------------------------------------------------------

describe("check file fixtures", () => {
  if (!existsSync(FIXTURES_DIR)) {
    test.skip("no fixtures directory", () => {});
    return;
  }

  const techDirs = readdirSync(FIXTURES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const tech of techDirs) {
    const checkFilePath = resolve(CHECKS_DIR, `${tech}.json`);
    if (!existsSync(checkFilePath)) continue;

    const raw = readFileSync(checkFilePath, "utf-8");
    const checkData = JSON.parse(raw) as CheckFile;
    const patterns = checkData.checks.static
      .filter((c) => !c.condition) // Skip conditional checks (need runtime context)
      .map((c) => ({
        id: c.id,
        regex: new RegExp(c.pattern),
      }));

    // Test "bad" fixtures — should trigger at least one check
    const badDir = resolve(FIXTURES_DIR, tech, "bad");
    if (existsSync(badDir)) {
      const badFiles = readdirSync(badDir).filter(
        (f) => f.endsWith(".ts") || f.endsWith(".surql") || f.endsWith(".vue")
      );

      for (const badFile of badFiles) {
        test(`${tech}/bad/${badFile} triggers at least one check`, () => {
          const content = readFileSync(
            resolve(badDir, badFile),
            "utf-8"
          );
          const triggered = patterns.some((p) => p.regex.test(content));
          expect(triggered).toBe(true);
        });
      }
    }

    // Test "good" fixtures — should NOT trigger any error-severity checks
    const goodDir = resolve(FIXTURES_DIR, tech, "good");
    if (existsSync(goodDir)) {
      const goodFiles = readdirSync(goodDir).filter(
        (f) => f.endsWith(".ts") || f.endsWith(".surql") || f.endsWith(".vue")
      );

      const errorPatterns = checkData.checks.static
        .filter((c) => c.severity === "error" && !c.condition)
        .map((c) => ({
          id: c.id,
          regex: new RegExp(c.pattern),
        }));

      for (const goodFile of goodFiles) {
        test(`${tech}/good/${goodFile} triggers no error checks`, () => {
          const content = readFileSync(
            resolve(goodDir, goodFile),
            "utf-8"
          );
          const triggered = errorPatterns.filter((p) =>
            p.regex.test(content)
          );
          expect(
            triggered,
            `Triggered: ${triggered.map((t) => t.id).join(", ")}`
          ).toHaveLength(0);
        });
      }
    }
  }
});
