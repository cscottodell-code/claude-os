#!/usr/bin/env node

// Crash logger
process.on('uncaughtException', (err) => {
  require('fs').appendFileSync('/tmp/hook-crash.log',
    new Date().toISOString() + ' UNCAUGHT: ' + err.stack + '\n');
  process.exit(0);
});
process.on('unhandledRejection', (err) => {
  require('fs').appendFileSync('/tmp/hook-crash.log',
    new Date().toISOString() + ' UNHANDLED: ' + String(err) + '\n');
  process.exit(0);
});

// ../../Global/scott-toolkit/hooks/pretooluse-router.ts
var import_promises2 = require("fs/promises");
var import_path7 = require("path");
var import_os2 = require("os");
var import_child_process = require("child_process");

// ../../Global/scott-toolkit/hooks/lib/stdin.ts
function collectStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const timer = setTimeout(() => {
      process.stdin.removeAllListeners();
      process.stdin.destroy();
      resolve("");
    }, 3000);
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    process.stdin.on("error", () => {
      clearTimeout(timer);
      resolve("");
    });
    process.stdin.resume();
  });
}
async function readStdin() {
  try {
    const text = await collectStdin();
    if (!text.trim())
      return { ok: true, input: null };
    return { ok: true, input: JSON.parse(text) };
  } catch {
    return { ok: false, raw: "(parse error)" };
  }
}
function getFilePath(input) {
  return input.tool_input?.file_path ?? input.tool_input?.path ?? null;
}
function getCommand(input) {
  return input.tool_input?.command ?? null;
}
function stripQuoted(command) {
  return command.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "");
}

// ../../Global/scott-toolkit/hooks/guards/destructive.ts
var PATTERNS = [
  {
    regex: /rm\s+-rf/,
    message: "rm -rf blocked — confirm destructive deletion."
  },
  {
    regex: /git\s+reset\s+--hard/,
    message: "git reset --hard blocked — confirm loss of uncommitted changes."
  },
  {
    regex: /git\s+checkout\s+--\s/,
    message: "git checkout -- blocked — confirm discarding changes."
  },
  {
    regex: /git\s+clean\s+-f/,
    message: "git clean -f blocked — confirm deleting untracked files."
  }
];
function guardDestructive(command) {
  const stripped = stripQuoted(command);
  for (const { regex, message } of PATTERNS) {
    if (regex.test(stripped)) {
      return { allow: false, message };
    }
  }
  return { allow: true };
}

// ../../Global/scott-toolkit/hooks/guards/npm-install.ts
var import_fs = require("fs");
var import_path = require("path");
function checkStackDrift(packages) {
  const lockPath = import_path.resolve(process.cwd(), "stack-lock.json");
  if (!import_fs.existsSync(lockPath))
    return null;
  let lock;
  try {
    lock = JSON.parse(import_fs.readFileSync(lockPath, "utf-8"));
  } catch {
    return null;
  }
  const warnings = [];
  const techs = lock.technologies ?? {};
  if (packages.includes("surrealdb")) {
    const lockedSdk = techs.surrealdb?.sdk;
    if (lockedSdk) {
      const lockedVersion = lockedSdk.replace(/.*@/, "");
      const requestedMatch = packages.match(/surrealdb@([0-9.]+)/);
      if (requestedMatch && requestedMatch[1] !== lockedVersion) {
        warnings.push(`STACK DRIFT: stack-lock.json locks surrealdb SDK to @${lockedVersion}, requested @${requestedMatch[1]}`);
      }
    }
  }
  if (packages.includes("@nuxt/ui")) {
    if (techs.nuxt?.sdk) {
      warnings.push("Note: stack-lock.json has Nuxt UI locked. Verify compatibility after install.");
    }
  }
  return warnings.length > 0 ? warnings.join(`
`) : null;
}
function guardNpmInstall(command) {
  const stripped = stripQuoted(command);
  const npmWithPkgs = stripped.match(/npm\s+(install|i)\s+(.+)/);
  if (npmWithPkgs) {
    const packages = command.replace(/.*npm\s+(install|i)\s+/, "");
    const drift = checkStackDrift(packages);
    const msg = [
      drift,
      `npm install blocked — packages: ${packages}. Confirm before adding new dependencies.`
    ].filter(Boolean).join(`
`);
    return { allow: false, message: msg };
  }
  if (/npm\s+(install|i)$/.test(stripped)) {
    return {
      allow: false,
      message: "npm install blocked — this installs all deps from package.json. Use 'npm ci' for clean installs, or confirm."
    };
  }
  const pnpmAdd = stripped.match(/pnpm\s+add\s+(.+)/);
  if (pnpmAdd) {
    const packages = command.replace(/.*pnpm\s+add\s+/, "");
    const drift = checkStackDrift(packages);
    const msg = [
      drift,
      `pnpm add blocked — packages: ${packages}. Confirm before adding new dependencies.`
    ].filter(Boolean).join(`
`);
    return { allow: false, message: msg };
  }
  const bunAdd = stripped.match(/bun\s+add\s+(.+)/);
  if (bunAdd) {
    const packages = command.replace(/.*bun\s+add\s+/, "");
    const drift = checkStackDrift(packages);
    const msg = [
      drift,
      `bun add blocked — packages: ${packages}. Confirm before adding new dependencies.`
    ].filter(Boolean).join(`
`);
    return { allow: false, message: msg };
  }
  return { allow: true };
}

