"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { SkillRow, SkillTree } from "@/lib/admin/skills";
import { cn } from "@/lib/utils";

type Subject = SkillTree["subjects"][number]["subject"];

const STATUS_HINT =
  "Tuần dự kiến đạt (docs/05 §5) — dùng để vẽ lộ trình mong đợi trên bảng của ba mẹ.";

async function call<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    details?: { issues?: { code: string | null; message: string }[] };
  };
  if (!res.ok) {
    const issues = data.details?.issues?.map((i) => `${i.code ?? "-"}: ${i.message}`).join("\n");
    throw new Error(issues ? `${data.error}\n${issues}` : (data.error ?? `Lỗi ${res.status}`));
  }
  return data as T;
}

interface ListResponse {
  tree: SkillTree;
  items: SkillRow[];
  count: number;
}

export function SkillsAdmin({
  tree: initialTree,
  initialSubject,
  initialItems,
}: {
  tree: SkillTree;
  initialSubject: Subject | null;
  initialItems: SkillRow[];
}) {
  const [tree, setTree] = useState(initialTree);
  const [items, setItems] = useState(initialItems);
  const [subject, setSubject] = useState<Subject | null>(initialSubject);
  const [strand, setStrand] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [includeRetired, setIncludeRetired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SkillRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const firstRender = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      else {
        if (subject) params.set("subject", subject);
        if (strand) params.set("strand", strand);
      }
      if (includeRetired) params.set("includeRetired", "1");
      const data = await call<ListResponse>(`/api/admin/skills?${params}`, "GET");
      setTree(data.tree);
      setItems(data.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [q, subject, strand, includeRetired]);

  // Debounced reload on any filter change (skipped for the server-rendered first paint).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(reload, q.trim() ? 250 : 0);
    return () => clearTimeout(t);
  }, [reload, q]);

  const selectedSubject = useMemo(
    () => tree.subjects.find((s) => s.subject === subject) ?? null,
    [tree, subject],
  );

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* ---------------- tree ---------------- */}
      <Card className="w-full shrink-0 lg:w-80">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-ink-900">Cây kỹ năng</h2>
          <span className="text-xs text-ink-400">
            <span data-testid="skill-total" className="font-bold text-ink-700">
              {tree.active}
            </span>{" "}
            đang dùng
            {tree.retired > 0 ? ` · ${tree.retired} đã ẩn` : ""}
          </span>
        </div>
        <ul className="mt-3 flex flex-col gap-1">
          {tree.subjects.map((s) => {
            const open = subject === s.subject;
            return (
              <li key={s.subject}>
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setStrand(null);
                    setSubject(open ? null : s.subject);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-control px-3 py-2 text-sm font-semibold transition-colors",
                    open ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50",
                  )}
                >
                  <span className="truncate">{s.label}</span>
                  <span
                    data-testid={`subject-count-${s.subject}`}
                    className="ml-2 shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-600"
                  >
                    {s.active}
                  </span>
                </button>
                {open ? (
                  <ul className="mb-1 ml-3 mt-1 flex flex-col gap-0.5 border-l border-ink-100 pl-3">
                    {s.strands.map((st) => (
                      <li key={st.strand}>
                        <button
                          type="button"
                          onClick={() => setStrand(strand === st.strand ? null : st.strand)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-control px-2 py-1.5 text-[13px] transition-colors",
                            strand === st.strand
                              ? "bg-ink-100 font-semibold text-ink-800"
                              : "text-ink-500 hover:bg-ink-50",
                          )}
                        >
                          <span className="truncate">{st.strand}</span>
                          <span className="ml-2 shrink-0 text-xs text-ink-400">{st.active}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ---------------- list ---------------- */}
      <Card flush className="min-w-0 flex-1">
        <div className="flex flex-wrap items-end gap-3 border-b border-ink-100 px-5 py-4">
          <div className="min-w-56 flex-1">
            <Field label="Tìm kỹ năng" hint="Theo mã, tên hoặc mô tả; có dấu hay không đều được.">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="đọc từ có sh, cộng trong phạm vi 10, VIET.HV…"
              />
            </Field>
          </div>
          <label className="flex h-11 items-center gap-2 text-sm font-semibold text-ink-600">
            <input
              type="checkbox"
              checked={includeRetired}
              onChange={(e) => setIncludeRetired(e.target.checked)}
              className="h-4 w-4"
            />
            Hiện cả kỹ năng đã ẩn
          </label>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Nạp JSON/CSV
          </Button>
        </div>

        {error ? (
          <p
            role="alert"
            className="whitespace-pre-wrap border-b border-danger-100 bg-danger-50 px-5 py-3 text-sm font-medium text-danger-700"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between px-5 py-3 text-sm text-ink-400">
          <span>
            {loading
              ? "Đang tải…"
              : `${items.length} kỹ năng${q.trim() ? ` khớp "${q.trim()}"` : selectedSubject ? ` · ${selectedSubject.label}` : ""}${strand ? ` · mạch ${strand}` : ""}`}
          </span>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Mã</TH>
              <TH>Tên</TH>
              <TH>Mạch</TH>
              <TH>Lớp</TH>
              <TH>Tuần</TH>
              <TH>Bài SGK</TH>
              <TH>Tiên quyết</TH>
              <TH className="text-right">Thao tác</TH>
            </TR>
          </THead>
          <TBody>
            {items.map((s) => (
              <TR key={s.id} className={s.isActive ? "" : "opacity-60"}>
                <TD className="font-mono text-xs text-ink-500">
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    className="text-left hover:text-brand-700 hover:underline"
                  >
                    {s.code}
                  </button>
                  {!s.isActive ? (
                    <Badge tone="neutral" dot className="ml-1">
                      đã ẩn
                    </Badge>
                  ) : null}
                </TD>
                <TD>
                  <div className="font-semibold text-ink-900">{s.nameVi}</div>
                  <div className="text-xs text-ink-400">{s.nameEn}</div>
                </TD>
                <TD className="text-sm">{s.strand}</TD>
                <TD className="text-sm">{s.gradeLevel}</TD>
                <TD className="text-sm">{s.expectedWeek ?? "—"}</TD>
                <TD className="text-xs text-ink-500">
                  {s.lessonRefs.length ? s.lessonRefs.slice(0, 2).join(", ") : "—"}
                  {s.lessonRefs.length > 2 ? ` +${s.lessonRefs.length - 2}` : ""}
                </TD>
                <TD className="text-xs text-ink-500">
                  {s.prerequisites.length ? s.prerequisites.join(", ") : "—"}
                </TD>
                <TD className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                    Sửa
                  </Button>
                </TD>
              </TR>
            ))}
            {items.length === 0 && !loading ? (
              <TR>
                <TD colSpan={8} className="py-8 text-center text-sm text-ink-400">
                  Không có kỹ năng nào khớp.
                </TD>
              </TR>
            ) : null}
          </TBody>
        </Table>
      </Card>

      {editing ? (
        <EditSkillDialog
          skill={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      ) : null}
      {importOpen ? (
        <ImportSkillsDialog
          onClose={() => setImportOpen(false)}
          onImported={async () => {
            setImportOpen(false);
            await reload();
          }}
        />
      ) : null}
    </div>
  );
}

function EditSkillDialog({
  skill,
  onClose,
  onSaved,
}: {
  skill: SkillRow;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [nameVi, setNameVi] = useState(skill.nameVi);
  const [nameEn, setNameEn] = useState(skill.nameEn);
  const [description, setDescription] = useState(skill.description);
  const [expectedWeek, setExpectedWeek] = useState(skill.expectedWeek?.toString() ?? "");
  const [prerequisites, setPrerequisites] = useState(skill.prerequisites.join(", "));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (patch?: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const body = patch ?? {
        nameVi: nameVi.trim(),
        nameEn: nameEn.trim(),
        description: description.trim(),
        expectedWeek: expectedWeek.trim() ? Number(expectedWeek) : null,
        prerequisites: prerequisites
          .split(/[,\s]+/)
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
      };
      await call(`/api/admin/skills/${encodeURIComponent(skill.code)}`, "PATCH", body);
      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={skill.code}
      description={`${skill.strand} · ${skill.subject}`}
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="whitespace-pre-wrap text-sm font-medium text-danger-600">
            {error}
          </p>
        ) : null}

        <dl className="grid grid-cols-2 gap-3 rounded-control bg-surface-muted/70 p-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Bài SGK</dt>
            <dd className="text-ink-700">{skill.lessonRefs.join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Chuẩn</dt>
            <dd className="text-ink-700">{skill.standardRef ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Dạng bài</dt>
            <dd className="text-ink-700">{skill.exerciseTypes.join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Cặp dễ nhầm
            </dt>
            <dd className="text-ink-700">{skill.confusableWith.join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Bằng chứng đã có
            </dt>
            <dd className="text-ink-700">{skill.evidenceCount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Nguồn</dt>
            <dd className="text-ink-700">{skill.source}</dd>
          </div>
        </dl>

        <Field label="Tên (tiếng Việt)">
          <Input value={nameVi} onChange={(e) => setNameVi(e.target.value)} />
        </Field>
        <Field label="Tên (tiếng Anh)">
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
        </Field>
        <Field label="Tuần dự kiến" hint={STATUS_HINT}>
          <Input
            type="number"
            min={1}
            max={35}
            value={expectedWeek}
            onChange={(e) => setExpectedWeek(e.target.value)}
          />
        </Field>
        <Field label="Tiên quyết (mã, phẩy)" hint="Phải là mã kỹ năng có thật, không tạo vòng lặp.">
          <Input value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} />
        </Field>
        <Field label="Mô tả (cho AI và ba mẹ)" hint='Cần có "Ví dụ:" và "Lỗi thường gặp:".'>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="w-full rounded-control border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-800 shadow-control focus:border-brand-400 focus:outline-none"
          />
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-4">
          {skill.isActive ? (
            <Button
              variant="destructive"
              loading={busy}
              onClick={() => save({ isActive: false })}
              title={
                skill.evidenceCount > 0
                  ? "Kỹ năng đã có bằng chứng: chỉ ẩn, dữ liệu của con được giữ"
                  : undefined
              }
            >
              Ẩn kỹ năng
            </Button>
          ) : (
            <Button variant="secondary" loading={busy} onClick={() => save({ isActive: true })}>
              Dùng lại
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Đóng
            </Button>
            <Button loading={busy} onClick={() => save()}>
              Lưu
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

interface ImportPlan {
  dryRun: boolean;
  plan: { subject: string; total: number; willCreate: string[]; willUpdate: string[] };
  result?: { created: number; updated: number; prerequisites: number };
}

function ImportSkillsDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void | Promise<void>;
}) {
  const [format, setFormat] = useState<"json" | "csv">("json");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (dryRun: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const body = {
        format,
        text,
        dryRun,
        ...(format === "csv" && subject ? { subject } : {}),
      };
      const data = await call<ImportPlan>("/api/admin/skills/import", "POST", body);
      setPlan(data);
      if (!dryRun) await onImported();
    } catch (err) {
      setError((err as Error).message);
      setPlan(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Nạp kỹ năng từ JSON/CSV"
      description="Dùng đúng bộ kiểm định của pnpm skills:validate. Xem trước rồi mới nạp; lô này không ẩn kỹ năng khác."
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="whitespace-pre-wrap text-sm font-medium text-danger-600">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <div className="w-40">
            <Field label="Định dạng">
              <Select value={format} onChange={(e) => setFormat(e.target.value as "json" | "csv")}>
                <option value="json">JSON (skill-map)</option>
                <option value="csv">CSV</option>
              </Select>
            </Field>
          </div>
          {format === "csv" ? (
            <div className="w-40">
              <Field label="Môn (nếu CSV không có cột)">
                <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  <option value="">Lấy từ mã</option>
                  {["VIET", "VMATH", "ESL", "ENL", "EMATH", "ESCI"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}
          <div className="flex items-end">
            <label className="text-sm">
              <span className="mb-1.5 block font-semibold text-ink-700">Chọn tệp</span>
              <input
                type="file"
                accept=".json,.csv,text/csv,application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFormat(file.name.toLowerCase().endsWith(".csv") ? "csv" : "json");
                  setText(await file.text());
                  setPlan(null);
                }}
                className="text-sm text-ink-600"
              />
            </label>
          </div>
        </div>

        <Field
          label="Nội dung tệp"
          hint={
            format === "csv"
              ? "Cột bắt buộc: code, strand, nameVi, nameEn, description. Tuỳ chọn: subject, gradeLevel, expectedWeek, lessonRef, prerequisites, exerciseTypes…"
              : "Đúng định dạng content/skill-map/<môn>.json"
          }
        >
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setPlan(null);
            }}
            rows={10}
            spellCheck={false}
            className="w-full rounded-control border border-ink-200 bg-white px-3.5 py-2 font-mono text-xs text-ink-800 shadow-control focus:border-brand-400 focus:outline-none"
          />
        </Field>

        {plan ? (
          <div className="rounded-control bg-surface-muted/70 p-3 text-sm text-ink-700">
            <p className="font-semibold">
              {plan.dryRun ? "Xem trước" : "Đã nạp"}: {plan.plan.subject} · {plan.plan.total} kỹ
              năng
            </p>
            <p className="mt-1 text-ink-500">
              Thêm mới {plan.plan.willCreate.length}, cập nhật {plan.plan.willUpdate.length}
              {plan.result ? ` · ${plan.result.prerequisites} tiên quyết` : ""}
            </p>
            {plan.plan.willCreate.length ? (
              <p className="mt-1 break-all font-mono text-xs text-ink-400">
                {plan.plan.willCreate.slice(0, 12).join(", ")}
                {plan.plan.willCreate.length > 12 ? "…" : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="outline"
            loading={busy}
            disabled={!text.trim()}
            onClick={() => send(true)}
          >
            Xem trước
          </Button>
          <Button
            loading={busy}
            disabled={!plan?.dryRun}
            onClick={() => send(false)}
            title={plan?.dryRun ? undefined : "Xem trước trước khi nạp"}
          >
            Nạp vào DB
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
