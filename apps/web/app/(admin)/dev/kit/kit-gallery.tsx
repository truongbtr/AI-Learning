"use client";

import { useState } from "react";
import { BigButton, HintBulb, IconTile, ParentDoor, SpeakerButton } from "@/components/kid/buttons";
import {
  ConfettiCelebration,
  DoneTick,
  type FeedbackKind,
  FeedbackOverlay,
  HintBubble,
} from "@/components/kid/feedback";
import { KidPinPad } from "@/components/kid/kid-pin-pad";
import { Mascot, type MascotName, MascotSays, type MascotState } from "@/components/kid/mascot";
import { playSound, setSoundEnabled } from "@/components/kid/sound";
import { StarBurst, StarPocket, useStarFlight } from "@/components/kid/stars";
import { EmptyState, LoadingMascot, OfflineNotice, SceneTransition } from "@/components/kid/states";
import { type KidTheme, THEME } from "@/components/kid/tokens";
import { type TimeOfDay, WorldBackground } from "@/components/kid/world-background";

/**
 * The component gallery of docs/06 §4: every kid component and every mascot state on one page,
 * so a change can be looked at without walking a child through a whole session.
 */

const STATES: MascotState[] = [
  "idle",
  "greet",
  "talk",
  "think",
  "cheer",
  "encourage",
  "celebrate",
  "sleep",
  "listen",
];

