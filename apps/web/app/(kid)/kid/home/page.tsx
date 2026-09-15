import { kidHome, prisma } from "@mtct/db";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/kid/states";
import { WorldBackground } from "@/components/kid/world-background";
import { signOutAction } from "@/lib/auth/actions";
import { kidStudent } from "@/lib/kid/student";
import { currentKidUi } from "@/lib/kid/ui-mode-server";
import { KidHomeClient } from "./home-client";

export const dynamic = "force-dynamic";

/**
 * K2 — the child's home (docs/06 §1.2). Everything the screen draws is loaded here in one query
 * (`kidHome`), so the first paint already has the world, the mascot's line and today's quest.
 */
export default async function KidHomePage() {
  // Pha 10: with the city UI on, the six-city map is home
  if ((await currentKidUi()) === "city") redirect("/kid/city");
  const { student } = await kidStudent();
  const home = student ? await kidHome(prisma, student.id) : null;

  if (!home) {
    return (
      <WorldBackground theme="robot">
        <main className="flex min-h-dvh items-center justify-center p-6">
          <EmptyState
            title="Chưa có hồ sơ của con ở đây"
            hint="Ba mẹ tạo tài khoản cho con trong trang quản trị nhé."
          />
        </main>
      </WorldBackground>
    );
  }

  return (
    <KidHomeClient
      home={home}
      signOut={
        <form action={signOutAction}>
          <button
            type="submit"
            className="min-h-[64px] rounded-[28px] bg-white/85 px-6 font-extrabold text-[20px] text-[#6B6B7B] shadow"
          >
            👋 Tạm biệt
          </button>
        </form>
      }
    />
  );
}
