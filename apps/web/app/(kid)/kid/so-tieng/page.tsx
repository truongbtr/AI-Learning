import { workshopProgress } from "@mtct/core";
import { prisma, syllableBook } from "@mtct/db";
import { redirect } from "next/navigation";
import { kidStudent } from "@/lib/kid/student";
import { SyllableBookClient } from "./syllable-book-client";

export const dynamic = "force-dynamic";

/**
 * "Sổ tiếng" (pha 12) — the Vietnamese syllables a child keeps, each one a brick in Phố Chữ.
 *
 * The same scrapbook as the Sổ từ: no score, no percentage, no comparison with the other child.
 * Opened from the Phố Chữ HUD (`?from=city`) or from home.
 */
export default async function SyllableBookPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");
  const { from } = await searchParams;
  const [book, city] = await Promise.all([
    syllableBook(prisma, student.id),
    prisma.studentCity.findUnique({
      where: { studentId_subject: { studentId: student.id, subject: "VIET" } },
      select: { syllableBricks: true },
    }),
  ]);

  return (
    <SyllableBookClient
      book={book}
      workshop={workshopProgress(Math.max(city?.syllableBricks ?? 0, book.known))}
      theme={student.mascot === "OWL" ? "garden" : "robot"}
      nickname={student.nickname}
      backHref={from === "city" ? "/kid/city/viet" : "/kid/home"}
    />
  );
}
