/**
 * "3 điều cần chú ý" — version 1, computed by rule (docs/04 §3.5 and §11.5, docs/08 pha 5 việc 1).
 *
 * The parent dashboard has to answer one question honestly every evening: *of everything going on
 * with this child, what are the two or three things worth five minutes tonight?* Phase 7 will have
 * Claude Code write the sentence; phase 5 works it out arithmetically, and that is deliberate —
 * a number a parent can click through to the actual questions is worth more than a fluent
 * paragraph nobody can check.
 *
 * Each point carries the four things docs/04 §11.5 asks for:
 *   what went wrong · how many times · which rung of the remediation ladder · what to do tonight
 * plus the handle the dashboard needs to open the evidence behind it.
 *
 * No AI (ADR-9, ADR-10). No comparison between the two children — a point is about one child
 * against their own last fortnight, never against their sibling (docs/00 §6).
 */
import { isWeakSkill } from "../mastery/status";
import type { MasteryStatus } from "../mastery/types";
import type { Subject } from "../planner/types";
import { ACTIVE_ERROR_COUNT_7D, rungInfo } from "../remediation/ladder";

/** How many points the card shows. Three is the number in the document, and in a tired evening. */
export const ATTENTION_POINTS = 3;

export interface AttentionErrorInput {
  code: string;
  nameVi: string;
  group: string;
  count7d: number;
  count30d: number;
  lastAt: Date | null;
  /** Skills the taxonomy says drill this code. */
  remediationSkills: string[];
  /** True for `doan_bua`, `bo_trong`… — not a gap in knowledge (docs/04 §11.1). */
  behavioural: boolean;
}

export interface AttentionSkillInput {
  code: string;
  nameVi: string;
  subject: Subject;
  mastery: number;
  status: MasteryStatus;
  confidence: number;
  evidenceCount: number;
  trend14d: number;
  prerequisites: string[];
  /** Distinct error codes seen on this skill in the last fortnight, with counts. */
  errorCounts14d?: Record<string, number>;
  expectedWeek?: number | null;
}

export interface AttentionTrackInput {
  skillCode: string;
  errorCode: string | null;
  rung: number;
  status: "ACTIVE" | "PASSED" | "NEEDS_PARENT";
}

export interface AttentionInput {
  errors: AttentionErrorInput[];
  skills: AttentionSkillInput[];
  tracks?: AttentionTrackInput[];
  /** School week now, to say whether a skill is simply not due yet. */
  currentWeek?: number | null;
}

export type AttentionKind = "ERROR" | "SKILL" | "PREREQUISITE" | "BEHAVIOUR";

export interface AttentionPoint {
  kind: AttentionKind;
  /** One line: what is going on. */
  title: string;
  /** How often, in the child's own words-of-fact ("4 lần trong 7 ngày"). */
  countLabel: string;
  count: number;
  /** Where on the ladder, when a track is open; null when nothing is being drilled yet. */
  rung: number | null;
  rungLabel: string | null;
  /** Five minutes tonight, off the screen. */
  suggestion: string;
  /** What the dashboard opens when the parent taps it. */
  errorCode: string | null;
  skillCode: string | null;
  subject: Subject | null;
  /** Bigger = more worth the parent's evening. Exposed so a test can pin the ordering. */
  weight: number;
}

/**
 * Five minutes at the kitchen table, by family of mistake. Keyed by the taxonomy's `group` so
 * every one of the 44 codes gets a real activity without 44 hand-written strings, and a code
 * added later still gets something sensible.
 */
