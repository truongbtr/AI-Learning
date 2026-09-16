"use client";

import type { CityEngine, TapTarget } from "@mtct/city/engine";
import type {
  CityChange,
  CityHud,
  CityStation,
  CitySubject,
  CityView,
  StationPlan,
} from "@mtct/core";
import type { KidSession, SessionSummary } from "@mtct/db";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BigButton } from "@/components/kid/buttons";
import { CityCanvas, type CityOverlayItem } from "@/components/kid/city/city-canvas";
import { ExercisePlay } from "@/components/kid/exercise-play";
import { fireConfetti } from "@/components/kid/feedback";
import { Mascot, type MascotState } from "@/components/kid/mascot";
import { playSound, preloadSounds } from "@/components/kid/sound";
import { StarPocket } from "@/components/kid/stars";
import { BrickRow } from "@/components/kid/syllable/station";
import { useSpeak } from "@/components/kid/use-speak";
import {
  CITY_INFO,
  PLOT_BUILD_NAMES,
  PUBLIC_BUILDING_NAMES,
  snapshotKey,
} from "@/lib/kid/city-names";

const LEVEL_WORDS = [
  "đang được xây",
  "là ngôi nhà nhỏ",
  "là nhà nhiều tầng",
  "là toà nhà lớn",
  "là toà nhà chọc trời",
] as const;

/** Celebrations played on arrival; anything beyond is summed up in one line. */
const MAX_CELEBRATIONS = 3;
/** How many things the child picks from when a plot opens (Pha 10 bổ sung §4). */
const BUILD_CHOICES = 3;

type Mode = "intro" | "idle" | "busy" | "panel" | "finale" | "done";

