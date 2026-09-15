import { cloudTtsEnabled, resolveVoice, ttsConfigFromEnv } from "@mtct/core/tts";
import { healthAdvice, healthReport, prisma } from "@mtct/db";
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Database,
  HardDrive,
  Volume2,
} from "lucide-react";
import { cookies } from "next/headers";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat, type StatTone } from "@/components/ui/stat";
import { kidUiMode, UI_COOKIE } from "@/lib/kid/ui-mode";
import { formatDateTime } from "@/lib/utils";
import { setCityOnThisDevice } from "./ui-actions";

export const dynamic = "force-dynamic";

/**
 * The one page the owner opens when something is wrong (docs/08 pha 8 việc 3, FR-ADM-04).
 *
 * Written for somebody who is not a programmer and is probably annoyed: every card says what is
 * wrong **and what to do about it**, in a sentence, with the command to type. Same data as
 * `GET /api/health`, so the two can never disagree.
 */
export default async function AdminHealthPage() {
  const h = await healthReport(prisma);
  const tts = ttsConfigFromEnv();

  const tone = (ok: boolean, warnOnly = false): StatTone =>
    ok ? "success" : warnOnly ? "warning" : "danger";

  // The same list `pnpm db:usage` prints, from packages/db/src/ops/health.ts, so the screen and
  // the command line can never drift apart — and so the rule is testable without a browser.
  const advice = healthAdvice(h);
  const deviceUi = (await cookies()).get(UI_COOKIE)?.value ?? null;
  const serverUi = kidUiMode(process.env);
  const thisDeviceUi = kidUiMode(process.env, deviceUi);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={["Hệ thống", "Sức khoẻ hệ thống"]}
        title="Sức khoẻ hệ thống"
        description="Cùng dữ liệu với GET /api/health. Thẻ nào đỏ hoặc vàng thì đọc phần “Cần làm gì” ngay dưới."
      />

      {advice.length === 0 ? (
        <div
          data-testid="health-all-ok"
          className="flex items-center gap-3 rounded-card border border-success-200 bg-success-50 p-4 text-success-700"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Mọi thứ đang chạy bình thường. Không cần làm gì cả.</p>
        </div>
      ) : (
        <Card data-testid="health-advice">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-600" />
                Cần làm gì
              </CardTitle>
              <CardDescription>
                Theo thứ tự quan trọng. Chép nguyên dòng lệnh vào PowerShell tại thư mục dự án.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3">
              {advice.map((a) => (
                <li
                  key={a.title}
                  className={`rounded-control border px-4 py-3 ${
                    a.level === "error"
                      ? "border-danger-200 bg-danger-50"
                      : "border-warning-200 bg-warning-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-ink-900">{a.title}</p>
                  <p className="mt-1 text-sm text-ink-700">{a.what}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Cơ sở dữ liệu"
          value={h.db.ok ? "Kết nối tốt" : "Lỗi"}
          caption={`${h.db.migrations} migration · ${h.db.sizeMb ?? "?"} MB`}
          icon={<Database className="h-6 w-6" />}
          tone={tone(h.db.ok)}
        />
        <Stat
          label="Worker (pg-boss)"
          value={h.worker.ok ? "Đang chạy" : "Ngừng"}
          caption={
            h.worker.ageSeconds === null
              ? "Chưa có ping"
              : `Ping cuối cách ${h.worker.ageSeconds} giây`
          }
          icon={<Activity className="h-6 w-6" />}
          tone={tone(h.worker.ok)}
        />
        <Stat
          label="Việc nền hỏng (24 giờ)"
          value={h.jobs.failed24h}
          caption={
            h.jobs.stuckActive > 0 ? `${h.jobs.stuckActive} việc đang treo` : "Không có việc treo"
          }
          icon={<Activity className="h-6 w-6" />}
          tone={tone(h.jobs.ok, true)}
        />
        <Stat
          label="Ổ đĩa còn trống"
          value={h.disk.freeGb === null ? "—" : `${h.disk.freeGb} GB`}
          caption={
            h.disk.totalGb === null
              ? h.disk.path
              : `trên ${h.disk.totalGb} GB · cảnh báo dưới ${h.disk.warnBelowGb} GB`
          }
          icon={<HardDrive className="h-6 w-6" />}
          tone={tone(h.disk.ok, true)}
        />
        <Stat
          label="Sao lưu gần nhất"
          value={h.backup.latest ? `${h.backup.ageHours} giờ trước` : "Chưa có"}
          caption={
            h.backup.latest
              ? `${h.backup.latest} · ${h.backup.sizeMb} MB · giữ ${h.backup.count} bản`
              : (h.backup.dir ?? "chưa đặt BACKUP_DIR")
          }
          icon={<Archive className="h-6 w-6" />}
          tone={tone(h.backup.ok, true)}
        />
        <Stat
          label="Giọng đọc tháng này"
          value={`${Math.round(h.tts.fraction * 100)}%`}
          caption={`${h.tts.chars.toLocaleString("vi-VN")} / ${h.tts.limit.toLocaleString("vi-VN")} ký tự (bậc F0 miễn phí)`}
          icon={<Volume2 className="h-6 w-6" />}
          tone={h.tts.level === "ok" ? "success" : h.tts.level === "warn" ? "warning" : "danger"}
        />
        <Stat
          label="Hàng chờ Claude Code"
          value={h.queueWaiting.toRead}
          caption={`${h.queueWaiting.toReview} lô ảnh chờ ba mẹ duyệt`}
          icon={<Activity className="h-6 w-6" />}
          tone="neutral"
        />
        <Stat
          label="Nguồn giọng"
          value={cloudTtsEnabled(tts) ? `Cloud (${tts.provider})` : "Trên thiết bị"}
          caption={
            cloudTtsEnabled(tts)
              ? `vi: ${resolveVoice(tts, "vi") ?? "—"} · en: ${resolveVoice(tts, "en") ?? "—"}`
              : "Cần giọng tiếng Việt cài trên máy"
          }
          icon={<Volume2 className="h-6 w-6" />}
          tone={cloudTtsEnabled(tts) ? "success" : "warning"}
        />
      </div>

      {h.tts.months.length > 0 ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Giọng đọc đã dùng theo tháng</CardTitle>
              <CardDescription>
                Chỉ đếm lần thật sự gọi Azure. Câu đã có mp3 trong kho thì phát file, không tốn gì.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm" data-testid="tts-usage">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-400">
                  <th className="pb-2 font-semibold">Tháng</th>
                  <th className="pb-2 font-semibold">Ký tự</th>
                  <th className="pb-2 font-semibold">Lần gọi</th>
                  <th className="pb-2 font-semibold">Phần của hạn mức F0</th>
                </tr>
              </thead>
              <tbody>
                {h.tts.months.map((m) => (
                  <tr key={m.month} className="border-t border-ink-100">
                    <td className="py-2 font-medium text-ink-800">{m.month}</td>
                    <td className="py-2 text-ink-700">{m.chars.toLocaleString("vi-VN")}</td>
                    <td className="py-2 text-ink-700">{m.calls.toLocaleString("vi-VN")}</td>
                    <td className="py-2 text-ink-700">
                      {Math.round((m.chars / h.tts.limit) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Chi tiết</CardTitle>
            <CardDescription>Dùng khi cần báo lỗi cho người phát triển.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Máy chủ", h.host],
              ["Worker ping cuối", formatDateTime(h.worker.lastPing)],
              ["Môi trường", process.env.NODE_ENV ?? "—"],
              [
                "Giọng vi / en",
                `${resolveVoice(tts, "vi") ?? "Web Speech"} · ${resolveVoice(tts, "en") ?? "Web Speech"}`,
              ],
              ["Múi giờ", process.env.TZ ?? "hệ thống"],
              ["Kho tệp", h.disk.path],
              ["Thư mục sao lưu", h.backup.dir ?? "chưa đặt BACKUP_DIR"],
              [
                "Cloudflare Access",
                process.env.CF_ACCESS_TEAM_DOMAIN && process.env.CF_ACCESS_AUD
                  ? `đang bật (${process.env.CF_ACCESS_TEAM_DOMAIN})`
                  : "chưa bật — /parent và /admin chỉ có mật khẩu",
              ],
              ["Đọc lúc", formatDateTime(h.time)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-control bg-surface-muted px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {label}
                </dt>
                <dd className="mt-1 font-medium text-ink-800 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card data-testid="kid-ui-device">
        <CardHeader>
          <div>
            <CardTitle>Giao diện của con trên máy này</CardTitle>
            <CardDescription>
              Máy chủ đang dùng <strong>{serverUi === "city" ? "thành phố" : "thế giới cũ"}</strong>{" "}
              (KID_UI). Nút dưới chỉ đổi <strong>trình duyệt này</strong> trong 30 ngày — đăng xuất
              rồi để con đăng nhập trên chính máy này là chơi thử được; các máy khác không đổi.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-600" data-testid="kid-ui-device-mode">
            Máy này: <strong>{thisDeviceUi === "city" ? "thành phố" : "thế giới cũ"}</strong>
            {deviceUi ? " (đã bật riêng)" : ""}
          </span>
          <form action={setCityOnThisDevice}>
            <input type="hidden" name="mode" value="city" />
            <button
              type="submit"
              className="rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              data-testid="kid-ui-city-on"
            >
              Bật thành phố trên máy này
            </button>
          </form>
          <form action={setCityOnThisDevice}>
            <input type="hidden" name="mode" value="off" />
            <button
              type="submit"
              className="rounded-control border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700"
              data-testid="kid-ui-city-off"
            >
              Tắt
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
