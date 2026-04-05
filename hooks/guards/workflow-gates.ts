/**
 * workflow-gates.ts — File-system gates for workflow phase enforcement.
 *
 * Each gate checks for a marker file that proves a prerequisite phase completed.
 * Gates are advisory (warn) in v1. Set WORKFLOW_GATES_BLOCK=1 to make them blocking.
 *
 * Pattern: same as phase-completion guard (.post-execution-complete marker).
 */

import { existsSync } from "fs";
import { resolve } from "path";

interface GateResult {
  allow: boolean;
  message?: string;
}

const BLOCK_MODE = process.env.WORKFLOW_GATES_BLOCK === "1";

function gate(
  markerFile: string,
  projectDir: string,
  workflow: string,
  prerequisitePhase: string,
  blockedPhase: string
): GateResult {
  const markerPath = resolve(projectDir, markerFile);

  if (existsSync(markerPath)) {
    return { allow: true };
  }

  const msg = `⚠️ ${workflow}: ${blockedPhase} requires ${prerequisitePhase} to complete first (missing ${markerFile}).`;

  if (BLOCK_MODE) {
    return { allow: false, message: msg + " Blocked." };
  }

  // Advisory mode: warn but allow
  return { allow: true, message: msg };
}

/** new-project Phase 5 must complete before Phase 6+ */
export function guardProjectScaffolded(projectDir: string): GateResult {
  return gate(
    ".project-scaffolded",
    projectDir,
    "new-project",
    "Phase 5 (Create Repo)",
    "Phase 6+ (Design Proof)"
  );
}

/** new-project Phase 6 must complete before Phase 7+ */
export function guardDesignApproved(projectDir: string): GateResult {
  return gate(
    ".design-approved",
    projectDir,
    "new-project",
    "Phase 6 (Design Proof)",
    "Phase 7+ (Build)"
  );
}

/** toolkit-update Phase 3 must complete before Phase 4+ */
export function guardChangesDrafted(projectDir: string): GateResult {
  return gate(
    ".changes-drafted",
    projectDir,
    "toolkit-update",
    "Phase 3 (Draft Changes)",
    "Phase 4+ (Update CHANGELOG)"
  );
}

/** retro Phase 2 must complete before Phase 3+ */
export function guardReflectionComplete(projectDir: string): GateResult {
  return gate(
    ".reflection-complete",
    projectDir,
    "retro",
    "Phase 2 (Guided Reflection)",
    "Phase 3+ (Generate Retro Document)"
  );
}