// ../../Global/scott-toolkit/hooks/guards/phase-completion.ts
var import_fs2 = require("fs");
var import_path2 = require("path");
function guardPhaseCompletion(command) {
  const stripped = stripQuoted(command);
  if (!/gsd-tools.*phase\s+complete/.test(stripped)) {
    return { allow: true };
  }
  const phaseMatch = stripped.match(/phase\s+complete\s+"?([0-9.]+)"?/);
  if (!phaseMatch) {
    return { allow: true };
  }
  const phaseNum = phaseMatch[1];
  const phasesDir = import_path2.resolve(process.cwd(), ".planning/phases");
  if (!import_fs2.existsSync(phasesDir)) {
    return { allow: true };
  }
  let phaseDir = null;
  try {
    const dirs = import_fs2.readdirSync(phasesDir);
    phaseDir = dirs.find((d) => d === phaseNum || d.startsWith(`${phaseNum}-`)) ?? null;
    if (!phaseDir) {
      const padded = phaseNum.includes(".") ? phaseNum : phaseNum.padStart(2, "0");
      phaseDir = dirs.find((d) => d === padded || d.startsWith(`${padded}-`)) ?? null;
    }
  } catch {
    return { allow: true };
  }
  if (!phaseDir) {
    return { allow: true };
  }
  const markerPath = import_path2.resolve(phasesDir, phaseDir, ".post-execution-complete");
  if (import_fs2.existsSync(markerPath)) {
    return { allow: true };
  }
  return {
    allow: false,
    message: [
      `BLOCKED: Post-execution sequence not completed for phase ${phaseNum}.`,
      "",
      "Run /scott:phase-closeout first. It handles verify, review, reflect, and gate.",
      "The marker file is created automatically when phase-closeout completes.",
      "To bypass: mv the guard .ts file to .ts.disabled, run the command, then mv it back."
    ].join(`
`)
  };
}

// ../../Global/scott-toolkit/hooks/guards/surrealdb-inject.ts
var import_fs3 = require("fs");
var import_path3 = require("path");
var import_os = require("os");
var SKILL_FILE = import_path3.resolve(import_os.homedir(), ".claude/skills/scott-surrealdb/SKILL.md");
var FILE_PATTERNS = [
  /\.surql$/,
  /\/db\.ts$/,
  /surreal/i,
  /surrealdb/i,
  /surreal.*schema/i,
  /surreal.*migration/i
];
var COMMAND_PATTERN = /surreal|surrealdb|surql|localhost:800[0-9]/i;
function matchesSurrealDB(filePath, command) {
  if (filePath) {
    for (const pattern of FILE_PATTERNS) {
      if (pattern.test(filePath))
        return true;
    }
  }
  if (command && COMMAND_PATTERN.test(command))
    return true;
  return false;
}
async function injectSurrealDB(filePath, command) {
  if (!matchesSurrealDB(filePath, command))
    return null;
  const dedupFile = `/tmp/surrealdb-skill-injected-${process.env.CLAUDE_SESSION_ID ?? process.pid}`;
  if (import_fs3.existsSync(dedupFile))
    return null;
  if (!import_fs3.existsSync(SKILL_FILE))
    return null;
  import_fs3.writeFileSync(dedupFile, "");
  let content = import_fs3.readFileSync(SKILL_FILE, "utf-8");
  const frontmatterEnd = content.indexOf("---", content.indexOf("---") + 3);
  if (frontmatterEnd !== -1) {
    content = content.slice(frontmatterEnd + 3).trim();
  }
  let healthWarning = "";
  try {
    const resp = await fetch("http://localhost:8000/health", {
      signal: AbortSignal.timeout(2000)
    });
    if (!resp.ok)
      throw new Error("unhealthy");
  } catch {
    healthWarning = `[WARNING] SurrealDB server is NOT running on localhost:8000. Start it with: ~/Sites/Global/scott-toolkit/start-surreal.sh

`;
  }
  const verifyProtocol = [
    "",
    "[MANDATORY VERIFICATION PROTOCOL]",
    "NEVER write SurrealQL from general knowledge or training data.",
    "BEFORE writing any SurrealQL or JS SDK code:",
    "  1. Query Context7: mcp__context7__query-docs with libraryId=/surrealdb/docs.surrealdb.com",
    "  2. If MCP server available: test queries against live SurrealDB via mcp__surrealdb__query",
    "  3. Copy syntax from verified docs or existing working migrations, never from memory",
    "Known v3 gotchas: single-field FULLTEXT only, TYPE object FLEXIBLE, IF { } ELSE { } (not THEN/END),",
    "RELATE needs LET for dynamic IDs, ORDER BY only supports field refs (use computed AS fields)."
  ].join(`
`);
  return `${healthWarning}[SurrealDB Skill Auto-Loaded] ${content}${verifyProtocol}`;
}
async function guardSurrealdbInject(filePath, command) {
  const context = await injectSurrealDB(filePath, command);
  if (context) {
    return { allow: true, additionalContext: context };
  }
  return { allow: true };
}

