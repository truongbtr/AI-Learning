/**
 * Pha 13b — bản đồ kỹ năng EMATH cho Unit 4 (hai bài cuối), Unit 5 và Unit 6 của EDI-MN1
 * (bản scan tr.52–97, chủ dự án gửi 18/09/2026).
 *
 * - Thêm 4 kỹ năng sách dạy thành bài riêng mà bản đồ CCSS gộp chung: đếm tiến để trừ, bớt về 10
 *   rồi trừ tiếp, thuộc tính không định hình (màu/cỡ), tách hình rồi dựng hình mới.
 * - Dời `expectedWeek` của các kỹ năng Unit 4–6 về tuần bài học (2 bài/tuần, tuần 4 = trang 28).
 * - Sửa vài tiên quyết cho khớp thứ tự sách (trừ trong 20 học trước khi đếm lùi trên tia số).
 *
 * Chạy sau `emath-mn1-skills.mjs`:
 *   node scripts/content-gen/emath-mn1-skills-b.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "content/skill-map/emath.json";
const map = JSON.parse(readFileSync(FILE, "utf8"));
const byCode = new Map(map.skills.map((s) => [s.code, s]));
const TYPES = ["MCQ", "DRAG_DROP", "LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD"];

const NEW = [
  {
    code: "EMATH.OA.COUNT_ON_SUBTRACT",
    strand: "OA",
    nameVi: "Đếm tiến để trừ (hiệu là khoảng cách)",
    nameEn: "Count on to subtract",
    description:
      "Trừ bằng cách bắt đầu từ số bé rồi đếm tiến tới số lớn trên tia số; số bước đếm chính là hiệu. Ví dụ: 15 − 9 — đứng ở 9, đếm tiến 6 bước tới 15, vậy 15 − 9 = 6; 'Malik has 12 seashells. He gives 5 away' → 7. Lỗi thường gặp: đếm cả số đứng đầu (ra thừa một), đếm lùi khi đề bảo đếm tiến, đọc ra số dừng thay vì số bước.",
    standardRef: "CCSS.MATH.1.OA.B.4",
    gradeLevel: "1",
    order: 10,
    expectedWeek: 11,
    lessonRef: "EDI-MN1-U5-L4",
    prerequisites: ["EMATH.OA.COUNT_ON", "EMATH.OA.SUB_WITHIN_10"],
    relatedSkillCodes: ["VMATH.SO.TRU_PV_10"],
    confusableWith: ["EMATH.OA.COUNT_BACK"],
    exerciseTypes: TYPES,
    difficultyRange: [1, 5],
  },
  {
    code: "EMATH.OA.MAKE_TEN_SUBTRACT",
    strand: "OA",
    nameVi: "Bớt về 10 rồi trừ tiếp",
    nameEn: "Make a 10 to subtract",
    description:
      "Trừ qua 10 bằng cách bớt về 10 trước rồi bớt nốt phần còn lại, tách số trừ bằng number bond. Ví dụ: 13 − 5 — tách 5 thành 3 và 2, 13 − 3 = 10 rồi 10 − 2 = 8; 15 − 6 = 9. Lỗi thường gặp: tách sai phần đầu (không đủ để về 10), quên bớt phần thứ hai nên trả lời 10, cộng nhầm phần còn lại.",
    standardRef: "CCSS.MATH.1.OA.C.6",
    gradeLevel: "1",
    order: 11,
    expectedWeek: 12,
    lessonRef: "EDI-MN1-U5-L5",
    prerequisites: ["EMATH.OA.MAKE_TEN", "EMATH.OA.SUB_WITHIN_10"],
    relatedSkillCodes: [],
    confusableWith: ["EMATH.OA.MAKE_TEN"],
    exerciseTypes: TYPES,
    difficultyRange: [1, 5],
  },
  {
    code: "EMATH.G.NON_DEFINING_ATTRS",
    strand: "G",
    nameVi: "Màu sắc, kích thước không đổi tên hình",
    nameEn: "Non-defining attributes of shapes",
    description:
      "Hiểu màu, cỡ và hướng đặt là thuộc tính không định hình: hình vẫn là hình đó dù to nhỏ hay xoay nghiêng; nhận ra hình trong đồ vật đời thường. Ví dụ: 'Is a red square still a square?' (Yes); sáu tam giác khác màu, khác cỡ đều là tam giác; thước → chữ nhật, đồng xu → tròn. Lỗi thường gặp: nghĩ hình xoay nghiêng là hình khác, nghĩ hình to và hình nhỏ khác tên, chọn theo màu thay vì theo cạnh.",
    standardRef: "CCSS.MATH.1.G.A.1",
    gradeLevel: "1",
    order: 45,
    expectedWeek: 13,
    lessonRef: "EDI-MN1-U6-L2",
    prerequisites: ["EMATH.G.NAME_2D_SHAPES", "EMATH.G.SHAPE_ATTRIBUTES"],
    relatedSkillCodes: ["VMATH.HH.NHAN_DANG_HINH_THUC_TE"],
    confusableWith: ["EMATH.G.SHAPE_ATTRIBUTES"],
    exerciseTypes: TYPES,
    difficultyRange: [1, 5],
  },
  {
    code: "EMATH.G.DECOMPOSE_SHAPES",
    strand: "G",
    nameVi: "Tách hình thành mảnh rồi dựng hình mới",
    nameEn: "Take shapes apart and build new ones",
    description:
      "Tách một hình phẳng thành các mảnh rồi xếp những mảnh ấy thành hình khác; nhận ra hai hình trông khác nhau nhưng làm từ cùng các mảnh. Ví dụ: một tam giác lớn gồm 4 tam giác nhỏ, xếp lại thành dải hình mới; 'Can you make the pair of shapes from the same parts?'. Lỗi thường gặp: đếm thiếu mảnh, nghĩ hình khác thì mảnh phải khác, xếp chồng mảnh thay vì ghép cạnh.",
    standardRef: "CCSS.MATH.1.G.A.2",
    gradeLevel: "1",
    order: 46,
    expectedWeek: 14,
    lessonRef: "EDI-MN1-U6-L4",
    prerequisites: ["EMATH.G.COMPOSE_SHAPES"],
    relatedSkillCodes: ["VMATH.HH.LAP_GHEP_XEP_HINH"],
    confusableWith: ["EMATH.G.COMPOSE_SHAPES"],
    exerciseTypes: TYPES,
    difficultyRange: [1, 5],
  },
];

/** Tuần và bài của các kỹ năng Unit 4–6 đã có sẵn. */
const MOVE = {
  "EMATH.OA.PROPERTIES_COMMUTATIVE": { expectedWeek: 8, lessonRef: "EDI-MN1-U4-L6" },
  "EMATH.OA.ADD_WITHIN_20": {
    expectedWeek: 8,
    lessonRef: ["EDI-MN1-U4-L5", "EDI-MN1-U4-L7"],
  },
  "EMATH.OA.THREE_ADDENDS": { expectedWeek: 9, lessonRef: "EDI-MN1-U4-L7" },
  "EMATH.OA.SUB_WITHIN_10": { expectedWeek: 10, lessonRef: "EDI-MN1-U5-L2" },
  "EMATH.OA.SUB_WITHIN_20": {
    expectedWeek: 10,
    lessonRef: ["EDI-MN1-U5-L1", "EDI-MN1-U5-L3", "EDI-MN1-U5-L4"],
    // the book counts to subtract (5-1) before it counts back on a number line (5-2)
    prerequisites: ["EMATH.OA.SUB_WITHIN_10"],
  },
  "EMATH.OA.COUNT_BACK": { expectedWeek: 11, lessonRef: "EDI-MN1-U5-L3" },
  "EMATH.G.SHAPE_ATTRIBUTES": { expectedWeek: 13, lessonRef: "EDI-MN1-U6-L1" },
  "EMATH.G.COMPOSE_SHAPES": { expectedWeek: 14, lessonRef: "EDI-MN1-U6-L3" },
  // Không có trong Volume 1 nhưng vẫn giữ (chủ dự án 18/09: "thú vị thì để lại"): chỉ dời xuống sau
  // Unit 6 để bài của lớp luôn được ưu tiên trước trong ô "bài mới".
  "EMATH.G.PATTERNS": { expectedWeek: 15 },
  "EMATH.NBT.ORDINAL_NUMBERS": { expectedWeek: 16 },
};

for (const def of NEW) {
  const at = map.skills.findIndex((s) => s.code === def.code);
  if (at >= 0) map.skills[at] = def;
  else {
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
    `${code.padEnd(32)} week ${s.expectedWeek} · prereq ${s.prerequisites.join(", ") || "—"}`,
  );
}
