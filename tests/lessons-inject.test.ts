/**
 * Lessons injection guard design contract tests.
 */

import { describe, expect, test } from "bun:test";
import { extractTaggedLessons, shouldInject } from "../hooks/guards/lessons-inject.js";

describe("extractTaggedLessons", () => {
  test("extracts [stack:surrealdb] tagged lessons", () => {
    const content = `# Lessons
- [stack:surrealdb] Always use type::record() not type::thing()
- [project] Update CLAUDE.md after each milestone
- [stack:nuxt] Use definePageMeta for route middleware`;
    const result = extractTaggedLessons(content, ["surrealdb"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("type::record");
  });

  test("extracts all [stack:*] lessons when no filter", () => {
    const content = `# Lessons
- [stack:surrealdb] Use type::record()
- [stack:nuxt] Use definePageMeta
- [project] Not a stack lesson`;
    const result = extractTaggedLessons(content, null);
    expect(result).toHaveLength(2);
  });

  test("returns empty array when no lessons match", () => {
    const content = `# Lessons
- [project] Not a stack lesson
- [prompt] Use neutral framing`;
    const result = extractTaggedLessons(content, ["surrealdb"]);
    expect(result).toHaveLength(0);
  });

  test("handles empty file", () => {
    expect(extractTaggedLessons("", null)).toEqual([]);
  });

  test("handles file with no tagged lessons", () => {
    const content = "# Lessons\nJust some notes without tags";
    expect(extractTaggedLessons(content, null)).toEqual([]);
  });

  test("extracts multiple technologies", () => {
    const content = `- [stack:surrealdb] Lesson A
- [stack:nuxt] Lesson B
- [stack:tailwind] Lesson C`;
    const result = extractTaggedLessons(content, ["surrealdb", "nuxt"]);
    expect(result).toHaveLength(2);
  });
});

describe("shouldInject", () => {
  test("returns true when lessons file exists and has stack lessons", () => {
    expect(shouldInject(true, 3)).toBe(true);
  });

  test("returns false when no lessons file", () => {
    expect(shouldInject(false, 0)).toBe(false);
  });

  test("returns false when lessons file exists but no stack lessons", () => {
    expect(shouldInject(true, 0)).toBe(false);
  });
});
