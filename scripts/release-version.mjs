#!/usr/bin/env node
/**
 * The app's one version number: `version` in the root package.json (CLAUDE.md "Phiên bản").
 * It is shown small at the bottom of every screen and in /api/health, so a screenshot or a health
 * check says which build is running.
 *
 *   pnpm release:bump [patch|minor|major]   raise it (default patch: 0.1.1 → 0.1.2)
 *   pnpm release:check                      before pushing to GitHub: fails when master has commits
 *                                           GitHub does not, but the version is still GitHub's
 *
 * `check` compares against the local `origin/master` ref; run `git fetch` first if it may be stale.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const pkgPath = join(root, "package.json");
const REMOTE = "origin/master";

const git = (...args) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

function readVersion() {
  return JSON.parse(readFileSync(pkgPath, "utf8")).version;
}

function bump(version, part) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!m) throw new Error(`package.json version "${version}" is not x.y.z`);
  let [major, minor, patch] = m.slice(1).map(Number);
  if (part === "major") [major, minor, patch] = [major + 1, 0, 0];
  else if (part === "minor") [minor, patch] = [minor + 1, 0];
  else if (part === "patch") patch += 1;
  else throw new Error(`unknown part "${part}" (patch|minor|major)`);
  return `${major}.${minor}.${patch}`;
}

const [cmd = "check", part = "patch"] = process.argv.slice(2);
const current = readVersion();

if (cmd === "bump") {
  const next = bump(current, part);
  const raw = readFileSync(pkgPath, "utf8");
  writeFileSync(pkgPath, raw.replace(`"version": "${current}"`, `"version": "${next}"`));
  console.log(`version ${current} → ${next} (commit it: chore(release): v${next})`);
} else if (cmd === "check") {
  let published;
  let ahead;
  try {
    published = JSON.parse(git("show", `${REMOTE}:package.json`)).version;
    ahead = Number(git("rev-list", "--count", `${REMOTE}..HEAD`));
  } catch {
    console.log(`v${current} — no ${REMOTE} ref to compare with`);
    process.exit(0);
  }
  if (ahead > 0 && published === current) {
    console.error(
      `v${current} is already on GitHub, and master has ${ahead} new commit(s). ` +
        "Run `pnpm release:bump` and commit before pushing.",
    );
    process.exit(1);
  }
  console.log(`v${current} (GitHub has v${published}, ${ahead} commit(s) to publish) — OK`);
} else {
  console.error("usage: release-version.mjs bump [patch|minor|major] | check");
  process.exit(2);
}
