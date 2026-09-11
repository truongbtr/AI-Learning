/**
 * Reading the class diary with patterns, not with an AI (docs/11 §4, docs/13 §4, ADR-10).
 *
 * Every evening the class teacher posts the same shape of text on Edi Parent: what each subject
 * covered, then what to do at home. It is regular enough that a handful of patterns get it right,
 * which matters more than it sounds: this runs in the app the moment a parent pastes the post, so
 * tonight's Daily Quest can already be about this morning's lesson. Only the lines that match no
 * pattern go to the queue for Claude Code to read later.
 *
 * Every pattern is matched against the *unaccented* text. Vietnamese has too many ways to write
 * the same word — "dặn dò" typed on a phone, "dan do" typed in a hurry, "Ðồng phục" pasted with a
 * different Ð — and a regex full of character classes would miss one of them on the evening it
 * mattered.
 *
 * Pure: text in, structure out. No database, no network, no clock.
 */

export type DiarySubject = "ESL" | "ENL" | "EMATH" | "ESCI" | "VIET" | "VMATH";

export type DiaryTaskType =
  | "READ_ALOUD"
  | "WRITE"
  | "WORKSHEET"
  | "VIDEO_SUBMIT"
  | "ONLINE_APP"
  | "BRING_ITEM"
  | "OTHER";

export type DiaryReminderKind = "UNIFORM" | "BRING" | "EVENT" | "SCHEDULE" | "OTHER";

export interface DiaryLessonRead {
  /** Exactly what the teacher called the subject ("ESL", "Tiếng Việt", "Nghệ thuật"). */
  subjectLabel: string;
  subject: DiarySubject | null;
  lessonRefText: string;
  /** "Bài 13" → 13, for matching a LessonUnit. */
  lessonNumber: number | null;
  unit: string | null;
  lesson: string | null;
  pages: number[];
  /** The "Con ôn tập …" half of an ESL line: the only description of the ESL syllabus we have. */
  contentNote: string | null;
}

export interface DiaryHomeworkRead {
  subjectLabel: string;
  subject: DiarySubject | null;
  taskType: DiaryTaskType;
  text: string;
  repeatCount: number | null;
  pages: number[];
  lessonNumber: number | null;
  /** The teacher wrote "khuyến khích" — an invitation, not an instruction. */
  optional: boolean;
  /** "Teams – Chương trình Việt" */
  submitTo: string | null;
}

export interface DiaryReminderRead {
  kind: DiaryReminderKind;
  text: string;
  /** "Ngày mai" → the day after the diary's date; the caller knows which date that is. */
  forTomorrow: boolean;
}

export interface DiaryParseResult {
  taught: DiaryLessonRead[];
  homework: DiaryHomeworkRead[];
  reminders: DiaryReminderRead[];
  /** Lines that looked like content but matched nothing — these go to the AI queue. */
  unmatched: string[];
  /** 0–1: how much of the post the patterns actually explained. */
  confidence: number;
}

/** Vietnamese without its diacritics, so one pattern matches every way of typing a word. */
export function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, (c) => (c === "đ" ? "d" : "D"))
    .toLowerCase()
    .trim();
}

/** The six subjects of the skill map, by every name the teacher uses for them. */
const SUBJECT_ALIASES: { subject: DiarySubject; names: string[] }[] = [
  { subject: "VIET", names: ["tieng viet", "tap viet", "chuong trinh viet", "tv"] },
  { subject: "VMATH", names: ["toan hoc", "toan"] },
  { subject: "EMATH", names: ["english maths", "english math", "maths", "math"] },
  { subject: "ESCI", names: ["english science", "science", "khoa hoc"] },
  { subject: "ENL", names: ["enl", "literacy", "reading", "kids a-z", "raz"] },
  { subject: "ESL", names: ["esl", "tieng anh", "global stage", "anh van", "english"] },
];

