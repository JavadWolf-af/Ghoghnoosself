import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "JavadWolf-af";
const REPO_NAME = "Ghoghnoosself";
const BRANCH = "main";
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".tsbuildinfo",
  "pnpm-lock.yaml",
  ".replit-artifact",
  ".local",
  ".agents",
  "*.log",
];

function shouldIgnore(path: string): boolean {
  const parts = path.split("/");
  return parts.some((part) =>
    IGNORE_PATTERNS.some((pattern) => {
      if (pattern.startsWith("*")) {
        return part.endsWith(pattern.slice(1));
      }
      return part === pattern;
    })
  );
}

function getAllFiles(dir: string, rootDir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const relPath = relative(rootDir, fullPath);
      if (shouldIgnore(relPath)) continue;
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...getAllFiles(fullPath, rootDir));
      } else {
        files.push(fullPath);
      }
    }
  } catch {
  }
  return files;
}

async function githubRequest(
  path: string,
  method = "GET",
  body?: object
): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res.status === 404 ? null : res.json();
}

async function getFileSha(filePath: string): Promise<string | null> {
  const data = await githubRequest(`/contents/${filePath}`);
  return data?.sha ?? null;
}

async function pushFile(
  localPath: string,
  repoPath: string
): Promise<"created" | "updated" | "skipped"> {
  const content = readFileSync(localPath);
  const base64Content = content.toString("base64");

  const existingSha = await getFileSha(repoPath);

  if (existingSha) {
    const existing = await githubRequest(`/contents/${repoPath}`);
    if (existing?.content) {
      const existingContent = existing.content.replace(/\n/g, "");
      if (existingContent === base64Content) {
        return "skipped";
      }
    }
  }

  await githubRequest(`/contents/${repoPath}`, "PUT", {
    message: existingSha
      ? `chore: update ${repoPath}`
      : `chore: add ${repoPath}`,
    content: base64Content,
    branch: BRANCH,
    ...(existingSha ? { sha: existingSha } : {}),
  });

  return existingSha ? "updated" : "created";
}

async function main() {
  if (!GITHUB_TOKEN) {
    console.error("Error: GITHUB_TOKEN environment variable is not set");
    process.exit(1);
  }

  const rootDir = join(process.cwd(), "..");
  const targetPaths = process.argv.slice(2);

  let filesToPush: string[] = [];

  if (targetPaths.length > 0) {
    for (const target of targetPaths) {
      const fullPath = join(rootDir, target);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          filesToPush.push(...getAllFiles(fullPath, rootDir));
        } else {
          filesToPush.push(fullPath);
        }
      } catch {
        console.warn(`Warning: Path not found: ${target}`);
      }
    }
  } else {
    filesToPush = getAllFiles(rootDir, rootDir);
  }

  console.log(`\nPushing to github.com/${REPO_OWNER}/${REPO_NAME} (${BRANCH})`);
  console.log(`Files to process: ${filesToPush.length}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of filesToPush) {
    const repoPath = relative(rootDir, filePath);
    try {
      const result = await pushFile(filePath, repoPath);
      if (result === "created") {
        console.log(`  + ${repoPath}`);
        created++;
      } else if (result === "updated") {
        console.log(`  ~ ${repoPath}`);
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`  ! ${repoPath}: ${err}`);
      errors++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (no change): ${skipped}`);
  if (errors > 0) console.log(`  Errors: ${errors}`);
}

main();
