/**
 * Which kid UI is live (Pha 10 §1.8): `KID_UI=city` turns on the six subject cities, anything else
 * (default) keeps the illustrated world of pha 3. Read on the server at request time, so switching
 * is an `.env` edit and a restart — no rebuild, and the two children never lose a day.
 *
 * Pha 10b: one device can try the cities on the real domain without changing anyone else's —
 * the `mtct_ui` cookie (set by an ADMIN from /admin/health) wins over `KID_UI`.
 */
export type KidUi = "city" | "world";

/** Per-device override, written only by the ADMIN button on /admin/health. */
export const UI_COOKIE = "mtct_ui";
export const UI_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const parse = (value: string | null | undefined): KidUi | null => {
  const v = value?.trim().toLowerCase();
  return v === "city" || v === "world" ? v : null;
};

export function kidUiMode(
  env: Record<string, string | undefined> = process.env,
  cookie?: string | null,
): KidUi {
  return parse(cookie) ?? (parse(env.KID_UI) === "city" ? "city" : "world");
}
