import { prisma } from "@mtct/db";
import { SpeakButton } from "@/components/kid/speak-button";
import { signOutAction } from "@/lib/auth/actions";
import { guardPage } from "@/lib/auth/session";
import { avatarEmoji } from "@/lib/avatars";
import { personaFor } from "@/lib/tts/voices";

export const dynamic = "force-dynamic";

/**
 * K2 placeholder for phase 0: shows the child's home name (docs/08 pha 0 acceptance).
 * The illustrated world, mascot and Daily Quest map arrive in phase 3 (docs/06).
 */
export default async function KidHomePage() {
  const user = await guardPage("kid");
  const student =
    user.role === "CHILD"
      ? await prisma.student.findUnique({
          where: { userId: user.id },
          select: { nickname: true, mascot: true, avatarKey: true },
        })
      : null;
  const nickname =
    student?.nickname ?? (user.role === "ADMIN" ? "bạn nhỏ (xem thử)" : user.displayName);
  const mascot = student?.mascot === "OWL" ? "🦉" : "🤖";
  const greeting = `Chào ${nickname}! Hôm nay mình cùng học vui nhé!`;
  const voice = personaFor(student ?? { avatarKey: user.avatarKey, mascot: null });

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between px-6 py-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <div className="animate-float text-[7rem] leading-none drop-shadow-lg" aria-hidden>
          {mascot}
        </div>
        <div className="rounded-3xl bg-white/85 px-8 py-6 shadow-lg">
          <p className="text-5xl font-black text-sky-800">Chào {nickname}!</p>
          <p className="mt-3 text-2xl font-bold text-slate-600">Hôm nay mình cùng học vui nhé!</p>
        </div>
        <SpeakButton text={greeting} voice={voice} autoPlay />
        <div className="flex items-center gap-3 rounded-3xl bg-white/70 px-6 py-4 text-2xl font-bold text-slate-600">
          <span className="text-4xl" aria-hidden>
            {avatarEmoji(student?.avatarKey ?? user.avatarKey)}
          </span>
          Nhiệm vụ hôm nay đang được chuẩn bị…
        </div>
      </div>
      <form action={signOutAction} className="mt-8">
        <button
          type="submit"
          className="min-h-16 rounded-full bg-white/80 px-8 text-2xl font-extrabold text-slate-600 shadow-md active:scale-95"
        >
          👋 Tạm biệt
        </button>
      </form>
    </main>
  );
}
