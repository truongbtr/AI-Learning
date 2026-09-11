/**
 * What is different about *this* week (docs/06 §1.8b item 1, §1.8c items 1–2).
 *
 * A six-year-old does not come back for the same garden twice. Every Monday the world puts on a
 * different coat: a theme, a few decorations, one badge that can only be earned that week, and the
 * picture whose pieces the child collects day by day.
 *
 * Pure and deterministic — the same Monday always gives the same week, so the worker, the screens
 * and the tests never disagree about what week it is.
 */

export interface WeeklyEvent {
  code: string;
  nameVi: string;
  /** One line the mascot says when the child first opens the app that week. */
  lineVi: string;
  /** Objects from content/art/objects to scatter over the world background. */
  decor: string[];
  emoji: string;
  /** Only obtainable during this week (docs/06 §1.8b item 1). */
  badgeCode: string;
}

/** The Monday of the week `date` falls in, at midnight local time. */
export function weekStartOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const shift = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - shift);
  return d;
}

/** Whole weeks since a fixed Monday — the index every rotation below is built on. */
export function weekIndex(date: Date): number {
  const epoch = Date.UTC(2026, 8, 7); // Monday 07/09/2026, the first week of the school year
  const monday = weekStartOf(date);
  const days = Math.round(
    (Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()) - epoch) / 86_400_000,
  );
  return Math.floor(days / 7);
}

export const WEEKLY_EVENTS: readonly WeeklyEvent[] = [
  {
    code: "DINO",
    nameVi: "Tuần khủng long",
    lineVi: "Tuần này thế giới mình có khủng long ghé chơi đó!",
    decor: ["cay-nam", "chiec-la", "qua-trung"],
    emoji: "🦕",
    badgeCode: "EVENT_DINO",
  },
  {
    code: "SPACE",
    nameVi: "Tuần vũ trụ",
    lineVi: "Tuần này mình bay lên trời ngắm sao nhé!",
    decor: ["ten-lua", "ngoi-sao", "mat-trang"],
    emoji: "🚀",
    badgeCode: "EVENT_SPACE",
  },
  {
    code: "MOON",
    nameVi: "Tuần Trung thu",
    lineVi: "Tuần này có đèn lồng và bánh nướng, vui lắm!",
    decor: ["cai-den", "mat-trang", "cai-trong"],
    emoji: "🏮",
    badgeCode: "EVENT_MOON",
  },
  {
    code: "OCEAN",
    nameVi: "Tuần đại dương",
    lineVi: "Tuần này mình lặn xuống biển thăm cá nhé!",
    decor: ["con-ca", "qua-bong", "dam-may"],
    emoji: "🐠",
    badgeCode: "EVENT_OCEAN",
  },
  {
    code: "JUNGLE",
    nameVi: "Tuần rừng xanh",
    lineVi: "Tuần này rừng có khỉ, có voi, có bướm nữa!",
    decor: ["con-khi", "con-voi", "con-buom"],
    emoji: "🌴",
    badgeCode: "EVENT_JUNGLE",
  },
  {
    code: "SNOW",
    nameVi: "Tuần mùa đông",
    lineVi: "Tuần này trời lạnh, mình mặc áo ấm rồi học nhé!",
    decor: ["cai-ao", "cai-mu", "ly-sua"],
    emoji: "❄️",
    badgeCode: "EVENT_SNOW",
  },
] as const;

export function weeklyEvent(date: Date): WeeklyEvent {
  return WEEKLY_EVENTS[weekIndex(date) % WEEKLY_EVENTS.length] as WeeklyEvent;
}

/** The picture the week's pieces build up to (docs/06 §1.8c item 2). Six pieces, one a day. */
export const PICTURE_THEMES: readonly { theme: string; nameVi: string; imageKey: string }[] = [
  { theme: "vuon-hoa", nameVi: "Vườn hoa mùa xuân", imageKey: "art/pictures/vuon-hoa.svg" },
  {
    theme: "thanh-pho",
    nameVi: "Thành phố robot buổi tối",
    imageKey: "art/pictures/thanh-pho.svg",
  },
  { theme: "bien-xanh", nameVi: "Biển xanh và đàn cá", imageKey: "art/pictures/bien-xanh.svg" },
  { theme: "rung-cay", nameVi: "Rừng cây và bạn bè", imageKey: "art/pictures/rung-cay.svg" },
  { theme: "bau-troi", nameVi: "Bầu trời đầy sao", imageKey: "art/pictures/bau-troi.svg" },
  { theme: "ngay-hoi", nameVi: "Ngày hội đèn lồng", imageKey: "art/pictures/ngay-hoi.svg" },
] as const;

export const PICTURE_PIECES = 6;

export function pictureForWeek(date: Date): { theme: string; nameVi: string; imageKey: string } {
  return PICTURE_THEMES[weekIndex(date) % PICTURE_THEMES.length] as (typeof PICTURE_THEMES)[number];
}

/** Cracks in this week's egg: five days of learning hatch it (docs/06 §1.8c item 1). */
export const EGG_CRACKS_TO_HATCH = 5;
