import { cityRead, kidHome, planCitySession, prisma, sessionForKid } from "@mtct/db";
import { redirect } from "next/navigation";
import { cityKid } from "@/lib/kid/city-session";
import { CityClient } from "./city-client";

export const dynamic = "force-dynamic";

/**
 * Pha 10 — one subject city, where the whole evening happens. Today's city session is planned
 * first (idempotent), then the city is recomputed from learning data with that session's 3–4
 * stations; the exercises themselves are played in a panel over the city, never on another page.
 */
export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityParam } = await params;
  const { student, city } = await cityKid(cityParam);

  const plan = await planCitySession(prisma, student.id, city);
  const [read, session, home] = await Promise.all([
    cityRead(prisma, student.id, city),
    sessionForKid(prisma, plan.sessionId, { studentId: student.id }),
    kidHome(prisma, student.id),
  ]);
  if (!session) redirect("/kid/city");

  // building names, read aloud when a building without a star is tapped
  const skills = await prisma.skill.findMany({
    where: { id: { in: read.state.view.skills.map((s) => s.skillId) } },
    select: { id: true, code: true, nameVi: true },
  });

  return (
    <CityClient
      city={city}
      studentId={student.id}
      nickname={student.nickname}
      mascot={home?.mascot ?? "robot"}
      initialView={read.state.view}
      initialHud={read.state.hud}
      initialStations={read.session?.stations ?? { stations: [], homework: [] }}
      changes={read.changes}
      session={session}
      skills={skills}
    />
  );
}
