"use client";

import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * P5 — the one-minute job a parent does in the kitchen (FR-INT-01).
 *
 * Photos are shrunk here, on the phone, before they are sent: a modern camera makes 4–8 MB files
 * and a family broadband upload of ten of those is a minute of staring at a spinner. A long edge
 * of 2000 is the most the reader can use anyway.
 */

const SUBJECTS: { value: string; label: string }[] = [
  { value: "", label: "Để hệ thống đoán" },
  { value: "VIET", label: "Tiếng Việt" },
  { value: "VMATH", label: "Toán" },
  { value: "ESL", label: "ESL" },
  { value: "ENL", label: "ENL (đọc tiếng Anh)" },
  { value: "EMATH", label: "English Maths" },
  { value: "ESCI", label: "English Science" },
];

const DOC_TYPES: { value: string; label: string }[] = [
  { value: "", label: "Để hệ thống đoán" },
  { value: "WORKBOOK", label: "Vở bài tập" },
  { value: "WORKSHEET", label: "Phiếu bài tập" },
  { value: "TEST", label: "Bài kiểm tra" },
  { value: "TEACHER_NOTE", label: "Nhận xét của cô" },
  { value: "CLASS_DIARY", label: "Nhật ký lớp (ảnh màn hình)" },
  { value: "KIDSAZ_REPORT", label: "Màn hình Raz-Kids / Kids A-Z" },
  { value: "NAVIO_REPORT", label: "Màn hình NAVIO" },
];

const LONG_EDGE = 2000;
const QUALITY = 0.82;

interface Picked {
  id: string;
  file: File;
  url: string;
  originalBytes: number;
}

/** Draws the picture into a canvas no bigger than LONG_EDGE and re-encodes it as JPEG. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/heic") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export function IntakeForm({
  students,
  defaultStudentId,
}: {
  students: { id: string; nickname: string }[];
  defaultStudentId: string;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [subject, setSubject] = useState("");
  const [docType, setDocType] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ files: number } | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const next: Picked[] = [];
    for (const file of Array.from(files).slice(0, 20 - picked.length)) {
      const small = await shrink(file);
      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file: small,
        url: URL.createObjectURL(small),
        originalBytes: file.size,
      });
    }
    setPicked((list) => [...list, ...next]);
  };

  const remove = (id: string) => {
    setPicked((list) => {
      const gone = list.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.url);
      return list.filter((p) => p.id !== id);
    });
  };

  const send = async () => {
    if (picked.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("studentId", studentId);
      if (subject) body.set("subject", subject);
      if (docType) body.set("docType", docType);
      if (date) body.set("date", date);
      if (note.trim()) body.set("note", note.trim());
      for (const p of picked) body.append("files", p.file, p.file.name);
      const res = await fetch("/api/intake", { method: "POST", body });
      const data = (await res.json()) as { files?: number; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Không gửi được ảnh");
      for (const p of picked) URL.revokeObjectURL(p.url);
      setPicked([]);
      setNote("");
      setDone({ files: data.files ?? 0 });
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const totalKb = Math.round(picked.reduce((n, p) => n + p.file.size, 0) / 1024);

  return (
    <div className="flex flex-col gap-4">
      {done ? (
        <Card className="border-success-200 bg-success-50">
          <p className="text-sm font-semibold text-success-700">
            Đã nhận {done.files} ảnh. Hệ thống đang chuẩn bị ảnh; khi có kết quả đọc, ảnh sẽ nằm
            trong <strong>Hộp thư duyệt</strong> để ba mẹ xem lại.
          </p>
          <p className="mt-2 text-sm text-ink-600">
            Kết quả đọc do Claude Code xử lý theo lô (2–3 lần/tuần) — app không tự gọi AI.
          </p>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Của bé
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nickname}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Môn
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            >
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Loại giấy tờ
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
            Ngày con làm
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-ink-700">
          Ghi chú (không bắt buộc)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Ví dụ: phiếu ESL con làm dở ở lớp"
            className="h-11 rounded-control border border-ink-200 bg-white px-3 text-sm"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <input
            ref={camera}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={library}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void add(e.target.files);
              e.target.value = "";
            }}
          />
          <Button type="button" size="lg" onClick={() => camera.current?.click()}>
            <Camera className="h-5 w-5" /> Chụp ảnh
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => library.current?.click()}
          >
            <ImagePlus className="h-5 w-5" /> Chọn từ máy
          </Button>
          <Button
            type="button"
            size="lg"
            variant="secondary"
            onClick={send}
            disabled={picked.length === 0 || busy}
            data-testid="intake-send"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            Gửi {picked.length > 0 ? `${picked.length} ảnh` : ""}
          </Button>
        </div>

        {error ? (
          <p role="alert" className="text-sm font-medium text-danger-600">
            {error}
          </p>
        ) : null}

        {picked.length > 0 ? (
          <>
            <p className="text-xs text-ink-500">
              {picked.length} ảnh · {totalKb} KB sau khi nén trên máy
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {picked.map((p) => (
                <li key={p.id} className="relative">
                  {/* biome-ignore lint/performance/noImgElement: a local object URL */}
                  <img
                    src={p.url}
                    alt=""
                    className="h-32 w-full rounded-control object-cover ring-1 ring-ink-200"
                  />
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    aria-label="Bỏ ảnh này"
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-ink-700 shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-ink-500">
            Chụp vở bài tập, phiếu, bài kiểm tra, nhận xét của cô, hay màn hình Raz-Kids/NAVIO. Ảnh
            gốc được giữ nguyên; hệ thống chỉ xoay, nén và tăng tương phản bản gửi đi đọc.
          </p>
        )}
      </Card>
    </div>
  );
}
