import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

/**
 * Where the operations plane lives (docs/14 §1: "thư mục là API").
 *
 * `ops/` sits at the root of the repository so that Claude chat reaching the project folder over a
 * bridge, and Claude Code sitting in the repo, are looking at the same files. A relative `OPS_ROOT`
 * is resolved against the workspace root and not the current directory — the CLIs run from
 * `packages/db`, and the phase-4 queue already learned that lesson the hard way.
 */
export function opsRoot(): string {
  const configured = process.env.OPS_ROOT ?? "./ops";
  return isAbsolute(configured) ? configured : resolve(workspaceRoot(), configured);
}

/** The folder holding pnpm-workspace.yaml, walking up from this file. */
export function workspaceRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}
