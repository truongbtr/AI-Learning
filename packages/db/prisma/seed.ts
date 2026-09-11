/**
 * Seed (docs/03 §4, docs/08 pha 0). Idempotent — safe to run on every container start.
 *
 *  - ONE User role=ADMIN from ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD (skipped when an ADMIN exists),
 *    mustChangePassword = true.
 *  - Timetable 1B3 + 30 TimetableSlot from content/timetable/1B3-2026.json.
 *  - 35 SchoolWeek from SCHOOL_YEAR_START (default 2026-09-08).
 *  - AiConfig default row, >= 5 Badge.
 *  - Skill stays EMPTY (phase 1).
 *  - Sample students (thy, thanh) ONLY when SEED_DEV=1 — never in production.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  contentDir,
  flattenTimetable,
  loadErrorTaxonomy,
  loadLessonUnitFiles,
  loadSkillMaps,
  parseTimetable,
  validateErrorTaxonomy,
  validateLessonUnits,
  validateSkillMaps,
} from "@mtct/content";
import { buildSchoolWeeks, DEFAULT_PICTURE_SET_KEY, parseIsoDate, pinToSecret } from "@mtct/core";
import { hash } from "@node-rs/argon2";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "../generated/client";
import {
  importErrorCodes,
  importLessonUnits,
  importSkillMaps,
  linkSkillLessonRefs,
} from "../src/skills/import";

const rootEnv = join(__dirname, "..", "..", "..", ".env");
if (existsSync(rootEnv)) loadEnv({ path: rootEnv, override: false });

const prisma = new PrismaClient();

const ARGON2 = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

async function seedAdmin() {
  const existing = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { username: true },
  });
  if (existing) {
    console.log(`admin: exists (${existing.username}) — skipped`);
    return;
  }
  const username = need("ADMIN_USERNAME").trim().toLowerCase();
  const email = need("ADMIN_EMAIL").trim().toLowerCase();
  const password = need("ADMIN_PASSWORD");
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters");
  await prisma.user.create({
    data: {
      username,
      email,
      displayName: "Admin",
      role: "ADMIN",
      passwordHash: await hash(password, ARGON2),
      mustChangePassword: true,
      isActive: true,
    },
  });
  console.log(`admin: created "${username}" (mustChangePassword=true)`);
}

async function seedTimetable() {
  const file = parseTimetable(
    JSON.parse(readFileSync(contentDir("timetable", "1B3-2026.json"), "utf8")),
  );
  const validFrom = parseIsoDate(file.validFrom);
  const timetable = await prisma.timetable.upsert({
    where: {
      className_schoolYear_validFrom: {
        className: file.className,
        schoolYear: file.schoolYear,
        validFrom,
      },
    },
    create: { className: file.className, schoolYear: file.schoolYear, validFrom },
    update: {},
  });
  const rows = flattenTimetable(file);
  for (const r of rows) {
    await prisma.timetableSlot.upsert({
      where: {
        timetableId_weekday_period: {
          timetableId: timetable.id,
          weekday: r.weekday,
          period: r.period,
        },
      },
      create: {
        timetableId: timetable.id,
        weekday: r.weekday,
        period: r.period,
        timeFrom: r.timeFrom,
        timeTo: r.timeTo,
        subjectLabelVi: r.subjectLabelVi,
        subjectLabelEn: r.subjectLabelEn,
        subject: r.subject,
        isNative: r.isNative,
      },
      update: {
        timeFrom: r.timeFrom,
        timeTo: r.timeTo,
        subjectLabelVi: r.subjectLabelVi,
        subjectLabelEn: r.subjectLabelEn,
        subject: r.subject,
        isNative: r.isNative,
      },
    });
  }
  console.log(`timetable: ${file.className} ${file.schoolYear}, ${rows.length} slots`);
}

async function seedSchoolWeeks() {
  const start = parseIsoDate(process.env.SCHOOL_YEAR_START ?? "2026-09-08");
  const schoolYear = `${start.getUTCFullYear()}-${start.getUTCFullYear() + 1}`;
  const weeks = buildSchoolWeeks(start);
  // Only create missing weeks: parents may edit dates/holidays in admin later (docs/11 §5).
  let created = 0;
  for (const w of weeks) {
    const exists = await prisma.schoolWeek.findUnique({
      where: { schoolYear_weekNo: { schoolYear, weekNo: w.weekNo } },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.schoolWeek.create({
      data: {
        schoolYear,
        weekNo: w.weekNo,
        dateFrom: w.dateFrom,
        dateTo: w.dateTo,
        term: w.term,
        isHoliday: w.isHoliday,
        note: w.note,
      },
    });
    created++;
  }
  console.log(`school weeks: ${weeks.length} for ${schoolYear} (${created} created)`);
}

async function seedAiConfig() {
  await prisma.aiConfig.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      modelByTask: {},
      dailyBudgetUsd: 0,
      cacheEnabled: true,
      autoApprove: {},
      ttsProvider: process.env.TTS_PROVIDER ?? "webspeech",
      sttProvider: "webspeech",
    },
    update: {},
  });
  console.log("ai config: default row present (no LLM provider — ADR-10)");
}

const BADGES = [
  {
    code: "FIRST_QUEST",
    nameVi: "Nhiệm vụ đầu tiên",
    nameEn: "First quest",
    icon: "🎉",
    rule: { type: "sessions_completed", count: 1 },
  },
  {
    code: "STREAK_3",
    nameVi: "3 ngày liên tiếp",
    nameEn: "3-day streak",
    icon: "🔥",
    rule: { type: "streak", days: 3 },
  },
  {
    code: "STREAK_7",
    nameVi: "7 ngày liên tiếp",
    nameEn: "7-day streak",
    icon: "🌟",
    rule: { type: "streak", days: 7 },
  },
  {
    code: "STARS_50",
    nameVi: "50 ngôi sao",
    nameEn: "50 stars",
    icon: "⭐",
    rule: { type: "stars_total", count: 50 },
  },
  {
    code: "STARS_200",
    nameVi: "200 ngôi sao",
    nameEn: "200 stars",
    icon: "🌠",
    rule: { type: "stars_total", count: 200 },
  },
  {
    code: "READER_10",
    nameVi: "Đọc to 10 lần",
    nameEn: "Read aloud 10 times",
    icon: "📖",
    rule: { type: "exercise_type_count", exerciseType: "READ_ALOUD", count: 10 },
  },
  {
    code: "MATH_MASTER_1",
    nameVi: "Thành thạo kỹ năng Toán đầu tiên",
    nameEn: "First maths skill mastered",
    icon: "🧮",
    rule: { type: "skills_mastered", subject: "VMATH", count: 1 },
  },
  {
    code: "ENGLISH_MASTER_1",
    nameVi: "Thành thạo kỹ năng tiếng Anh đầu tiên",
    nameEn: "First English skill mastered",
    icon: "🗣️",
    rule: { type: "skills_mastered", subject: "ESL", count: 1 },
  },
];

async function seedBadges() {
  for (const b of BADGES) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: { nameVi: b.nameVi, nameEn: b.nameEn, icon: b.icon, rule: b.rule },
    });
  }
  console.log(`badges: ${BADGES.length}`);
}

/** Dev-only sample profiles (docs/03 §4 4b). A Student needs a CHILD user, so both are created. */
async function seedDevStudents() {
  const samples = [
    {
      username: "thy",
      slug: "thy",
      displayName: "Thy",
      fullName: "Mai Thy",
      nickname: "Thy",
      avatarKey: "girl-1",
      interests: ["múa", "vẽ", "công chúa", "động vật"],
      mascot: "OWL" as const,
      pin: ["cat", "rabbit", "butterfly", "fish"],
    },
    {
      username: "thanh",
      slug: "thanh",
      displayName: "Thanh",
      fullName: "Chí Thanh",
      nickname: "Thanh",
      avatarKey: "boy-1",
      interests: ["máy móc", "robot", "cờ vua", "đàn", "xe cộ"],
      mascot: "ROBOT" as const,
      pin: ["dog", "lion", "elephant", "turtle"],
    },
  ];
  for (const s of samples) {
    const user = await prisma.user.upsert({
      where: { username: s.username },
      create: {
        username: s.username,
        displayName: s.displayName,
        avatarKey: s.avatarKey,
        role: "CHILD",
        picturePinHash: await hash(pinToSecret(s.pin), ARGON2),
        pictureSetKey: DEFAULT_PICTURE_SET_KEY,
        isActive: true,
      },
      update: {},
    });
    await prisma.student.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        slug: s.slug,
        fullName: s.fullName,
        nickname: s.nickname,
        avatarKey: s.avatarKey,
        birthDate: new Date(Date.UTC(2020, 0, 1)),
        grade: 1,
        className: "1B3",
        schoolYear: "2026-2027",
        interests: s.interests,
        mascot: s.mascot,
        settings: {
          dailyMinutes: 15,
          suggestedTime: "19:30",
          voiceTutorEnabled: false,
          difficultyBias: 0,
        },
      },
      update: {},
    });
    console.log(`dev student: ${s.nickname} (user "${s.username}", pin ${s.pin.join(" > ")})`);
  }
}

