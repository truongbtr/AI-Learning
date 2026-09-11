import { prisma, startSession } from "@mtct/db";
import { redirect } from "next/navigation";
import { kidStudent, todaysQuest } from "@/lib/kid/student";
import { StationClient } from "./station-client";

export const dynamic = "force-dynamic";

/** K4 — one station of today's quest (docs/06 §1.2). */
export default async function StationPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");

  const session = await todaysQuest(student.id);
  await startSession(prisma, session.id);

  const order = Number.parseInt(n, 10);
  const index = session.items.findIndex((i) => i.order === order);
  const item = session.items[index];
  // A station that does not exist, or one already answered, sends the child back to the road.
  if (!item) redirect("/kid/quest");
  if (session.attempts.some((a) => a.order === order && a.done)) redirect("/kid/quest");

  return <StationClient session={session} item={item} index={index} />;
}
