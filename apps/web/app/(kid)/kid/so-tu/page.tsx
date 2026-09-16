import { prisma, wordBook } from "@mtct/db";
import { redirect } from "next/navigation";
import { kidStudent } from "@/lib/kid/student";
import { WordBookClient } from "./word-book-client";

export const dynamic = "force-dynamic";

/**
 * "Sổ từ" (pha 11) — every English word the child has met, with its picture, its Vietnamese and a
 * way to hear it again.
 *
 * It is a scrapbook, not a report: no score, no percentage, no box numbers and no comparison with
 * the other child (docs/06 §1.1). What it answers is a question a six-year-old asks out loud —
 * "how many words do I know now?" — and the only number on the screen is how many they have met.
 */
export default async function WordBookPage() {
  const { student } = await kidStudent();
  if (!student) redirect("/kid/home");
  const book = await wordBook(prisma, student.id);

  return (
    <WordBookClient
      book={book}
      theme={student.mascot === "OWL" ? "garden" : "robot"}
      nickname={student.nickname}
    />
  );
}
