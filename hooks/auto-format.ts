#!/usr/bin/env bun
/**
 * auto-format.ts — PostToolUse: run Prettier on written/edited files.
 */

import { existsSync } from "fs";
import { resolve, dirname, extname } from "path";
import { readStdin, getFilePath } from "./lib/stdin.js";
import { exec } from "../src/exec.js";

const FORMATTABLE = new Set([".js", ".ts", ".vue", ".css", ".json"]);
const PRETTIER_CONFIGS = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.js",
  ".prettierrc.cjs",
  ".prettierrc.yaml",
  "prettier.config.js",
];

const input = await readStdin();
if (!input) process.exit(0);

const filePath = getFilePath(input);
if (!filePath || !FORMATTABLE.has(extname(filePath))) process.exit(0);
if (!existsSync(filePath)) process.exit(0);

// Find project root (git root or file directory)
const gitResult = await exec(
  `git -C "${dirname(filePath)}" rev-parse --show-toplevel 2>/dev/null`
);
const projectRoot = gitResult.ok ? gitResult.stdout : dirname(filePath);

// Check if project has Prettier configured
const hasPrettier =
  PRETTIER_CONFIGS.some((c) => existsSync(resolve(projectRoot, c))) ||
  (() => {
    try {
      const pkg = JSON.parse(
        Bun.file(resolve(projectRoot, "package.json")).text() as unknown as string
      );
      return !!pkg.prettier;
    } catch {
      return false;
    }
  })();

if (!hasPrettier) process.exit(0);

// Find prettier binary
const localPrettier = resolve(projectRoot, "node_modules/.bin/prettier");
const prettierBin = existsSync(localPrettier) ? localPrettier : "prettier";

// Hash before
const before = await Bun.file(filePath).text();
const beforeHash = Bun.hash(before);

// Run prettier
const result = await exec(`"${prettierBin}" --write "${filePath}"`, {
  timeout: 10_000,
  cwd: projectRoot,
});

if (!result.ok) process.exit(0);

// Hash after
const after = await Bun.file(filePath).text();
const afterHash = Bun.hash(after);

if (beforeHash !== afterHash) {
  console.log(
    `auto-format: Prettier reformatted ${filePath}. Re-read the file to see changes.`
  );
}

process.exit(0);
