/**
 * Pha 13 việc 2 — bản đồ kỹ năng EMATH theo nhịp MATH NOTES Grade 1 · Volume 1 (EDI-MN1).
 *
 * - Thêm 3 kỹ năng sách dạy riêng mà bản đồ CCSS chưa tách: TEEN_NUMBERS, NUMBER_CHART_20,
 *   COMPARE_TO_20.
 * - Dời `expectedWeek` về tuần của LessonUnit tương ứng (content/lessons/emath/EDI-MN1.units.json).
 * - Sửa tiên quyết theo thứ tự sách: chục – đơn vị học ngay sau teen numbers, trước đếm cách 10;
 *   "Relate Counting to Addition" (4-1) đứng trước "Ways to make 10" (4-2).
 * - Kỹ năng mới và hai kỹ năng chục – đơn vị không khai WRITE_PHOTO (phiên của con không còn bài
 *   viết-rồi-chụp, 16/09); hai kỹ năng chục – đơn vị thêm dạng nghe/đọc to để gói bài đủ dạng.
 *
 * Chạy lại được nhiều lần: chỉ đặt giá trị, không cộng dồn.
 *
 *   node scripts/content-gen/emath-mn1-skills.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "content/skill-map/emath.json";
const map = JSON.parse(readFileSync(FILE, "utf8"));
const byCode = new Map(map.skills.map((s) => [s.code, s]));

const NEW = [
  {
    code: "EMATH.NBT.TEEN_NUMBERS",
    strand: "NBT",
    nameVi: "Số 11–19 (teen numbers): một chục và vài đơn vị",
    nameEn: "Teen numbers: ten and some ones",
    description:
      "Hiểu số 11–19 là một nhóm mười và 1–9 đơn vị; đọc số trên hai ten-frame (khung đầu đầy); đọc, nghe và nói tên eleven … nineteen. Ví dụ: 'A full ten-frame and 4 dots: 1 ten and 4 ones is 14'; 13 = 10 + 3; 'Circle the teen numbers: 7, 12, 10, 15'. Lỗi thường gặp: coi 10 (hoặc 20) là teen number, đọc nhầm khung thứ hai (10 + 9 thành 17), nhầm thirteen/thirty.",
    standardRef: "CCSS.MATH.K.NBT.A.1",
    gradeLevel: "K",
    order: 19,
    expectedWeek: 4,
    lessonRef: "EDI-MN1-U3-L2",
    prerequisites: ["EMATH.NBT.COUNT_TO_20"],
    relatedSkillCodes: ["VMATH.SO.SO_11_20", "ESL.VOC.NUMBERS_1_20"],
    confusableWith: [],
    exerciseTypes: ["MCQ", "COUNT_TAP", "DRAG_DROP", "LISTEN_CHOOSE", "READ_ALOUD"],
    difficultyRange: [1, 5],
  },
  {
    code: "EMATH.NBT.NUMBER_CHART_20",
    strand: "NBT",
    nameVi: "Quy luật trên bảng số 1–20 (hàng, cột)",
    nameEn: "Patterns on a number chart to 20",
    description:
      "Đọc bảng số 2 hàng × 10 cột; sang phải thêm 1, xuống dưới cùng cột thêm 10; điền số thiếu trong bảng và trong mảnh bảng; nói các số tiếp theo. Ví dụ: 'What number is 2 more than 13?' (15); mảnh bảng [16, 17, _ / _, 10, 11] → 18 và 9; 'What numbers come next? 14 → 15, 16, 17, 18'. Lỗi thường gặp: đếm cách 2 hoặc đếm lùi khi hỏi số tiếp theo, đọc cột thành hàng (số dưới 4 là 5 thay vì 14).",
    standardRef: "CCSS.MATH.1.NBT.A.1",
    gradeLevel: "1",
    order: 21,
    expectedWeek: 5,
    lessonRef: "EDI-MN1-U3-L3",
    prerequisites: ["EMATH.NBT.COUNT_TO_20"],
    relatedSkillCodes: ["VMATH.SO.BANG_100_DEM_THEO_CHUC"],
    confusableWith: [],
    exerciseTypes: ["MCQ", "DRAG_DROP", "LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD"],
    difficultyRange: [1, 5],
  },
  {
    code: "EMATH.NBT.COMPARE_TO_20",
    strand: "NBT",
    nameVi: "So sánh số tới 20 (lời, tia số, dấu < > =)",
    nameEn: "Compare numbers to 20",
    description:
      "So sánh hai số tới 20 bằng mô hình chục – đơn vị, bằng tia số (bên phải lớn hơn) và bằng dấu > < =; nói câu 'is greater than / is less than / is equal to'; đánh giá câu so sánh đúng hay sai. Ví dụ: 'Val has 17 beads. Jean has 11 beads. Who has more?'; 15 ○ 12 → >; 'Pat says that 6 is greater than 11. Do you agree?'. Lỗi thường gặp: đặt dấu ngược chiều, chọn số bé khi hỏi số lớn, so theo chữ số hàng đơn vị (9 lớn hơn 12).",
    standardRef: "CCSS.MATH.1.NBT.B.3",
    gradeLevel: "1",
    order: 22,
    expectedWeek: 7,
    lessonRef: ["EDI-MN1-U3-L7", "EDI-MN1-U3-L8", "EDI-MN1-U3-L9"],
    prerequisites: ["EMATH.NBT.COMPARE_1_10", "EMATH.NBT.TEEN_NUMBERS"],
    relatedSkillCodes: ["VMATH.SO.SO_SANH_100"],
    confusableWith: [],
    exerciseTypes: ["MCQ", "DRAG_DROP", "LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD"],
    difficultyRange: [1, 5],
  },
];

/** expectedWeek, lessonRef and prerequisites that follow the book. */
const MOVE = {
  "EMATH.NBT.COUNT_TO_20": { lessonRef: "EDI-MN1-U3-L1" },
  "EMATH.NBT.NUMBER_LINE_TO_20": {
    expectedWeek: 5,
    lessonRef: ["EDI-MN1-U3-L4", "EDI-MN1-U3-L8"],
  },
  "EMATH.NBT.TENS_ONES": {
    expectedWeek: 6,
    lessonRef: ["EDI-MN1-U3-L5", "EDI-MN1-U3-L6"],
    prerequisites: ["EMATH.NBT.COUNT_TO_20", "EMATH.NBT.TEEN_NUMBERS"],
    exerciseTypes: ["DRAG_DROP", "MCQ", "COUNT_TAP", "LISTEN_CHOOSE", "READ_ALOUD"],
    difficultyRange: [1, 5],
  },
  "EMATH.NBT.PLACE_VALUE_MODELS": {
    expectedWeek: 6,
    lessonRef: "EDI-MN1-U3-L6",
    exerciseTypes: ["DRAG_DROP", "COUNT_TAP", "MCQ", "LISTEN_CHOOSE", "READ_ALOUD"],
    difficultyRange: [1, 5],
  },
  "EMATH.OA.ADD_WITHIN_10": {
    lessonRef: "EDI-MN1-U4-L1",
    // 4-1 "Relate Counting to Addition" comes before 4-2 "Ways to make 10"
    prerequisites: ["EMATH.OA.ADD_WITHIN_5"],
  },
  "EMATH.OA.NUMBER_BONDS_10": { expectedWeek: 9, lessonRef: "EDI-MN1-U4-L2" },
  "EMATH.OA.COUNT_ON": { expectedWeek: 10, lessonRef: "EDI-MN1-U4-L3" },
  "EMATH.OA.DOUBLES": { expectedWeek: 11, lessonRef: "EDI-MN1-U4-L4" },
  "EMATH.OA.MAKE_TEN": {
    expectedWeek: 11,
    lessonRef: "EDI-MN1-U4-L5",
    // the book reads the strategy aloud: "7 plus 3 is 10, 10 plus 2 is 12"
    exerciseTypes: ["MCQ", "LISTEN_CHOOSE", "DRAG_DROP", "COUNT_TAP", "READ_ALOUD"],
  },
};

for (const def of NEW) {
  const at = map.skills.findIndex((s) => s.code === def.code);
  if (at >= 0) map.skills[at] = def;
  else {
    // keep the file grouped: a new NBT skill goes after the last NBT skill whose order is lower
    const after = map.skills.findLastIndex((s) => s.strand === def.strand && s.order <= def.order);
    map.skills.splice(after + 1, 0, def);
  }
  byCode.set(def.code, def);
}
for (const [code, patch] of Object.entries(MOVE)) {
  const skill = byCode.get(code);
  if (!skill) throw new Error(`missing ${code}`);
  Object.assign(skill, patch);
}

writeFileSync(FILE, `${JSON.stringify(map, null, 2)}\n`, "utf8");
console.log(`${map.skills.length} EMATH skills`);
for (const code of [...NEW.map((s) => s.code), ...Object.keys(MOVE)]) {
  const s = byCode.get(code);
  console.log(
    `${code.padEnd(30)} week ${s.expectedWeek} · prereq ${s.prerequisites.join(", ") || "—"}`,
  );
}
