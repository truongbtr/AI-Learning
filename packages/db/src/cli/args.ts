import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

/** Tiny flag parser for the content CLIs: `--dir x`, `--skill CODE`, `--dry-run`, `--json`. */
export interface Args {
  flags: Set<string>;
  values: Map<string, string>;
  rest: string[];
}

export function parseArgs(argv: string[] = process.argv.slice(2)): Args {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (!arg.startsWith("--")) {
      rest.push(arg);
      continue;
    }
    const name = arg.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      values.set(name, next);
      i++;
    } else {
      flags.add(name);
    }
  }
  return { flags, values, rest };
}

/**
 * A path a person typed on the command line is relative to the repository, not to `packages/db`
 * where the CLI actually runs. Resolves against the folder holding pnpm-workspace.yaml.
 */
export function fromRepoRoot(path: string): string {
  if (isAbsolute(path)) return path;
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return resolve(dir, path);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(process.cwd(), path);
}
