"use client";

import { CheckCircle2, Eye, ThumbsDown, ThumbsUp, Undo2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ExercisePreview, type PreviewSpec } from "@/components/kid/exercise-preview";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { BatchRow, ExerciseRow } from "@/lib/admin/content";
import { formatDateTime } from "@/lib/utils";

const STATUS_TONE = { DRAFT: "warning", PUBLISHED: "success", RETIRED: "neutral" } as const;
const STATUS_LABEL = { DRAFT: "Nháp", PUBLISHED: "Đã phát hành", RETIRED: "Nghỉ hưu" } as const;
const FLAG_LABEL = { OK: "Được", GOOD: "Tốt", BAD: "Bài xấu", UNREVIEWED: "Chưa xem" } as const;

/**
 * FR-ADM-05: the batch list, a preview of every exercise exactly as the child will see it,
 * GOOD/BAD flags and the DRAFT → PUBLISHED switch. A DRAFT exercise never reaches a session, and
 * flagging BAD pulls it straight back out of the bank.
 */
export function ContentAdmin({
  initialBatches,
  initialItems,
  coverage,
}: {
  initialBatches: BatchRow[];
  initialItems: ExerciseRow[];
  coverage: {
    code: string;
    nameVi: string;
    subject: string;
    published: number;
    draft: number;
    missingTypes: string[];
    missingDifficulties: number[];
  }[];
}) {
  const [batches, setBatches] = useState(initialBatches);
  const [items, setItems] = useState(initialItems);
  const [batchId, setBatchId] = useState<string>(initialBatches[0]?.id ?? "");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [preview, setPreview] = useState<ExerciseRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (next: { batch?: string; status?: string; type?: string } = {}) => {
      setBusy(true);
      setError(null);
      const params = new URLSearchParams();
      const b = next.batch ?? batchId;
      const s = next.status ?? status;
      const t = next.type ?? type;
      if (b) params.set("batch", b);
      if (s) params.set("status", s);
      if (t) params.set("type", t);
      try {
        const res = await fetch(`/api/admin/content?${params}`);
        if (!res.ok) throw new Error((await res.json()).error ?? "Không tải được");
        const data = await res.json();
        setBatches(data.batches);
        setItems(data.items);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [batchId, status, type],
  );

  const act = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Không thực hiện được");
        await reload();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const batch = batches.find((b) => b.id === batchId);
  const thin = coverage.filter((c) => c.published < 10);

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="rounded-control bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
          {error}
        </p>
      ) : null}

      <Card flush>
        <div className="border-b border-ink-100 px-5 py-4">
          <CardTitle>Lô nội dung</CardTitle>
          <CardDescription>
            Mỗi lần chạy <code>pnpm content:import</code> là một lô. Bài ở trạng thái “Nháp” không
            bao giờ vào phiên học của con.
          </CardDescription>
        </div>
        {batches.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-400">
            Chưa có lô nào. Soạn file trong <code>content/exercises/</code> rồi chạy{" "}
            <code>pnpm content:import</code>.
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Nguồn</TH>
                <TH>Lúc</TH>
                <TH>Thêm / sửa / nghỉ</TH>
                <TH>Nháp</TH>
                <TH>Đã phát hành</TH>
                <TH>Bài xấu</TH>
                <TH> </TH>
              </TR>
            </THead>
            <TBody>
              {batches.map((b) => (
                <TR key={b.id} className={b.id === batchId ? "bg-surface-subtle" : undefined}>
                  <TD className="font-medium text-ink-900">{b.sourceDir}</TD>
                  <TD className="whitespace-nowrap text-xs text-ink-500">{formatDateTime(b.at)}</TD>
                  <TD className="text-xs text-ink-500">
                    {b.created} / {b.updated} / {b.retired}
                  </TD>
                  <TD>{b.draft}</TD>
                  <TD>{b.published}</TD>
                  <TD>{b.bad > 0 ? <Badge tone="danger">{b.bad}</Badge> : "—"}</TD>
                  <TD className="whitespace-nowrap">
                    <Button
                      size="sm"
                      variant={b.id === batchId ? "default" : "outline"}
                      onClick={() => {
                        setBatchId(b.id);
                        void reload({ batch: b.id });
                      }}
                    >
                      Xem lô
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {batch ? (
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle>Duyệt lô {batch.sourceDir}</CardTitle>
              <CardDescription>
                {batch.draft} bài nháp · {batch.published} đã phát hành
                {batch.note ? ` · ${batch.note}` : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Lọc theo trạng thái"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  void reload({ status: e.target.value });
                }}
                className="h-9 w-44 text-[13px]"
              >
                <option value="">Mọi trạng thái</option>
                <option value="DRAFT">Nháp</option>
                <option value="PUBLISHED">Đã phát hành</option>
                <option value="RETIRED">Nghỉ hưu</option>
              </Select>
              <Select
                aria-label="Lọc theo dạng bài"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  void reload({ type: e.target.value });
                }}
                className="h-9 w-48 text-[13px]"
              >
                <option value="">Mọi dạng bài</option>
                {[
                  "MCQ",
                  "LISTEN_CHOOSE",
                  "DRAG_DROP",
                  "COUNT_TAP",
                  "READ_ALOUD",
                  "WRITE_PHOTO",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Button
                loading={busy}
                onClick={() => act({ action: "publish", batchId: batch.id })}
                disabled={batch.draft === 0}
              >
                <CheckCircle2 className="h-4 w-4" /> Phát hành lô ({batch.draft})
              </Button>
              <Button
                variant="outline"
                loading={busy}
                onClick={() => act({ action: "unpublish", batchId: batch.id })}
                disabled={batch.published === 0}
              >
                <Undo2 className="h-4 w-4" /> Thu hồi
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Table>
              <THead>
                <TR>
                  <TH>Mã bài</TH>
                  <TH>Dạng</TH>
                  <TH>Độ khó</TH>
                  <TH>Kỹ năng</TH>
                  <TH>Nguồn</TH>
                  <TH>Trạng thái</TH>
                  <TH>Cờ</TH>
                  <TH> </TH>
                </TR>
              </THead>
              <TBody>
                {items.map((item) => (
                  <TR key={item.stableId}>
                    <TD className="font-mono text-xs text-ink-700">{item.stableId}</TD>
                    <TD className="text-xs">
                      {item.type}
                      {item.scaffold === "model" ? (
                        <Badge tone="info" className="ml-1">
                          mẫu
                        </Badge>
                      ) : null}
                    </TD>
                    <TD>{item.difficulty}</TD>
                    <TD className="font-mono text-[11px] text-ink-500">
                      {item.skillCodes.join(", ")}
                    </TD>
                    <TD className="text-xs text-ink-500">{item.sourceRef ?? "—"}</TD>
                    <TD>
                      <Badge tone={STATUS_TONE[item.status as keyof typeof STATUS_TONE]} dot>
                        {STATUS_LABEL[item.status as keyof typeof STATUS_LABEL]}
                      </Badge>
                    </TD>
                    <TD className="text-xs">
                      {FLAG_LABEL[item.qualityFlag as keyof typeof FLAG_LABEL]}
                    </TD>
                    <TD className="whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setPreview(item)}>
                          <Eye className="h-4 w-4" /> Xem thử
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Đánh dấu tốt ${item.stableId}`}
                          onClick={() =>
                            act({ action: "flag", stableId: item.stableId, flag: "GOOD" })
                          }
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Đánh dấu bài xấu ${item.stableId}`}
                          onClick={() =>
                            act({ action: "flag", stableId: item.stableId, flag: "BAD" })
                          }
                        >
                          <ThumbsDown className="h-4 w-4 text-danger-500" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-400">Không có bài nào khớp bộ lọc.</p>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card flush>
        <div className="border-b border-ink-100 px-5 py-4">
          <CardTitle>Phủ nội dung theo kỹ năng</CardTitle>
          <CardDescription>
            Kỹ năng dưới 10 bài đã phát hành là việc của đợt soạn kế tiếp ({thin.length} kỹ năng).
          </CardDescription>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Kỹ năng</TH>
              <TH>Đã phát hành</TH>
              <TH>Nháp</TH>
              <TH>Thiếu dạng</TH>
              <TH>Thiếu mức khó</TH>
            </TR>
          </THead>
          <TBody>
            {coverage.map((c) => (
              <TR key={c.code}>
                <TD>
                  <span className="font-mono text-[11px] text-ink-500">{c.code}</span>
                  <span className="ml-2 text-ink-800">{c.nameVi}</span>
                </TD>
                <TD>
                  <Badge
                    tone={c.published >= 35 ? "success" : c.published < 10 ? "danger" : "warning"}
                  >
                    {c.published}
                  </Badge>
                </TD>
                <TD>{c.draft}</TD>
                <TD className="text-xs text-ink-500">{c.missingTypes.join(", ") || "—"}</TD>
                <TD className="text-xs text-ink-500">{c.missingDifficulties.join(", ") || "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        {coverage.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">Chưa có kỹ năng nào có bài.</p>
        ) : null}
      </Card>

      <Dialog
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview ? `Xem thử ${preview.stableId}` : ""}
        description="Đúng như con sẽ thấy trên máy tính bảng. Đáp án và chẩn đoán chỉ hiện ở đây, không gửi ra máy của con."
        className="w-[min(96vw,52rem)]"
      >
        {preview ? (
          <div className="flex flex-col gap-4">
            <ExercisePreview spec={preview.spec as PreviewSpec} />
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-control bg-surface-muted px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Đáp án
                </dt>
                <dd className="mt-1 font-mono text-xs text-ink-800">
                  {JSON.stringify((preview.answer as { value?: unknown })?.value)}
                </dd>
              </div>
              <div className="rounded-control bg-surface-muted px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Nhiễu có chẩn đoán
                </dt>
                <dd className="mt-1 font-mono text-xs text-ink-800">
                  {JSON.stringify((preview.answer as { errorTags?: unknown })?.errorTags) ?? "—"}
                </dd>
              </div>
              <div className="rounded-control bg-surface-muted px-4 py-3 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Giải thích khi con chưa đúng
                </dt>
                <dd className="mt-1 text-ink-800">{preview.explanation ?? "—"}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => act({ action: "flag", stableId: preview.stableId, flag: "GOOD" })}
              >
                <ThumbsUp className="h-4 w-4" /> Bài tốt
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  void act({ action: "flag", stableId: preview.stableId, flag: "BAD" });
                  setPreview(null);
                }}
              >
                <ThumbsDown className="h-4 w-4" /> Bài xấu, bỏ khỏi ngân hàng
              </Button>
              {preview.status === "DRAFT" ? (
                <Button onClick={() => act({ action: "publishOne", stableId: preview.stableId })}>
                  <CheckCircle2 className="h-4 w-4" /> Phát hành riêng bài này
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
