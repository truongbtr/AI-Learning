/**
 * The world changes with the real clock (docs/06 §1.8c "thế giới đổi theo giờ thật"): a child who
 * opens the app before school sees morning light, and after dinner sees evening.
 *
 * Pure, and in its own file so it can be tested without pulling in the animation library.
 */
export type TimeOfDay = "morning" | "day" | "evening" | "night";

export function timeOfDay(date = new Date()): TimeOfDay {
  const h = date.getHours();
  if (h < 9) return "morning";
  if (h < 16) return "day";
  if (h < 19) return "evening";
  return "night";
}

/** A wash laid over the sky layer; the art itself is only ever drawn in daylight. */
export const TIME_TINT: Record<TimeOfDay, string> = {
  morning: "linear-gradient(180deg, rgba(255,214,150,0.30), rgba(255,255,255,0) 55%)",
  day: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0))",
  evening: "linear-gradient(180deg, rgba(255,150,90,0.30), rgba(124,92,255,0.16) 70%)",
  night: "linear-gradient(180deg, rgba(30,40,90,0.46), rgba(30,40,90,0.24) 70%)",
};

/** What the mascot says about the time of day, used on the home screen. */
export const TIME_GREETING: Record<TimeOfDay, string> = {
  morning: "Chào buổi sáng!",
  day: "Chào con!",
  evening: "Chiều rồi, mình học một chút nhé!",
  night: "Tối rồi, học nhẹ thôi nha!",
};
