-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "LoginResult" AS ENUM ('OK', 'WRONG_PASSWORD', 'LOCKED', 'NO_SUCH_USER', 'DISABLED');

-- CreateEnum
CREATE TYPE "Mascot" AS ENUM ('ROBOT', 'OWL');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('ESL', 'ENL', 'EMATH', 'ESCI', 'VIET', 'VMATH');

-- CreateEnum
CREATE TYPE "SkillSource" AS ENUM ('SEED', 'ADMIN', 'AI');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('NOT_STARTED', 'LEARNING', 'NEEDS_PRACTICE', 'SOLID', 'MASTERED');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('ACTIVE', 'PASSED', 'NEEDS_PARENT');

-- CreateEnum
CREATE TYPE "MasteryCause" AS ENUM ('EVIDENCE', 'DECAY', 'PARENT_OVERRIDE', 'RECALC');

-- CreateEnum
CREATE TYPE "EvidenceSource" AS ENUM ('EXERCISE', 'INTAKE_PHOTO', 'INTAKE_TEACHER_NOTE', 'HOMEWORK', 'EXTERNAL_REPORT', 'PARENT_NOTE', 'PARENT_OVERRIDE', 'VOICE_TUTOR');

-- CreateEnum
CREATE TYPE "EvidenceOutcome" AS ENUM ('CORRECT', 'PARTIAL', 'INCORRECT', 'OBSERVED');

