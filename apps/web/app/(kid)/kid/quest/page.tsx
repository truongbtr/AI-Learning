import { prisma } from "@mtct/db";
import { redirect } from "next/navigation";
import { kidStudent, todaysQuest } from "@/lib/kid/student";
import { QuestMapClient } from "./quest-map-client";

export const dynamic = "force-dynamic";

/** K3 — the map of today's quest (docs/06 §1.2). */
export default async function QuestPage() {
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");
  const session = await todaysQuest(student.id);
  const companion = await prisma.studentPet.findFirst({
    where: { studentId: student.id, isCompanion: true },
    select: { petCode: true },
  });

  return (
    <QuestMapClient
      session={session}
      avatarKey={student.avatarKey}
      companion={companion ? (PET_ASSET[companion.petCode] ?? null) : null}
    />
  );
}

/** The pet that walks beside the avatar is drawn with the matching object (docs/06 §1.8c item 4). */
const PET_ASSET: Record<string, string> = {
  "meo-con": "con-meo",
  "cun-con": "con-cho",
  "vit-con": "con-vit",
  "ga-con": "con-ga",
  "buom-nho": "con-buom",
  "ech-xanh": "con-ech",
  "canh-cut": "chim-canh-cut",
  "robot-nho": "con-robot",
};