/** Longest name first: "english maths" must win over "english". */
const SUBJECT_BY_NAME: { subject: DiarySubject; name: string }[] = SUBJECT_ALIASES.flatMap((a) =>
  a.names.map((name) => ({ subject: a.subject, name })),
).sort((a, b) => b.name.length - a.name.length);

export function subjectOf(label: string): DiarySubject | null {
  const folded = fold(label)
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!folded) return null;
  for (const { subject, name } of SUBJECT_BY_NAME) {
    if (folded === name || folded.startsWith(`${name} `)) return subject;
  }
  for (const { subject, name } of SUBJECT_BY_NAME) {
    if (new RegExp(`\\b${name}\\b`).test(folded)) return subject;
  }
  return null;
}

const SECTION_INFO = /phan\s+thong\s+tin/;
const SECTION_HOMEWORK = /phan\s+dan\s+do/;
const CLOSING = /^(tran trong|gvcn|co giao chu nhiem|giao vien chu nhiem)/;
const GREETING =
  /^(hom nay,? con da tham gia|con da tham gia|kinh gui|phu huynh (than men|kinh men)|xin chao|chao (ba me|quy))/;

/** "trang 38, 39" / "tr.38-40" / "(SGK … trang 38,39)" → page numbers. */
export function pagesIn(text: string): number[] {
  const out = new Set<number>();
  const re = /(?:trang|tr\.?)\s*([\d\s,\-–va]+)/g;
  const folded = fold(text);
  let m = re.exec(folded);
  while (m) {
    for (const part of (m[1] ?? "").split(/[,\s]+|va/)) {
      const range = /^(\d+)[-–](\d+)$/.exec(part);
      if (range) {
        const from = Number(range[1]);
        const to = Number(range[2]);
        for (let p = from; p <= to && p - from < 20; p++) out.add(p);
      } else if (/^\d+$/.test(part)) {
        out.add(Number(part));
      }
    }
    m = re.exec(folded);
  }
  return [...out].sort((a, b) => a - b);
}

/** "Bài 13: U u – Ư ư" → 13 */
export function lessonNumberIn(text: string): number | null {
  const m = /\bbai\s*(\d{1,3})\b/.exec(fold(text));
  return m ? Number(m[1]) : null;
}

function unitLessonIn(text: string): { unit: string | null; lesson: string | null } {
  const folded = fold(text);
  const unit = /unit\s*(\d{1,2})/.exec(folded);
  const lesson = /lesson\s*(\d{1,2})/.exec(folded);
  return { unit: unit?.[1] ?? null, lesson: lesson?.[1] ?? null };
}

/** How many times: "luyện đọc 5 lần", "đọc 3 lượt". */
function repeatIn(text: string): number | null {
  const m = /(\d{1,2})\s*(lan|luot)\b/.exec(fold(text));
  const n = m ? Number(m[1]) : null;
  return n && n >= 1 && n <= 20 ? n : null;
}

const TASK_PATTERNS: { type: DiaryTaskType; test: RegExp }[] = [
  { type: "VIDEO_SUBMIT", test: /quay\s*(video|clip)|nop\s*video|ghi hinh/ },
  { type: "READ_ALOUD", test: /luyen\s*doc|doc\s*bai|doc\s*lai|doc\s*\d+\s*lan|doc thuoc/ },
  { type: "WORKSHEET", test: /phieu\s*bai\s*tap|worksheet|phieu\s*on/ },
  { type: "ONLINE_APP", test: /navio|kids\s*a-?z|raz-?kids|online|lam bai tren (app|ung dung)/ },
  // "viet" alone is half of "tieng viet"; this pattern needs the verb, not the word.
  {
    type: "WRITE",
    test: /tap viet|viet (bai|lai|vao|chinh ta|tu)|lam bai tap|hoan thanh vo|lam vo/,
  },
  { type: "BRING_ITEM", test: /\bmang\b|dem theo/ },
];

