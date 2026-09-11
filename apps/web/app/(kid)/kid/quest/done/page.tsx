import { finishSession, prisma } from "@mtct/db";
import { redirect } from "next/navigation";
import { kidStudent, todaysQuest } from "@/lib/kid/student";
import { DoneClient } from "./done-client";

export const dynamic = "force-dynamic";

/**
 * K5 — the celebration (docs/06 §1.2). Closing the session is what grants the day's stars, the
 * streak, the egg's crack and any badge, so it happens here, on the server, once.
 */
export default async function QuestDonePage() {
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");
  const session = await todaysQuest(student.id);
  const summary = await finishSession(prisma, session.id, { studentId: student.id });

  return <DoneClient summary={summary} theme={session.theme} studentId={student.id} />;
}
