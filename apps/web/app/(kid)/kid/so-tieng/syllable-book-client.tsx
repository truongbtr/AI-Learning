"use client";

import { cadenceLine, type WorkshopProgress, writtenSyllable } from "@mtct/core";
import type { SyllableBook } from "@mtct/db";
import { useEffect } from "react";
import { BigButton, SpeakerButton } from "@/components/kid/buttons";
import { LexemeBook } from "@/components/kid/lexeme-book";
import { BrickRow } from "@/components/kid/syllable/station";
import { useCadence } from "@/components/kid/syllable/use-cadence";
import { useSpeak } from "@/components/kid/use-speak";

/**
 * The syllables a child keeps, by lesson group, each one tappable to hear it and its rhythm again.
 * Above them, the brick pile of Phố Chữ: a house for every ten, and the bricks towards the next —
 * drawn, never written as a fraction.
 */
export function SyllableBookClient({
  book,
  workshop,
  theme,
  nickname,
  backHref,
}: {
  book: SyllableBook;
  workshop: WorkshopProgress;
  theme: "robot" | "garden";
  nickname: string;
  backHref: string;
}) {
  const { speak } = useSpeak();
  const cadence = useCadence();
  useEffect(() => cadence.stop, [cadence.stop]);

  const subtitle =
    book.known === 0
      ? "Lắp tiếng ở Xưởng Tiếng để sưu tầm tiếng nhé!"
      : `${book.known} tiếng đã thuộc` +
        (book.practising > 0 ? ` · ${book.practising} tiếng đang tập` : "");

  return (
    <LexemeBook
      title={`Sổ tiếng của ${nickname}`}
      subtitle={subtitle}
      emptyIcon="⚙️"
      emptyText={
        book.practising > 0
          ? "Con đang tập vài tiếng rồi. Tiếng nào con lắp đúng qua mấy ngày sẽ thành một viên gạch và được dán vào đây."
          : "Sổ còn trống. Mỗi tiếng con lắp đúng qua mấy ngày sẽ thành một viên gạch và được dán vào đây."
      }
      backHref={backHref}
      backLabel={backHref.includes("city") ? "← Về Phố Chữ" : "← Về nhà"}
      theme={theme}
      cardTestId="syllable-card"
      aside={
        <div
          className="flex flex-wrap items-center justify-center gap-3 rounded-[28px] bg-white px-5 py-3 shadow-[0_10px_24px_-16px_rgba(43,43,58,0.6)]"
          data-testid="syllable-workshop"
          data-houses={workshop.houses}
          data-bricks={workshop.bricks}
        >
          <span className="font-extrabold text-[24px] text-[#2B2B3A]">
            {workshop.houses > 0 ? `${workshop.houses} ngôi nhà ở Phố Chữ` : "Ngôi nhà đầu tiên"}
          </span>
          <BrickRow laid={workshop.bricks} />
        </div>
      }
      sections={book.groups.map((group) => ({
        key: group.skillCode,
        title: group.nameVi,
        cards: group.syllables.map((s) => ({
          id: s.stableId,
          big: writtenSyllable(s.text, s.properName),
          small: s.meaning,
          picture: s.picture ?? undefined,
          say: () => void speak(s.text, { lang: "vi-VN" }),
          detail: (
            <>
              <SpeakerButton text={s.text} lang="vi-VN" size={72} />
              <div className="flex flex-col gap-2">
                <span className="font-extrabold text-[24px] text-[#2B2B3A]">
                  {cadenceLine(s.text)}
                </span>
                <span className="font-bold text-[20px] text-[#6B6B7B]">
                  Con đã gặp tiếng này {s.seen} lần
                </span>
              </div>
              <BigButton tone="quiet" onClick={() => void cadence.play(s.text)}>
                Nghe đánh vần
              </BigButton>
            </>
          ),
        })),
      }))}
    />
  );
}
