# 03 — MÔ HÌNH DỮ LIỆU

> Schema mục tiêu cho Prisma/PostgreSQL. Dev viết `packages/db/prisma/schema.prisma` theo đây; tên bảng/cột tiếng Anh, chú thích tiếng Việt. Mọi bảng có `id` (cuid), `createdAt`, `updatedAt` trừ khi ghi khác.

---

## 1. Sơ đồ quan hệ (tổng quát)

```
User (ADMIN|PARENT|CHILD) ; LoginAudit ; TrustedDevice
User ─1:1─ Student  (khi role=CHILD)
User ─┬─< StudentGuardian >─ Student ─┬─< SkillMastery >─ Skill ─< SkillPrerequisite
      │                               ├─< Evidence ──────────┘        │
      │                               ├─< Session ─< Attempt ─ Exercise ─< ExerciseSkill ─┘
      │                               ├─< Plan ─< PlanItem ─────────────────────────────┘
      │                               ├─< Report
      │                               ├─< ExternalProgress
      │                               ├─< Reward / Badge / Streak
      │                               └─< Conversation ─< Message
      └─< IntakeJob ─< IntakeResult ─< IntakeItem
Material ─< LessonUnit ─< LessonUnitSkill ─ Skill
Timetable ─< TimetableSlot ; SchoolWeek
ClassDiary ─┬─< DiaryLesson ─ LessonUnit
            ├─< Homework ──── Student
            └─< ClassReminder
AiCall ; AiConfig ; PromptTemplate ; Setting
```

## 2. Các thực thể

### 2.1 Người dùng & học sinh

**User** (một bảng cho cả nhà — xem `12-NGUOI-DUNG-DANG-NHAP.md`) — `username` (duy nhất, không dấu: `admin|ba|me|thy|thanh`), `displayName`, `avatarKey`, `email?` (bắt buộc với `ADMIN`/`PARENT`, trống với `CHILD`), `role` (enum **`ADMIN|PARENT|CHILD`**), `passwordHash?` (Argon2id — người lớn), `picturePinHash?` (Argon2id — chuỗi 4 hình của con), `pictureSetKey?` (bộ hình dùng cho lưới chọn), `isActive`, `mustChangePassword`, `failedCount`, `lockedUntil?`, `lastLoginAt?`, `locale` (vi), `createdById?`.

**LoginAudit** — `userId?`, `usernameTried`, `ip`, `userAgent`, `result` (`OK|WRONG_PASSWORD|LOCKED|NO_SUCH_USER|DISABLED`), `at`. Index `(userId, at desc)`, `(ip, at desc)`.

**TrustedDevice** *(P1)* — `userId`, `tokenHash`, `label`, `approvedById`, `expiresAt`, `lastSeenAt` — dùng cho "thiết bị tin cậy" của phần dành cho con (`12` §6).

**Student** (hồ sơ học tập, nối **1–1** với một `User` có `role=CHILD` qua `userId` unique) — `userId`, `slug` (thy | thanh), `fullName`, `nickname` (tên gọi ở nhà), `avatarKey`, `birthDate`, `grade` (1), `className` (1B3), `schoolYear` (2026-2027), `interests: string[]`, `mascot` (enum), `settings: Json` (`dailyMinutes`, `suggestedTime`, `voiceTutorEnabled`, `difficultyBias`), `isActive`.

**StudentGuardian** — `userId` (`role=PARENT` hoặc `ADMIN`), `studentId`, `relation` (ba/mẹ), `canApprove: boolean`. Phụ huynh **chỉ thấy dữ liệu của con được gắn ở đây**.

### 2.2 Bản đồ kỹ năng

**Skill** — `code` (duy nhất, ví dụ `EM.OA.ADD10` = English Maths / Operations & Algebraic / cộng trong 10), `subject` (enum: `ESL`, `ENL`, `EMATH`, `ESCI`, `VIET`, `VMATH`), `strand` (mạch, ví dụ *Phonics*, *Number & Operations*), `nameVi`, `nameEn`, `description` (mô tả để AI hiểu phạm vi), `standardRef` (ví dụ `CCSS.MATH.1.OA.C.6`, `CT2018.TV1.DOC.3`), `gradeLevel` (K, 1, 2 — cho phép nội dung dưới/trên lớp), `order` (thứ tự trong mạch), `expectedWeek` (tuần học kỳ vọng đạt, nullable), `exerciseTypes: string[]` (dạng bài phù hợp), `difficultyRange` (1–5), `relatedSkillCodes: string[]`, `confusableWith: string[]` (cặp dễ nhầm — thang rèn bậc 5, ADR-13), `searchVector` (tsvector, trigger giữ, ADR-12/13), `isActive`, `source` (SEED|ADMIN|AI).

