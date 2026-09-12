/**
 * Mở rộng bản đồ kỹ năng cho những kỹ năng đợt 2 soạn đủ gói 40 bài.
 *
 * Một kỹ năng chỉ khai vài dạng bài và biên độ khó hẹp là đủ khi chưa có bài nào. Khi đã có
 * ngân hàng 40 bài thì hợp đồng đổi: validator đòi **cả năm mức khó** và **>= 4 trong sáu dạng
 * của pha 3**, vì đó là cái làm một tối học không nhàm. Script này ghi lại đúng những thay đổi
 * đó, để `git diff` của bản đồ kỹ năng đọc được chứ không phải sửa tay rải rác.
 *
 *   node scripts/content-gen/patch-skill-map.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

/**
 * Bỏ COUNT_TAP khỏi mọi kỹ năng học vần và ghép âm (12/09/2026, sau khi đọc `exercise-health.csv`).
 *
 * `countTarget` chỉ vẽ được **một** loại vật lặp lại, nên một bài đếm không bao giờ phân biệt được
 * b với d hay /æ/ với /e/ — nó đo kỹ năng đếm. 14 bài như vậy của đợt 1 đã nghỉ hưu
 * (`retire-count-tap-phonics.mjs`); bảng dưới gỡ dạng bài khỏi hợp đồng để không ai soạn lại.
 */
const DROP_COUNT_TAP = [
  "VIET.HV.AM_A",
  "VIET.HV.AM_B",
  "VIET.HV.AM_C",
  "VIET.HV.AM_CH_KH",
  "VIET.HV.AM_D_DD",
  "VIET.HV.AM_E_EE",
  "VIET.HV.AM_O",
  "VIET.HV.AM_U_UW",
  "VIET.HV.DAU_THANH",
  "VIET.HV.NHAM_LAN_B_D",
  "ESL.PH.ALPHABET_SOUNDS",
  "ESL.PH.SPELL_CVC",
  "ENL.RF.RHYME",
  "ENL.RF.SIGHT_WORDS_PREPRIMER",
  "ENL.RF.BLEND_PHONEMES",
  "ENL.RF.ISOLATE_SOUNDS",
];

