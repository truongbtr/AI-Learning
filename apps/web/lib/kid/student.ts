import { planDailyQuest, prisma, sessionForKid } from "@mtct/db";
import { redirect } from "next/navigation";
import { guardPage } from "@/lib/auth/session";

/**
 * Who is playing, on the server (docs/12 §4).
 *
 * A CHILD only ever gets its own profile — the id never comes from the URL. An ADMIN looking at
 * the kid area is previewing, and gets the first active child so the screens can be checked
 * without logging in as one.
 */
export async function kidStudent() {
  const user = await guardPage("kid");
  const student =
    user.role === "CHILD"
      ? await prisma.student.findUnique({ where: { userId: user.id }, select: studentFields })
      : await prisma.student.findFirst({
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: studentFields,
        });
  return { user, student, preview: user.role !== "CHILD" };
}

const studentFields = {
  id: true,
  nickname: true,
  mascot: true,
  avatarKey: true,
  interests: true,
} as const;

/**
 * Today's quest, planned on the spot if the 04:00 job has not run (a machine that was off, a child
 * whose account was made this morning). Never plans a second one for the same day.
 */
export async function todaysQuest(studentId: string) {
  const quest = await planDailyQuest(prisma, studentId);
  const session = await sessionForKid(prisma, quest.sessionId, { studentId });
  if (!session) redirect("/kid/home");
  return session;
}
