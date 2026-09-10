"use client";

import { PASSWORD_MIN_LENGTH, PICTURE_SETS } from "@mtct/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PicturePinGrid } from "@/components/kid/picture-pin-grid";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { AdminUserRow, StudentOption } from "@/lib/admin/users";
import { AVATARS, avatarEmoji } from "@/lib/avatars";
import { formatDateTime } from "@/lib/utils";

type DialogState =
  | null
  | { kind: "create" }
  | { kind: "link"; user: AdminUserRow }
  | { kind: "reset"; user: AdminUserRow }
  | { kind: "logins"; user: AdminUserRow };

const ROLE_LABEL = { ADMIN: "Quản trị", PARENT: "Phụ huynh", CHILD: "Con" } as const;

async function call<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Lỗi ${res.status}`);
  return data as T;
}

export function UsersAdmin({
  users,
  students,
  currentUserId,
}: {
  users: AdminUserRow[];
  students: StudentOption[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function toggleActive(u: AdminUserRow) {
    setRowError(null);
    setBusyId(u.id);
    try {
      await call(`/api/admin/users/${u.id}`, "PATCH", { isActive: !u.isActive });
      router.refresh();
    } catch (err) {
      setRowError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  function done() {
    setDialog(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {rowError ? (
        <p
          role="alert"
          className="rounded-control border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {rowError}
        </p>
      ) : null}
      <Card flush>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-ink-900">Tài khoản</h2>
            <p className="text-sm text-ink-400">
              {users.length} tài khoản · admin, phụ huynh và con
            </p>
          </div>
          <Button onClick={() => setDialog({ kind: "create" })}>+ Tạo tài khoản</Button>
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Ảnh</TH>
              <TH>Tên hiển thị</TH>
              <TH>Tên đăng nhập</TH>
              <TH>Vai trò</TH>
              <TH>Con được gắn</TH>
              <TH>Đang bật?</TH>
              <TH>Đăng nhập lần cuối</TH>
              <TH className="text-right">Thao tác</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id} className={u.isActive ? "" : "opacity-60"}>
                <TD className="text-2xl">{avatarEmoji(u.avatarKey)}</TD>
                <TD>
                  <div className="font-semibold text-ink-900">{u.displayName}</div>
                  {u.email ? <div className="text-xs text-ink-400">{u.email}</div> : null}
                  {u.student ? (
                    <div className="text-xs text-ink-400">Hồ sơ: {u.student.nickname}</div>
                  ) : null}
                </TD>
                <TD className="font-mono text-xs text-ink-500">{u.username}</TD>
                <TD>
                  <Badge
                    tone={u.role === "ADMIN" ? "brand" : u.role === "PARENT" ? "info" : "neutral"}
                  >
                    {ROLE_LABEL[u.role]}
                  </Badge>
                  {u.mustChangePassword ? (
                    <Badge tone="warning" dot className="ml-1">
                      phải đổi mật khẩu
                    </Badge>
                  ) : null}
                  {u.lockedUntil ? (
                    <Badge tone="warning" dot className="ml-1">
                      khoá tới {formatDateTime(u.lockedUntil)}
                    </Badge>
                  ) : null}
                </TD>
                <TD className="text-sm">
                  {u.role === "CHILD" ? (
                    "—"
                  ) : u.guardianOf.length ? (
                    u.guardianOf.map((g) => g.nickname).join(", ")
                  ) : (
                    <span className="text-ink-400">chưa gắn</span>
                  )}
                </TD>
                <TD>
                  {u.isActive ? (
                    <Badge tone="success" dot>
                      Bật
                    </Badge>
                  ) : (
                    <Badge tone="neutral" dot>
                      Tắt
                    </Badge>
                  )}
                </TD>
                <TD className="text-sm">{formatDateTime(u.lastLoginAt)}</TD>
                <TD>
                  <div className="flex flex-wrap justify-end gap-1">
                    {u.role !== "CHILD" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDialog({ kind: "link", user: u })}
                      >
                        Gắn con
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDialog({ kind: "reset", user: u })}
                    >
                      {u.role === "CHILD" ? "Đặt lại mã hình" : "Đặt lại mật khẩu"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === u.id || u.id === currentUserId}
                      title={
                        u.id === currentUserId ? "Không tự tắt tài khoản đang dùng" : undefined
                      }
                      onClick={() => toggleActive(u)}
                    >
                      {u.isActive ? "Tắt" : "Bật"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDialog({ kind: "logins", user: u })}
                    >
                      Nhật ký
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Dialog
        open={dialog?.kind === "create"}
        onClose={() => setDialog(null)}
        title="Tạo tài khoản"
      >
        <CreateUserForm users={users} students={students} onDone={done} />
      </Dialog>
      <Dialog
        open={dialog?.kind === "link"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "link" ? `Gắn con cho ${dialog.user.displayName}` : ""}
      >
        {dialog?.kind === "link" ? (
          <LinkForm user={dialog.user} students={students} onDone={done} />
        ) : null}
      </Dialog>
      <Dialog
        open={dialog?.kind === "reset"}
        onClose={() => setDialog(null)}
        title={dialog?.kind === "reset" ? `Đặt lại cho ${dialog.user.displayName}` : ""}
      >
        {dialog?.kind === "reset" ? <ResetForm user={dialog.user} onDone={done} /> : null}
      </Dialog>
      <Dialog
        open={dialog?.kind === "logins"}
        onClose={() => setDialog(null)}
        title={
          dialog?.kind === "logins" ? `50 lần đăng nhập gần nhất — ${dialog.user.displayName}` : ""
        }
        className="w-[min(96vw,56rem)]"
      >
        {dialog?.kind === "logins" ? <LoginsTable userId={dialog.user.id} /> : null}
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------- create

function CreateUserForm({
  users,
  students,
  onDone,
}: {
  users: AdminUserRow[];
  students: StudentOption[];
  onDone: () => void;
}) {
  const [role, setRole] = useState<"PARENT" | "CHILD" | "ADMIN">("PARENT");
  const [pin, setPin] = useState<string[]>([]);
  const [pictureSetKey, setPictureSetKey] = useState(PICTURE_SETS[0]!.key);
  const [pinReset, setPinReset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const adults = users.filter((u) => u.role !== "CHILD" && u.isActive);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      role,
      username: f.get("username"),
      displayName: f.get("displayName"),
      avatarKey: f.get("avatarKey") || null,
    };
    if (role === "CHILD") {
      body.pictureSetKey = pictureSetKey;
      body.pin = pin;
      body.student = {
        fullName: f.get("fullName"),
        nickname: f.get("nickname"),
        birthDate: f.get("birthDate") || null,
        className: f.get("className") || "1B3",
        interests: String(f.get("interests") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        mascot: f.get("mascot") || "ROBOT",
      };
      body.guardianUserIds = f.getAll("guardianUserIds");
    } else {
      body.email = f.get("email");
      body.password = f.get("password");
      body.guardianStudentIds = f.getAll("guardianStudentIds");
    }
    setPending(true);
    try {
      await call("/api/admin/users", "POST", body);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vai trò">
          <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="PARENT">Phụ huynh</option>
            <option value="CHILD">Con</option>
            <option value="ADMIN">Quản trị</option>
          </Select>
        </Field>
        <Field label="Tên đăng nhập" hint="Không dấu, chữ thường: ba, me, thy, thanh">
          <Input name="username" required pattern="[a-z0-9_.-]{2,32}" autoCapitalize="none" />
        </Field>
        <Field label="Tên hiển thị">
          <Input name="displayName" required placeholder={role === "CHILD" ? "Thy" : "Mẹ"} />
        </Field>
        <Field label="Ảnh đại diện">
          <Select key={role} name="avatarKey" defaultValue={role === "CHILD" ? "girl-1" : "mom"}>
            {AVATARS.map((a) => (
              <option key={a.key} value={a.key}>
                {a.emoji} {a.labelVi}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {role !== "CHILD" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field
            label="Mật khẩu tạm"
            hint={`≥ ${PASSWORD_MIN_LENGTH} ký tự; người dùng phải đổi ở lần đăng nhập đầu`}
          >
            <Input
              name="password"
              type="text"
              required
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="off"
            />
          </Field>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-medium">Gắn con</legend>
            {students.length === 0 ? (
              <p className="text-xs text-ink-400">
                Chưa có hồ sơ con nào — tạo tài khoản Con trước.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-3">
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="guardianStudentIds"
                      value={s.id}
                      className="h-4 w-4"
                    />
                    {s.nickname}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên đầy đủ">
              <Input name="fullName" required placeholder="Mai Thy" />
            </Field>
            <Field label="Tên gọi ở nhà">
              <Input name="nickname" required placeholder="Thy" />
            </Field>
            <Field label="Ngày sinh">
              <Input name="birthDate" type="date" />
            </Field>
            <Field label="Lớp">
              <Input name="className" defaultValue="1B3" />
            </Field>
            <Field label="Sở thích (phẩy)">
              <Input name="interests" placeholder="múa, vẽ, động vật" />
            </Field>
            <Field label="Mascot">
              <Select name="mascot" defaultValue="ROBOT">
                <option value="ROBOT">🤖 Rô-bốt</option>
                <option value="OWL">🦉 Cú</option>
              </Select>
            </Field>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Phụ huynh của bé</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {adults.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="guardianUserIds"
                    value={a.id}
                    className="h-4 w-4"
                    defaultChecked
                  />
                  {a.displayName}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Bộ hình">
            <Select
              value={pictureSetKey}
              onChange={(e) => {
                setPictureSetKey(e.target.value);
                setPin([]);
                setPinReset((t) => t + 1);
              }}
            >
              {PICTURE_SETS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.nameVi}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium">Mã 4 hình (chọn theo thứ tự con sẽ nhớ)</p>
            <PicturePinGrid
              setKey={pictureSetKey}
              size="compact"
              onChange={setPin}
              resetToken={pinReset}
            />
          </div>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-control border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || (role === "CHILD" && pin.length !== 4)}>
          {pending ? "Đang tạo…" : "Tạo tài khoản"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- link parent ↔ child

function LinkForm({
  user,
  students,
  onDone,
}: {
  user: AdminUserRow;
  students: StudentOption[];
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(user.guardianOf.map((g) => g.studentId));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setError(null);
    setPending(true);
    try {
      await call(`/api/admin/users/${user.id}`, "PATCH", { guardianStudentIds: selected });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {students.length === 0 ? (
        <p className="text-sm text-ink-400">Chưa có hồ sơ con nào.</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.includes(s.id)}
                onChange={(e) =>
                  setSelected((cur) =>
                    e.target.checked ? [...cur, s.id] : cur.filter((id) => id !== s.id),
                  )
                }
              />
              {s.nickname} <span className="text-xs text-ink-400">({s.slug})</span>
            </label>
          ))}
        </div>
      )}
      {error ? <p className="text-sm font-medium text-danger-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button onClick={save} disabled={pending}>
          Lưu
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- reset password / pin

function ResetForm({ user, onDone }: { user: AdminUserRow; onDone: () => void }) {
  const [pin, setPin] = useState<string[]>([]);
  const [pictureSetKey, setPictureSetKey] = useState(user.pictureSetKey ?? PICTURE_SETS[0]!.key);
  const [pinReset, setPinReset] = useState(0);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setError(null);
    setPending(true);
    try {
      await call(
        `/api/admin/users/${user.id}/reset-credential`,
        "POST",
        user.role === "CHILD" ? { pin, pictureSetKey } : { password },
      );
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {user.role === "CHILD" ? (
        <>
          <Field label="Bộ hình">
            <Select
              value={pictureSetKey}
              onChange={(e) => {
                setPictureSetKey(e.target.value);
                setPin([]);
                setPinReset((t) => t + 1);
              }}
            >
              {PICTURE_SETS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.nameVi}
                </option>
              ))}
            </Select>
          </Field>
          <PicturePinGrid
            setKey={pictureSetKey}
            size="compact"
            onChange={setPin}
            resetToken={pinReset}
          />
          <p className="text-xs text-ink-400">
            Con đăng nhập được bằng mã mới ngay; bộ đếm sai được xoá.
          </p>
        </>
      ) : (
        <Field label="Mật khẩu tạm mới" hint="Người dùng sẽ phải đổi ở lần đăng nhập kế tiếp.">
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="off"
          />
        </Field>
      )}
      {error ? <p className="text-sm font-medium text-danger-600">{error}</p> : null}
      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={
            pending ||
            (user.role === "CHILD" ? pin.length !== 4 : password.length < PASSWORD_MIN_LENGTH)
          }
        >
          Lưu
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- login audit

interface LoginRow {
  id: string;
  at: string;
  ip: string;
  result: string;
  usernameTried: string;
  userAgent: string;
}

const RESULT_LABEL: Record<string, string> = {
  OK: "Thành công",
  WRONG_PASSWORD: "Sai mật khẩu/mã",
  LOCKED: "Bị khoá",
  NO_SUCH_USER: "Không tồn tại",
  DISABLED: "Tài khoản tắt",
};

function LoginsTable({ userId }: { userId: string }) {
  const [rows, setRows] = useState<LoginRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (rows === null && error === null) {
    call<{ items: LoginRow[] }>(`/api/admin/users/${userId}/logins`, "GET")
      .then((d) => setRows(d.items))
      .catch((err) => setError((err as Error).message));
  }
  if (error) return <p className="text-sm font-medium text-danger-600">{error}</p>;
  if (rows === null) return <p className="text-sm text-ink-400">Đang tải…</p>;
  if (rows.length === 0) return <p className="text-sm text-ink-400">Chưa có lần đăng nhập nào.</p>;
  return (
    <Table>
      <THead>
        <TR>
          <TH>Thời điểm</TH>
          <TH>IP</TH>
          <TH>Kết quả</TH>
          <TH>Thiết bị</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r) => (
          <TR key={r.id}>
            <TD className="whitespace-nowrap text-xs">{formatDateTime(r.at)}</TD>
            <TD className="font-mono text-xs">{r.ip}</TD>
            <TD>
              <Badge tone={r.result === "OK" ? "success" : "warning"} dot>
                {RESULT_LABEL[r.result] ?? r.result}
              </Badge>
            </TD>
            <TD className="max-w-[20rem] truncate text-xs text-ink-400" title={r.userAgent}>
              {r.userAgent}
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