const REMINDER_PATTERNS: { kind: DiaryReminderKind; test: RegExp }[] = [
  { kind: "UNIFORM", test: /dong phuc|\bmac\b|giay|dep|\bao\b|quan ao/ },
  { kind: "BRING", test: /\bmang\b|chuan bi|dem theo/ },
  { kind: "EVENT", test: /da ngoai|sinh nhat|le hoi|ngoai khoa|\bhoi (thi|dien)/ },
  { kind: "SCHEDULE", test: /nghi hoc|doi lich|nghi le|hoc bu|lich hoc/ },
];

/** A line that is a reminder for the family rather than schoolwork for the child. */
function reminderKindOf(label: string, text: string): DiaryReminderKind | null {
  if (subjectOf(label)) return null;
  const both = fold(`${label} ${text}`);
  for (const { kind, test } of REMINDER_PATTERNS) if (test.test(both)) return kind;
  return null;
}

function taskTypeOf(text: string): DiaryTaskType {
  const folded = fold(text);
  for (const { type, test } of TASK_PATTERNS) if (test.test(folded)) return type;
  return "OTHER";
}

function submitToIn(text: string): string | null {
  const m = /(Teams[^.;\n]*)/i.exec(text);
  return m ? (m[1] ?? "").trim().replace(/[.,;]$/, "") : null;
}

/** `- Tiếng Việt: Bài 13: U u – Ư ư` → label + the rest. */
function splitLabel(line: string): { label: string; rest: string } | null {
  const m = /^\s*(?:[-+*•]|\d{1,2}[.)])?\s*([^:]{2,40}?)\s*:\s*(.*)$/.exec(line);
  if (!m) return null;
  return { label: (m[1] ?? "").trim(), rest: (m[2] ?? "").trim() };
}

function isNoise(line: string): boolean {
  const folded = fold(line);
  if (folded.length < 3) return true;
  return CLOSING.test(folded) || GREETING.test(folded);
}

/**
 * Reads one post. `text` is what the parent pasted, newlines and all.
 *
 * The two sections are found by their headings; anything before the first heading is reported as
 * unmatched rather than guessed at, because putting an imagined lesson in front of a child
 * tonight is worse than asking Claude Code to read one odd line tomorrow.
 */
export function parseClassDiary(text: string): DiaryParseResult {
  const lines = text.split(/\r?\n/);
  const taught: DiaryLessonRead[] = [];
  const homework: DiaryHomeworkRead[] = [];
  const reminders: DiaryReminderRead[] = [];
  const unmatched: string[] = [];

  let section: "info" | "homework" | null = null;
  let considered = 0;
  let lastLabel = "";
  let lastSubject: DiarySubject | null = null;
  /** A wrapped homework line continues the previous one until a new numbered item starts. */
  let openHomework: DiaryHomeworkRead | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const folded = fold(line);
    if (SECTION_INFO.test(folded)) {
      section = "info";
      continue;
    }
    if (SECTION_HOMEWORK.test(folded)) {
      section = "homework";
      openHomework = null;
      continue;
    }
    if (isNoise(line)) continue;

    const indented = /^\s{3,}\S/.test(raw);
    const bulleted = /^\s*[+>]/.test(raw);
    const numbered = /^\s*\d{1,2}[.)]\s/.test(raw);
    const parts = splitLabel(line);
    considered++;

    if (section === "info") {
      // A wrapped line ("       family members, adjectives…") belongs to the lesson above it.
      if ((indented || bulleted) && !parts && taught.length > 0) {
        const last = taught[taught.length - 1] as DiaryLessonRead;
        const extra = line.replace(/^\s*[+>]\s*/, "").trim();
        last.contentNote = [last.contentNote, extra].filter(Boolean).join(" ");
        if (last.pages.length === 0) last.pages = pagesIn(extra);
        continue;
      }
      if (!parts) {
        unmatched.push(line.trim());
        continue;
      }
      taught.push(readLesson(parts.label, parts.rest));
      continue;
    }

    if (section === "homework") {
      if (numbered && parts) {
        lastLabel = parts.label;
        lastSubject = subjectOf(parts.label);
        openHomework = null;
        const kind = reminderKindOf(parts.label, parts.rest);
        if (kind) {
          reminders.push({ kind, text: parts.rest, forTomorrow: isTomorrow(parts.rest) });
          continue;
        }
        // "1. Tiếng Việt:" alone is a heading for the "+" lines under it.
        if (parts.rest.length >= 4) {
          openHomework = readHomework(parts.label, lastSubject, parts.rest);
          homework.push(openHomework);
        }
        continue;
      }

      const body = line.replace(/^\s*[-+>*•]\s*/, "").trim();
      // A new "+" bullet starts a new task; a bare wrapped line continues the open one.
      if (bulleted || !openHomework) {
        const kind = reminderKindOf(lastLabel, body);
        if (kind) {
          reminders.push({ kind, text: body, forTomorrow: isTomorrow(body) });
          continue;
        }
        openHomework = readHomework(lastLabel, lastSubject, body);
        homework.push(openHomework);
        continue;
      }
      // Wrapped: either more of the same task, or a second task the teacher ran on.
      const startsNewTask =
        taskTypeOf(body) !== "OTHER" && taskTypeOf(body) !== openHomework.taskType;
      if (startsNewTask) {
        openHomework = readHomework(lastLabel, lastSubject, body);
        homework.push(openHomework);
      } else {
        mergeHomework(openHomework, body);
      }
      continue;
    }

    unmatched.push(line.trim());
  }

  // How much of the post was placed somewhere — a wrapped line folded into the task above it
  // counts as understood, an unplaceable line does not.
  const confidence = considered === 0 ? 0 : (considered - unmatched.length) / considered;
  return { taught, homework, reminders, unmatched, confidence };
}

