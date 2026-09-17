/**
 * Pha 13 việc 3 — mã lỗi cho những bẫy MATH NOTES cố ý gài mà bộ mã cũ không tả đúng.
 *
 * Đã thử mã có sẵn trước:
 * - đếm cả số đầu khi đếm tiếp (6 + 3 ra 10) → `dem_thua_1` (đúng nghĩa: thừa một), không thêm mã;
 * - nhầm chiều dấu → `nham_dau_lon_be`; chọn số bé khi hỏi số lớn → `so_sanh_nguoc`;
 * - hai thanh chục thay vì một (23 thay 13) → `sai_hang_chuc_don_vi`.
 * Bốn chỗ dưới đây không mã nào nói đúng việc con làm, nên mới thêm:
 * - `chuc_khong_du_10`  thanh "chục" chỉ có 9 khối, 25 khối rời gọi là 2 chục (sách tr.18, tr.21);
 * - `nham_so_teen`      coi 10 (hay 20) là teen number (sách tr.10);
 * - `sai_quy_luat_dem`  chọn dãy đếm cách 2 hoặc đếm lùi khi hỏi số tiếp theo (sách tr.15–16);
 * - `nho_sai_doubles`   chọn phép doubles cộng sai 3 + 3 = 5, 5 + 5 = 9 (sách tr.47).
 * `dem_thieu_1`/`dem_thua_1` không thay được: một phép doubles sai là một *câu*, không phải một số.
 *
 *   node scripts/content-gen/emath-mn1-errors.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "content/error-taxonomy.json";
const file = JSON.parse(readFileSync(FILE, "utf8"));

const NEW = [
  {
    code: "chuc_khong_du_10",
    subject: "EMATH",
    group: "toan_dem_so",
    nameVi: "Nhóm chục không đủ 10",
    description:
      "Gọi một thanh 9 khối là một chục, hoặc gọi một đám khối rời là '2 tens' mà không đếm đủ 10 mỗi nhóm.",
    detection: "Đáp án nhiễu là mô hình có thanh 9 khối (MCQ tranh); câu YES/NO với 25 khối rời.",
    remediation: "Đếm từng khối của thanh trước khi gọi là 'one ten'; xếp 10 khối rời thành thanh.",
    remediationSkills: ["EMATH.NBT.TENS_ONES", "EMATH.NBT.PLACE_VALUE_MODELS"],
    lessonRefs: ["EDI-MN1-U3-L5", "EDI-MN1-U3-L6"],
    behavioural: false,
  },
  {
    code: "nham_so_teen",
    subject: "EMATH",
    group: "toan_dem_so",
    nameVi: "Coi 10 hoặc 20 là teen number",
    description: "Khoanh 10 (hoặc 20) khi được hỏi teen numbers 11–19.",
    detection:
      "Thẻ 10/20 kéo nhầm vào giỏ teen numbers; ô nhiễu 10 trong câu 'Which is a teen number?'.",
    remediation: "Nhắc 'teen numbers là 1 chục và vài đơn vị': 10 là 1 chục và 0 đơn vị.",
    remediationSkills: ["EMATH.NBT.TEEN_NUMBERS"],
    lessonRefs: ["EDI-MN1-U3-L2"],
    behavioural: false,
  },
  {
    code: "sai_quy_luat_dem",
    subject: "EMATH",
    group: "toan_dem_so",
    nameVi: "Đếm sai quy luật (cách 2, đếm lùi) khi hỏi số tiếp theo",
    description:
      "Được hỏi các số tiếp theo trên tia số hoặc bảng số, con chọn dãy đếm cách 2 hoặc dãy đếm lùi thay vì đếm tới từng 1.",
    detection: "Ô nhiễu là dãy đếm cách 2 / đếm lùi (sách tr.15–16).",
    remediation: "Chạm từng vạch tia số và đọc to; mỗi bước sang phải là thêm 1.",
    remediationSkills: [
      "EMATH.NBT.NUMBER_LINE_TO_20",
      "EMATH.NBT.NUMBER_CHART_20",
      "EMATH.NBT.COUNT_TO_20",
    ],
    lessonRefs: ["EDI-MN1-U3-L3", "EDI-MN1-U3-L4"],
    behavioural: false,
  },
  {
    code: "nho_sai_doubles",
    subject: "EMATH",
    group: "toan_phep_tinh",
    nameVi: "Nhớ sai phép doubles",
    description:
      "Chọn một phép doubles có tổng sai (3 + 3 = 5, 5 + 5 = 9) vì thấy hai số hạng giống nhau mà không kiểm tổng.",
    detection: "Ô nhiễu là phép doubles cộng sai (sách tr.47).",
    remediation: "Đếm hai thẻ chấm giống nhau; gắn mỗi doubles với một đồ vật (4 + 4 chân nhện).",
    remediationSkills: ["EMATH.OA.DOUBLES"],
    lessonRefs: ["EDI-MN1-U4-L4"],
    behavioural: false,
  },
];

for (const def of NEW) {
  const at = file.codes.findIndex((c) => c.code === def.code);
  if (at >= 0) file.codes[at] = def;
  else {
    // after the last maths code, before the ESL block
    const after = file.codes.findLastIndex((c) => c.subject === "VMATH" || c.subject === "EMATH");
    file.codes.splice(after + 1, 0, def);
  }
}

// The two comparison codes now also point at the English comparison skill and its lessons.
for (const code of ["so_sanh_nguoc", "nham_dau_lon_be"]) {
  const c = file.codes.find((x) => x.code === code);
  for (const s of ["EMATH.NBT.COMPARE_TO_20"])
    if (!c.remediationSkills.includes(s)) c.remediationSkills.push(s);
  for (const l of ["EDI-MN1-U3-L7", "EDI-MN1-U3-L9"])
    if (!c.lessonRefs.includes(l)) c.lessonRefs.push(l);
}

writeFileSync(FILE, `${JSON.stringify(file, null, 2)}\n`, "utf8");
console.log(`${file.codes.length} error codes`);