-- CreateEnum
CREATE TYPE "IntakeKind" AS ENUM ('PHOTO_BATCH', 'MATERIAL');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('QUEUED', 'PROCESSING', 'PENDING_REVIEW', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('WORKBOOK', 'TEST', 'WORKSHEET', 'TEACHER_NOTE', 'CLASS_DIARY', 'NAVIO_REPORT', 'KIDSAZ_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "IntakeItemOutcome" AS ENUM ('CORRECT', 'PARTIAL', 'INCORRECT', 'BLANK', 'UNGRADED');

-- CreateEnum
CREATE TYPE "ExternalPlatform" AS ENUM ('NAVIO', 'KIDSAZ');

-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('TEXTBOOK', 'CURRICULUM', 'WORKSHEET', 'WEEKLY_NOTICE', 'OTHER');

-- CreateEnum
CREATE TYPE "HomeworkTaskType" AS ENUM ('READ_ALOUD', 'WRITE', 'WORKSHEET', 'VIDEO_SUBMIT', 'ONLINE_APP', 'BRING_ITEM', 'OTHER');

-- CreateEnum
CREATE TYPE "HomeworkStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReminderKind" AS ENUM ('UNIFORM', 'BRING', 'EVENT', 'SCHEDULE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExerciseType" AS ENUM ('MCQ', 'LISTEN_CHOOSE', 'DRAG_DROP', 'READ_ALOUD', 'COUNT_TAP', 'WRITE_PHOTO', 'SPEAK_ANSWER', 'TRACE', 'MINI_STORY');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'vi');

-- CreateEnum
CREATE TYPE "GeneratedBy" AS ENUM ('CLAUDE_CODE', 'AI_RUNTIME', 'HUMAN');

-- CreateEnum
CREATE TYPE "ExerciseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AssetTheme" AS ENUM ('NEUTRAL', 'ROBOT', 'GARDEN');

-- CreateEnum
CREATE TYPE "QualityFlag" AS ENUM ('OK', 'GOOD', 'BAD', 'UNREVIEWED');

-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('DAILY_QUEST', 'FREE_PLAY', 'TARGETED', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GradedBy" AS ENUM ('LOCAL', 'AI', 'PARENT', 'PENDING');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('PROPOSED', 'APPROVED', 'ACTIVE', 'DONE', 'REJECTED');

-- CreateEnum
CREATE TYPE "PlanCreator" AS ENUM ('AI', 'PARENT');

-- CreateEnum
CREATE TYPE "PlanHintCreator" AS ENUM ('CLAUDE_CODE', 'PARENT');

-- CreateEnum
CREATE TYPE "ReportKind" AS ENUM ('WEEKLY', 'MONTHLY', 'ADHOC');

-- CreateEnum
CREATE TYPE "RewardGoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KidMailFrom" AS ENUM ('PARENT', 'CHARACTER', 'TEACHER_PRAISE');

-- CreateEnum
CREATE TYPE "MascotMemoryKind" AS ENUM ('YESTERDAY_WIN', 'INTEREST', 'SCHEDULE', 'EVENT');

-- CreateEnum
CREATE TYPE "CertificateKind" AS ENUM ('TOPIC', 'MONTH', 'SPECIAL');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('KID', 'PARENT');

-- CreateEnum
CREATE TYPE "ContentBatchKind" AS ENUM ('SKILL_MAP', 'LESSONS', 'EXERCISES', 'ART', 'INTAKE');

-- CreateEnum
CREATE TYPE "InboxKind" AS ENUM ('PHOTO_INTAKE', 'DIARY_HARD', 'WRITE_PHOTO_GRADE', 'SPEAK_GRADE', 'WEEKLY_REPORT');

-- CreateEnum
CREATE TYPE "InboxStatus" AS ENUM ('PENDING', 'PULLED', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "AiTask" AS ENUM ('INTAKE_EXTRACT', 'INTAKE_MAP', 'GRADE', 'PLAN', 'REPORT', 'ASSIST_PARENT', 'ASSIST_KID', 'EMBED', 'TTS', 'STT', 'EXERCISE_GEN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarKey" TEXT,
    "email" TEXT,
    "role" "Role" NOT NULL,
    "passwordHash" TEXT,
    "picturePinHash" TEXT,
    "pictureSetKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "locale" TEXT NOT NULL DEFAULT 'vi',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "usernameTried" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "result" "LoginResult" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "approvedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarKey" TEXT,
    "birthDate" TIMESTAMP(3),
    "grade" INTEGER NOT NULL DEFAULT 1,
    "className" TEXT NOT NULL DEFAULT '1B3',
    "schoolYear" TEXT NOT NULL DEFAULT '2026-2027',
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mascot" "Mascot" NOT NULL DEFAULT 'ROBOT',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardian" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'ba',
    "canApprove" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "strand" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "standardRef" TEXT,
    "gradeLevel" TEXT NOT NULL DEFAULT '1',
    "order" INTEGER NOT NULL DEFAULT 0,
    "expectedWeek" INTEGER,
    "exerciseTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficultyMin" INTEGER NOT NULL DEFAULT 1,
    "difficultyMax" INTEGER NOT NULL DEFAULT 5,
    "relatedSkillCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" "SkillSource" NOT NULL DEFAULT 'SEED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillPrerequisite" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "SkillPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillMastery" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidenceCount" INTEGER NOT NULL DEFAULT 0,
    "lastEvidenceAt" TIMESTAMP(3),
    "trend14d" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MasteryStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "nextReviewAt" TIMESTAMP(3),
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorStat" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "errorCode" TEXT NOT NULL,
    "count7d" INTEGER NOT NULL DEFAULT 0,
    "count30d" INTEGER NOT NULL DEFAULT 0,
    "lastAt" TIMESTAMP(3),
    "lastEvidenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemediationTrack" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "errorCode" TEXT,
    "rung" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastStepAt" TIMESTAMP(3),
    "status" "RemediationStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemediationTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasteryHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "masteryBefore" DOUBLE PRECISION NOT NULL,
    "masteryAfter" DOUBLE PRECISION NOT NULL,
    "confidenceAfter" DOUBLE PRECISION NOT NULL,
    "cause" "MasteryCause" NOT NULL,
    "evidenceId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasteryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "source" "EvidenceSource" NOT NULL,
    "outcome" "EvidenceOutcome" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "errorCode" TEXT,
    "attemptId" TEXT,
    "intakeItemId" TEXT,
    "note" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeJob" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "createdById" TEXT NOT NULL,
    "kind" "IntakeKind" NOT NULL DEFAULT 'PHOTO_BATCH',
    "status" "IntakeStatus" NOT NULL DEFAULT 'QUEUED',
    "subjectHint" "Subject",
    "dateHint" TIMESTAMP(3),
    "files" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "aiCallIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeResult" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "docType" "DocType" NOT NULL DEFAULT 'OTHER',
    "subject" "Subject",
    "detectedStudent" TEXT,
    "summary" TEXT NOT NULL DEFAULT '',
    "teacherComment" TEXT,
    "rawExtraction" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntakeItem" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL DEFAULT '',
    "studentAnswer" TEXT,
    "expectedAnswer" TEXT,
    "outcome" "IntakeItemOutcome" NOT NULL DEFAULT 'UNGRADED',
    "errorCode" TEXT,
    "skillCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skillCodesFinal" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bbox" JSONB,
    "fileIndex" INTEGER NOT NULL DEFAULT 0,
    "evidenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntakeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "platform" "ExternalPlatform" NOT NULL,
    "metric" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueNum" DOUBLE PRECISION,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceIntakeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" "Subject",
    "kind" "MaterialKind" NOT NULL DEFAULT 'TEXTBOOK',
    "term" INTEGER,
    "files" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "pageCount" INTEGER,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonUnit" (
    "id" TEXT NOT NULL,
    "materialId" TEXT,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vocabulary" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "concepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sampleTasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pageFrom" INTEGER,
    "pageTo" INTEGER,
    "contentText" TEXT,
    "weekFrom" INTEGER,
    "weekTo" INTEGER,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonUnitSkill" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "LessonUnitSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassDiary" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "rawText" TEXT NOT NULL,
    "sourceIntakeId" TEXT,
    "parsedAt" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassDiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryLesson" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT NOT NULL,
    "subject" "Subject",
    "subjectLabel" TEXT NOT NULL DEFAULT '',
    "lessonRefText" TEXT NOT NULL,
    "lessonUnitId" TEXT,
    "unit" TEXT,
    "lesson" TEXT,
    "pages" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "contentNote" TEXT,
    "skillCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT,
    "studentId" TEXT NOT NULL,
    "subject" "Subject",
    "taskType" "HomeworkTaskType" NOT NULL DEFAULT 'OTHER',
    "text" TEXT NOT NULL,
    "repeatCount" INTEGER,
    "pages" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "skillCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "status" "HomeworkStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "doneAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "artifactKey" TEXT,
    "submitTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassReminder" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT NOT NULL,
    "kind" "ReminderKind" NOT NULL DEFAULT 'OTHER',
    "text" TEXT NOT NULL,
    "forDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "type" "ExerciseType" NOT NULL,
    "subject" "Subject" NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'vi',
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "spec" JSONB NOT NULL,
    "answerKey" JSONB NOT NULL,
    "explanation" TEXT,
    "assets" JSONB NOT NULL DEFAULT '[]',
    "lessonUnitId" TEXT,
    "generatedBy" "GeneratedBy" NOT NULL DEFAULT 'CLAUDE_CODE',
    "stableId" TEXT NOT NULL,
    "sourceFile" TEXT,
    "sourceRef" TEXT,
    "batchId" TEXT,
    "status" "ExerciseStatus" NOT NULL DEFAULT 'DRAFT',
    "assetTheme" "AssetTheme" NOT NULL DEFAULT 'NEUTRAL',
    "targetsError" TEXT,
    "promptVersion" TEXT,
    "qualityFlag" "QualityFlag" NOT NULL DEFAULT 'UNREVIEWED',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "contentHash" TEXT NOT NULL,
    "personalizedFor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSkill" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "ExerciseSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "SessionKind" NOT NULL DEFAULT 'DAILY_QUEST',
    "planId" TEXT,
    "date" DATE NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED',
    "slots" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "starsEarned" INTEGER NOT NULL DEFAULT 0,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "generationLog" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "response" JSONB NOT NULL DEFAULT '{}',
    "isCorrect" BOOLEAN,
    "score" DOUBLE PRECISION,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "tries" INTEGER NOT NULL DEFAULT 0,
    "timeMs" INTEGER NOT NULL DEFAULT 0,
    "gradedBy" "GradedBy" NOT NULL DEFAULT 'PENDING',
    "aiFeedback" JSONB,
    "audioKey" TEXT,
    "photoKey" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'PROPOSED',
    "rationale" TEXT,
    "createdBy" "PlanCreator" NOT NULL DEFAULT 'AI',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "reason" TEXT,
    "targetMastery" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "sessionsPlanned" INTEGER NOT NULL DEFAULT 0,
    "sessionsDone" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanHint" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3) NOT NULL,
    "focusSkills" JSONB NOT NULL DEFAULT '[]',
    "focusErrors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoidSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "note" TEXT,
    "createdBy" "PlanHintCreator" NOT NULL DEFAULT 'CLAUDE_CODE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanHint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "ReportKind" NOT NULL DEFAULT 'WEEKLY',
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "contentMd" TEXT NOT NULL DEFAULT '',
    "data" JSONB NOT NULL DEFAULT '{}',
    "aiCallId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "longest" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "rule" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentBadge" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "badgeCode" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StarLedger" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardGoal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "starsNeeded" INTEGER NOT NULL,
    "starsSpent" INTEGER NOT NULL DEFAULT 0,
    "status" "RewardGoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collectible" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL DEFAULT '',
    "cost" INTEGER NOT NULL DEFAULT 10,
    "category" TEXT NOT NULL DEFAULT 'misc',
    "assetKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collectible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCollectible" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "collectibleCode" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "placement" JSONB,

    CONSTRAINT "StudentCollectible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "lottieKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPet" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "petCode" TEXT NOT NULL,
    "hatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompanion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StudentPet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EggProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "cracks" INTEGER NOT NULL DEFAULT 0,
    "hatchedPetCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EggProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPicture" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "theme" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "pieces" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPicture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPicturePiece" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "pieceIndex" INTEGER NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPicturePiece_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KidMail" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromKind" "KidMailFrom" NOT NULL DEFAULT 'PARENT',
    "fromUserId" TEXT,
    "text" TEXT NOT NULL,
    "audioKey" TEXT,
    "giftCode" TEXT,
    "deliverOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KidMail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MascotMemory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "MascotMemoryKind" NOT NULL,
    "text" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MascotMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "CertificateKind" NOT NULL DEFAULT 'TOPIC',
    "title" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pdfKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "userId" TEXT,
    "audience" "Audience" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "audioKey" TEXT,
    "filtered" BOOLEAN NOT NULL DEFAULT false,
    "filterReason" TEXT,
    "aiCallId" TEXT,
    "senderUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timetable" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Timetable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "timetableId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "timeFrom" TEXT NOT NULL,
    "timeTo" TEXT NOT NULL,
    "subjectLabelVi" TEXT NOT NULL,
    "subjectLabelEn" TEXT NOT NULL,
    "subject" "Subject",
    "isNative" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolWeek" (
    "id" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "weekNo" INTEGER NOT NULL,
    "dateFrom" DATE NOT NULL,
    "dateTo" DATE NOT NULL,
    "term" INTEGER NOT NULL DEFAULT 1,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentBatch" (
    "id" TEXT NOT NULL,
    "kind" "ContentBatchKind" NOT NULL,
    "sourceDir" TEXT NOT NULL,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "retired" INTEGER NOT NULL DEFAULT 0,
    "runBy" TEXT NOT NULL DEFAULT 'claude-code',
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboxItem" (
    "id" TEXT NOT NULL,
    "kind" "InboxKind" NOT NULL,
    "studentId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "InboxStatus" NOT NULL DEFAULT 'PENDING',
    "pulledAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "resultRef" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboxItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCall" (
    "id" TEXT NOT NULL,
    "task" "AiTask" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OK',
    "error" TEXT,
    "inputSummary" TEXT,
    "outputRef" TEXT,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "modelByTask" JSONB NOT NULL DEFAULT '{}',
    "dailyBudgetUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cacheEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" JSONB NOT NULL DEFAULT '{}',
    "ttsProvider" TEXT NOT NULL DEFAULT 'webspeech',
    "sttProvider" TEXT NOT NULL DEFAULT 'webspeech',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "task" "AiTask" NOT NULL,
    "version" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "detail" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LoginAudit_userId_at_idx" ON "LoginAudit"("userId", "at" DESC);

-- CreateIndex
CREATE INDEX "LoginAudit_ip_at_idx" ON "LoginAudit"("ip", "at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_tokenHash_key" ON "TrustedDevice"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_slug_key" ON "Student"("slug");

-- CreateIndex
CREATE INDEX "StudentGuardian_studentId_idx" ON "StudentGuardian"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGuardian_userId_studentId_key" ON "StudentGuardian"("userId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_code_key" ON "Skill"("code");

-- CreateIndex
CREATE INDEX "Skill_subject_strand_order_idx" ON "Skill"("subject", "strand", "order");

-- CreateIndex
CREATE UNIQUE INDEX "SkillPrerequisite_skillId_prerequisiteId_key" ON "SkillPrerequisite"("skillId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "SkillMastery_studentId_status_idx" ON "SkillMastery"("studentId", "status");

-- CreateIndex
CREATE INDEX "SkillMastery_studentId_nextReviewAt_idx" ON "SkillMastery"("studentId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "SkillMastery_studentId_skillId_key" ON "SkillMastery"("studentId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorStat_studentId_errorCode_key" ON "ErrorStat"("studentId", "errorCode");

-- CreateIndex
CREATE INDEX "RemediationTrack_studentId_status_idx" ON "RemediationTrack"("studentId", "status");

-- CreateIndex
CREATE INDEX "MasteryHistory_studentId_skillId_at_idx" ON "MasteryHistory"("studentId", "skillId", "at" DESC);

-- CreateIndex
CREATE INDEX "Evidence_studentId_skillId_observedAt_idx" ON "Evidence"("studentId", "skillId", "observedAt" DESC);

-- CreateIndex
CREATE INDEX "IntakeJob_status_createdAt_idx" ON "IntakeJob"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeItem_resultId_index_key" ON "IntakeItem"("resultId", "index");

-- CreateIndex
CREATE INDEX "ExternalProgress_studentId_platform_metric_observedAt_idx" ON "ExternalProgress"("studentId", "platform", "metric", "observedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LessonUnit_code_key" ON "LessonUnit"("code");

-- CreateIndex
CREATE INDEX "LessonUnit_subject_weekFrom_idx" ON "LessonUnit"("subject", "weekFrom");

-- CreateIndex
CREATE UNIQUE INDEX "LessonUnitSkill_unitId_skillId_key" ON "LessonUnitSkill"("unitId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassDiary_className_date_key" ON "ClassDiary"("className", "date");

-- CreateIndex
CREATE INDEX "Homework_studentId_status_dueDate_idx" ON "Homework"("studentId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_stableId_key" ON "Exercise"("stableId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_contentHash_key" ON "Exercise"("contentHash");

-- CreateIndex
CREATE INDEX "Exercise_status_subject_difficulty_type_idx" ON "Exercise"("status", "subject", "difficulty", "type");

-- CreateIndex
CREATE INDEX "Exercise_status_assetTheme_idx" ON "Exercise"("status", "assetTheme");

-- CreateIndex
CREATE INDEX "Exercise_targetsError_idx" ON "Exercise"("targetsError");

-- CreateIndex
CREATE INDEX "ExerciseSkill_skillId_idx" ON "ExerciseSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSkill_exerciseId_skillId_key" ON "ExerciseSkill"("exerciseId", "skillId");

-- CreateIndex
CREATE INDEX "Session_studentId_date_idx" ON "Session"("studentId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Attempt_sessionId_order_key" ON "Attempt"("sessionId", "order");

-- CreateIndex
CREATE INDEX "Plan_studentId_weekStart_idx" ON "Plan"("studentId", "weekStart" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PlanItem_planId_skillId_key" ON "PlanItem"("planId", "skillId");

-- CreateIndex
CREATE INDEX "PlanHint_studentId_validTo_idx" ON "PlanHint"("studentId", "validTo");

-- CreateIndex
CREATE INDEX "Report_studentId_periodStart_idx" ON "Report"("studentId", "periodStart" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Streak_studentId_key" ON "Streak"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_code_key" ON "Badge"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentBadge_studentId_badgeCode_key" ON "StudentBadge"("studentId", "badgeCode");

-- CreateIndex
CREATE INDEX "StarLedger_studentId_at_idx" ON "StarLedger"("studentId", "at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Collectible_code_key" ON "Collectible"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCollectible_studentId_collectibleCode_key" ON "StudentCollectible"("studentId", "collectibleCode");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_code_key" ON "Pet"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPet_studentId_petCode_key" ON "StudentPet"("studentId", "petCode");

-- CreateIndex
CREATE UNIQUE INDEX "EggProgress_studentId_weekStart_key" ON "EggProgress"("studentId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPicture_weekStart_key" ON "WeeklyPicture"("weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPicturePiece_studentId_weekStart_pieceIndex_key" ON "StudentPicturePiece"("studentId", "weekStart", "pieceIndex");

-- CreateIndex
CREATE INDEX "KidMail_studentId_deliverOn_idx" ON "KidMail"("studentId", "deliverOn");

-- CreateIndex
CREATE INDEX "MascotMemory_studentId_validTo_idx" ON "MascotMemory"("studentId", "validTo");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Timetable_className_schoolYear_validFrom_key" ON "Timetable"("className", "schoolYear", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableSlot_timetableId_weekday_period_key" ON "TimetableSlot"("timetableId", "weekday", "period");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolWeek_schoolYear_weekNo_key" ON "SchoolWeek"("schoolYear", "weekNo");

-- CreateIndex
CREATE INDEX "InboxItem_status_createdAt_idx" ON "InboxItem"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AiCall_task_at_idx" ON "AiCall"("task", "at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_task_version_key" ON "PromptTemplate"("task", "version");

-- CreateIndex
CREATE INDEX "AuditLog_userId_at_idx" ON "AuditLog"("userId", "at" DESC);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAudit" ADD CONSTRAINT "LoginAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillMastery" ADD CONSTRAINT "SkillMastery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillMastery" ADD CONSTRAINT "SkillMastery_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorStat" ADD CONSTRAINT "ErrorStat_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationTrack" ADD CONSTRAINT "RemediationTrack_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemediationTrack" ADD CONSTRAINT "RemediationTrack_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryHistory" ADD CONSTRAINT "MasteryHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryHistory" ADD CONSTRAINT "MasteryHistory_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_intakeItemId_fkey" FOREIGN KEY ("intakeItemId") REFERENCES "IntakeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeJob" ADD CONSTRAINT "IntakeJob_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeJob" ADD CONSTRAINT "IntakeJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeResult" ADD CONSTRAINT "IntakeResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "IntakeJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeResult" ADD CONSTRAINT "IntakeResult_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntakeItem" ADD CONSTRAINT "IntakeItem_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "IntakeResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalProgress" ADD CONSTRAINT "ExternalProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalProgress" ADD CONSTRAINT "ExternalProgress_sourceIntakeId_fkey" FOREIGN KEY ("sourceIntakeId") REFERENCES "IntakeJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonUnit" ADD CONSTRAINT "LessonUnit_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonUnitSkill" ADD CONSTRAINT "LessonUnitSkill_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "LessonUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonUnitSkill" ADD CONSTRAINT "LessonUnitSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassDiary" ADD CONSTRAINT "ClassDiary_sourceIntakeId_fkey" FOREIGN KEY ("sourceIntakeId") REFERENCES "IntakeJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryLesson" ADD CONSTRAINT "DiaryLesson_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "ClassDiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryLesson" ADD CONSTRAINT "DiaryLesson_lessonUnitId_fkey" FOREIGN KEY ("lessonUnitId") REFERENCES "LessonUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "ClassDiary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassReminder" ADD CONSTRAINT "ClassReminder_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "ClassDiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_lessonUnitId_fkey" FOREIGN KEY ("lessonUnitId") REFERENCES "LessonUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ContentBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSkill" ADD CONSTRAINT "ExerciseSkill_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSkill" ADD CONSTRAINT "ExerciseSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanHint" ADD CONSTRAINT "PlanHint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBadge" ADD CONSTRAINT "StudentBadge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentBadge" ADD CONSTRAINT "StudentBadge_badgeCode_fkey" FOREIGN KEY ("badgeCode") REFERENCES "Badge"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StarLedger" ADD CONSTRAINT "StarLedger_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardGoal" ADD CONSTRAINT "RewardGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCollectible" ADD CONSTRAINT "StudentCollectible_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCollectible" ADD CONSTRAINT "StudentCollectible_collectibleCode_fkey" FOREIGN KEY ("collectibleCode") REFERENCES "Collectible"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPet" ADD CONSTRAINT "StudentPet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPet" ADD CONSTRAINT "StudentPet_petCode_fkey" FOREIGN KEY ("petCode") REFERENCES "Pet"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EggProgress" ADD CONSTRAINT "EggProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPicturePiece" ADD CONSTRAINT "StudentPicturePiece_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KidMail" ADD CONSTRAINT "KidMail_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KidMail" ADD CONSTRAINT "KidMail_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MascotMemory" ADD CONSTRAINT "MascotMemory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboxItem" ADD CONSTRAINT "InboxItem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