const ACTIVITY_BY_GROUP: Record<string, (nameVi: string) => string> = {
  viet_am_chu: (n) =>
    `Viết hai chữ dễ nhầm thật to lên giấy (${n.toLowerCase()}), con tô màu khác nhau rồi đi tìm mỗi chữ 3 lần trong một trang sách.`,
  viet_dau_thanh: () =>
    "Đọc to 5 cặp tiếng chỉ khác dấu (mả – mã, hỏi – hõi), con vừa đọc vừa lấy tay vẽ dấu trên không.",
  viet_doc: () =>
    "Con đọc cho ba mẹ nghe 5 dòng trong sách, ba mẹ chỉ tay theo từng tiếng — chậm cũng được, miễn không bỏ tiếng nào.",
  viet_viet: () =>
    "Viết 5 chữ lên nền cát/bột hoặc bảng con trước khi viết vào vở: nét to thì tay nhớ lâu hơn.",
  toan_dem_so: () =>
    "Lấy 10 hạt đậu, con đếm rồi cất đi 1–2 hạt và đếm tiếp từ chỗ đang có, không đếm lại từ đầu.",
  toan_phep_tinh: () =>
    "Đố nhau 5 phép trong phạm vi 10 bằng đồ vật thật, mỗi phép con nói to “thêm” hay “bớt” trước khi tính.",
  toan_so_sanh: () =>
    "Xếp hai nhóm đồ vật cạnh nhau, con chỉ nhóm nhiều hơn rồi mới viết dấu — miệng cá sấu quay về phía nhiều.",
  anh_ngu_phap: () =>
    "Nói 5 câu về người trong nhà theo mẫu (I have… / She is…), ba mẹ nói trước một câu làm mẫu.",
  anh_am_chu: () =>
    "Đọc to 5 từ ngắn, con nghe rồi nhắc lại và chỉ vào chữ cái đầu; nghe trước, viết sau.",
  chung_hanh_vi: () =>
    "Nhắc con đọc hết đề rồi mới trả lời: ba mẹ đọc đề, con nhắc lại bằng lời của con trước khi làm.",
};

const DEFAULT_ACTIVITY = (n: string) =>
  `Cùng con làm lại 3 câu kiểu này trên giấy, vừa làm vừa nói to cách nghĩ (${n.toLowerCase()}).`;

export function activityFor(group: string, nameVi: string): string {
  return (ACTIVITY_BY_GROUP[group] ?? DEFAULT_ACTIVITY)(nameVi);
}

/**
 * docs/04 §3.5, on the shape this screen holds a skill in. The definition itself lives in
 * `mastery/status.ts` and is shared with the planner — there must not be two answers to "is this
 * child weak at this", or the dashboard and tonight's session will disagree in front of a parent.
 */
export function isWeakForAttention(skill: AttentionSkillInput): boolean {
  const sameErrorCount14d = Math.max(0, ...Object.values(skill.errorCounts14d ?? {}), 0);
  return isWeakSkill(skill, sameErrorCount14d);
}

/**
 * Skill names in the map carry their whole scope after a colon — "Tính từ tả người: old, young,
 * tall, short, funny, kind, cute, smart". That is right in a skill map and unreadable in a
 * sentence, especially when two of them meet in one title. The part before the colon is the name;
 * anything still long is cut on a word.
 */
