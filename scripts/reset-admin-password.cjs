// Runs INSIDE the web container. Reads the new password from stdin (never from argv, so it is not
// in the process list or shell history), hashes it like the app does and clears the lockout.
//   node reset-admin-password.cjs <username> [--check]
const { hash } = require("/app/apps/web/node_modules/@node-rs/argon2");
const { PrismaClient } = require("/app/packages/db/generated/client");

const ARGON2 = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

async function main() {
  const username = (process.argv[2] ?? "").trim().toLowerCase();
  const check = process.argv.includes("--check");
  if (!username) throw new Error("thiếu tên đăng nhập");
  const db = new PrismaClient();
  try {
    const user = await db.user.findUnique({
      where: { username },
      select: { id: true, role: true, isActive: true },
    });
    if (!user || user.role !== "ADMIN") throw new Error(`không có tài khoản ADMIN "${username}"`);
    if (check) {
      await hash("kiem-tra-thu-vien", ARGON2);
      console.log(
        `OK: tìm thấy ADMIN "${username}" (đang ${user.isActive ? "bật" : "tắt"}), thư viện băm chạy được.`,
      );
      return;
    }
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    const password = input.replace(/\r?\n$/, "");
    if (password.length < 10) throw new Error("mật khẩu phải có ít nhất 10 ký tự");
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(password, ARGON2),
        mustChangePassword: false,
        failedCount: 0,
        lockedUntil: null,
        isActive: true,
      },
    });
    console.log(`Đã đặt mật khẩu mới cho "${username}". Đăng nhập ở /login.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(`Lỗi: ${err.message}`);
  process.exit(1);
});