const ZONES = [
  { world: "robot", zone: "xuong-so", label: "Xưởng Số (Toán)" },
  { world: "robot", zone: "thap-chu", label: "Tháp Chữ (Tiếng Việt)" },
  { world: "robot", zone: "tram-khong-gian", label: "Trạm Không Gian" },
  { world: "robot", zone: "ben-tau-tieng-anh", label: "Bến Tàu Tiếng Anh" },
  { world: "garden", zone: "vuon-so", label: "Vườn Số" },
] as const;

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink-100 bg-white p-5">
      <h3 className="font-semibold text-ink-900 text-lg">{title}</h3>
      {note ? <p className="mt-1 text-ink-500 text-sm">{note}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function KitGallery() {
  const [who, setWho] = useState<MascotName>("robot");
  const [theme, setTheme] = useState<KidTheme>("robot");
  const [time, setTime] = useState<TimeOfDay>("day");
  const [speaking, setSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackKind>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stars, setStars] = useState(6);
  const [burst, setBurst] = useState<{ x: number; y: number } | null>(null);
  const [scene, setScene] = useState("a");
  const [confetti, setConfetti] = useState(false);
  const [sound, setSound] = useState(true);
  const { fly, layer } = useStarFlight(() => setStars((s) => s + 1));

  return (
    <div className="flex flex-col gap-5">
      {layer}
      <FeedbackOverlay
        kind={feedback}
        mascot={who}
        explanation={feedback === "answer" ? "3 cộng 2 bằng 5." : undefined}
        onDone={() => setFeedback(null)}
      />
      <ConfettiCelebration fire={confetti} />
      {burst ? <StarBurst x={burst.x} y={burst.y} /> : null}

      <Section
        title="Điều khiển"
        note="Đổi nhân vật, thế giới và giờ trong ngày để xem mọi biến thể."
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            Mascot:
            <select
              value={who}
              onChange={(e) => setWho(e.target.value as MascotName)}
              className="rounded-md border border-ink-200 px-2 py-1"
            >
              <option value="robot">Rô-bốt</option>
              <option value="cu">bạn Cú</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Thế giới:
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as KidTheme)}
              className="rounded-md border border-ink-200 px-2 py-1"
            >
              <option value="robot">Thành phố Robot</option>
              <option value="garden">Vườn Kỳ Diệu</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Giờ:
            <select
              value={time}
              onChange={(e) => setTime(e.target.value as TimeOfDay)}
              className="rounded-md border border-ink-200 px-2 py-1"
            >
              <option value="morning">sáng sớm</option>
              <option value="day">ban ngày</option>
              <option value="evening">chiều tối</option>
              <option value="night">tối</option>
            </select>
          </label>
          <button
            type="button"
            className="rounded-md border border-ink-200 px-3 py-1"
            onClick={() => {
              const next = !sound;
              setSound(next);
              setSoundEnabled(next);
            }}
          >
            Âm thanh: {sound ? "bật" : "tắt"}
          </button>
          <span className="text-ink-400">
            Bộ 6 âm:
            {(["dung", "gan-dung", "sao", "huy-hieu", "xong-phien", "cham"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="ml-2 rounded-md border border-ink-200 px-2 py-0.5"
                onClick={() => playSound(s)}
              >
                {s}
              </button>
            ))}
          </span>
        </div>
      </Section>

      <Section
        title="Mascot — 9 trạng thái (docs/06 §1.7)"
        note="Chạm vào mascot để xem phản ứng; mắt chớp và râu/ăng-ten đung đưa ở mọi trạng thái."
      >
        <div className="flex flex-wrap gap-3">
          {STATES.map((s) => (
            <div
              key={s}
              className="flex w-[140px] flex-col items-center rounded-lg bg-[#FFF8EC] p-2"
            >
              <Mascot name={who} state={s} size={120} speaking={s === "talk" && speaking} />
              <span className="mt-1 font-mono text-ink-500 text-xs">{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <SpeakerButton
            text="Mình là bạn của con. Cùng làm nhiệm vụ hôm nay nhé!"
            onSpeakingChange={setSpeaking}
          />
          <span className="text-ink-500 text-sm">
            Bấm loa: miệng mascot <code>talk</code> nhép theo giọng đọc.
          </span>
        </div>
      </Section>

      <Section
        title="Nền thế giới — 3 lớp, 5 khu"
        note="Vùng giữa (400,180)–(1200,700) luôn để trống cho đề bài."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ZONES.map((z) => (
            <div
              key={`${z.world}-${z.zone}`}
              className="overflow-hidden rounded-xl border border-ink-100"
            >
              <div className="relative h-[190px]">
                {(["sky", "mid", "fore"] as const).map((l) => (
                  // biome-ignore lint/performance/noImgElement: local SVG layers
                  <img
                    key={l}
                    src={`/art/worlds/${z.world}/${z.zone}-${l}.svg`}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ))}
              </div>
              <p className="px-3 py-2 text-ink-600 text-sm">{z.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Một màn hình thật"
        note="WorldBackground + mascot + nút chính + túi sao, đúng như con thấy."
      >
        <div className="overflow-hidden rounded-2xl border border-ink-100">
          <WorldBackground theme={theme} subject="VMATH" at={time} className="min-h-[440px]">
            <div className="flex min-h-[440px] flex-col justify-between p-6">
              <div className="flex items-start justify-between">
                <StarPocket count={stars} />
                <ParentDoor onOpen={() => alert("Về trang ba mẹ")} />
              </div>
              <div className="flex items-end justify-between gap-4">
                <MascotSays
                  name={THEME[theme].mascot as MascotName}
                  state="greet"
                  size={190}
                  text="Chào con!"
                  sub="Hôm nay có 12 việc nhỏ thôi."
                />
                <BigButton
                  color={THEME[theme].primary}
                  onClick={() => {
                    setConfetti(false);
                    window.setTimeout(() => setConfetti(true), 10);
                  }}
                >
                  Nhiệm vụ hôm nay
                </BigButton>
              </div>
            </div>
          </WorldBackground>
        </div>
      </Section>

      <Section title="Nút, thẻ, loa, bóng đèn">
        <div className="flex flex-wrap items-center gap-4">
          <BigButton onClick={() => playSound("cham")}>Đi thôi!</BigButton>
          <BigButton tone="reward" onClick={() => playSound("huy-hieu")}>
            Nhận thưởng
          </BigButton>
          <BigButton tone="quiet" onClick={() => {}}>
            Để sau
          </BigButton>
          <BigButton tone="primary" disabled>
            Chưa mở
          </BigButton>
          <SpeakerButton text="Nghe rồi chọn ô đúng nhé!" />
          <HintBulb
            used={hintsUsed}
            onHint={() => {
              setHintsUsed((n) => n + 1);
              setHint("Đếm tiếp từ 3: bốn, năm.");
              window.setTimeout(() => setHint(null), 3000);
            }}
          />
          <DoneTick />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <IconTile label="Toán" emoji="🔢" />
          <IconTile label="Tiếng Việt" emoji="🔤" />
          <IconTile label="Bộ sưu tập" src="/art/effects/chest-closed.svg" />
          <IconTile label="Bạn Cú" src="/art/mascots/cu/idle.svg" />
        </div>
        <div className="mt-4">
          <HintBubble hint={hint} mascot={who} />
        </div>
      </Section>

      <Section
        title="Sao bay về túi + phản hồi"
        note="Sao bay theo đường cong 600 ms rồi túi sao đếm nhảy."
      >
        <div className="flex flex-wrap items-center gap-3">
          <StarPocket count={stars} />
          <button
            type="button"
            className="rounded-lg bg-[#34C759] px-4 py-2 font-semibold text-white"
            onClick={(e) => {
              const r = (e.target as HTMLElement).getBoundingClientRect();
              fly(r.left + r.width / 2, r.top + r.height / 2);
              setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
              window.setTimeout(() => setBurst(null), 800);
              setFeedback("correct");
            }}
          >
            Trả lời đúng
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#FFB020] px-4 py-2 font-semibold text-ink-900"
            onClick={() => setFeedback("almost")}
          >
            Gần đúng
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#2F80ED] px-4 py-2 font-semibold text-white"
            onClick={() => setFeedback("answer")}
          >
            Hiện đáp án (sau 3 lần)
          </button>
        </div>
      </Section>

      <Section title="Chuyển cảnh" note="Camera lia theo hướng con đang đi trong thế giới.">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-ink-200 px-3 py-2"
            onClick={() => setScene(scene === "a" ? "b" : "a")}
          >
            Đổi cảnh
          </button>
          <div className="w-[360px] overflow-hidden rounded-xl bg-[#FFF8EC] p-4">
            <SceneTransition sceneKey={scene}>
              <div className="flex items-center gap-3">
                <Mascot
                  name={who}
                  state={scene === "a" ? "idle" : "cheer"}
                  size={90}
                  interactive={false}
                />
                <p className="font-extrabold text-[22px] text-[#2B2B3A]">
                  {scene === "a" ? "Bài 3 — Toán" : "Bài 4 — Tiếng Việt"}
                </p>
              </div>
            </SceneTransition>
          </div>
        </div>
      </Section>

      <Section
        title="Đang tải · chưa có gì · mất mạng"
        note="Checklist §4 mục 7: không bao giờ là spinner trơn."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-[#FFF8EC] p-3">
            <LoadingMascot mascot={who} />
          </div>
          <div className="rounded-xl bg-[#FFF8EC] p-3">
            <EmptyState
              mascot={who}
              title="Hôm nay con làm xong hết rồi!"
              hint="Mai mình gặp lại nhé."
            />
          </div>
          <div className="rounded-xl bg-[#FFF8EC] p-3">
            <OfflineNotice retry={() => {}} />
          </div>
        </div>
      </Section>

      <Section title="Mã hình của con (KidPinPad)">
        <div className="rounded-xl bg-[#FFF8EC] p-4">
          <KidPinPad
            name="Thy"
            setKey="animals"
            mascot={who}
            onComplete={() => playSound("dung")}
            error={null}
          />
        </div>
      </Section>
    </div>
  );
}
