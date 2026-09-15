/**
 * `pnpm art:sync` — copies content/art/ into apps/web/public/art/ so Next can serve it.
 *
 * The art belongs with the rest of the content (it is authored, reviewed and versioned there),
 * but the browser can only fetch what sits under public/. `predev` and `prebuild` run this, and
 * apps/web/public/art is gitignored — content/art/ stays the single source.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const from = join(process.cwd(), "content", "art");
const to = join(process.cwd(), "apps", "web", "public", "art");

if (!existsSync(from)) {
  console.log("content/art/ chưa có — bỏ qua (chạy `pnpm art:build` để tạo).");
  process.exit(0);
}
rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, {
  recursive: true,
  // Raw Kenney kits (~98 MB) and the render workbenches are authoring-only, not served.
  filter: (src) =>
    !src.includes(`${"_"}contact-sheet`) &&
    !src.endsWith("STYLE.md") &&
    !/[\\/](kenney|3d-city|3d-proto|node_modules)([\\/]|$)/.test(src.slice(from.length)),
});
console.log("art:sync — content/art → apps/web/public/art");
