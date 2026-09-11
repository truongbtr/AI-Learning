/** Placeholder avatars until phase 3 art (content/art). Keys are stored in User.avatarKey. */
export const AVATARS: ReadonlyArray<{ key: string; emoji: string; labelVi: string }> = [
  { key: "girl-1", emoji: "👧", labelVi: "Bé gái" },
  { key: "boy-1", emoji: "🧒", labelVi: "Bé trai" },
  { key: "girl-2", emoji: "👩‍🦱", labelVi: "Bé gái tóc xoăn" },
  { key: "boy-2", emoji: "👦", labelVi: "Bé trai 2" },
  { key: "unicorn", emoji: "🦄", labelVi: "Kỳ lân" },
  { key: "dino", emoji: "🦖", labelVi: "Khủng long" },
  { key: "panda", emoji: "🐼", labelVi: "Gấu trúc" },
  { key: "fox", emoji: "🦊", labelVi: "Cáo" },
  { key: "dad", emoji: "👨", labelVi: "Ba" },
  { key: "mom", emoji: "👩", labelVi: "Mẹ" },
  { key: "admin", emoji: "🛠️", labelVi: "Quản trị" },
];

export function avatarEmoji(key: string | null | undefined): string {
  return AVATARS.find((a) => a.key === key)?.emoji ?? "🙂";
}

/**
 * The drawn avatars of phase 3 (`content/art/avatars`). The emoji list above still names the
 * accounts made before there was any art, so every old key maps onto a drawn face.
 */
export const DRAWN_AVATARS: ReadonlyArray<{ key: string; labelVi: string }> = [
  { key: "avatar-01", labelVi: "Bạn tóc nơ" },
  { key: "avatar-02", labelVi: "Bạn tóc ngắn" },
  { key: "avatar-03", labelVi: "Bạn buộc tóc" },
  { key: "avatar-04", labelVi: "Bạn mũ lưỡi trai" },
  { key: "avatar-05", labelVi: "Bạn kính tròn" },
  { key: "avatar-06", labelVi: "Bạn tóc xoăn" },
  { key: "avatar-07", labelVi: "Bạn mũ len" },
  { key: "avatar-08", labelVi: "Bạn tóc dài" },
];

const LEGACY_TO_DRAWN: Record<string, string> = {
  "girl-1": "avatar-01",
  "boy-1": "avatar-02",
  "girl-2": "avatar-06",
  "boy-2": "avatar-04",
  unicorn: "avatar-03",
  dino: "avatar-07",
  panda: "avatar-05",
  fox: "avatar-08",
};

/** Path to the drawn avatar for any stored key — never null, so no card is ever empty. */
export function avatarArt(key: string | null | undefined): string {
  const drawn =
    key && /^avatar-0[1-8]$/.test(key) ? key : LEGACY_TO_DRAWN[key ?? ""] || "avatar-01";
  return `/art/avatars/${drawn}.svg`;
}
