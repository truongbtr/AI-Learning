/**
 * `pnpm auth:bypass on|off|status` — flip "tắt đăng nhập" from a terminal (docs/12 §7).
 *
 * The web page at /admin/auth does the same thing, but this exists for the case that makes the
 * feature worth having: the login page itself is the thing that is broken, and the browser cannot
 * get you to any admin screen at all.
 *
 *   pnpm auth:bypass status
 *   pnpm auth:bypass on --hours 4
 *   pnpm auth:bypass off
 */
import { activeBypass, readAuthBypass, setAuthBypass } from "../auth/bypass";
import { prisma } from "../index";

/** argv without the runner's own separators, so `pnpm auth:bypass -- on` works too. */
const args = process.argv.slice(2).filter((a) => a !== "--");

function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const command = (args[0] ?? "status").toLowerCase();

  if (command === "status") {
    const state = await activeBypass(prisma);
    const row = state.on ? state.row : await readAuthBypass(prisma);
    if (state.on) {
      console.log(
        `TẮT ĐĂNG NHẬP đang bật — ai cũng vào được với tài khoản "${state.user.displayName}", tới ${state.until.toLocaleString("vi-VN")}.`,
      );
    } else {
      const why = {
        off: "đã tắt công tắc",
        expired: "hết hạn",
        "no-user": "tài khoản mượn không dùng được",
      };
      console.log(`Đăng nhập bình thường (${why[state.reason]}).`);
      if (row?.until) console.log(`Lần gần nhất đặt hạn tới: ${row.until}`);
    }
    return;
  }

  if (command === "on") {
    const hours = Number(arg("hours") ?? 8);
    const state = await setAuthBypass(prisma, {
      enabled: true,
      hours,
      note: arg("note") ?? "bật từ dòng lệnh",
    });
    if (!state.on) throw new Error("không bật được");
    console.log(
      `Đã TẮT đăng nhập tới ${state.until.toLocaleString("vi-VN")} — mở web là vào thẳng /admin với tài khoản "${state.user.displayName}".`,
    );
    console.log("Nhớ chạy `pnpm auth:bypass off` khi thử xong.");
    return;
  }

  if (command === "off") {
    await setAuthBypass(prisma, { enabled: false, note: arg("note") ?? "tắt từ dòng lệnh" });
    console.log("Đã bật lại đăng nhập. Mọi người phải đăng nhập như bình thường.");
    return;
  }

  throw new Error(`lệnh không biết: ${command} (dùng on | off | status)`);
}

main()
  .catch((err) => {
    console.error(`✗ ${(err as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
