// The build chooser pictures (Pha 10b việc 3): every plot build rendered by the real engine,
// alone on its lot, cropped square and saved as content/art/city/builds/<code>.webp (≤ 40 KB).
//   pnpm --filter @mtct/city bench:build && pnpm --filter @mtct/city shoot:builds
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { PLOT_CATALOGUE } from "../src/build/civic";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const outDir = resolve(repo, "content/art/city/builds");
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
mkdirSync(outDir, { recursive: true });

/** Frame height (share of the screen) for builds that rise above a house. */
const TALL: Record<string, number> = {
  tower: 0.62,
  windmill: 0.5,
  lighthouse: 0.46,
  treehouse: 0.42,
};
const W = 1600;
const H = 1200;
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("pageerror", e.message));
for (const code of Object.keys(PLOT_CATALOGUE)) {
  await page.goto(
    `http://127.0.0.1:${port}/packages/city/bench/index.html?shot&nobubbles&hour=10&city=vmath&solo=${code}`,
  );
  await page.waitForFunction(() => (window as { __ready?: boolean }).__ready === true, null, {
    timeout: 120000,
  });
  const _crop = (await page.evaluate(() => (window as { __crop?: unknown }).__crop)) as {
    x: number;
    y: number;
  } | null;
  const png = await page.screenshot({ type: "png" });
  // the camera looks at the lot centre, so the build stands in the middle of the frame; tall
  // builds rise above it, hence the frame sits a little higher than the centre
  const size = Math.round(H * (TALL[code] ?? 0.36));
  const cx = W / 2;
  const cy = H / 2 - size * (TALL[code] ? 0.24 : 0.16);
  const left = Math.max(0, Math.min(W - size, Math.round(cx - size / 2)));
  const top = Math.max(0, Math.min(H - size, Math.round(cy - size / 2)));
  let quality = 80;
  let info = { size: Number.POSITIVE_INFINITY };
  const file = join(outDir, `${code}.webp`);
  while (quality >= 40) {
    info = await sharp(png)
      .extract({ left, top, width: size, height: size })
      .resize(400, 400)
      .webp({ quality })
      .toFile(file);
    if (info.size <= 40_000) break;
    quality -= 10;
  }
  console.log(code, info.size, `q${quality}`);
}
await browser.close();
server.close();
