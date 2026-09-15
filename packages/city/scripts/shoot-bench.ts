// Screenshot / measure the bench with local Chrome.
//   pnpm --filter @mtct/city bench:shoot -- "city=viet&size=full" out.jpg [w] [h]
//   pnpm --filter @mtct/city bench:shoot -- --fps "city=viet&size=full"   (live loop, 6 s average)
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

declare global {
  interface Window {
    __ready?: boolean;
    __bench?: unknown;
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const mime: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".bin": "application/octet-stream",
};
const server = http.createServer((req, res) => {
  const p = join(repo, decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/"));
  if (!p.startsWith(repo) || !existsSync(p) || statSync(p).isDirectory()) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader("Content-Type", mime[extname(p)] ?? "application/octet-stream");
  createReadStream(p).pipe(res);
});
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as { port: number }).port;

const raw = process.argv.slice(2).filter((a) => a !== "--");
const fpsMode = raw.includes("--fps");
const throttle = raw.includes("--throttle");
const args = raw.filter((a) => !a.startsWith("--"));
const query = args[0] ?? "";
const out = resolve(repo, "docs/screens/3d-city", args[1] ?? "engine.jpg");
const W = Number(args[fpsMode ? 1 : 2] ?? (fpsMode ? 1180 : 2400));
const H = Number(args[fpsMode ? 2 : 3] ?? (fpsMode ? 820 : 1500));

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width: W, height: H },
  deviceScaleFactor: fpsMode ? 2 : 1,
});
page.on("pageerror", (e) => console.error("pageerror", e.message));
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning")
    console.log(`[${m.type()}]`, m.text().slice(0, 300));
});
const t0 = Date.now();
await page.goto(
  `http://127.0.0.1:${port}/packages/city/bench/index.html?${fpsMode ? "" : "shot&"}${query}`,
);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const readyMs = Date.now() - t0;
if (fpsMode) {
  if (throttle) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  await page.waitForTimeout(6000);
  console.log(
    JSON.stringify({ query, readyMs, ...((await page.evaluate(() => window.__bench)) as object) }),
  );
} else {
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({
    path: out,
    type: out.endsWith(".png") ? "png" : "jpeg",
    quality: out.endsWith(".png") ? undefined : 88,
  });
  console.log(
    JSON.stringify({
      out: out.slice(repo.length + 1),
      readyMs,
      ...((await page.evaluate(() => window.__bench)) as object),
    }),
  );
}
await browser.close();
server.close();
