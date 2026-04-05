/** Parse a version string like "4.3.2", "v3", "^2.0.1" into numeric parts */
export function parseSemver(
  version: string
): { major: number; minor: number; patch: number } | null {
  const match = version.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2] ?? "0", 10),
    patch: parseInt(match[3] ?? "0", 10),
  };
}

/** Compare two version strings. Returns -1, 0, or 1. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return 0;

  for (const key of ["major", "minor", "patch"] as const) {
    if (pa[key] < pb[key]) return -1;
    if (pa[key] > pb[key]) return 1;
  }
  return 0;
}

/** Check if version satisfies a simple constraint like ">=4", "^2.0.1" */
export function satisfies(version: string, constraint: string): boolean {
  const ver = parseSemver(version);
  const con = parseSemver(constraint);
  if (!ver || !con) return false;

  if (constraint.startsWith(">=")) {
    return compareSemver(version, constraint.replace(/^>=\s*/, "")) >= 0;
  }
  if (constraint.startsWith("^")) {
    // ^major.minor.patch: same major, >= minor.patch
    return (
      ver.major === con.major &&
      compareSemver(version, constraint.replace(/^\^/, "")) >= 0
    );
  }
  // Default: major version match
  return ver.major === con.major;
}
