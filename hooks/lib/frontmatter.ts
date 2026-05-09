/**
 * Tiny YAML frontmatter parser for the growth-os shape governed by Phase 3a Rule 4.
 * Handles the limited subset: scalar fields, inline list `[a, b, c]`, multi-line
 * list `key:\n  - a\n  - b`, optional quoted values. No nested objects (Phase 3a forbids).
 *
 * The full `yaml` package would also work, but this keeps zero dependencies and
 * avoids the per-invocation parse cost of a general parser at hot-path PreToolUse time.
 */

export interface ParsedFrontmatter {
  fields: Record<string, string | string[]>;
  raw: string;
  bodyStart: number;
}

const FRONTMATTER_FENCE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function extractFrontmatter(content: string): ParsedFrontmatter | null {
  const match = content.match(FRONTMATTER_FENCE);
  if (!match) return null;
  const raw = match[1];
  const fields = parseFrontmatterBody(raw);
  return { fields, raw, bodyStart: match[0].length };
}

function parseFrontmatterBody(body: string): Record<string, string | string[]> {
  const fields: Record<string, string | string[]> = {};
  const lines = body.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i++;
      continue;
    }
    const scalarMatch = line.match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
    if (!scalarMatch) {
      i++;
      continue;
    }
    const key = scalarMatch[1];
    const rest = scalarMatch[2];
    if (rest === "") {
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        const itemMatch = next.match(/^\s+-\s*(.*)$/);
        if (!itemMatch) break;
        items.push(stripQuotes(itemMatch[1].trim()));
        j++;
      }
      fields[key] = items;
      i = j;
      continue;
    }
    if (rest.startsWith("[") && rest.endsWith("]")) {
      const inner = rest.slice(1, -1);
      const items = inner === ""
        ? []
        : inner.split(",").map((s) => stripQuotes(s.trim()));
      fields[key] = items;
      i++;
      continue;
    }
    fields[key] = stripQuotes(rest);
    i++;
  }
  return fields;
}

function stripQuotes(s: string): string {
  if (s.length >= 2) {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/** Extract type axis values from a tags array. e.g. ["types/commitment", "source/llm"] -> { types: "commitment", source: "llm" }. */
export function extractTagAxes(tags: string[]): Record<string, string> {
  const axes: Record<string, string> = {};
  for (const tag of tags) {
    const slashIdx = tag.indexOf("/");
    if (slashIdx === -1) continue;
    const axis = tag.slice(0, slashIdx);
    const value = tag.slice(slashIdx + 1);
    if (!(axis in axes)) axes[axis] = value;
  }
  return axes;
}

/** Resolve a note's type from frontmatter. Precedence: top-level `type:` field, then tag axis `types/X`. */
export function resolveType(fields: Record<string, string | string[]>): string | null {
  if (typeof fields.type === "string") return fields.type;
  if (Array.isArray(fields.tags)) {
    const axes = extractTagAxes(fields.tags);
    if (axes.types) return axes.types;
  }
  return null;
}

/** Get the subtype from frontmatter. */
export function resolveSubtype(fields: Record<string, string | string[]>): string | null {
  if (typeof fields.subtype === "string") return fields.subtype;
  return null;
}

export function asArray(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}
