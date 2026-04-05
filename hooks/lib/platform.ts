/**
 * Cross-platform utilities for hooks.
 * Replaces md5/md5sum, stat differences, and date arithmetic.
 */

import { createHash } from "crypto";
import { statSync } from "fs";

/** Hash a string to a short hex prefix (replaces md5/md5sum) */
export function shortHash(input: string, length = 8): string {
  return createHash("md5").update(input).digest("hex").slice(0, length);
}

/** Get file modification time as Unix timestamp (seconds) */
export function fileMtime(path: string): number | null {
  try {
    return Math.floor(statSync(path).mtimeMs / 1000);
  } catch {
    return null;
  }
}

/** Current Unix timestamp (seconds) */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Format a date as YYYY-MM-DD */
export function dateStr(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

/** Format a date as YYYYMMDD-HHMMSS */
export function timestampStr(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

/** Calculate days between two dates */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000;
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / msPerDay);
}