**SkillPrerequisite** — `skillId`, `prerequisiteId`, `strength` (0–1).

> Không có `SkillEmbedding`/pgvector (ADR-12, ADR-10). Tra cứu kỹ năng bằng chuỗi dùng cột `Skill.searchVector` (`tsvector`, cập nhật bằng trigger từ mã + tên + mô tả + mạch, qua `unaccent`) với chỉ mục GIN — xem ADR-13.

### 2.3 Năng lực & bằng chứng

**SkillMastery** — `studentId`, `skillId` (unique cặp), `mastery` (0–100), `confidence` (0–1), `evidenceCount`, `lastEvidenceAt`, `trend14d` (số), `status` (enum `NOT_STARTED|LEARNING|NEEDS_PRACTICE|SOLID|MASTERED`), `nextReviewAt` (spaced repetition), `intervalDays`, `easeFactor`.

**ErrorCode** (ADR-13) — `code` (khoá chính, ví dụ `nham_b_d`), `subject`, `group`, `nameVi`, `description`, `detection`, `remediation`, `remediationSkills: string[]`, `lessonRefs: string[]`, `behavioural`, `isActive`, `source`. Nguồn sự thật vẫn là `content/error-taxonomy.json`; `pnpm db:seed` nạp vào bảng này để API chặn mã lạ ngay trong transaction.

**ErrorStat** — `studentId`, `errorCode` (mã trong `content/error-taxonomy.json`, `04` §11.1), `count7d`, `count30d`, `lastAt`, `lastEvidenceId`; unique `(studentId, errorCode)`. Cập nhật bởi job khi có `Evidence` mang mã lỗi; là nguồn cho thang rèn và "3 điều cần chú ý".

**RemediationTrack** — `studentId`, `skillId`, `errorCode?`, `rung` (1–6, `04` §11.4), `startedAt`, `lastStepAt`, `status` (`ACTIVE|PASSED|NEEDS_PARENT`), `note`.

**MasteryHistory** — `studentId`, `skillId`, `masteryBefore`, `masteryAfter`, `confidenceAfter`, `cause` (enum `EVIDENCE|DECAY|PARENT_OVERRIDE|RECALC`), `evidenceId?`, `at`.

**Evidence** — `studentId`, `skillId`, `source` (enum `EXERCISE|INTAKE_PHOTO|INTAKE_TEACHER_NOTE|HOMEWORK|EXTERNAL_REPORT|PARENT_NOTE|PARENT_OVERRIDE|VOICE_TUTOR`), `outcome` (enum `CORRECT|PARTIAL|INCORRECT|OBSERVED`), `score` (0–1), `weight` (0–1, theo nguồn), `difficulty` (1–5), `errorCode?` (mã lỗi chuẩn nếu có), `attemptId?`, `intakeItemId?`, `note`, `observedAt`, `createdById?`.

### 2.4 Nạp dữ liệu

**IntakeJob** — `studentId?` (AI có thể đoán), `createdById`, `kind` (enum `PHOTO_BATCH|MATERIAL`), `status` (`QUEUED|PROCESSING|PENDING_REVIEW|NEEDS_REVIEW|APPROVED|REJECTED|FAILED`), `subjectHint?`, `dateHint?`, `files: FileRef[]` (JSON: key, mime, size, width, height), `error?`, `aiCallIds: string[]`.

**IntakeResult** — `jobId`, `docType` (enum `WORKBOOK|TEST|WORKSHEET|TEACHER_NOTE|CLASS_DIARY|NAVIO_REPORT|KIDSAZ_REPORT|OTHER`), `subject`, `detectedStudent?`, `summary`, `teacherComment?`, `rawExtraction: Json` (đúng schema `IntakeExtraction`), `confidence`, `reviewedById?`, `reviewedAt?`.

