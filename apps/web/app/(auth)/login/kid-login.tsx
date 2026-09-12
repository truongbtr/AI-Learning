"use client";

import { motion } from "framer-motion";
import { useState, useTransition } from "react";
import { MascotSays } from "@/components/kid/mascot";
import { PicturePinGrid } from "@/components/kid/picture-pin-grid";
import { SpeakButton, speak } from "@/components/kid/speak-button";
import { STAGGER } from "@/components/kid/tokens";
import { avatarArt } from "@/lib/avatars";
import { kidLoginAction } from "./actions";

export interface KidCard {
  id: string;
  displayName: string;
  avatarKey: string | null;
  pictureSetKey: string | null;
}

const PROMPT = "Chọn 4 hình của con nhé";

/** Top half of /login: big avatar cards → picture grid (docs/12 §4). */
export function KidLogin({ kids }: { kids: KidCard[] }) {
  const [selected, setSelected] = useState<KidCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const [pending, startTransition] = useTransition();

  if (kids.length === 0) {
    return (
      <p className="rounded-2xl bg-white/70 px-4 py-3 text-center text-lg text-slate-600">
        Chưa có tài khoản cho con. Admin tạo trong trang Quản lý người dùng.
      </p>
    );
  }

  function choose(kid: KidCard) {
    setSelected(kid);
    setError(null);
    setResetToken((t) => t + 1);
    speak(`Chào ${kid.displayName}! ${PROMPT}`);
  }

  function submit(pin: string[]) {
    if (!selected) return;
    startTransition(async () => {
      const result = await kidLoginAction({ userId: selected.id, pin });
      if (result?.error) {
        setError(result.error);
        speak(result.error);
        setResetToken((t) => t + 1);
      }
    });
  }

  return (
    <section aria-label="Con đăng nhập" data-testid="kid-login" className="space-y-4">
      {/* K1 is a place too: the mascot is here to say hello before anyone has logged in. */}
      {selected ? null : (
        <div className="flex justify-center">
          <MascotSays
            name="robot"
            state="greet"
            size={170}
            text="Chào con! Con là ai nào?"
            sub="Chạm vào ảnh của con nhé."
          />
        </div>
      )}
      <motion.div
        variants={STAGGER.container}
        initial="hidden"
        animate="show"
        className="flex flex-wrap justify-center gap-4"
      >
        {kids.map((kid) => (
          <motion.button
            type="button"
            key={kid.id}
            data-testid={`kid-card-${kid.id}`}
            variants={STAGGER.item}
            whileTap={{ scale: 0.94 }}
            onClick={() => choose(kid)}
            aria-pressed={selected?.id === kid.id}
            className={`flex min-h-40 min-w-40 flex-col items-center justify-center rounded-3xl border-4 bg-white/90 px-6 py-4 shadow-lg ${
              selected?.id === kid.id ? "border-amber-400 ring-4 ring-amber-200" : "border-white"
            }`}
          >
            {/* biome-ignore lint/performance/noImgElement: an inline SVG asset, not a photo */}
            <img src={avatarArt(kid.avatarKey)} alt="" width={104} height={104} />
            <span className="mt-2 font-extrabold text-3xl text-slate-700">{kid.displayName}</span>
          </motion.button>
        ))}
      </motion.div>

      {selected ? (
        <div className="mx-auto max-w-xl space-y-4 rounded-3xl bg-white/70 p-4 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <p className="text-2xl font-extrabold text-slate-700">{PROMPT}</p>
            <SpeakButton text={PROMPT} />
          </div>
          <PicturePinGrid
            setKey={selected.pictureSetKey}
            onComplete={submit}
            disabled={pending}
            resetToken={resetToken}
          />
          {pending ? (
            <p className="text-center text-2xl font-bold text-slate-600">Đang mở cửa…</p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-2xl bg-amber-100 px-4 py-3 text-center text-2xl font-bold text-amber-800"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