// ../../Global/scott-toolkit/hooks/guards/lessons-inject.ts
var import_fs5 = require("fs");
var import_path4 = require("path");

// ../../Global/scott-toolkit/src/json.ts
var import_promises = require("fs/promises");
var import_fs4 = require("fs");
async function readJson(path) {
  try {
    const content = await import_promises.readFile(path, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    if (import_fs4.existsSync(path)) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[toolkit] JSON parse error in ${path}: ${msg}`);
    }
    return null;
  }
}

// ../../Global/scott-toolkit/hooks/guards/lessons-inject.ts
function extractTaggedLessons(content, techFilter) {
  const lines = content.split(`
`);
  const lessons = [];
  for (const line of lines) {
    const match = line.match(/^\s*-\s*\[stack:(\w+)\]\s*(.+)/);
    if (!match)
      continue;
    const tech = match[1];
    const lesson = match[0].trim();
    if (techFilter === null || techFilter.includes(tech)) {
      lessons.push(lesson);
    }
  }
  return lessons;
}
function shouldInject(fileExists, lessonCount) {
  return fileExists && lessonCount > 0;
}
async function detectTechnologies(cwd) {
  const lock = await readJson(import_path4.resolve(cwd, "stack-lock.json"));
  if (!lock?.technologies)
    return [];
  return Object.keys(lock.technologies);
}
async function guardLessonsInject(cwd) {
  const dedupFile = `/tmp/lessons-injected-${process.env.CLAUDE_SESSION_ID ?? process.pid}`;
  if (import_fs5.existsSync(dedupFile))
    return { allow: true };
  const lessonsPath = import_path4.resolve(cwd, "tasks/lessons.md");
  if (!import_fs5.existsSync(lessonsPath))
    return { allow: true };
  const content = import_fs5.readFileSync(lessonsPath, "utf-8");
  const techs = await detectTechnologies(cwd);
  const lessons = extractTaggedLessons(content, techs.length > 0 ? techs : null);
  if (!shouldInject(true, lessons.length))
    return { allow: true };
  import_fs5.writeFileSync(dedupFile, "");
  const header = `[Lessons Auto-Loaded] ${lessons.length} past lesson(s) for this project's stack. Review before writing code:
`;
  const body = lessons.map((l) => `  ${l}`).join(`
`);
  return {
    allow: true,
    additionalContext: `${header}${body}`
  };
}

// ../../Global/scott-toolkit/hooks/guards/workflow-gates.ts
var import_fs6 = require("fs");
var import_path5 = require("path");
var ADVISORY_MODE = process.env.WORKFLOW_GATES_ADVISORY === "1";
function gate(markerFile, projectDir, workflow, prerequisitePhase, blockedPhase) {
  const markerPath = import_path5.resolve(projectDir, markerFile);
  if (import_fs6.existsSync(markerPath)) {
    return { allow: true };
  }
  const msg = `${workflow}: ${blockedPhase} requires ${prerequisitePhase} to complete first (missing ${markerFile}).`;
  if (ADVISORY_MODE) {
    return { allow: true, message: msg + " (advisory — set WORKFLOW_GATES_ADVISORY=0 to enforce)" };
  }
  return { allow: false, message: msg + " Blocked. To bypass: mv the guard .ts file to .ts.disabled, run the command, then mv it back." };
}
function guardProjectScaffolded(projectDir) {
  return gate(".project-scaffolded", projectDir, "new-project", "Phase 5 (Create Repo)", "Phase 6+ (Design Proof)");
}
function guardDesignApproved(projectDir) {
  return gate(".design-approved", projectDir, "new-project", "Phase 6 (Design Proof)", "Phase 7+ (Build)");
}
function guardReflectionComplete(projectDir) {
  return gate(".reflection-complete", projectDir, "retro", "Phase 2 (Guided Reflection)", "Phase 3+ (Generate Retro Document)");
}

// ../../Global/scott-toolkit/hooks/guards/surrealdb-integration-tests.ts
var import_fs7 = require("fs");
var import_path6 = require("path");
function hasSurrealMigrations(cwd) {
  const migrationsDir = import_path6.resolve(cwd, "server/migrations");
  if (!import_fs7.existsSync(migrationsDir))
    return false;
  try {
    return import_fs7.readdirSync(migrationsDir).some((f) => f.endsWith(".surql"));
  } catch {
    return false;
  }
}
function hasLiveIntegrationTests(cwd) {
  const integrationDir = import_path6.resolve(cwd, "tests/integration");
  if (!import_fs7.existsSync(integrationDir))
    return false;
  try {
    const files = import_fs7.readdirSync(integrationDir).filter((f) => f.endsWith(".test.ts"));
    return files.some((f) => {
      try {
        const content = import_fs7.readFileSync(import_path6.join(integrationDir, f), "utf-8");
        return content.includes("db-setup") || content.includes("setup()");
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}
function phaseModifiedSurrealFiles(cwd, phaseNum) {
  const phasesDir = import_path6.resolve(cwd, ".planning/phases");
  if (!import_fs7.existsSync(phasesDir))
    return false;
  try {
    const dirs = import_fs7.readdirSync(phasesDir);
    const padded = phaseNum.padStart(2, "0");
    const phaseDir = dirs.find((d) => d === phaseNum || d.startsWith(`${phaseNum}-`) || d === padded || d.startsWith(`${padded}-`));
    if (!phaseDir)
      return false;
    const fullPhaseDir = import_path6.resolve(phasesDir, phaseDir);
    const summaries = import_fs7.readdirSync(fullPhaseDir).filter((f) => f.endsWith("-SUMMARY.md"));
    for (const summary of summaries) {
      try {
        const content = import_fs7.readFileSync(import_path6.join(fullPhaseDir, summary), "utf-8");
        if (content.includes(".surql") || content.includes("encryption.ts") || content.includes("entity-types.ts") || content.includes("surql`") || content.includes("surrealdb")) {
          return true;
        }
      } catch {}
    }
  } catch {
    return false;
  }
  return false;
}
function guardSurrealTestAdvisory(command, cwd) {
  if (!/vitest|test/.test(command))
    return { allow: true };
  if (!hasSurrealMigrations(cwd))
    return { allow: true };
  if (hasLiveIntegrationTests(cwd))
    return { allow: true };
  return {
    allow: true,
    additionalContext: [
      "[SURREAL-TEST WARNING] This project has SurrealDB migrations but no live integration tests.",
      "Mock tests do NOT verify SurrealQL syntax, schema ASSERTs, or field constraints.",
      "",
      "Create tests/integration/db-setup.ts and write integration tests that run against",
      "a live SurrealDB instance. See Eleanor's tests/integration/ for the pattern.",
      "",
      "Bugs hidden by mocks in the past: invalid ASSERT values, unsupported multi-field",
      "FULLTEXT indexes, missing FLEXIBLE keyword, invalid IF/THEN/ELSE syntax."
    ].join(`
`)
  };
}
function guardSurrealPhaseComplete(command, cwd) {
  if (!/gsd-tools.*phase\s+complete/.test(command))
    return { allow: true };
  const phaseMatch = command.match(/phase\s+complete\s+"?([0-9.]+)"?/);
  if (!phaseMatch)
    return { allow: true };
  const phaseNum = phaseMatch[1];
  if (!phaseModifiedSurrealFiles(cwd, phaseNum))
    return { allow: true };
  if (!hasLiveIntegrationTests(cwd)) {
    return {
      allow: false,
      message: [
        `BLOCKED: Phase ${phaseNum} modified SurrealDB files but no live integration tests found.`,
        "",
        "Every phase that touches SurrealDB schemas or queries MUST have integration tests",
        "that run against a live SurrealDB instance. Mock tests hide schema bugs.",
        "",
        "Required:",
        "  1. Create tests/integration/db-setup.ts (live DB connect + migrate + teardown)",
        "  2. Write tests/integration/ tests that import db-setup and verify real queries",
        "  3. Run: npx vitest run tests/integration/",
        "",
        "To bypass (not recommended): rename this guard to .ts.disabled temporarily."
      ].join(`
`)
    };
  }
  return { allow: true };
}