**IntakeItem** — `resultId`, `index`, `questionText`, `studentAnswer?`, `expectedAnswer?`, `outcome` (`CORRECT|PARTIAL|INCORRECT|BLANK|UNGRADED` — **`BLANK` = con để trống, không đồng nghĩa với sai**, xem `07` §2.2), `errorCode?` (mã chuẩn trong `content/error-taxonomy.json`, `04` §11.1 — ví dụ `nham_b_d`, `dem_thieu_1`), `skillCodes: string[]` (AI đề xuất), `skillCodesFinal: string[]` (sau duyệt), `bbox?` (vùng ảnh), `fileIndex`, `evidenceIds: string[]`.

**ExternalProgress** — `studentId`, `platform` (`NAVIO|KIDSAZ`), `metric` (ví dụ `raz_level`, `unit_completed`, `stars`), `value` (string), `valueNum?`, `observedAt`, `sourceIntakeId?`.

### 2.5 Giáo trình

**Material** — `title`, `subject`, `kind` (`TEXTBOOK|CURRICULUM|WORKSHEET|WEEKLY_NOTICE|OTHER`), `term`, `files: FileRef[]`, `status`, `pageCount`, `uploadedById`.

**LessonUnit** — `materialId`, `code` (ví dụ `NAVIO-L1-U3`), `title`, `subject`, `objectives: string[]`, `vocabulary: string[]`, `concepts: string[]`, `sampleTasks: string[]`, `pageFrom`, `pageTo`, `contentText` (văn bản đã trích), `weekFrom?`, `weekTo?` (lịch học), `isApproved`. (Không có cột `embedding` — ADR-12.)

**LessonUnitSkill** — `unitId`, `skillId`, `weight`.

### 2.5b Nhật ký lớp & bài cô giao (xem `11-NHAT-KY-LOP.md`)

**ClassDiary** — `className`, `date` (unique cặp className+date), `rawText` (văn bản gốc bài đăng Edi Parent), `sourceIntakeId?`, `parsedAt`, `confidence`.

**DiaryLesson** (đã học hôm nay) — `diaryId`, `subject`, `lessonRefText` ("Bài 13: U u – Ư ư"), `lessonUnitId?` (khớp được thì gắn), `unit?`, `lesson?` (cho ESL: Unit 1 / Lesson 16), `pages: int[]`, `contentNote` ("family members, adjectives, have, to be"), `skillCodes: string[]`.

**Homework** (bài cô giao) — `diaryId?`, `studentId`, `subject`, `taskType` (`READ_ALOUD|WRITE|WORKSHEET|VIDEO_SUBMIT|ONLINE_APP|BRING_ITEM|OTHER`), `text`, `repeatCount?` (ví dụ đọc 5 lần), `pages: int[]`, `skillCodes: string[]`, `optional` (cô "khuyến khích"), `dueDate?`, `status` (`PENDING|IN_PROGRESS|DONE|SKIPPED`), `progress` (ví dụ 3/5), `doneAt?`, `sessionId?` (phiên đã làm), `artifactKey?` (video/ảnh con nộp), `submitTo?` ("Teams – Chương trình Việt").

**ClassReminder** (nhắc phi học tập) — `diaryId`, `kind` (`UNIFORM|BRING|EVENT|SCHEDULE|OTHER`), `text`, `forDate`. Chỉ hiện cho ba mẹ, không sinh bằng chứng.

### 2.6 Bài luyện & phiên học

**Exercise** (ngân hàng bài) — `type` (enum theo 9 dạng: `MCQ|LISTEN_CHOOSE|DRAG_DROP|READ_ALOUD|COUNT_TAP|WRITE_PHOTO|SPEAK_ANSWER|TRACE|MINI_STORY`), `subject`, `language` (`en|vi`), `difficulty` (1–5), `spec: Json` (đúng `ExerciseSpec`, xem `04-AI-DANH-GIA.md` §5), `answerKey: Json`, `explanation` (giải thích ngắn, có bản đọc), `assets: FileRef[]` (audio TTS cache, ảnh), `lessonUnitId?`, `generatedBy` (`CLAUDE_CODE|AI_RUNTIME|HUMAN`), `stableId` (unique — `id` trong file pack, khoá để cập nhật tại chỗ), `sourceFile` (đường dẫn file pack), `sourceRef` (ví dụ "SGV Toán tr.41"), `batchId` (→ `ContentBatch`), `status` (`DRAFT|PUBLISHED|RETIRED` — chỉ `PUBLISHED` mới vào phiên học), `assetTheme` (`NEUTRAL|ROBOT|GARDEN`), `targetsError?` (mã lỗi bài nhắm tới, ví dụ `nham_b_d`), `promptVersion`, `qualityFlag` (`OK|GOOD|BAD|UNREVIEWED`), `usageCount`, `contentHash` (chống trùng), `personalizedFor?` (hiếm dùng — cá nhân hoá chủ yếu bằng chỗ trống lúc hiển thị, `10` §7).

