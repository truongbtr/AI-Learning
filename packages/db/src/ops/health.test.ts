import { describe, expect, it } from "vitest";
import { type HealthReport, healthAdvice } from "./health";

/**
 * docs/08 pha 8, tiêu chí 6: **"`docs/VAN-HANH.md` đủ để chủ dự án tự xử lý khi web không vào
 * được, không cần gọi developer."**
 *
 * The screen's half of that promise is this list. The bar is not "says what is wrong" — a red
 * light that says "worker down" and nothing else sends somebody to a chat window. Every entry has
 * to carry the command to type, so the test is: for each failure, is there a runnable line in it.
 */

const healthy: HealthReport = {
  status: "ok",
  time: "2026-09-12T12:00:00.000Z",
  host: "eduserver",
  db: { ok: true, migrations: 5, sizeMb: 20 },
  worker: { ok: true, lastPing: "2026-09-12T11:59:30.000Z", ageSeconds: 30 },
  jobs: { ok: true, failed24h: 0, byQueue: [], stuckActive: 0 },
  disk: { ok: true, path: "/data/files", freeGb: 180, totalGb: 447, warnBelowGb: 10 },
  backup: {
    ok: true,
    dir: "E:/SAO-LUU-MTCT",
    latest: "mtct-2026-09-12-0100.dump",
    ageHours: 11,
    sizeMb: 0.6,
    count: 12,
  },
  tts: {
    month: "2026-09",
    chars: 71,
    calls: 1,
    provider: "azure",
    limit: 500_000,
    fraction: 0.0001,
    level: "ok",
    months: [],
    ok: true,
  },
  queueWaiting: { toRead: 0, toReview: 0 },
};

/** A command a person can actually paste into PowerShell. */
const RUNNABLE = /docker compose|docker system|pnpm |Get-ChildItem|TTS_PROVIDER=/;

describe("what the health page tells the owner to do (docs/08 pha 8, tiêu chí 6)", () => {
  it("says nothing at all when nothing is wrong", () => {
    expect(healthAdvice(healthy)).toEqual([]);
  });

  it("every failure comes with a command, never just a diagnosis", () => {
    const broken: HealthReport = {
      ...healthy,
      db: { ...healthy.db, ok: false },
      worker: { ...healthy.worker, ok: false },
      jobs: {
        ok: false,
        failed24h: 3,
        byQueue: [{ queue: "intake.preprocess", failed: 3, lastFailedAt: null }],
        stuckActive: 1,
      },
      disk: { ...healthy.disk, ok: false, freeGb: 4 },
      backup: { ...healthy.backup, ok: false, ageHours: 90 },
      tts: { ...healthy.tts, level: "over", chars: 510_000, ok: false },
    };
    const advice = healthAdvice(broken);
    expect(advice).toHaveLength(7);
    for (const item of advice) {
      expect(item.title, "mỗi mục phải có tiêu đề").toBeTruthy();
      expect(item.what, `"${item.title}" thiếu dòng lệnh`).toMatch(RUNNABLE);
    }
  });

  it("puts the two that stop tonight's session first, and marks them red", () => {
    const advice = healthAdvice({
      ...healthy,
      db: { ...healthy.db, ok: false },
      worker: { ...healthy.worker, ok: false },
      backup: { ...healthy.backup, ok: false },
    });
    expect(advice.slice(0, 2).map((a) => a.level)).toEqual(["error", "error"]);
    expect(advice[0]?.title).toContain("cơ sở dữ liệu");
    expect(advice[1]?.title).toContain("Worker");
    expect(advice[2]?.level).toBe("warn");
  });

  it("names the queue that failed, so the owner is not told to read every log", () => {
    const advice = healthAdvice({
      ...healthy,
      jobs: {
        ok: false,
        failed24h: 2,
        byQueue: [{ queue: "planner.daily", failed: 2, lastFailedAt: null }],
        stuckActive: 0,
      },
    });
    expect(advice[0]?.what).toContain("planner.daily");
  });

  it("says what a worker being down costs tonight, not just that it is down", () => {
    const advice = healthAdvice({ ...healthy, worker: { ...healthy.worker, ok: false } });
    expect(advice[0]?.what).toContain("4 giờ sáng");
  });

  it("warns before the free voice tier is gone, not after the bill", () => {
    const warned = healthAdvice({
      ...healthy,
      tts: { ...healthy.tts, level: "warn", chars: 410_000 },
    });
    expect(warned).toHaveLength(1);
    expect(warned[0]?.what).toMatch(/content:import|webspeech/);
  });

  it("tells the owner how to take a backup when there is none", () => {
    const advice = healthAdvice({
      ...healthy,
      backup: { ok: false, dir: null, latest: null, ageHours: null, sizeMb: null, count: 0 },
    });
    expect(advice[0]?.title).toContain("Chưa có bản sao lưu");
    expect(advice[0]?.what).toContain("backup.sh");
  });
});
