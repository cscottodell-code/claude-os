#!/usr/bin/env node --experimental-strip-types --no-warnings
/**
 * context-reminders.ts — PostToolUse: track session duration and tool count.
 * Warns at thresholds: 60min then every 30min, 100 tools then every 50.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { shortHash, dateStr, now } from "./lib/platform.ts";

interface ContextState {
  start_time: number;
  tool_count: number;
  warned_duration: number;
  warned_tools: number;
}

const stateFile = `/tmp/claude-context-${shortHash(process.cwd())}-${dateStr()}.json`;

let state: ContextState;
if (existsSync(stateFile)) {
  try {
    state = JSON.parse(readFileSync(stateFile, "utf-8"));
  } catch {
    state = { start_time: now(), tool_count: 0, warned_duration: 0, warned_tools: 0 };
  }
} else {
  state = { start_time: now(), tool_count: 0, warned_duration: 0, warned_tools: 0 };
}

state.tool_count++;

const elapsed = now() - state.start_time;
const elapsedMin = Math.floor(elapsed / 60);
const warnings: string[] = [];

// Duration warnings: first at 60min, then every 30min
const durationBracket = elapsedMin >= 60 ? Math.floor((elapsedMin - 60) / 30) + 1 : 0;
if (durationBracket > state.warned_duration) {
  state.warned_duration = durationBracket;
  warnings.push(
    `Session duration: ${elapsedMin}min. Consider /compact or a fresh session to prevent context degradation.`
  );
}

// Tool count warnings: first at 100, then every 50
const toolBracket = state.tool_count >= 100 ? Math.floor((state.tool_count - 100) / 50) + 1 : 0;
if (toolBracket > state.warned_tools) {
  state.warned_tools = toolBracket;
  warnings.push(
    `Tool calls: ${state.tool_count}. High tool count may indicate context degradation. Consider /compact.`
  );
}

// Save state
writeFileSync(stateFile, JSON.stringify(state));

if (warnings.length > 0) {
  console.log(`\n--- Context Health ---`);
  for (const w of warnings) console.log(`  ${w}`);
  console.log(`---\n`);
}

process.exit(0);