**ExerciseSkill** — `exerciseId`, `skillId`, `weight`.

**Session** — `studentId`, `kind` (`DAILY_QUEST|FREE_PLAY|TARGETED|ASSESSMENT`), `planId?`, `date`, `status` (`PLANNED|IN_PROGRESS|COMPLETED|ABANDONED`), `slots: Json` (danh sách slot đã lên: skillId, exerciseId, order, reason), `startedAt`, `finishedAt`, `durationSec`, `starsEarned`, `summary: Json` (kết quả theo kỹ năng, mascot message), `generationLog: Json`.

**Attempt** — `sessionId`, `exerciseId`, `order`, `response: Json` (đáp án con chọn / transcript / ảnh), `isCorrect?`, `score` (0–1), `hintsUsed`, `tries`, `timeMs`, `gradedBy` (`LOCAL|AI|PARENT|PENDING`), `aiFeedback?` (Json: nhận xét, lỗi), `audioKey?`, `photoKey?`, `gradedAt?`.

### 2.7 Kế hoạch, báo cáo, động lực

**Plan** — `studentId`, `weekStart`, `weekEnd`, `status` (`PROPOSED|APPROVED|ACTIVE|DONE|REJECTED`), `rationale` (AI viết), `createdBy` (`AI|PARENT`), `approvedById?`.
**PlanItem** — `planId`, `skillId`, `priority` (1–5), `reason`, `targetMastery`, `sessionsPlanned`, `sessionsDone`.

**Report** — `studentId`, `kind` (`WEEKLY|MONTHLY|ADHOC`), `periodStart`, `periodEnd`, `contentMd`, `data: Json` (số liệu dùng để viết), `aiCallId`, `sentAt?`.

**Streak** — `studentId`, `current`, `longest`, `lastActiveDate`.
**Badge** — `code`, `nameVi`, `nameEn`, `icon`, `rule: Json`. **StudentBadge** — `studentId`, `badgeCode`, `earnedAt`, `seen`.
**StarLedger** — `studentId`, `delta`, `reason`, `refType`, `refId`, `at`. **RewardGoal** — `studentId`, `title` ("đi công viên"), `starsNeeded`, `starsSpent`, `status`.
**Collectible** — `code`, `cost`, `category`; **StudentCollectible** — sở hữu.
**Pet** — `code`, `name`, `rarity`, `lottieKey`; **StudentPet** — `studentId`, `petCode`, `hatchedAt`, `isCompanion`. **EggProgress** — `studentId`, `weekStart`, `cracks` (0–5), `hatchedPetCode?`.
**WeeklyPicture** — `weekStart`, `theme`, `imageKey`; **StudentPicturePiece** — `studentId`, `weekStart`, `pieceIndex`, `earnedAt`.
**KidMail** — `studentId`, `fromKind` (`PARENT|CHARACTER|TEACHER_PRAISE`), `fromUserId?`, `text`, `audioKey?`, `giftCode?`, `deliverOn`, `openedAt?`. **MascotMemory** — `studentId`, `kind` (`YESTERDAY_WIN|INTEREST|SCHEDULE|EVENT`), `text`, `validFrom`, `validTo`, `usedAt?`.
**Certificate** — `studentId`, `kind` (`TOPIC|MONTH|SPECIAL`), `title`, `issuedAt`, `pdfKey`.

### 2.8 Hội thoại AI

**Conversation** — `studentId?`, `userId?`, `audience` (`KID|PARENT`), `startedAt`, `expiresAt` (kid: +90 ngày). **Message** — `conversationId`, `role`, `contentText`, `audioKey?`, `filtered: boolean`, `filterReason?`, `aiCallId?`.

### 2.9 Trường & lịch

