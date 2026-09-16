"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { Picture } from "./exercise/picture";
import { Mascot } from "./mascot";
import { playSound } from "./sound";
import { SPRING, STAGGER, THEME } from "./tokens";

export interface BookCard {
  id: string;
  /** The word or syllable, written large. */
  big: string;
  small?: string;
  picture?: unknown;
  /** Said out loud when the card is touched. */
  say?: () => void;
  /** Shown under the section while the card is open: a speaker, a phrase, how often it was met. */
  detail?: ReactNode;
}

export interface BookSection {
  key: string;
  title: string;
  cards: BookCard[];
}

/**
 * The child's own book of what she keeps — "Sổ từ" for English words (pha 11) and "Sổ tiếng" for
 * Vietnamese syllables (pha 12) are the same page with different cards.
 *
 * A scrapbook, not a report: no score, no percentage, no target and no empty slots for what has
 * not been met yet (docs/06 §1.1). The only number on it is how many there are.
 */
export function LexemeBook({
  title,
  subtitle,
  emptyIcon,
  emptyText,
  sections,
  backHref,
  backLabel = "← Về nhà",
  theme,
  cardTestId,
  aside,
}: {
  title: string;
  subtitle: string;
  emptyIcon: ReactNode;
  emptyText: string;
  sections: BookSection[];
  backHref: string;
  backLabel?: string;
  theme: "robot" | "garden";
  cardTestId: string;
  /** Something extra under the title — Phố Chữ's brick pile, say. */
  aside?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<string | null>(null);
  const colour = THEME[theme].primary;

  return (
    <main className="min-h-dvh bg-[#FFF8EC] px-4 pt-6 pb-16">
      <header className="mx-auto flex max-w-[980px] flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="flex min-h-[64px] items-center rounded-[28px] bg-white px-5 font-extrabold text-[22px] text-[#2B2B3A] shadow-[0_10px_24px_-16px_rgba(43,43,58,0.6)]"
        >
          {backLabel}
        </Link>
        <div className="flex items-center gap-3">
          <Mascot name={theme === "garden" ? "cu" : "robot"} state="greet" size={72} />
          <div className="flex flex-col">
            <span className="font-extrabold text-[28px] text-[#2B2B3A]">{title}</span>
            <span className="font-bold text-[22px] text-[#6B6B7B]">{subtitle}</span>
          </div>
        </div>
      </header>

      {aside ? <div className="mx-auto mt-5 flex max-w-[980px] justify-center">{aside}</div> : null}

      {sections.length === 0 ? (
        <div className="mx-auto mt-16 flex max-w-[620px] flex-col items-center gap-4 text-center">
          <span className="text-[72px]" aria-hidden>
            {emptyIcon}
          </span>
          <p className="font-bold text-[24px] text-[#6B6B7B]">{emptyText}</p>
        </div>
      ) : null}

      <div className="mx-auto mt-8 flex max-w-[980px] flex-col gap-8">
        {sections.map((section) => {
          const current = section.cards.find((c) => c.id === open);
          return (
            <section key={section.key} className="flex flex-col gap-3">
              <h2 className="font-extrabold text-[26px] text-[#2B2B3A]">
                {section.title}{" "}
                <span className="font-bold text-[20px] text-[#6B6B7B]">
                  ({section.cards.length})
                </span>
              </h2>
              <motion.div
                variants={STAGGER.container}
                initial="hidden"
                animate="show"
                className="flex flex-wrap gap-3"
              >
                {section.cards.map((card) => {
                  const isOpen = open === card.id;
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      variants={STAGGER.item}
                      onClick={() => {
                        playSound("cham");
                        card.say?.();
                        setOpen(isOpen ? null : card.id);
                      }}
                      whileTap={reduce ? undefined : { scale: 0.96 }}
                      transition={SPRING.press}
                      className="flex min-h-[150px] w-[150px] flex-col items-center justify-center gap-1 rounded-[28px] bg-white p-3 shadow-[0_12px_28px_-16px_rgba(43,43,58,0.5)]"
                      style={isOpen ? { boxShadow: `0 0 0 5px ${colour}` } : undefined}
                      data-testid={cardTestId}
                      data-id={card.id}
                    >
                      {card.picture ? (
                        <Picture image={card.picture as never} size={72} alt={card.small ?? ""} />
                      ) : null}
                      <span className="font-extrabold text-[30px] text-[#2B2B3A] leading-tight">
                        {card.big}
                      </span>
                      {card.small ? (
                        <span className="font-bold text-[18px] text-[#6B6B7B] leading-tight">
                          {card.small}
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </motion.div>

              {current?.detail ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 rounded-[28px] bg-white/80 px-5 py-4"
                >
                  {current.detail}
                </motion.div>
              ) : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
