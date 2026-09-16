"use client";

import type { WordBook } from "@mtct/db";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { SpeakerButton } from "@/components/kid/buttons";
import { Picture } from "@/components/kid/exercise/picture";
import { Mascot } from "@/components/kid/mascot";
import { playSound } from "@/components/kid/sound";
import { SPRING, STAGGER, THEME } from "@/components/kid/tokens";

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
  const reduce = useReducedMotion();
  const [openWord, setOpenWord] = useState<string | null>(null);
  const colour = THEME[theme].primary;

  return (
    <main className="min-h-dvh bg-[#FFF8EC] px-4 pb-16 pt-6">
      <header className="mx-auto flex max-w-[980px] items-center justify-between gap-3">
        <Link
          href="/kid/home"
          className="flex min-h-[64px] items-center rounded-[28px] bg-white px-5 font-extrabold text-[22px] text-[#2B2B3A] shadow-[0_10px_24px_-16px_rgba(43,43,58,0.6)]"
        >
          ← Về nhà
        </Link>
        <div className="flex items-center gap-3">
          <Mascot name={theme === "garden" ? "cu" : "robot"} state="greet" size={72} />
          <div className="flex flex-col">
            <span className="font-extrabold text-[28px] text-[#2B2B3A]">Sổ từ của {nickname}</span>
            <span className="font-bold text-[22px] text-[#6B6B7B]">
              {book.met === 0
                ? "Chơi ở Bến Cảng Từ để sưu tầm từ nhé!"
                : `${book.met} từ đã gặp · ${book.known} từ thuộc rồi`}
            </span>
          </div>
        </div>
      </header>

      {book.topics.length === 0 ? (
        <div className="mx-auto mt-16 flex max-w-[620px] flex-col items-center gap-4 text-center">
          <span className="text-[72px]" aria-hidden="true">
            ⛵
          </span>
          <p className="font-bold text-[24px] text-[#6B6B7B]">
            Sổ còn trống. Mỗi lần con chơi ở Bến Cảng Từ, một từ mới sẽ được dán vào đây.
          </p>
        </div>
      ) : null}

      <div className="mx-auto mt-8 flex max-w-[980px] flex-col gap-8">
        {book.topics.map((topic) => (
          <section key={topic.skillCode} className="flex flex-col gap-3">
            <h2 className="font-extrabold text-[26px] text-[#2B2B3A]">
              {topic.nameVi}{" "}
              <span className="font-bold text-[20px] text-[#6B6B7B]">
                ({topic.words.length} từ)
              </span>
            </h2>
            <motion.div
              variants={STAGGER.container}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-3"
            >
              {topic.words.map((w) => {
                const open = openWord === w.stableId;
                return (
                  <motion.button
                    key={w.stableId}
                    type="button"
                    variants={STAGGER.item}
                    onClick={() => {
                      playSound("cham");
                      setOpenWord(open ? null : w.stableId);
                    }}
                    whileTap={reduce ? undefined : { scale: 0.96 }}
                    transition={SPRING.press}
                    className={`flex min-h-[150px] w-[150px] flex-col items-center justify-center gap-1 rounded-[28px] bg-white p-3 shadow-[0_12px_28px_-16px_rgba(43,43,58,0.5)] ${
                      open ? "ring-[5px]" : ""
                    }`}
                    style={open ? { boxShadow: `0 0 0 5px ${colour}` } : undefined}
                    data-testid="word-card"
                    data-word={w.stableId}
                  >
                    <Picture image={w.picture as never} size={84} alt={w.vi} />
                    <span className="font-extrabold text-[24px] text-[#2B2B3A]">{w.en}</span>
                    <span className="font-bold text-[18px] text-[#6B6B7B]">{w.vi}</span>
                  </motion.button>
                );
              })}
            </motion.div>

            {topic.words.some((w) => w.stableId === openWord) ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-[28px] bg-white/80 px-5 py-4"
              >
                {(() => {
                  const w = topic.words.find((x) => x.stableId === openWord);
                  if (!w) return null;
                  return (
                    <>
                      <SpeakerButton text={w.en} lang="en-US" size={72} />
                      <div className="flex flex-col">
                        <span className="font-extrabold text-[24px] text-[#2B2B3A]">
                          {w.phraseEn}
                        </span>
                        <span className="font-bold text-[20px] text-[#6B6B7B]">
                          Con đã gặp từ này {w.seen} lần
                        </span>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