export function shortSkillName(nameVi: string, max = 42): string {
  const head = (nameVi.split(":")[0] ?? nameVi).trim();
  if (head.length <= max) return head;
  const cut = head.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function countLabelFor(count7d: number, count30d: number): string {
  if (count7d > 0) return `${count7d} lần trong 7 ngày`;
  if (count30d > 0) return `${count30d} lần trong 30 ngày`;
  return "chưa đủ số lần để chắc";
}

/**
 * Ranks everything and returns the top three.
 *
 * The order is the order a parent would choose if they could see all of it at once:
 *
 *  1. an active mistake being made over and over beats a low number on a chart — it is concrete,
 *     it repeats, and there is something to do about it tonight;
 *  2. a weak skill whose **prerequisite** is weaker is reported as the prerequisite (docs/04 §3.5,
 *     "tìm gốc rễ"): drilling the top of a stack that has no bottom wastes a week;
 *  3. a skill sliding backwards beats one that was always low, because the slide is new;
 *  4. behaviour codes (guessing, leaving blanks) come last: real, but not a gap in knowledge, and
 *     a parent reading them first would think their child is careless rather than stuck.
 */
export function attentionPoints(input: AttentionInput, limit = ATTENTION_POINTS): AttentionPoint[] {
  const skillsByCode = new Map(input.skills.map((s) => [s.code, s]));
  const trackFor = (skillCode: string | null, errorCode: string | null) =>
    (input.tracks ?? []).find(
      (t) =>
        t.status === "ACTIVE" &&
        (errorCode ? t.errorCode === errorCode : true) &&
        (skillCode ? t.skillCode === skillCode : true),
    ) ?? null;

  const points: AttentionPoint[] = [];
  const claimedSkills = new Set<string>();

  // ── 1. active mistakes ────────────────────────────────────────────────────────────────────
  for (const error of input.errors) {
    if (error.count7d < ACTIVE_ERROR_COUNT_7D && error.count30d < ACTIVE_ERROR_COUNT_7D * 2)
      continue;
    // The skill the taxonomy drills this code on, when the child actually has that skill.
    const skill = error.remediationSkills.map((c) => skillsByCode.get(c)).find(Boolean) ?? null;
    const track = trackFor(skill?.code ?? null, error.code);
    const count = error.count7d > 0 ? error.count7d : error.count30d;
    points.push({
      kind: error.behavioural ? "BEHAVIOUR" : "ERROR",
      title: error.nameVi,
      countLabel: countLabelFor(error.count7d, error.count30d),
      count,
      rung: track?.rung ?? null,
      rungLabel: track ? rungInfo(track.rung).labelVi : null,
      suggestion: activityFor(error.group, error.nameVi),
      errorCode: error.code,
      skillCode: skill?.code ?? null,
      subject: skill?.subject ?? null,
      // A behavioural code is real but not a gap; it never outranks a mistake of knowledge.
      weight: (error.behavioural ? 20 : 100) + count * 4 + (track ? 10 : 0),
    });
    if (skill) claimedSkills.add(skill.code);
  }

  // ── 2. weak skills, reported at the root ──────────────────────────────────────────────────
  for (const skill of input.skills) {
    if (!isWeakForAttention(skill) || claimedSkills.has(skill.code)) continue;
    // A prerequisite that is weaker than the skill itself is the real problem (docs/04 §3.5).
    const weakerPrerequisite = skill.prerequisites
      .map((code) => skillsByCode.get(code))
      .filter((p): p is AttentionSkillInput => Boolean(p) && p!.mastery < skill.mastery)
      .sort((a, b) => a.mastery - b.mastery)[0];
    const target = weakerPrerequisite ?? skill;
    if (claimedSkills.has(target.code)) continue;
    claimedSkills.add(target.code);

    const track = trackFor(target.code, null);
    const sliding = skill.trend14d <= -8;
    const name = shortSkillName(skill.nameVi);
    const rootName = shortSkillName(target.nameVi);
    points.push({
      kind: weakerPrerequisite ? "PREREQUISITE" : "SKILL",
      title: weakerPrerequisite
        ? `${name} — nhưng gốc là ${rootName}`
        : sliding
          ? `${name} đang đi xuống`
          : name,
      countLabel: sliding
        ? `giảm ${Math.abs(Math.round(skill.trend14d))} điểm trong 14 ngày`
        : `${Math.round(target.mastery)}/100 · ${target.evidenceCount} bằng chứng`,
      count: target.evidenceCount,
      rung: track?.rung ?? null,
      rungLabel: track ? rungInfo(track.rung).labelVi : null,
      suggestion: weakerPrerequisite
        ? `Tối nay luyện ${rootName} trước — ${name} sẽ dễ hơn hẳn khi phần này vững.`
        : `Ngồi cạnh con làm 3 câu về ${name.toLowerCase()}, con nói to cách nghĩ, ba mẹ chỉ gật đầu.`,
      errorCode: null,
      skillCode: target.code,
      subject: target.subject,
      weight:
        (weakerPrerequisite ? 70 : sliding ? 60 : 40) +
        Math.round((100 - target.mastery) / 5) +
        (track ? 10 : 0),
    });
  }

  return points.sort((a, b) => b.weight - a.weight).slice(0, limit);
}