function isTomorrow(text: string): boolean {
  return /\b(ngay mai|sang mai|chieu mai|mai)\b/.test(fold(text));
}

function readLesson(label: string, rest: string): DiaryLessonRead {
  const { unit, lesson } = unitLessonIn(rest);
  // "Unit 1 - Lesson 16 - Unit Review: Con ôn tập từ vựng…" — the note is the part after the colon.
  const noteSplit = /^(.*?):\s*(con\s.*)$/is.exec(rest);
  const title = (noteSplit?.[1] ?? rest).trim();
  return {
    subjectLabel: label,
    subject: subjectOf(label),
    lessonRefText: title,
    lessonNumber: lessonNumberIn(title),
    unit,
    lesson,
    pages: pagesIn(rest),
    contentNote: noteSplit?.[2]?.trim() ?? null,
  };
}

function readHomework(
  label: string,
  fallbackSubject: DiarySubject | null,
  body: string,
): DiaryHomeworkRead {
  const taskType = taskTypeOf(body);
  return {
    subjectLabel: label,
    subject: subjectOf(label) ?? fallbackSubject,
    taskType,
    text: body,
    repeatCount: taskType === "READ_ALOUD" ? repeatIn(body) : null,
    pages: pagesIn(body),
    lessonNumber: lessonNumberIn(body),
    // docs/11 §4: "khuyến khích" is the teacher inviting, not instructing.
    optional: /khuyen khich|neu co the|tu nguyen/.test(fold(body)),
    submitTo: submitToIn(body),
  };
}

/** A task the teacher wrote across two or three lines. */
function mergeHomework(task: DiaryHomeworkRead, more: string): void {
  task.text = `${task.text} ${more}`.trim();
  if (task.pages.length === 0) task.pages = pagesIn(more);
  if (task.lessonNumber === null) task.lessonNumber = lessonNumberIn(more);
  if (task.repeatCount === null && task.taskType === "READ_ALOUD") {
    task.repeatCount = repeatIn(more);
  }
  if (!task.submitTo) task.submitTo = submitToIn(more);
  if (!task.optional) task.optional = /khuyen khich|neu co the|tu nguyen/.test(fold(more));
}
