import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Walks up from `from` (default: cwd) until it finds the repo root (pnpm-workspace.yaml).
 * Uses cwd rather than import.meta so the package loads under both ESM bundlers and CommonJS.
 */
export function findRepoRoot(from: string = process.cwd()): string {
  let dir = from;
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Cannot find repo root (pnpm-workspace.yaml) above ${from}`);
}

export function contentDir(...segments: string[]): string {
  return join(findRepoRoot(), "content", ...segments);
}
