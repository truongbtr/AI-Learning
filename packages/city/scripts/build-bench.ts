// pnpm --filter @mtct/city bench:build → bench/dist/bench.js (one IIFE bundle, three included)

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
await build({
  entryPoints: [join(here, "../bench/main.ts")],
  bundle: true,
  format: "iife",
  target: ["safari15", "chrome100"],
  minify: process.argv.includes("--minify"),
  outfile: join(here, "../bench/dist/bench.js"),
  logLevel: "info",
});
