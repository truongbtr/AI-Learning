/**
 * Which kid UI is live (Pha 10 §1.8): `KID_UI=city` turns on the six subject cities, anything else
 * (default) keeps the illustrated world of pha 3. Read on the server at request time, so switching
 * is an `.env` edit and a restart — no rebuild, and the two children never lose a day.
 */
export type KidUi = "city" | "world";

export function kidUiMode(env: Record<string, string | undefined> = process.env): KidUi {
  return env.KID_UI?.trim().toLowerCase() === "city" ? "city" : "world";
}
