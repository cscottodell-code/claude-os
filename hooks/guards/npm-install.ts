/**
 * Guard: Block npm/pnpm/bun install + stack-lock drift detection.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { stripQuoted } from "../lib/stdin.js";
import type { GuardResult } from "./git-push.js";

function checkStackDrift(packages: string): string | null {
  const lockPath = resolve(process.cwd(), "stack-lock.json");
  if (!existsSync(lockPath)) return null;

  let lock: Record<string, unknown>;
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf-8"));
  } catch {
    return null;
  }

  const warnings: string[] = [];
  const techs = (lock.technologies ?? {}) as Record<
    string,
    { sdk?: string }
  >;

  // Check SurrealDB SDK version conflicts
  if (packages.includes("surrealdb")) {
    const lockedSdk = techs.surrealdb?.sdk;
    if (lockedSdk) {
      const lockedVersion = lockedSdk.replace(/.*@/, "");
      const requestedMatch = packages.match(/surrealdb@([0-9.]+)/);
      if (requestedMatch && requestedMatch[1] !== lockedVersion) {
        warnings.push(
          `STACK DRIFT: stack-lock.json locks surrealdb SDK to @${lockedVersion}, requested @${requestedMatch[1]}`
        );
      }
    }
  }

  // Check Nuxt UI version conflicts
  if (packages.includes("@nuxt/ui")) {
    if (techs.nuxt?.sdk) {
      warnings.push(
        "Note: stack-lock.json has Nuxt UI locked. Verify compatibility after install."
      );
    }
  }

  return warnings.length > 0 ? warnings.join("\n") : null;
}

export function guardNpmInstall(command: string): GuardResult {
  const stripped = stripQuoted(command);

  // npm install <packages> or npm i <packages>
  const npmWithPkgs = stripped.match(/npm\s+(install|i)\s+(.+)/);
  if (npmWithPkgs) {
    const packages = command.replace(/.*npm\s+(install|i)\s+/, "");
    const drift = checkStackDrift(packages);
    const msg = [
      drift,
      `npm install blocked — packages: ${packages}. Confirm before adding new dependencies.`,
    ]
      .filter(Boolean)
      .join("\n");
    return { allow: false, message: msg };
  }

  // Bare npm install / npm i
  if (/npm\s+(install|i)$/.test(stripped)) {
    return {
      allow: false,
      message:
        "npm install blocked — this installs all deps from package.json. Use 'npm ci' for clean installs, or confirm.",
    };
  }

  // pnpm add <packages>
  const pnpmAdd = stripped.match(/pnpm\s+add\s+(.+)/);
  if (pnpmAdd) {
    const packages = command.replace(/.*pnpm\s+add\s+/, "");
    const drift = checkStackDrift(packages);
    const msg = [
      drift,
      `pnpm add blocked — packages: ${packages}. Confirm before adding new dependencies.`,
    ]
      .filter(Boolean)
      .join("\n");
    return { allow: false, message: msg };
  }

  // bun add <packages>
  const bunAdd = stripped.match(/bun\s+add\s+(.+)/);
  if (bunAdd) {
    const packages = command.replace(/.*bun\s+add\s+/, "");
    const drift = checkStackDrift(packages);
    const msg = [
      drift,
      `bun add blocked — packages: ${packages}. Confirm before adding new dependencies.`,
    ]
      .filter(Boolean)
      .join("\n");
    return { allow: false, message: msg };
  }

  return { allow: true };
}
