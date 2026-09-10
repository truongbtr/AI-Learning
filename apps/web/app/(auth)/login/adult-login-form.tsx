"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { type AdultLoginState, adultLoginAction } from "./actions";

export function AdultLoginForm({ next }: { next: string | null }) {
  const [state, action, pending] = useActionState<AdultLoginState, FormData>(adultLoginAction, {});
  const [showHelp, setShowHelp] = useState(false);
  return (
    <form action={action} className="space-y-4" aria-label="Ba mẹ đăng nhập">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Tên đăng nhập">
        <Input
          name="username"
          autoComplete="username"
          required
          autoCapitalize="none"
          spellCheck={false}
        />
      </Field>
      <Field label="Mật khẩu">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="remember" className="h-4 w-4" />
        Ghi nhớ máy này (30 ngày)
      </label>
      {state.error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <Button type="submit" disabled={pending}>
          {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        </Button>
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={() => setShowHelp((v) => !v)}
        >
          Quên mật khẩu?
        </button>
      </div>
      {showHelp ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Hệ thống không gửi email tự động. Nhờ admin (Ba) đặt lại mật khẩu trong trang Quản lý
          người dùng.
        </p>
      ) : null}
    </form>
  );
}
