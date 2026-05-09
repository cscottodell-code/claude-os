#!/usr/bin/env bun
/**
 * Guard: Frontmatter validation against Phase 3a per-type schemas (Phase 4 Rules 2 + 5).
 *
 * Tool + field-presence hybrid (Rule 2):
 *  - Write tool (file creation): block on missing required fields and on
 *    present-field violations (closed vocab, forbidden link fields).
 *  - Edit tool (file modification): block on present-field violations only;
 *    advise on missing required fields via console output (no block) so the
 *    legacy non-conformance per Phase 3a Rule 5 stays soft.
 *
 * Reads schemas from claude-os/config/frontmatter-schemas.json.
 * Bypass: touch ~/.claude/.allow-frontmatter for single-use authorization.
 */

import { existsSync, readFileSync, unlinkSync } from "fs";
import { homedir } from "os";
import { resolve } from "path";

import { readStdin, getFilePath } from "../lib/stdin.js";
import {
  extractFrontmatter,
  extractTagAxes,
  resolveType,
  resolveSubtype,
  asArray,
} from "../lib/frontmatter.js";

const BYPASS_MARKER = resolve(homedir(), ".claude/.allow-frontmatter");
const CONFIG_PATH = resolve(
  homedir(),
  "Scott/claude-os/config/frontmatter-schemas.json"
);

interface SubtypeUnlock {
  applies_when: {
    type?: string;
    subtype?: string;
    tags_axis?: Record<string, string>;
  };
  required_fields?: string[];
  field_vocabs?: Record<string, string[]>;
}

interface ConditionalRequired {
  trigger: { field: string; value: string };
  required_fields: string[];
}

interface SchemaConfig {
  universal_baseline: {
    required_fields: string[];
    tags_required_axes: string[];
  };
  types: Record<
    string,
    {
      required_fields?: string[];
      tags_required_axes?: string[];
    }
  >;
  subtype_unlocks: Record<string, SubtypeUnlock>;
  conditional_required_fields: Record<string, ConditionalRequired>;
  tag_axis_vocabs: Record<string, string[]>;
  format_conventions: { field_name_pattern: string };
  forbidden_link_fields: { fields: string[] };
  scope: {
    include_prefixes: string[];
    exclude_prefixes: string[];
    exclude_filenames: string[];
  };
}

function loadConfig(): SchemaConfig | null {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as SchemaConfig;
  } catch {
    return null;
  }
}

function inScope(filePath: string, scope: SchemaConfig["scope"]): boolean {
  if (!scope.include_prefixes.some((p) => filePath.includes("/" + p))) return false;
  if (scope.exclude_prefixes.some((p) => filePath.includes("/" + p))) return false;
  const filename = filePath.split("/").pop() ?? "";
  if (scope.exclude_filenames.includes(filename)) return false;
  if (!filename.endsWith(".md")) return false;
  return true;
}

function unlockMatches(
  unlock: SubtypeUnlock,
  type: string | null,
  subtype: string | null,
  tagAxes: Record<string, string>
): boolean {
  const w = unlock.applies_when;
  if (w.type && w.type !== type) return false;
  if (w.subtype && w.subtype !== subtype) return false;
  if (w.tags_axis) {
    for (const [axis, value] of Object.entries(w.tags_axis)) {
      if (tagAxes[axis] !== value) return false;
    }
  }
  return true;
}

interface ValidationOutcome {
  blockingErrors: string[];
  advisories: string[];
}

