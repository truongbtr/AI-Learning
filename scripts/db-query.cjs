// Ad-hoc SQL for checks: node scripts/db-query.cjs "select 1"  (loads .env from repo root)
const path = require("node:path");
require(
  require.resolve("dotenv", { paths: [path.join(__dirname, "..", "packages", "db")] }),
).config({ path: path.join(__dirname, "..", ".env"), quiet: true });
const { PrismaClient } = require("../packages/db/generated/client");
const prisma = new PrismaClient();
const sql = process.argv.slice(2).join(" ");
prisma
  .$queryRawUnsafe(sql)
  .then((rows) =>
    console.log(JSON.stringify(rows, (_, v) => (typeof v === "bigint" ? Number(v) : v), 2)),
  )
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