// ../../Global/scott-toolkit/hooks/pretooluse-router.ts
async function main() {
  const stdinResult = await readStdin();
  if (!stdinResult.ok) {
    process.exit(0);
  }
  const input = stdinResult.input;
  const command = input ? getCommand(input) : null;
  const filePath = input ? getFilePath(input) : null;
  const rawInput = input ? JSON.stringify(input) : "";
  if (!input) {
    process.exit(0);
  }
  if (command) {
    const logFile = import_path7.resolve(import_os2.homedir(), ".claude/bash-commands.log");
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    await import_promises2.appendFile(logFile, `[${timestamp}] ${command}
`).catch(() => {});
  }
  const stripped = command ? stripQuoted(command) : "";
  if (command && /rm\s+-rf|git\s+reset\s+--hard|git\s+checkout\s+--\s|git\s+clean\s+-f/.test(stripped)) {
    const result = guardDestructive(command);
    if (!result.allow) {
      if (result.message)
        console.log(result.message);
      process.exit(2);
    }
  }
  if (command && /(?:npm|pnpm|bun)\s+(?:install|add|i\s)/.test(stripped)) {
    const result = guardNpmInstall(command);
    if (!result.allow) {
      if (result.message)
        console.log(result.message);
      process.exit(2);
    }
  }
  if (command && /phase.*(complete|done|finish)/.test(command)) {
    const result = guardPhaseCompletion(command);
    if (!result.allow) {
      if (result.message)
        console.log(result.message);
      process.exit(2);
    }
    const surrealResult = guardSurrealPhaseComplete(stripped, process.cwd());
    if (!surrealResult.allow) {
      if (surrealResult.message)
        console.log(surrealResult.message);
      process.exit(2);
    }
  }
  if (command && /(?:^|\s|&&|\|)git\s+commit/.test(stripped)) {
    const gsdHook = import_path7.resolve(import_os2.homedir(), ".claude/hooks/gsd-validate-commit.sh");
    try {
      import_child_process.execFileSync("bash", [gsdHook], {
        input: rawInput,
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 5000
      });
    } catch (err) {
      if (err.status && err.status !== 0) {
        const stdout = err.stdout?.toString().trim();
        if (stdout)
          console.log(stdout);
        process.exit(err.status);
      }
    }
  }
  if (command) {
    const cwd = process.cwd();
    const gates = [
      { pattern: /design.proof|phase.6|impeccable.*teach/i, fn: () => guardProjectScaffolded(cwd) },
      { pattern: /build.milestone|phase.7|gsd.*execute/i, fn: () => guardDesignApproved(cwd) },
      { pattern: /generate.retro|phase.3.*retro/i, fn: () => guardReflectionComplete(cwd) }
    ];
    for (const g of gates) {
      if (g.pattern.test(command) || g.pattern.test(rawInput)) {
        const result = g.fn();
        if (result.message)
          console.log(result.message);
        if (!result.allow)
          process.exit(2);
      }
    }
  }
  if (command && /vitest|npx\s+test|pnpm\s+test/.test(stripped)) {
    const surrealTestResult = guardSurrealTestAdvisory(stripped, process.cwd());
    if (surrealTestResult.additionalContext) {
      console.log(JSON.stringify({ additionalContext: surrealTestResult.additionalContext }));
    }
  }
  if (command && /surreal|surrealdb|surql|localhost:800[0-9]/i.test(command) || filePath && /surreal|\.surql$/i.test(filePath)) {
    const result = await guardSurrealdbInject(filePath, command);
    if (result.additionalContext) {
      console.log(JSON.stringify({ additionalContext: result.additionalContext }));
    }
  }
  const lessonsResult = await guardLessonsInject(process.cwd());
  if (lessonsResult.additionalContext) {
    console.log(JSON.stringify({ additionalContext: lessonsResult.additionalContext }));
  }
  process.exit(0);
}
main();
