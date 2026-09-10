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
