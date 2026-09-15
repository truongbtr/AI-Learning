import { kidHome, prisma, worldRead } from "@mtct/db";
import { redirect } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import { kidStudent } from "@/lib/kid/student";
import { currentKidUi } from "@/lib/kid/ui-mode-server";
import { WorldMapClient } from "./world-map-client";

export const dynamic = "force-dynamic";

/** Pha 10 — the six-city map: choosing a city is choosing a subject. */
export default async function CityWorldPage() {
  if ((await currentKidUi()) !== "city") redirect("/kid/home");
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");
  const [cities, home] = await Promise.all([
    worldRead(prisma, student.id),
    kidHome(prisma, student.id),
  ]);

  return (
    <WorldMapClient
      cities={cities}
      studentId={student.id}
      nickname={student.nickname}
      mascot={home?.mascot ?? "robot"}
      stars={home?.stars ?? 0}
      daysLearnt={home?.streak.current ?? 0}
      signOut={
        <form action={signOutAction}>
          <button
            type="submit"
            className="min-h-[64px] rounded-[28px] bg-white/85 px-6 font-extrabold text-[22px] text-[#6B6B7B] shadow"
          >
            👋 Tạm biệt
          </button>
        </form>
      }
    />
  );
}
