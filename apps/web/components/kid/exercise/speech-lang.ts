/** Letters only Vietnamese writes (tone marks, ă â ê ô ơ ư, đ). */
const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

/**
 * Which voice reads a line of an exercise. The exercise's language decides, except that a line
 * written in Vietnamese (a hint for parents, a note) is always read in Vietnamese — so "A toy
 * inside a box." in an English exercise gets the English voice, not a Vietnamese one.
 */
export function speechLang(text: string, language: string | undefined): "vi-VN" | "en-US" {
  if (VIETNAMESE.test(text)) return "vi-VN";
  return language === "en" ? "en-US" : "vi-VN";
}
