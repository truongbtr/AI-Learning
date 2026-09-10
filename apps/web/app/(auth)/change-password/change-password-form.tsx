"use client";

import { PASSWORD_MIN_LENGTH } from "@mtct/core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ChangePasswordForm({ homeHref }: { homeHref: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (newPassword !== confirm) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Không đổi được mật khẩu.");
        return;
      }
      // Full navigation so the refreshed session cookie is used by proxy.ts (no RSC race).
      window.location.assign(homeHref);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Mật khẩu hiện tại">
        <Input name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field
        label="Mật khẩu mới"
        hint={`Ít nhất ${PASSWORD_MIN_LENGTH} ký tự, có chữ và số hoặc ký hiệu, không dùng mật khẩu phổ biến.`}
      >
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
        />
      </Field>
      <Field label="Nhập lại mật khẩu mới">
        <Input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
        />
      </Field>
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}