interface Panel {
  station: CityStation;
  queue: number[];
  at: number;
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const sizeOf = (level: number, step: number) => level * 3 + step;
const post = (url: string, body: unknown) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

/**
 * Pha 10 — one subject city, where the whole evening is played (docs/06 hướng thành phố, bổ sung).
 *
 * Only the 3–4 buildings of tonight's stations carry a star. Tapping a star flies the camera to the
 * building and slides a panel up over the city (still in sight, softly blurred) with the existing
 * exercise components; when the station's exercises are done the panel goes down and the building
 * grows in front of the child. After the last station: a loop over the city, the stars fly into the
 * pocket, new land opens and the child chooses what to build. No mark, no red, no timer.
 */
export function CityClient({
  city,
  studentId,
  nickname,
  mascot,
  initialView,
  initialHud,
  initialStations,
  changes,
  session,
  skills,
}: {
  city: CitySubject;
  studentId: string;
  nickname: string;
  mascot: "robot" | "cu";
  initialView: CityView;
  initialHud: CityHud;
  initialStations: StationPlan;
  changes: CityChange[];
  session: KidSession;
  skills: { id: string; code: string; nameVi: string }[];
}) {
  const router = useRouter();
  const { speak, state: speakState } = useSpeak();
  const reduce = !!useReducedMotion();
  const info = CITY_INFO[city];
  const [view, setView] = useState(initialView);
  const [hud, setHud] = useState(initialHud);
  const [plan, setPlan] = useState(initialStations);
  const [engine, setEngine] = useState<CityEngine | null>(null);
  const [mode, setMode] = useState<Mode>("intro");
  const [mascotState, setMascotState] = useState<MascotState>("greet");
  const [line, setLine] = useState("");
  const [panel, setPanel] = useState<Panel | null>(null);
  const [pocket, setPocket] = useState(initialHud.starsEarned);
  const [chooser, setChooser] = useState<{ plot: number; options: string[] } | null>(null);
  const [card, setCard] = useState<{ title: string; sub: string } | null>(null);
  const [played, setPlayed] = useState<Set<number>>(
    () => new Set(session.attempts.filter((a) => a.done).map((a) => a.order)),
  );
  const started = useRef(false);
  const handled = useRef(new Set<number>());
  const finishedRef = useRef(session.status === "COMPLETED");
  const viewRef = useRef(view);
  viewRef.current = view;

  // The city's day starts in the morning when the child sat down — the same moment on every screen
  // and after a reload, so the sky never jumps (pha 11). A session not started yet: now.
  const [openedAt] = useState(() => Date.now());
  const dayAnchorMs = session.startedAt ? new Date(session.startedAt).getTime() : openedAt;

  const idBySkillCode = useMemo(() => new Map(skills.map((s) => [s.code, s.id])), [skills]);
  const nameBySkillId = useMemo(() => new Map(skills.map((s) => [s.id, s.nameVi])), [skills]);
  const itemByOrder = useMemo(
    () => new Map(session.items.map((i) => [i.order, i])),
    [session.items],
  );
  // homework already done shows as done in the session items
  const homeworkLeft = plan.homework.filter(
    (o) => !played.has(o) && !itemByOrder.get(o)?.homework?.done,
  );
  const open = plan.stations.filter((s) => !s.done);
  const next = open[0] ?? null;

  const say = useCallback(
    (text: string, state: MascotState = "talk") => {
      setLine(text);
      setMascotState(state);
      return speak(text);
    },
    [speak],
  );

  const stationTarget = useCallback(
    (station: CityStation): TapTarget | null => {
      if (station.index < 0) return { type: "townHall" };
      const skillId = idBySkillCode.get(station.skillCode);
      return skillId ? { type: "skill", skillId } : null;
    },
    [idBySkillCode],
  );

  // ------------------------------------------------------------------ growth since the last visit
  const celebrate = useCallback(
    async (list: CityChange[], eng: CityEngine) => {
      const shown = list.slice(0, MAX_CELEBRATIONS);
      for (const change of shown) {
        const target = targetOf(change);
        const text = celebrationLine(change, viewRef.current, info.wonder);
        if (target) {
          await eng.focus(target, reduce ? 1 : 900);
          eng.hold(target);
        }
        setMascotState("celebrate");
        setLine(text);
        playSound(change.type === "wonderPiece" ? "huy-hieu" : "sao");
        void fireConfetti(change.type === "wonderPiece" ? 2 : 1);
        await Promise.all([target ? eng.rise(target, 2000) : wait(900), speak(text)]);
        if (change.type === "wonderPiece" && change.complete) {
          for (let i = 0; i < 3; i++) {
            void fireConfetti(2.5);
            await wait(450);
          }
        }
      }
      if (list.length > shown.length) {
        await say(
          `Còn ${list.length - shown.length} điều mới nữa trong phố, con tìm thử nhé!`,
          "cheer",
        );
      }
      if (list.length > 0) void post("/api/kid/city/seen", { studentId, city }).catch(() => {});
    },
    [city, info.wonder, reduce, say, speak, studentId],
  );

  const goHome = useCallback(
    async (eng: CityEngine) => {
      const home = eng.home();
      await eng.flyTo(home.x, home.z, home.dist, reduce ? 1 : 900);
    },
    [reduce],
  );

  /** Pull back to the resting distance with the next star in the middle of the screen. */
  const showNext = useCallback(
    async (eng: CityEngine, station: CityStation | null) => {
      const target = station ? stationTarget(station) : null;
      const lot = target ? eng.lotOf(target) : null;
      if (!lot) return goHome(eng);
      await eng.flyTo(lot.x, lot.z, eng.home().dist, reduce ? 1 : 900);
    },
    [goHome, reduce, stationTarget],
  );

  // ------------------------------------------------------------------ arrival: fly down into the city
  useEffect(() => {
    preloadSounds();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: arrival plays once, when the engine is ready
  useEffect(() => {
    if (!engine || started.current) return;
    started.current = true;
    void (async () => {
      const home = engine.home();
      if (reduce) engine.setCamera(home);
      else {
        engine.setCamera({ ...home, dist: 124 });
        await engine.flyTo(home.x, home.z, home.dist, 1500);
      }
      if (changes.length > 0) {
        await celebrate(changes, engine);
        await goHome(engine);
      }
      if (session.status === "COMPLETED") {
        setMode("done");
        void say(`${info.name} hôm nay xong rồi! Con giỏi quá, ${nickname}!`, "cheer");
        return;
      }
      setMode("idle");
      if (open[0]) void showNext(engine, open[0]);
      if (open.length === 0 && homeworkLeft.length === 0) {
        void say(`Chào ${nickname}! Thành phố đang chuẩn bị nhiệm vụ cho con.`, "greet");
      } else if (open.length === 0) {
        void say(`Chào ${nickname}! Có thư của cô ở toà thị chính.`, "greet");
      } else {
        // a Xưởng Tiếng station wears a cog, not a star (pha 12) — say what the child will see
        const workshop = open[0]?.orders.some((o) => itemByOrder.get(o)?.syllable);
        void say(
          `Chào ${nickname}! Tối nay ${info.name} có ${open.length} ngôi sao. ` +
            (workshop ? "Chạm vào bánh răng để vào Xưởng Tiếng nhé!" : "Chạm vào ngôi sao nhé!"),
          "greet",
        );
      }
    })();
  }, [engine]);

  // ------------------------------------------------------------------ a station: fly, panel up, play
  const openPanel = useCallback(
    async (station: CityStation, orders: number[]) => {
      if (!engine || mode !== "idle") return;
      const queue = orders.filter((o) => !played.has(o) && itemByOrder.has(o));
      if (queue.length === 0) return;
      setMode("busy");
      setCard(null);
      playSound("cham");
      const target = stationTarget(station);
      if (target) await engine.focus(target, reduce ? 1 : 600);
      setPanel({ station, queue, at: 0 });
      setMode("panel");
    },
    [engine, itemByOrder, mode, played, reduce, stationTarget],
  );

  const openStation = useCallback(
    (station: CityStation) => openPanel(station, station.orders),
    [openPanel],
  );
  const openHomework = useCallback(
    () => openPanel({ index: -1, skillCode: "", orders: homeworkLeft, done: false }, homeworkLeft),
    [homeworkLeft, openPanel],
  );

  const finale = useCallback(async () => {
    if (!engine) return;
    setMode("finale");
    finishedRef.current = true;
    const before = viewRef.current.land.owned;
    let summary: SessionSummary | null = null;
    try {
      const res = await post(`/api/sessions/${session.id}/finish`, {});
      if (res.ok) summary = (await res.json()) as SessionSummary;
    } catch {
      /* the stars are safe on the server; the loop still plays */
    }
    const badges = summary?.rewards?.badges ?? [];
    if (badges.length > 0) {
      void post("/api/kid/badges", { studentId, codes: badges.map((b) => b.code) }).catch(() => {});
    }
    setMascotState("celebrate");
    const earned = summary?.starsEarned ?? 0;
    const text = `Xong hết các ngôi sao của ${info.name}! Tối nay con được ${earned} ngôi sao!`;
    setLine(text);
    playSound("xong-phien");
    void fireConfetti(2);
    const fresh = readCity(studentId, city);
    // the loop over the city, while the stars count up into the pocket
    const counting = (async () => {
      const target = (await fresh)?.hud.starsEarned ?? pocket;
      for (let p = pocket; p < target; p++) {
        setPocket(p + 1);
        playSound("sao");
        await wait(Math.max(60, 1600 / Math.max(1, target - pocket)));
      }
    })();
    await Promise.all([engine.tour(reduce ? 1 : 6500), speak(text), counting]);

    const state = await fresh;
    if (state) {
      setHud(state.hud);
      setPocket(state.hud.starsEarned);
      setView(state.view);
      await wait(80);
      await celebrate(
        state.changes.filter((c) => c.type !== "plotUnlocked"),
        engine,
      );
      const plot = emptyPlot(state.view);
      if (plot !== null) {
        await engine.focus({ type: "plot", plot }, reduce ? 1 : 900);
        playSound("huy-hieu");
        void fireConfetti(1.5);
        setChooser({ plot, options: state.hud.unlockedBuilds.slice(-BUILD_CHOICES) });
        void say(
          state.view.land.owned > before
            ? "Đủ sao rồi! Mở được một ô đất mới. Con muốn xây gì?"
            : "Ô đất của con vẫn đang chờ. Con muốn xây gì?",
          "cheer",
        );
        return;
      }
    }
    await goHome(engine);
    setMode("done");
    void say("Con muốn về bản đồ hay chơi thêm?", "cheer");
  }, [
    celebrate,
    city,
    engine,
    goHome,
    info.name,
    pocket,
    reduce,
    say,
    session.id,
    speak,
    studentId,
  ]);

  const finishStation = useCallback(
    async (station: CityStation, playedNow: Set<number>) => {
      if (!engine) return;
      setPanel(null);
      setMode("busy");
      await wait(reduce ? 50 : 450);
      const target = stationTarget(station);
      const before =
        target?.type === "skill"
          ? viewRef.current.skills.find((s) => s.skillId === target.skillId)
          : undefined;
      const fresh = await readCity(studentId, city);
      let nextPlan = markDone(plan, station);
      if (fresh) {
        // growth only: the building the child just worked on never looks smaller than before
        const merged: CityView = {
          ...fresh.view,
          skills: fresh.view.skills.map((s) =>
            before &&
            s.skillId === before.skillId &&
            sizeOf(s.level, s.step) < sizeOf(before.level, before.step)
              ? { ...s, level: before.level, step: before.step }
              : s,
          ),
        };
        if (fresh.session?.id === session.id) nextPlan = fresh.session.stations;
        setHud(fresh.hud);
        setPocket(fresh.hud.starsEarned);
        if (target) engine.hold(target);
        setView(merged);
        await wait(80);
      }
      setPlan(nextPlan);
      const builtName =
        (before ? nameBySkillId.get(before.skillId) : undefined) ?? before?.label ?? "";
      const text =
        station.index < 0
          ? "Con làm xong bài cô giao rồi! Cả phố sáng đèn!"
          : `Toà nhà ${builtName} lớn thêm rồi!`;
      setMascotState("celebrate");
      setLine(text);
      playSound("sao");
      void fireConfetti(1);
      await Promise.all([target ? engine.rise(target, 2000) : wait(1200), speak(text)]);
      await showNext(engine, nextPlan.stations.find((s) => !s.done) ?? null);

      const starsLeft = nextPlan.stations.filter((s) => !s.done).length;
      const lettersLeft = nextPlan.homework.filter(
        (o) => !playedNow.has(o) && !itemByOrder.get(o)?.homework?.done,
      ).length;
      if (starsLeft === 0 && lettersLeft === 0) {
        await finale();
        return;
      }
      setMode("idle");
      void say(
        starsLeft > 0
          ? `Còn ${starsLeft} ngôi sao nữa. Ngôi sao đang nhấp nháy đó!`
          : "Còn thư của cô ở toà thị chính!",
        "cheer",
      );
    },
    [
      city,
      engine,
      finale,
      showNext,
      itemByOrder,
      nameBySkillId,
      plan,
      reduce,
      say,
      session.id,
      speak,
      stationTarget,
      studentId,
    ],
  );

  const onExerciseDone = useCallback(() => {
    if (!panel) return;
    const order = panel.queue[panel.at] as number;
    // the feedback overlay can report the same exercise twice (a tap and its own timer)
    if (handled.current.has(order)) return;
    handled.current.add(order);
    const playedNow = new Set(played).add(order);
    setPlayed(playedNow);
    if (panel.at + 1 < panel.queue.length) {
      setPanel({ ...panel, at: panel.at + 1 });
      return;
    }
    void finishStation(panel.station, playedNow);
  }, [finishStation, panel, played]);

  // ------------------------------------------------------------------ taps
  const onTap = useCallback(
    (t: TapTarget) => {
      if (mode !== "idle" && mode !== "done") return;
      if (t.type === "skill") {
        const station = open.find((s) => idBySkillCode.get(s.skillCode) === t.skillId);
        if (station && mode === "idle") return void openStation(station);
        const s = view.skills.find((x) => x.skillId === t.skillId);
        if (!s) return;
        const name = nameBySkillId.get(s.skillId) ?? s.label;
        const sub = `Toà nhà ${s.label} ${LEVEL_WORDS[s.level]}`;
        playSound("cham");
        setCard({ title: name, sub });
        return void speak(`${name}. ${sub}.`);
      }
      if (t.type === "townHall" && homeworkLeft.length > 0 && mode === "idle") {
        return void openHomework();
      }
      playSound("cham");
      let title: string;
      let sub = "";
      if (t.type === "townHall") {
        title = "Toà thị chính";
        sub = "Khi cô giao bài, thư sẽ đến đây";
      } else if (t.type === "wonder") {
        title = `Kỳ quan ${info.wonder}`;
        sub = `${hud.wonder.pieces} trên ${hud.wonder.total} mảnh`;
      } else if (t.type === "public") {
        title = PUBLIC_BUILDING_NAMES[t.code] ?? "Công trình";
        sub = "Nhờ huy hiệu của con";
      } else if (t.plot < view.land.owned) {
        const built = view.land.builds.find((b) => b.plot === t.plot)?.build;
        if (!built) {
          setMode("busy");
          setChooser({ plot: t.plot, options: hud.unlockedBuilds.slice(-BUILD_CHOICES) });
          return void speak("Ô đất của con. Con muốn xây gì?");
        }
        title = PLOT_BUILD_NAMES[built]?.nameVi ?? "Ô đất của con";
      } else {
        title = "Ô đất chờ mở";
        sub = `Còn ${Math.max(1, hud.land.nextCost - hud.land.progress)} ngôi sao nữa`;
      }
      setCard({ title, sub });
      void speak(sub ? `${title}. ${sub}.` : title);
    },
    [
      homeworkLeft.length,
      hud,
      idBySkillCode,
      info.wonder,
      mode,
      nameBySkillId,
      open,
      openHomework,
      openStation,
      speak,
      view,
    ],
  );

  // ------------------------------------------------------------------ building on a new plot
  const build = useCallback(
    async (plot: number, code: string) => {
      if (!engine) return;
      setChooser(null);
      try {
        const res = await post("/api/kid/city/plot", { studentId, city, plot, build: code });
        if (res.ok) {
          const state = (await res.json()) as { view: CityView; hud: CityHud };
          const target: TapTarget = { type: "plot", plot };
          engine.hold(target);
          setView(state.view);
          setHud(state.hud);
          await wait(80);
          const text = `Xây xong ${PLOT_BUILD_NAMES[code]?.nameVi ?? "công trình"} rồi! Đẹp quá!`;
          setMascotState("celebrate");
          setLine(text);
          playSound("sao");
          void fireConfetti(1.5);
          await Promise.all([engine.rise(target, 2200), speak(text)]);
        }
      } catch {
        /* the plot stays open; the child can choose next time */
      }
      await goHome(engine);
      void post("/api/kid/city/seen", { studentId, city }).catch(() => {});
      if (finishedRef.current) {
        setMode("done");
        void say("Con muốn về bản đồ hay chơi thêm?", "cheer");
      } else {
        setMode("idle");
      }
    },
    [city, engine, goHome, say, speak, studentId],
  );

  // back to the map, leaving a small picture of this city for its island
  const toMap = useCallback(async () => {
    playSound("cham");
    if (engine) {
      engine.setCamera(engine.home());
      await saveSnapshot(engine.snapshot(0.85), snapshotKey(studentId, city));
    }
    router.push("/kid/city");
  }, [city, engine, router, studentId]);

  const playAgain = useCallback(async () => {
    setMode("busy");
    try {
      await post("/api/kid/city/again", { studentId, city });
    } finally {
      window.location.reload();
    }
  }, [city, studentId]);

  // ------------------------------------------------------------------ stars on roofs: the only buttons in the city
  const overlays = useMemo<CityOverlayItem[]>(() => {
    if (mode !== "idle") return [];
    const out: CityOverlayItem[] = [];
    const seen = new Set<string>();
    for (const station of open) {
      const skillId = idBySkillCode.get(station.skillCode);
      if (!skillId || seen.has(skillId)) continue;
      seen.add(skillId);
      const isNext = station === next;
      // tonight's Xưởng Tiếng station wears a cog instead of a star (pha 12)
      const workshop = station.orders.some((o) => itemByOrder.get(o)?.syllable);
      out.push({
        anchor: `skill:${skillId}`,
        key: `star:${skillId}`,
        node: (
          <StarBubble
            label={
              workshop
                ? `Xưởng Tiếng ở toà nhà ${nameBySkillId.get(skillId) ?? ""}`
                : `Ngôi sao ở toà nhà ${nameBySkillId.get(skillId) ?? ""}`
            }
            pulse={isNext && !reduce}
            big={isNext}
            onTap={() => void openStation(station)}
          >
            {workshop ? "⚙️" : "⭐"}
          </StarBubble>
        ),
      });
    }
    if (homeworkLeft.length > 0) {
      out.push({
        anchor: "townHall:order",
        key: "scroll",
        node: (
          <StarBubble
            label="Thư của cô giáo ở toà thị chính"
            pulse={!next && !reduce}
            big={!next}
            onTap={() => void openHomework()}
          >
            📜
          </StarBubble>
        ),
      });
    }
    return out;
  }, [
    homeworkLeft.length,
    idBySkillCode,
    itemByOrder,
    mode,
    nameBySkillId,
    next,
    open,
    openHomework,
    openStation,
    reduce,
  ]);

  const item = panel ? itemByOrder.get(panel.queue[panel.at] as number) : undefined;
  const stationTotal = plan.stations.length;
  const stationsDone = stationTotal - open.length;
  const landShare = hud.land.nextCost > 0 ? Math.min(1, hud.land.progress / hud.land.nextCost) : 0;

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-[#d2f3ff]"
      data-testid="city-screen"
      data-city={city}
      data-mode={mode}
    >
      <CityCanvas
        view={view}
        overlays={overlays}
        onReady={setEngine}
        onTap={onTap}
        dayAnchorMs={dayAnchorMs}
      />

      {/* HUD */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3">
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => void toMap()}
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/95 text-[40px] shadow"
            aria-label="Về bản đồ"
            data-testid="city-back"
          >
            🌍
          </motion.button>
          <button
            type="button"
            onClick={() =>
              void speak(
                `Ô đất mới: con có ${hud.land.progress} trên ${hud.land.nextCost} ngôi sao.`,
              )
            }
            className="flex min-h-[64px] w-[210px] flex-col justify-center gap-1 rounded-[22px] bg-white/90 px-4 py-2 text-left shadow"
            data-testid="land-bar"
          >
            <span className="font-extrabold text-[22px] text-[#1f3b63]">
              🏡 {hud.land.progress}/{hud.land.nextCost} ⭐
            </span>
            <span className="h-3 w-full overflow-hidden rounded-full bg-[#e7eef7]">
              <motion.span
                className="block h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${info.b}, ${info.a})` }}
                animate={{ width: `${Math.round(landShare * 100)}%` }}
                transition={{ type: "spring", stiffness: 90, damping: 18 }}
              />
            </span>
          </button>
          {/* Xưởng Tiếng (pha 12): the syllables this child keeps, and the bricks towards a house */}
          {city === "viet" && view.workshop ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                playSound("cham");
                void speak("Sổ tiếng của con");
                router.push("/kid/so-tieng?from=city");
              }}
              className="flex min-h-[64px] w-[210px] items-center gap-2 rounded-[22px] bg-white/90 px-4 py-2 text-left shadow"
              aria-label="Mở sổ tiếng"
              data-testid="syllable-book-open"
              data-houses={view.workshop.houses}
              data-bricks={view.workshop.bricks}
            >
              <span className="text-[34px]" aria-hidden>
                📒
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-extrabold text-[22px] text-[#1f3b63]">Sổ tiếng</span>
                <BrickRow laid={view.workshop.bricks} size={9} />
              </span>
            </motion.button>
          ) : null}
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void speak(`${info.name}, thành phố ${info.subject}`)}
            className="min-h-[64px] rounded-full border-[5px] bg-white/95 px-6 font-black text-[28px] text-[#1f3b63] shadow"
            style={{ borderColor: info.a }}
            data-testid="city-name"
          >
            {info.emoji} {info.name}
          </button>
          {stationTotal > 0 ? (
            <button
              type="button"
              onClick={() =>
                void speak(
                  open.length > 0
                    ? `Còn ${open.length} ngôi sao nữa.`
                    : "Xong hết các ngôi sao rồi!",
                )
              }
              className="flex min-h-[56px] items-center gap-1 rounded-full bg-white/85 px-4 text-[30px] shadow"
              aria-label={`Đã xong ${stationsDone} trên ${stationTotal} ngôi sao`}
              data-testid="station-progress"
              data-done={stationsDone}
              data-total={stationTotal}
            >
              {plan.stations.map((s) => (
                <span key={s.index} className={s.done ? "" : "opacity-30 grayscale"}>
                  ⭐
                </span>
              ))}
            </button>
          ) : null}
        </div>

        <div className="pointer-events-auto">
          <StarPocket count={pocket} />
        </div>
      </header>

      {/* what a tapped building is — shown and read aloud */}
      <AnimatePresence>
        {card && mode !== "panel" ? (
          <motion.button
            type="button"
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setCard(null)}
            className="fixed top-[150px] left-1/2 z-20 w-[min(92vw,26rem)] -translate-x-1/2 rounded-[24px] bg-white/95 px-5 py-3 text-center shadow-lg"
            data-testid="building-card"
          >
            <p className="font-black text-[24px] text-[#1f3b63] leading-tight">{card.title}</p>
            {card.sub ? (
              <p className="mt-1 font-bold text-[22px] text-[#4a6a92]">{card.sub}</p>
            ) : null}
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* mascot */}
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end gap-2 p-3">
        <Mascot name={mascot} state={mascotState} size={120} speaking={speakState === "speaking"} />
        <AnimatePresence>
          {/* a sheet over the city (exercises, choosing a build) hides the bubble: its words are never cut */}
          {line && !panel && !chooser ? (
            <motion.p
              key={line}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 max-w-[24rem] rounded-[24px] bg-white/95 px-5 py-3 font-extrabold text-[22px] text-[#2B2B3A] leading-snug shadow"
              data-testid="city-line"
            >
              {line}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </footer>

      {/* after the session: back to the map, or play more */}
      <AnimatePresence>
        {mode === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed right-4 bottom-4 z-30 flex flex-wrap justify-end gap-3"
            data-testid="city-done"
          >
            <BigButton tone="quiet" onClick={() => void toMap()}>
              🌍 Về bản đồ
            </BigButton>
            <BigButton tone="reward" onClick={() => void playAgain()} data-testid="play-again">
              ⭐ Chơi thêm
            </BigButton>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* the exercise panel: slides up over the city, the city stays in sight behind it */}
      <AnimatePresence>
        {panel && item ? (
          <motion.div
            key="veil"
            className="fixed inset-0 z-30 bg-[#1f3b63]/15"
            style={{ backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        ) : null}
        {panel && item ? (
          <motion.section
            key="panel"
            className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-[76dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-t-[36px] bg-[#FFFBF2] px-4 pt-3 pb-4 shadow-[0_-20px_60px_-20px_rgba(31,59,99,0.45)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
            data-testid="exercise-panel"
          >
            <div className="mx-auto mb-2 h-2 w-16 shrink-0 rounded-full bg-[#e3d9c4]" />
            <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
              <span className="rounded-full bg-white px-4 py-2 font-extrabold text-[22px] text-[#1f3b63] shadow-sm">
                {panel.station.index < 0 ? "📜 Bài cô giao" : `⭐ ${info.name}`} · {panel.at + 1}/
                {panel.queue.length}
              </span>
              <div className="flex gap-1" aria-hidden>
                {panel.queue.map((o, i) => (
                  <span
                    key={o}
                    className="h-4 w-10 rounded-full"
                    style={{
                      background: i < panel.at ? info.a : i === panel.at ? info.b : "#e7e0d0",
                    }}
                  />
                ))}
              </div>
            </div>
            <ExercisePlay
              key={item.order}
              session={session}
              item={item}
              onStars={() => setPocket((p) => p + 1)}
              onFinished={onExerciseDone}
            />
          </motion.section>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {chooser ? (
          <BuildChooser
            key="chooser"
            plot={chooser.plot}
            options={chooser.options}
            onSpeak={(t) => void speak(t)}
            onBuild={(code) => void build(chooser.plot, code)}
            onLater={() => {
              setChooser(null);
              setMode(finishedRef.current ? "done" : "idle");
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Shrink the frame to an island-sized JPEG and keep it; never blocks leaving for long. */
function saveSnapshot(dataUrl: string, key: string): Promise<void> {
  return new Promise((resolve) => {
    const done = () => resolve();
    const timer = window.setTimeout(done, 400);
    const img = new Image();
    img.onload = () => {
      try {
        const w = 480;
        const h = 360;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const scale = Math.max(w / img.width, h / img.height);
        const sw = w / scale;
        const sh = h / scale;
        c.getContext("2d")?.drawImage(
          img,
          (img.width - sw) / 2,
          (img.height - sh) / 2,
          sw,
          sh,
          0,
          0,
          w,
          h,
        );
        localStorage.setItem(key, c.toDataURL("image/jpeg", 0.72));
      } catch {
        /* storage full or private mode: the island keeps its drawn picture */
      }
      window.clearTimeout(timer);
      done();
    };
    img.onerror = done;
    img.src = dataUrl;
  });
}

async function readCity(studentId: string, city: CitySubject) {
  try {
    const res = await fetch(
      `/api/kid/city?studentId=${encodeURIComponent(studentId)}&city=${city}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as {
      view: CityView;
      hud: CityHud;
      changes: CityChange[];
      session: { id: string; status: string; stations: StationPlan } | null;
    };
  } catch {
    return null;
  }
}

/** The first open plot with nothing built on it yet. */
function emptyPlot(view: CityView): number | null {
  const built = new Set(view.land.builds.map((b) => b.plot));
  for (let p = 0; p < view.land.owned; p++) if (!built.has(p)) return p;
  return null;
}

function markDone(plan: StationPlan, station: CityStation): StationPlan {
  if (station.index < 0) return { ...plan, homework: [] };
  return {
    ...plan,
    stations: plan.stations.map((s) => (s.index === station.index ? { ...s, done: true } : s)),
  };
}

function targetOf(change: CityChange): TapTarget | null {
  switch (change.type) {
    case "newBuilding":
    case "levelUp":
      return { type: "skill", skillId: change.skillId };
    case "plotUnlocked":
      return { type: "plot", plot: change.plot };
    case "publicBuilt":
      return { type: "public", code: change.code };
    case "wonderPiece":
      return { type: "wonder" };
    default:
      return null;
  }
}

function celebrationLine(change: CityChange, view: CityView, wonder: string): string {
  const label = (id: string) => view.skills.find((s) => s.skillId === id)?.label ?? "";
  switch (change.type) {
    case "newBuilding":
      return `Có toà nhà ${label(change.skillId)} mới trong thành phố!`;
    case "levelUp":
      return change.to === 4
        ? `Toà nhà ${label(change.skillId)} thành toà nhà chọc trời rồi!`
        : `Toà nhà ${label(change.skillId)} cao thêm rồi!`;
    case "plotUnlocked":
      return "Mở được một ô đất mới!";
    case "publicBuilt":
      return `Thành phố có ${PUBLIC_BUILDING_NAMES[change.code] ?? "công trình"} mới!`;
    case "wonderPiece":
      return change.complete
        ? `Kỳ quan ${wonder} đã hoàn thành! Tuyệt vời!`
        : `Thêm một mảnh kỳ quan ${wonder}! Cả tuần con chăm học quá!`;
    case "decoration":
      return "Có đồ trang trí mới trong phố!";
  }
}

function StarBubble({
  children,
  label,
  onTap,
  pulse,
  big,
}: {
  children: React.ReactNode;
  label: string;
  onTap: () => void;
  pulse: boolean;
  big: boolean;
}) {
  const px = big ? 84 : 68;
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onTap}
      data-testid="station-star"
      data-next={big ? "1" : "0"}
      className="flex items-center justify-center rounded-full border-4 border-white bg-[#FFD447] shadow-[0_8px_18px_-6px_rgba(31,59,99,0.55)]"
      style={{ width: px, height: px, fontSize: big ? 46 : 36 }}
      initial={{ scale: 0 }}
      animate={pulse ? { scale: [1, 1.14, 1], y: [0, -10, 0] } : { scale: 1 }}
      transition={
        pulse
          ? { repeat: Number.POSITIVE_INFINITY, duration: 1.3 }
          : { type: "spring", stiffness: 320, damping: 16 }
      }
      whileTap={{ scale: 0.88 }}
    >
      {children}
    </motion.button>
  );
}

function BuildChooser({
  plot,
  options,
  onSpeak,
  onBuild,
  onLater,
}: {
  plot: number;
  options: string[];
  onSpeak: (text: string) => void;
  onBuild: (code: string) => void;
  /** "Để sau": the plot stays open, nothing is lost. */
  onLater: () => void;
}) {
  const title = "Con muốn xây gì ở ô đất mới?";
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#1f3b63]/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-testid="build-chooser"
      data-plot={plot}
    >
      <motion.div
        className="w-full max-w-4xl rounded-t-[36px] bg-[#FFF8EC] p-5 shadow-2xl"
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        exit={{ y: 400 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <button
          type="button"
          onClick={() => onSpeak(title)}
          className="mb-4 w-full text-center font-black text-[30px] text-[#1f3b63]"
        >
          🔨 {title}
        </button>
        <ul className="grid grid-cols-3 gap-4">
          {options.map((code, i) => {
            const b = PLOT_BUILD_NAMES[code] ?? { nameVi: code, emoji: "🏠" };
            return (
              <li key={code}>
                <motion.button
                  type="button"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: i * 0.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    playSound("cham");
                    onSpeak(b.nameVi);
                    onBuild(code);
                  }}
                  className="flex w-full flex-col items-center gap-2 overflow-hidden rounded-[28px] border-4 border-white bg-white p-2 pb-3 shadow-[0_10px_0_rgba(31,59,99,0.12)]"
                  data-testid={`build-${code}`}
                >
                  {/* biome-ignore lint/performance/noImgElement: pre-rendered by the city engine (shoot:builds) */}
                  <img
                    src={`/art/city/builds/${code}.webp`}
                    alt=""
                    className="aspect-square w-full rounded-[22px] bg-[#e9f7dc] object-cover"
                    data-testid="build-picture"
                  />
                  <span className="text-center font-extrabold text-[24px] text-[#2B2B3A] leading-tight">
                    {b.nameVi}
                  </span>
                </motion.button>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex justify-center">
          <BigButton tone="quiet" onClick={onLater} data-testid="build-later">
            Để sau
          </BigButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