function validate(
  fields: Record<string, string | string[]>,
  config: SchemaConfig
): ValidationOutcome {
  const blockingErrors: string[] = [];
  const advisories: string[] = [];

  for (const fieldName of Object.keys(fields)) {
    if (!new RegExp(config.format_conventions.field_name_pattern).test(fieldName)) {
      blockingErrors.push(
        `Frontmatter field name "${fieldName}" violates lowercase-kebab convention (Phase 3a Rule 4).`
      );
    }
    if (config.forbidden_link_fields.fields.includes(fieldName)) {
      blockingErrors.push(
        `Frontmatter field "${fieldName}" is forbidden (Phase 3a Rule 3: no frontmatter link fields). Move the relationship to body wikilinks or prose.`
      );
    }
  }

  const tags = asArray(fields.tags);
  const tagAxes = extractTagAxes(tags);

  for (const [axis, vocab] of Object.entries(config.tag_axis_vocabs)) {
    const value = tagAxes[axis];
    if (value !== undefined && !vocab.includes(value)) {
      blockingErrors.push(
        `Tag value "${axis}/${value}" is not in the closed vocab. Allowed: ${axis}/${vocab.join(", " + axis + "/")}.`
      );
    }
  }

  const requiredUniversal = config.universal_baseline.required_fields;
  const requiredAxes = config.universal_baseline.tags_required_axes;

  const missing: string[] = [];
  for (const f of requiredUniversal) {
    if (!(f in fields)) missing.push(f);
  }
  for (const axis of requiredAxes) {
    if (!(axis in tagAxes)) missing.push(`tags:${axis}/<value>`);
  }

  const type = resolveType(fields);
  const subtype = resolveSubtype(fields);

  if (type && config.types[type]) {
    const typeSpec = config.types[type];
    for (const f of typeSpec.required_fields ?? []) {
      if (!(f in fields)) missing.push(f);
    }
    for (const axis of typeSpec.tags_required_axes ?? []) {
      if (!(axis in tagAxes)) missing.push(`tags:${axis}/<value>`);
    }
  } else if (type === null && tags.length > 0) {
    advisories.push(
      `Type cannot be resolved (no top-level type: field and no types/X tag). Add type: <vocab> or include types/<value> in tags.`
    );
  }

  for (const [key, unlock] of Object.entries(config.subtype_unlocks)) {
    if (key.startsWith("_") || typeof unlock !== "object" || unlock === null) continue;
    if (!("applies_when" in unlock)) continue;
    if (!unlockMatches(unlock as SubtypeUnlock, type, subtype, tagAxes)) continue;
    const u = unlock as SubtypeUnlock;
    for (const f of u.required_fields ?? []) {
      if (!(f in fields)) missing.push(f);
    }
    for (const [field, vocab] of Object.entries(u.field_vocabs ?? {})) {
      const v = fields[field];
      if (typeof v === "string" && !vocab.includes(v)) {
        blockingErrors.push(
          `Field "${field}" value "${v}" is not in the closed vocab. Allowed: ${vocab.join(", ")}.`
        );
      }
    }
  }

  for (const [key, cr] of Object.entries(config.conditional_required_fields)) {
    if (key.startsWith("_") || typeof cr !== "object" || cr === null) continue;
    if (!("trigger" in cr)) continue;
    const c = cr as ConditionalRequired;
    if (fields[c.trigger.field] === c.trigger.value) {
      for (const f of c.required_fields) {
        if (!(f in fields)) missing.push(f);
      }
    }
  }

  if (missing.length > 0) {
    advisories.push(`Missing required fields: ${missing.join(", ")}.`);
  }

  return { blockingErrors, advisories };
}

async function main() {
  const result = await readStdin();
  if (!result.ok) {
    console.log("guard-frontmatter: stdin parse failed; blocking (fail-closed).");
    process.exit(2);
  }
  const input = result.input;
  if (!input) process.exit(0);

  const tool = input.tool_name;
  if (tool !== "Edit" && tool !== "Write") process.exit(0);

  const filePath = getFilePath(input);
  if (!filePath) process.exit(0);

  const config = loadConfig();
  if (!config) process.exit(0);

  if (!inScope(filePath, config.scope)) process.exit(0);

  const toolInput = input.tool_input as Record<string, unknown> | undefined;
  if (!toolInput) process.exit(0);

  let contentToValidate: string | null = null;
  let preEditExists = false;

  if (tool === "Write") {
    contentToValidate = (toolInput.content as string | undefined) ?? null;
    try {
      readFileSync(filePath, "utf-8");
      preEditExists = true;
    } catch {
      preEditExists = false;
    }
  } else {
    try {
      const preEdit = readFileSync(filePath, "utf-8");
      preEditExists = true;
      const oldStr = (toolInput.old_string as string | undefined) ?? "";
      const newStr = (toolInput.new_string as string | undefined) ?? "";
      contentToValidate = preEdit.replace(oldStr, newStr);
    } catch {
      process.exit(0);
    }
  }

  if (!contentToValidate) process.exit(0);

  const fm = extractFrontmatter(contentToValidate);
  if (!fm) {
    if (tool === "Write") {
      console.log(
        `guard-frontmatter: ${filePath} has no YAML frontmatter. Wiki notes require frontmatter (Phase 3a). To authorize a one-off: touch ~/.claude/.allow-frontmatter`
      );
      if (existsSync(BYPASS_MARKER)) {
        try {
          unlinkSync(BYPASS_MARKER);
          console.log("guard-frontmatter: allowed by single-use bypass marker. Marker consumed.");
          process.exit(0);
        } catch {
          console.log("guard-frontmatter: bypass marker present but could not be consumed. Blocking.");
          process.exit(2);
        }
      }
      process.exit(2);
    }
    process.exit(0);
  }

  const outcome = validate(fm.fields, config);

  const isStrict = tool === "Write" && !preEditExists;
  const blockingProblems = [...outcome.blockingErrors];
  if (isStrict) blockingProblems.push(...outcome.advisories);

  if (blockingProblems.length === 0) {
    if (outcome.advisories.length > 0) {
      console.log(
        `guard-frontmatter: ${filePath} (advisory):\n  ${outcome.advisories.join("\n  ")}`
      );
    }
    process.exit(0);
  }

  if (existsSync(BYPASS_MARKER)) {
    try {
      unlinkSync(BYPASS_MARKER);
    } catch {
      console.log("guard-frontmatter: bypass marker present but could not be consumed. Blocking.");
      process.exit(2);
    }
    console.log(
      `guard-frontmatter: edit allowed by single-use bypass marker (${filePath}). Marker consumed.`
    );
    process.exit(0);
  }

  console.log(
    `Frontmatter validation failed for ${filePath}:\n  ${blockingProblems.join("\n  ")}\n` +
      `To authorize a one-off violation: touch ~/.claude/.allow-frontmatter`
  );
  process.exit(2);
}

main();
