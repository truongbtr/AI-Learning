import type { Prisma, PrismaClient } from "../../generated/client";

/**
 * How many characters the cloud voice has cost this month (docs/08 pha 8, tiêu chí 5).
 *
 * The owner dropped the "AI ≤ 6 USD/month" target when ADR-9 and ADR-10 removed every LLM call
 * from the running system. What is left is the one paid service the app still touches: Azure
 * Speech, on the free F0 tier, which gives 500,000 neural characters a month. Overshoot it and the
 * bill is real, so the number has to be visible somewhere rather than discovered on a statement.
 *
 * Counted at the only place a character is actually billed: a synthesis that came back from the
 * provider rather than from the mp3 cache. Most evenings that is zero — `pnpm content:import`
 * generates the bank's audio once, and a child's session then plays files.
 *
 * Stored in `Setting["tts.usage"]` as `{ "2026-09": { chars, calls, provider } }`. Twelve months
 * are kept, which is one row and no migration; a usage table for a two-child household would be a
 * table nobody ever reads.
 */

export const TTS_USAGE_KEY = "tts.usage";
/** Azure F0: 500,000 neural characters per month, free. Above this the tier starts charging. */
export const AZURE_F0_MONTHLY_CHARS = 500_000;
/** Warn at 80% — enough runway to finish a content batch before the month turns over. */
export const TTS_WARN_FRACTION = 0.8;
const KEEP_MONTHS = 12;

export interface TtsMonth {
  chars: number;
  calls: number;
  provider: string;
}
export type TtsUsage = Record<string, TtsMonth>;

/** `YYYY-MM` in Vietnam time — a bill runs on the family's calendar, not on UTC's. */
export function usageMonth(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).format(at);
}

export async function readTtsUsage(db: PrismaClient): Promise<TtsUsage> {
  const row = await db.setting.findUnique({ where: { key: TTS_USAGE_KEY } });
  return (row?.value as TtsUsage | null) ?? {};
}

/**
 * Adds one provider call. Never throws: a counter that can break a child's "Nghe" button is worse
 * than a counter that misses a few characters.
 */
export async function recordTtsUsage(
  db: PrismaClient,
  chars: number,
  provider: string,
  at: Date = new Date(),
): Promise<void> {
  if (chars <= 0) return;
  try {
    const month = usageMonth(at);
    const usage = await readTtsUsage(db);
    const current = usage[month] ?? { chars: 0, calls: 0, provider };
    usage[month] = {
      chars: current.chars + chars,
      calls: current.calls + 1,
      provider,
    };
    for (const key of Object.keys(usage).sort().slice(0, -KEEP_MONTHS)) delete usage[key];
    const value = usage as unknown as Prisma.InputJsonValue;
    await db.setting.upsert({
      where: { key: TTS_USAGE_KEY },
      create: { key: TTS_USAGE_KEY, value },
      update: { value },
    });
  } catch (err) {
    console.error("[tts] không ghi được số ký tự đã dùng", err);
  }
}

export interface TtsUsageSummary {
  month: string;
  chars: number;
  calls: number;
  provider: string;
  limit: number;
  fraction: number;
  /** ok | warn (past 80%) | over (past the free tier — this now costs money) */
  level: "ok" | "warn" | "over";
  months: { month: string; chars: number; calls: number }[];
}

export function summariseTtsUsage(usage: TtsUsage, at: Date = new Date()): TtsUsageSummary {
  const month = usageMonth(at);
  const current = usage[month] ?? { chars: 0, calls: 0, provider: "—" };
  const fraction = current.chars / AZURE_F0_MONTHLY_CHARS;
  return {
    month,
    chars: current.chars,
    calls: current.calls,
    provider: current.provider,
    limit: AZURE_F0_MONTHLY_CHARS,
    fraction,
    level: fraction >= 1 ? "over" : fraction >= TTS_WARN_FRACTION ? "warn" : "ok",
    months: Object.entries(usage)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([m, v]) => ({ month: m, chars: v.chars, calls: v.calls })),
  };
}
