import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const forbiddenBasenames = new Set([
  "auth.json",
  "trust.json",
  "cursor-model-cache.json",
  "mcp-cache.json",
  "run-history.jsonl",
  "pi-web.sqlite",
  "pi-web-version",
]);
const forbiddenSegments = new Set([
  ".git",
  "node_modules",
  "npm",
  "git",
  "bin",
  "tmp",
  "backups",
  "sessions",
  "session-status",
  "context-store",
  "mcp-oauth",
  "pi-web",
]);
const forbiddenSuffixes = [
  ".env",
  ".sqlite",
  ".sqlite-shm",
  ".sqlite-wal",
  ".db",
  ".tar.gz",
  ".tgz",
  ".zip",
];
const secretPatterns = [
  /sk-(?:ant|proj|live|test|or-v1)-[A-Za-z0-9_\-]{20,}/,
  /(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
  /["']refresh_token["']\s*[:=]\s*["'][^"']{20,}["']/i,
  /["']access_token["']\s*[:=]\s*["'][^"']{20,}["']/i,
  /["']client_secret["']\s*[:=]\s*["'][^"']{12,}["']/i,
];
const textExtensions = new Set([
  ".md",
  ".json",
  ".jsonc",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".sh",
  ".txt",
  ".yaml",
  ".yml",
]);

const failures = [];

function extensionOf(path) {
  if (path.endsWith(".tar.gz")) return ".tar.gz";
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
}

function checkPath(path) {
  const rel = relative(root, path) || ".";
  const parts = rel.split(/[\\/]+/);
  const base = parts.at(-1) ?? rel;
  if (forbiddenBasenames.has(base)) failures.push(`${rel}: forbidden filename`);
  for (const part of parts) {
    if (forbiddenSegments.has(part)) failures.push(`${rel}: forbidden path segment ${part}`);
  }
  for (const suffix of forbiddenSuffixes) {
    if (base === suffix.slice(1) || base.endsWith(suffix)) failures.push(`${rel}: forbidden suffix ${suffix}`);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = relative(root, path);
    if (entry.name === ".git") continue;
    checkPath(path);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    if (!entry.isFile()) continue;
    const size = statSync(path).size;
    if (size > 5 * 1024 * 1024) failures.push(`${rel}: file exceeds 5 MiB`);
    const ext = extensionOf(path);
    if (!textExtensions.has(ext) && !["AGENTS.md", "README.md", "SECURITY.md", ".gitignore", ".gitkeep"].includes(entry.name)) continue;
    const content = readFileSync(path, "utf8");
    for (const pattern of secretPatterns) {
      if (pattern.test(content)) failures.push(`${rel}: content matched ${pattern}`);
    }
  }
}

walk(root);

if (failures.length > 0) {
  console.error("Secret/shareability verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Secret/shareability verification passed.");