**Timetable** — `className`, `schoolYear`, `validFrom`. **TimetableSlot** — `timetableId`, `weekday` (1–5), `period` (label: `1-2`, `3-4`, `5-6`, `7-8`, `DATN`, `9-10`), `timeFrom`, `timeTo`, `subjectLabelVi`, `subjectLabelEn`, `subject?` (map sang enum môn nếu là 5 môn cốt lõi), `isNative` (ENL).
**SchoolWeek** — `schoolYear`, `weekNo`, `dateFrom`, `dateTo`, `term`, `isHoliday`, `note`.

### 2.10 AI & hệ thống

**ContentBatch** — `kind` (`SKILL_MAP|LESSONS|EXERCISES|ART|INTAKE`), `sourceDir`, `fileCount`, `created`, `updated`, `retired`, `runBy` (`claude-code`), `note`, `at`. Mỗi lần `content:import` ghi một hàng; dùng để hoàn tác và để admin xem "lô vừa nạp".

**AiCall** — `task` (`INTAKE_EXTRACT|INTAKE_MAP|GRADE|PLAN|REPORT|ASSIST_PARENT|ASSIST_KID|EMBED|TTS|STT|EXERCISE_GEN`), `provider`, `model`, `promptVersion`, `inputTokens`, `outputTokens`, `costUsd`, `latencyMs`, `status`, `error?`, `inputSummary`, `outputRef?` (key file JSON), `cacheHit`, `at`.
**AiConfig** (1 hàng) — `modelByTask: Json`, `dailyBudgetUsd`, `cacheEnabled`, `autoApprove: Json` (theo loại), `ttsProvider`, `sttProvider`.
**PromptTemplate** — `task`, `version`, `body`, `isActive`, `notes`.
**Setting** — key/value chung. **AuditLog** — `userId`, `action`, `target`, `at`.

## 3. Chỉ mục & ràng buộc quan trọng

- `SkillMastery(studentId, skillId)` unique; index `(studentId, status)`, `(studentId, nextReviewAt)`.
- `Evidence(studentId, skillId, observedAt desc)`.
- `Exercise(stableId)` unique, `Exercise(contentHash)` unique; index `(status, subject, difficulty, type)`, `(status, assetTheme)`, `(targetsError)`; GIN trên `ExerciseSkill`.
- `Attempt(sessionId, order)` unique.
- `IntakeJob(status, createdAt)`.
- Full-text: GIN trên `Skill.searchVector` (ADR-12/ADR-13); không có pgvector.
- Xoá Student → cascade toàn bộ bảng con (phục vụ NFR-06), file xoá bằng job.

## 4. Dữ liệu seed

1. `content/skill-map/*.json` → bảng `Skill`, `SkillPrerequisite` (xem `05-CHUONG-TRINH-HOC.md`).
2. `content/timetable/1B3-2026.json` → `Timetable`, `TimetableSlot` (TKB trong ảnh của trường).
3. `SchoolWeek` năm học 2026–2027: tuần 1 bắt đầu **08/09/2026** (dev để tham số hoá; phụ huynh sửa được).
4. **Chỉ seed một `User` role=`ADMIN`** từ `ADMIN_USERNAME`/`ADMIN_EMAIL`/`ADMIN_PASSWORD` trong `.env`, `mustChangePassword=true`; bỏ qua nếu đã có admin. Tài khoản Ba/Mẹ/hai bé do admin tự tạo trong `/admin/users` (`12` §5) — **seed không tạo sẵn**.
4b. Hồ sơ `Student` mẫu (`thy`, `thanh`) chỉ seed ở môi trường dev để có dữ liệu chạy thử; ở bản thật hồ sơ được tạo cùng lúc với tài khoản `CHILD`. Nội dung mẫu: `thy` (Mai Thy, sở thích: múa, vẽ, công chúa, động vật), `thanh` (Chí Thanh, sở thích: máy móc, robot, cờ vua, đàn, xe cộ). Ngày sinh 01/01/2020.
5. `Badge`, `Collectible` cơ bản (≥ 15 huy hiệu, ≥ 20 vật phẩm).
5b. `LessonUnit` khung từ `09-GIAO-TRINH-TRUONG.md` (41 bài Toán, 8 chủ đề TV tập hai): code, title, tuần, trang — `isApproved=false`, chưa có `contentText`; `content:import` điền dần sau.
6. `PromptTemplate` v1 cho mọi task từ `content/prompts/`.
7. `AiConfig` mặc định.
