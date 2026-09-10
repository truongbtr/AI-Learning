import { prisma } from "@mtct/db";
import { Activity, Database, HardDrive, Volume2 } from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cloudTtsEnabled, ttsConfigFromEnv } from "@/lib/tts/provider";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WORKER_STALE_MS = 6 * 60 * 1000;

/** What /api/health reports, for humans (docs/08 pha 0 criterion 6). */
export default async function AdminHealthPage() {
  let db: "ok" | "error" = "ok";
  let lastPing: string | null = null;
  let migrations = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ping = await prisma.setting.findUnique({ where: { key: "worker.lastPing" } });
    lastPing = (ping?.value as { at?: string } | null)?.at ?? null;
    const rows = await prisma.$queryRaw<
      { n: bigint }[]
    >`SELECT count(*)::bigint AS n FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    migrations = Number(rows[0]?.n ?? 0);
  } catch {
    db = "error";
  }
  const ageMs = lastPing ? Date.now() - new Date(lastPing).getTime() : null;
  const workerOk = ageMs !== null && ageMs <= WORKER_STALE_MS;
  const tts = ttsConfigFromEnv();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Hệ thống", "Sức khoẻ hệ thống"]}
        title="Sức khoẻ hệ thống"
        description="Cơ sở dữ liệu, worker và giọng đọc. Cùng dữ liệu với GET /api/health."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Cơ sở dữ liệu"
          value={db === "ok" ? "Kết nối tốt" : "Lỗi"}
          caption={`${migrations} migration đã áp dụng`}
          icon={<Database className="h-6 w-6" />}
          tone={db === "ok" ? "success" : "danger"}
        />
        <KpiCard
          label="Worker (pg-boss)"
          value={workerOk ? "Đang chạy" : "Ngừng"}
          caption={
            ageMs === null ? "Chưa có ping" : `Ping cuối cách ${Math.round(ageMs / 1000)} giây`
          }
          icon={<Activity className="h-6 w-6" />}
          tone={workerOk ? "success" : "danger"}
        />
        <KpiCard
          label="Giọng đọc"
          value={cloudTtsEnabled(tts) ? `Cloud (${tts.provider})` : "Trên thiết bị"}
          caption={cloudTtsEnabled(tts) ? tts.voices.vi : "Cần giọng tiếng Việt cài trên máy"}
          icon={<Volume2 className="h-6 w-6" />}
          tone={cloudTtsEnabled(tts) ? "success" : "warning"}
        />
        <KpiCard
          label="Kho tệp"
          value={process.env.FILE_ROOT ?? "./data/files"}
          caption="FILE_ROOT (ảnh vở, cache mp3)"
          icon={<HardDrive className="h-6 w-6" />}
        />
      </div>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Chi tiết</CardTitle>
            <CardDescription>Dùng khi cần báo lỗi cho người phát triển.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-control bg-surface-muted px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Worker ping cuối
              </dt>
              <dd className="mt-1 font-medium text-ink-800">{formatDateTime(lastPing)}</dd>
            </div>
            <div className="rounded-control bg-surface-muted px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Môi trường
              </dt>
              <dd className="mt-1 font-medium text-ink-800">{process.env.NODE_ENV}</dd>
            </div>
            <div className="rounded-control bg-surface-muted px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Giọng vi / en
              </dt>
              <dd className="mt-1 font-medium text-ink-800">
                {tts.voices.vi ?? "Web Speech"} · {tts.voices.en ?? "Web Speech"}
              </dd>
            </div>
            <div className="rounded-control bg-surface-muted px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Múi giờ
              </dt>
              <dd className="mt-1 font-medium text-ink-800">{process.env.TZ ?? "hệ thống"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
