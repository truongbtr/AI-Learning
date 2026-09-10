/**
 * Kid login: pick 4 pictures in order from a grid of 9-12 (docs/12 §4).
 * The ordered keys become one secret string that is hashed with Argon2id.
 */
export interface PictureDef {
  key: string;
  emoji: string;
  labelVi: string;
  labelEn: string;
}

export interface PictureSet {
  key: string;
  nameVi: string;
  pictures: readonly PictureDef[];
}

export const PICTURE_SETS: readonly PictureSet[] = [
  {
    key: "animals",
    nameVi: "Con vật",
    pictures: [
      { key: "cat", emoji: "🐱", labelVi: "Mèo", labelEn: "Cat" },
      { key: "dog", emoji: "🐶", labelVi: "Chó", labelEn: "Dog" },
      { key: "rabbit", emoji: "🐰", labelVi: "Thỏ", labelEn: "Rabbit" },
      { key: "bear", emoji: "🐻", labelVi: "Gấu", labelEn: "Bear" },
      { key: "fish", emoji: "🐟", labelVi: "Cá", labelEn: "Fish" },
      { key: "bird", emoji: "🐦", labelVi: "Chim", labelEn: "Bird" },
      { key: "frog", emoji: "🐸", labelVi: "Ếch", labelEn: "Frog" },
      { key: "elephant", emoji: "🐘", labelVi: "Voi", labelEn: "Elephant" },
      { key: "lion", emoji: "🦁", labelVi: "Sư tử", labelEn: "Lion" },
      { key: "duck", emoji: "🦆", labelVi: "Vịt", labelEn: "Duck" },
      { key: "butterfly", emoji: "🦋", labelVi: "Bướm", labelEn: "Butterfly" },
      { key: "turtle", emoji: "🐢", labelVi: "Rùa", labelEn: "Turtle" },
    ],
  },
  {
    key: "things",
    nameVi: "Đồ vật",
    pictures: [
      { key: "apple", emoji: "🍎", labelVi: "Táo", labelEn: "Apple" },
      { key: "star", emoji: "⭐", labelVi: "Ngôi sao", labelEn: "Star" },
      { key: "car", emoji: "🚗", labelVi: "Ô tô", labelEn: "Car" },
      { key: "flower", emoji: "🌸", labelVi: "Hoa", labelEn: "Flower" },
      { key: "sun", emoji: "🌞", labelVi: "Mặt trời", labelEn: "Sun" },
      { key: "ball", emoji: "⚽", labelVi: "Quả bóng", labelEn: "Ball" },
      { key: "tree", emoji: "🌳", labelVi: "Cây", labelEn: "Tree" },
      { key: "cake", emoji: "🎂", labelVi: "Bánh kem", labelEn: "Cake" },
      { key: "robot", emoji: "🤖", labelVi: "Rô-bốt", labelEn: "Robot" },
      { key: "rocket", emoji: "🚀", labelVi: "Tên lửa", labelEn: "Rocket" },
      { key: "book", emoji: "📚", labelVi: "Sách", labelEn: "Book" },
      { key: "balloon", emoji: "🎈", labelVi: "Bóng bay", labelEn: "Balloon" },
    ],
  },
];

export const PIN_LENGTH = 4;
export const DEFAULT_PICTURE_SET_KEY = "animals";

export function getPictureSet(key: string | null | undefined): PictureSet {
  return PICTURE_SETS.find((s) => s.key === key) ?? PICTURE_SETS[0]!;
}

export type PinIssue = "WRONG_LENGTH" | "UNKNOWN_PICTURE";

/** Validates an ordered list of picture keys against a set. */
export function validatePin(keys: readonly string[], set: PictureSet): PinIssue[] {
  const issues: PinIssue[] = [];
  if (keys.length !== PIN_LENGTH) issues.push("WRONG_LENGTH");
  const known = new Set(set.pictures.map((p) => p.key));
  if (keys.some((k) => !known.has(k))) issues.push("UNKNOWN_PICTURE");
  return issues;
}

/** Ordered keys -> single secret string to hash. Order matters ("cat.dog" is not "dog.cat"). */
export function pinToSecret(keys: readonly string[]): string {
  return keys.map((k) => k.trim().toLowerCase()).join(".");
}
