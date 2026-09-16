// Renders bench/agents (every moving thing at four headings) to an image, with local Chrome.
//   pnpm --filter @mtct/city exec tsx scripts/shoot-agents.ts [out.png]
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { chromium } from "playwright-core";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../bench/agents");
const out = resolve(process.argv[2] ?? join(root, "agents.png"));
await build({
  entryPoints: [join(root, "main.ts")],
  bundle: true,
  format: "iife",
  outfile: join(root, "dist/agents.js"),
  logLevel: "warning",
});
const server = http.createServer((req, res) => {
  const p = join(root, decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/"));
  if (!p.startsWith(root) || !existsSync(p) || statSync(p).isDirectory()) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader("Content-Type", extname(p) === ".js" ? "text/javascript" : "text/html");
  createReadStream(p).pipe(res);
});
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
page.on("pageerror", (e) => console.error("pageerror", e.message));
await page.goto(`http://127.0.0.1:${port}/index.html`);
await page.waitForFunction(() => (window as { __ready?: boolean }).__ready === true);
await page.locator("#c").screenshot({ path: out });
await browser.close();
server.close();
console.log(out);
