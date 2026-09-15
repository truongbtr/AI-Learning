import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript" };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.statusCode = 404;
    return res.end("nope");
  }
  res.setHeader("Content-Type", mime[path.extname(p)] || "application/octet-stream");
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const jobs = process.argv.slice(2).length ? process.argv.slice(2) : ["city", "sheet"];
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
for (const mode of jobs) {
  const W = 2400,
    H = mode === "sheet" ? 1350 : 1500;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("pageerror", e.message));
  page.on("console", (m) => {
    if (m.type() === "error") console.error("console", m.text());
  });
  await page.goto(`http://127.0.0.1:${port}/scene.html?mode=${mode}&w=${W}&h=${H}`);
  await page.waitForFunction(() => window.__done === true, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  const out = `out-${mode}.png`;
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
  console.log("wrote", out);
  await page.close();
}
await browser.close();
server.close();