/**
 * Skill map, lesson-unit skeletons and error codes (docs/08 pha 1 việc 1).
 * Validates the files first and refuses to touch the DB when they are inconsistent.
 * Only Skill/SkillPrerequisite/Material/LessonUnit/LessonUnitSkill/ErrorCode/ContentBatch —
 * never Evidence/SkillMastery/Session/Attempt.
 */
async function seedSkillMap() {
  const maps = loadSkillMaps();
  const unitFiles = loadLessonUnitFiles();
  const taxonomy = loadErrorTaxonomy();
  if (maps.length === 0) {
    console.log("skill map: no files in content/skill-map — skipped");
    return;
  }
  const lessonCodes = new Set(unitFiles.flatMap((f) => f.units.units.map((u) => u.code)));
  const skillCodes = new Set(maps.flatMap((m) => m.map.skills.map((s) => s.code)));
  const check = validateSkillMaps(maps, lessonCodes);
  const unitIssues = validateLessonUnits(unitFiles, skillCodes);
  const taxIssues = taxonomy ? validateErrorTaxonomy(taxonomy, skillCodes) : [];
  if (check.errors.length || unitIssues.length || taxIssues.length) {
    for (const e of check.errors) console.error(`  ${e.file} [${e.code ?? "-"}]: ${e.message}`);
    for (const e of unitIssues) console.error(`  ${e.file} [${e.code ?? "-"}]: ${e.message}`);
    for (const e of taxIssues) console.error(`  error-taxonomy.json: ${e}`);
    throw new Error("content/ is invalid — run `pnpm skills:validate` (nothing was written)");
  }

  const skills = await importSkillMaps(
    prisma,
    maps.map((m) => m.map),
    { note: `seed: ${maps.map((m) => m.map.subject).join(", ")}` },
  );
  const units = await importLessonUnits(
    prisma,
    unitFiles.map((f) => f.units),
  );
  const links = await linkSkillLessonRefs(
    prisma,
    maps.map((m) => m.map),
  );
  console.log(
    `skill map: ${skills.total} skills (${skills.created} new, ${skills.updated} updated, ${skills.retired} retired), ${skills.prerequisites} prerequisites`,
  );
  console.log(
    `lesson units: ${units.created + units.updated} in ${units.materials} materials (${units.created} new), ${units.links + links} skill links`,
  );
  if (taxonomy) {
    const errs = await importErrorCodes(prisma, taxonomy);
    console.log(
      `error codes: ${taxonomy.codes.length} (${errs.created} new, ${errs.updated} updated, ${errs.retired} retired)`,
    );
  } else {
    console.log("error codes: content/error-taxonomy.json missing — skipped");
  }
}

async function main() {
  const dev = process.env.SEED_DEV === "1" || process.argv.includes("--dev");
  if (dev && process.env.NODE_ENV === "production") {
    throw new Error("SEED_DEV is not allowed with NODE_ENV=production");
  }
  await seedAdmin();
  await seedTimetable();
  await seedSchoolWeeks();
  await seedAiConfig();
  await seedBadges();
  await seedSkillMap();
  if (dev) await seedDevStudents();
  const counts = {
    users: await prisma.user.count(),
    skills: await prisma.skill.count(),
    skillPrerequisites: await prisma.skillPrerequisite.count(),
    lessonUnits: await prisma.lessonUnit.count(),
    materials: await prisma.material.count(),
    errorCodes: await prisma.errorCode.count(),
    timetableSlots: await prisma.timetableSlot.count(),
    schoolWeeks: await prisma.schoolWeek.count(),
    badges: await prisma.badge.count(),
  };
  console.log("seed done:", JSON.stringify(counts));
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
