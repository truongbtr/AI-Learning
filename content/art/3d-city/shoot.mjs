// Render pages of this workbench to images with the local Chrome (real GPU via ANGLE/D3D11).
//   node shoot.mjs <page.html?query> <out-file> [width] [height]
//   node shoot.mjs --all            # every shot listed in SHOTS below
// Serves content/art/ so pages can load ../kenney/*.glb and ./node_modules/three.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const root = path.resolve(here, "..");
const out = path.resolve(here, "../../../docs/screens/3d-city");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
};

const SHOTS = [
  ["city.html?city=vmath", "thanh-so.jpg", 2400, 1500],
  ["city.html?city=viet", "pho-chu.jpg", 2400, 1500],
  ["sheet.html?city=vmath", "thanh-so-5-muc.jpg", 2400, 1100],
  ["sheet.html?city=viet", "pho-chu-5-muc.jpg", 2400, 1100],
  ["wonder.html?city=vmath", "kim-tu-thap-ghep-manh.jpg", 2400, 1000],
  ["wonder.html?city=viet", "chua-mot-cot-ghep-manh.jpg", 2400, 1000],
];

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.statusCode = 404;
    return res.end("not found");
  }
  res.setHeader("Content-Type", mime[path.extname(p)] || "application/octet-stream");
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const args = process.argv.slice(2);
const jobs =
  args[0] === "--all" || args.length === 0
    ? SHOTS
    : [[args[0], args[1], +args[2] || 2400, +args[3] || 1500]];
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu"],
});
for (const [page, file, W, H] of jobs) {
  const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  tab.on("pageerror", (e) => console.error("pageerror", e.message));
  tab.on("console", (m) => console.log(`[${m.type()}]`, m.text()));
  const sep = page.includes("?") ? "&" : "?";
  const t0 = Date.now();
  await tab.goto(`http://127.0.0.1:${port}/3d-city/${page}${sep}w=${W}&h=${H}`);
  await tab.waitForFunction(() => window.__done === true, null, { timeout: 180000 });
  const stats = await tab.evaluate(() => window.__stats || null);
  const target =
    path.isAbsolute(file) || file.includes("/") ? path.resolve(here, file) : path.join(out, file);
  await tab.screenshot({
    path: target,
    type: target.endsWith(".png") ? "png" : "jpeg",
    quality: target.endsWith(".png") ? undefined : 90,
  });
  console.log(
    "wrote",
    path.relative(process.cwd(), target),
    `${Date.now() - t0} ms`,
    stats ? JSON.stringify(stats) : "",
  );
  await tab.close();
}
await browser.close();
server.close();
