"use client";

import type { WordBook } from "@mtct/db";
import { SpeakerButton } from "@/components/kid/buttons";
import { LexemeBook } from "@/components/kid/lexeme-book";

/**
 * The child's own dictionary. Every card is a word they have already met: tap it to hear it again
 * and to see the phrase it lives in.
 *
 * Deliberately missing: any sense of a target. There is no "12/262", no bar creeping towards a
 * goal and no empty slots for words not met — an empty page of unknown words is a list of things
 * you cannot do, which is the one thing this world never shows a child (docs/06 §1.1).
 */
export function WordBookClient({
  book,
  theme,
  nickname,
}: {
  book: WordBook;
  theme: "robot" | "garden";
  nickname: string;
}) {
  return (
    <LexemeBook
      title={`Sổ từ của ${nickname}`}
      subtitle={
        book.met === 0
          ? "Chơi ở Bến Cảng Từ để sưu tầm từ nhé!"
          : `${book.met} từ đã gặp · ${book.known} từ thuộc rồi`
      }
      emptyIcon="⛵"
      emptyText="Sổ còn trống. Mỗi lần con chơi ở Bến Cảng Từ, một từ mới sẽ được dán vào đây."
      backHref="/kid/home"
      theme={theme}
      cardTestId="word-card"
      sections={book.topics.map((topic) => ({
        key: topic.skillCode,
        title: topic.nameVi,
        cards: topic.words.map((w) => ({
          id: w.stableId,
          big: w.en,
          small: w.vi,
          picture: w.picture,
          detail: (
            <>
              <SpeakerButton text={w.en} lang="en-US" size={72} />
              <div className="flex flex-col">
                <span className="font-extrabold text-[24px] text-[#2B2B3A]">{w.phraseEn}</span>
                <span className="font-bold text-[20px] text-[#6B6B7B]">
                  Con đã gặp từ này {w.seen} lần
                </span>
              </div>
            </>
          ),
        })),
      }))}
    />
  );
}
