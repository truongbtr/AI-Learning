import { collectionFor, prisma } from "@mtct/db";
import { redirect } from "next/navigation";
import { kidStudent } from "@/lib/kid/student";
import { CollectionClient } from "./collection-client";

export const dynamic = "force-dynamic";

/** K7 — the collection and the child's own corner of the world (docs/06 §1.2). */
export default async function CollectionPage() {
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");
  const view = await collectionFor(prisma, student.id);
  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    orderBy: { issuedAt: "desc" },
    take: 6,
    select: { id: true, title: true, issuedAt: true },
  });

  return (
    <CollectionClient
      view={view}
      theme={student.mascot === "OWL" ? "garden" : "robot"}
      studentId={student.id}
      nickname={student.nickname}
      certificates={certificates.map((c) => ({
        id: c.id,
        title: c.title,
        issuedAt: c.issuedAt.toISOString().slice(0, 10),
      }))}
    />
  );
}