/** code -> { types: thêm dạng bài, drop: bỏ dạng bài, range: biên độ khó, lessonRef: tầm bài học } */
const PATCHES = {
  // Năm dấu thanh: thêm WRITE_PHOTO (đặt dấu đúng chỗ là việc của tay, không phải của mắt) và
  // nới lên mức 5 (bốn ô cùng con chữ khác dấu là bài khó thật). lessonRef thêm bài 9 vì dấu
  // được luyện lại tới khi đủ sáu dấu — đúng quy ước VIET.HV.DAU_THANH đã dùng ở đợt 1.
  "VIET.HV.DAU_HUYEN": {
    types: ["WRITE_PHOTO"],
    range: [1, 5],
    lessonRef: ["KNTT-TV1-T1-B02", "KNTT-TV1-T1-B09"],
  },
  "VIET.HV.DAU_SAC": {
    types: ["WRITE_PHOTO"],
    range: [1, 5],
    lessonRef: ["KNTT-TV1-T1-B03", "KNTT-TV1-T1-B09"],
  },
  "VIET.HV.DAU_HOI": {
    types: ["WRITE_PHOTO"],
    range: [1, 5],
    lessonRef: ["KNTT-TV1-T1-B06", "KNTT-TV1-T1-B09"],
  },
  "VIET.HV.DAU_NANG": {
    types: ["WRITE_PHOTO"],
    range: [1, 5],
    lessonRef: ["KNTT-TV1-T1-B07", "KNTT-TV1-T1-B09"],
  },
  "VIET.HV.DAU_NGA": { types: ["WRITE_PHOTO"], range: [1, 5] },

  // Âm ô, ơ, i/k, h/l: thêm DRAG_DROP và WRITE_PHOTO để đủ bốn dạng pha 3 (TRACE chưa có bộ
  // dựng hình ở pha 3 nên không tính), nới mức khó vì bài đối chiếu ô/o, ơ/o là bài khó.
  "VIET.HV.AM_OO": { types: ["DRAG_DROP", "WRITE_PHOTO"], range: [1, 5] },
  "VIET.HV.AM_OW": { types: ["DRAG_DROP", "WRITE_PHOTO"], range: [1, 5] },
  "VIET.HV.AM_I_K": { types: ["DRAG_DROP", "WRITE_PHOTO"], range: [1, 5] },
  "VIET.HV.AM_H_L": { types: ["DRAG_DROP", "WRITE_PHOTO"], range: [1, 5] },
  "VIET.HV.DANH_VAN_TIENG": {
    types: ["WRITE_PHOTO"],
    range: [1, 5],
    lessonRef: ["KNTT-TV1-T1-B13"],
  },
  "VIET.DOC.DOC_TIENG": { types: ["DRAG_DROP", "WRITE_PHOTO"], range: [1, 5] },
  "VIET.DOC.DOC_TU": { types: ["WRITE_PHOTO"], range: [1, 5] },

  // English Science chưa có gói nào. Bốn dạng pha 3 là sàn của validator; khoa học lớp 1 hợp
  // với COUNT_TAP (đếm vật sống trong tranh) và LISTEN_CHOOSE (nghe tên vật liệu) hơn là
  // SPEAK_ANSWER, thứ phải chờ hàng chờ AI mới có phản hồi.
  // WRITE_PHOTO ở đây là "vẽ rồi ghi nhãn" — việc thật của khoa học lớp 1, và là đường duy nhất
  // để ba mẹ nhìn thấy con hiểu tới đâu khi con chưa viết được câu dài.
  "ESCI.LS.LIVING_NONLIVING": {
    types: ["LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.INQ.OBSERVE_DESCRIBE": {
    types: ["LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.LS.NEEDS_OF_LIVING_THINGS": {
    types: ["LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.VOC.MATERIALS": { types: ["COUNT_TAP", "WRITE_PHOTO"], range: [1, 5] },
  "ESCI.PS.MATERIALS_PROPERTIES": {
    types: ["LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.INQ.PREDICT": {
    types: ["LISTEN_CHOOSE", "DRAG_DROP", "READ_ALOUD", "COUNT_TAP", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.PS.FLOAT_SINK": {
    types: ["LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.INQ.SORT_CLASSIFY": {
    types: ["LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.PS.LIGHT_SEE": {
    types: ["DRAG_DROP", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },
  "ESCI.PS.LIGHT_MATERIALS": {
    types: ["LISTEN_CHOOSE", "COUNT_TAP", "READ_ALOUD", "WRITE_PHOTO"],
    range: [1, 5],
  },

  // English Maths: cộng trừ trong 5 và 10, so sánh, tia số, số thứ tự.
  "EMATH.OA.ADD_WITHIN_5": { types: ["LISTEN_CHOOSE", "READ_ALOUD", "WRITE_PHOTO"], range: [1, 5] },
  "EMATH.OA.SUB_WITHIN_5": { types: ["LISTEN_CHOOSE", "READ_ALOUD", "WRITE_PHOTO"], range: [1, 5] },
  "EMATH.OA.SUB_WITHIN_10": { types: ["READ_ALOUD", "WRITE_PHOTO"], range: [1, 5] },
  "EMATH.NBT.COMPARE_1_10": { types: ["LISTEN_CHOOSE", "READ_ALOUD"], range: [1, 5] },
  "EMATH.NBT.NUMBER_LINE_TO_20": { types: ["LISTEN_CHOOSE", "READ_ALOUD"], range: [1, 5] },
  "EMATH.NBT.ORDINAL_NUMBERS": { types: ["COUNT_TAP", "READ_ALOUD"], range: [1, 5] },

  // ESL / ENL của Global Stage 1 Unit 1 và Phonics Review.
  "ESL.VOC.NUMBERS_1_20": { types: ["DRAG_DROP", "WRITE_PHOTO"], range: [1, 5] },
  "ESL.PH.SPELL_CVC": { types: ["LISTEN_CHOOSE"], range: [1, 5] },
  "ESL.VOC.ANIMALS_FARM": { types: ["COUNT_TAP", "WRITE_PHOTO"], range: [1, 5] },
  "ESL.GR.HOW_MANY": { types: ["LISTEN_CHOOSE", "DRAG_DROP", "READ_ALOUD"], range: [1, 5] },
  "ENL.RF.BLEND_PHONEMES": { types: ["DRAG_DROP"], range: [1, 5] },
  "ENL.RF.ISOLATE_SOUNDS": { types: ["DRAG_DROP"], range: [1, 5] },
};

for (const code of DROP_COUNT_TAP) PATCHES[code] = { ...PATCHES[code], drop: ["COUNT_TAP"] };

const FILES = ["emath", "enl", "esci", "esl", "viet", "vmath"];
let touched = 0;
for (const name of FILES) {
  const file = `content/skill-map/${name}.json`;
  const map = JSON.parse(readFileSync(file, "utf8"));
  let changed = false;
  for (const skill of map.skills) {
    const patch = PATCHES[skill.code];
    if (!patch) continue;
    for (const t of patch.types ?? [])
      if (!skill.exerciseTypes.includes(t)) {
        skill.exerciseTypes.push(t);
        changed = true;
      }
    for (const t of patch.drop ?? [])
      if (skill.exerciseTypes.includes(t)) {
        skill.exerciseTypes = skill.exerciseTypes.filter((x) => x !== t);
        changed = true;
      }
    if (patch.range && String(patch.range) !== String(skill.difficultyRange)) {
      skill.difficultyRange = patch.range;
      changed = true;
    }
    if (patch.lessonRef && JSON.stringify(patch.lessonRef) !== JSON.stringify(skill.lessonRef)) {
      skill.lessonRef = patch.lessonRef;
      changed = true;
    }
    if (changed) touched++;
  }
  if (changed) writeFileSync(file, `${JSON.stringify(map, null, 2)}\n`, "utf8");
}
console.log(`skill map: ${touched} kỹ năng được mở rộng cho ngân hàng bài đợt 2`);
