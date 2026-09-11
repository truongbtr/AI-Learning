"use client";

import type { CollectionView } from "@mtct/db";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MascotSays } from "@/components/kid/mascot";
import { playSound } from "@/components/kid/sound";
import { StarPocket } from "@/components/kid/stars";
import { SceneTransition } from "@/components/kid/states";
import { COLOR, SPRING, STAGGER } from "@/components/kid/tokens";
import { useSpeak } from "@/components/kid/use-speak";
import { WorldBackground } from "@/components/kid/world-background";

/**
 * K7 — the collection (docs/06 §1.2, §1.8c item 14). Stars buy things and the things go *into the
 * world*: the child taps an owned item to place it in the scene, and it stays where it was put.
 */

const CATEGORY_LABEL: Record<string, string> = {
  "cay-co": "Cây cỏ",
  "trang-tri": "Trang trí",
  "cong-trinh": "Công trình",
  "xe-co": "Xe cộ",
  "ban-dong-hanh": "Bạn đồng hành",
  misc: "Khác",
};

export function CollectionClient({
  view,
  theme,
  studentId,
  nickname,
}: {
  view: CollectionView;
  theme: "robot" | "garden";
  studentId: string;
  nickname: string;
}) {
  const router = useRouter();
  const { speak } = useSpeak();
  const [stars, setStars] = useState(view.stars);
  const [items, setItems] = useState(view.items);
  const [placing, setPlacing] = useState<string | null>(null);
  const [line, setLine] = useState(`Đây là thế giới của ${nickname} đó!`);

  const owned = items.filter((i) => i.owned);
  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
  }

  const buy = async (code: string, cost: number, nameVi: string) => {
    if (stars < cost) {
      const msg = "Mình cố thêm một chút nữa là đủ sao nhé!";
      setLine(msg);
      speak(msg, { lang: "vi" });
      return;
    }
    playSound("sao");
    const res = await fetch("/api/kid/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, code }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { stars: number };
    setStars(data.stars);
    setItems((list) => list.map((i) => (i.code === code ? { ...i, owned: true } : i)));
    const msg = `${nameVi} là của con rồi! Chạm vào để đặt vào thế giới nhé.`;
    setLine(msg);
    speak(msg, { lang: "vi" });
  };

  const place = async (code: string, x: number, y: number) => {
    setItems((list) => list.map((i) => (i.code === code ? { ...i, placement: { x, y } } : i)));
    setPlacing(null);
    await fetch("/api/kid/collection", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, code, placement: { x, y } }),
    }).catch(() => {});
  };

  return (
    <WorldBackground theme={theme}>
      <SceneTransition sceneKey="collection" direction="left">
        <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-5 py-5">
          <header className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/kid/home")}
              className="flex min-h-[64px] items-center gap-2 rounded-[28px] bg-white/90 px-5 font-extrabold text-[20px] text-[#6B6B7B]"
            >
              🏡 Về nhà
            </button>
            <StarPocket count={stars} />
          </header>

          {/* The world itself: tapping it while placing puts the item down. */}
          <button
            type="button"
            data-testid="collection-scene"
            onClick={(e) => {
              if (!placing) return;
              const r = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - r.left) / r.width) * 100;
              const y = ((e.clientY - r.top) / r.height) * 100;
              void place(placing, Math.round(x), Math.round(y));
            }}
            className="relative h-[clamp(14rem,32vh,22rem)] w-full cursor-pointer rounded-[32px] bg-white/25"
          >
            {owned
              .filter((i) => i.placement)
              .map((i) => (
                /* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */
                <motion.img
                  key={i.code}
                  src={`/art/objects/${i.assetKey ?? i.code}.svg`}
                  alt={i.nameVi}
                  width={64}
                  height={64}
                  initial={{ scale: 0, y: -30 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={SPRING.pop}
                  className="-translate-x-1/2 -translate-y-1/2 absolute"
                  style={{ left: `${i.placement?.x}%`, top: `${i.placement?.y}%` }}
                />
              ))}
            {placing ? (
              <span className="-translate-x-1/2 absolute bottom-3 left-1/2 rounded-full bg-white/95 px-5 py-2 font-extrabold text-[20px]">
                Chạm vào chỗ con thích để đặt nhé!
              </span>
            ) : null}
          </button>

          <MascotSays
            name={theme === "garden" ? "cu" : "robot"}
            state="talk"
            size={150}
            text={line}
          />

          {view.goal ? (
            <div className="rounded-[28px] bg-white/92 px-6 py-4">
              <p className="font-extrabold text-[21px] text-[#2B2B3A]">
                Mục tiêu của nhà mình: {view.goal.title}
              </p>
              <div className="mt-2 h-5 w-full overflow-hidden rounded-full bg-[#FFF0C8]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((stars / Math.max(1, view.goal.starsNeeded)) * 100))}%`,
                    background: COLOR.reward,
                  }}
                />
              </div>
            </div>
          ) : null}

          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-4 pb-6"
          >
            {[...byCategory.entries()].map(([category, list]) => (
              <section key={category}>
                <h2 className="mb-2 font-extrabold text-[22px] text-[#2B2B3A]">
                  {CATEGORY_LABEL[category] ?? category}
                </h2>
                <div className="flex flex-wrap gap-3">
                  {list.map((i) => (
                    <motion.button
                      key={i.code}
                      type="button"
                      variants={STAGGER.item}
                      whileTap={{ scale: 0.93 }}
                      data-testid={`item-${i.code}`}
                      onClick={() => (i.owned ? setPlacing(i.code) : buy(i.code, i.cost, i.nameVi))}
                      className="flex min-h-[132px] w-[138px] flex-col items-center justify-center gap-1 rounded-[26px] bg-white/92 p-3 shadow-[0_10px_24px_-16px_rgba(43,43,58,0.7)]"
                      style={{ outline: placing === i.code ? `4px solid ${COLOR.reward}` : "none" }}
                    >
                      {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
                      <img
                        src={`/art/objects/${i.assetKey ?? i.code}.svg`}
                        alt=""
                        width={56}
                        height={56}
                        style={{ opacity: i.owned ? 1 : 0.55 }}
                      />
                      <span className="text-center font-extrabold text-[18px] text-[#2B2B3A] leading-tight">
                        {i.nameVi}
                      </span>
                      <span className="font-extrabold text-[18px] text-[#6B6B7B]">
                        {i.owned ? "✓ của con" : `⭐ ${i.cost}`}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </section>
            ))}
          </motion.div>
        </main>
      </SceneTransition>
    </WorldBackground>
  );
}
