"use server";

import { prisma } from "@mtct/db";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import type { LoginFailure } from "@/lib/auth/login-service";
import { homeFor } from "@/lib/auth/session";

export interface AdultLoginState {
  error?: string;
}

function failureOf(err: unknown): LoginFailure | "UNKNOWN" {
  if (err instanceof AuthError) {
    const code = (err as { code?: string }).code;
    if (code === "INVALID" || code === "LOCKED" || code === "THROTTLED") return code;
    if (err.type === "CredentialsSignin") return "INVALID";
  }
  return "UNKNOWN";
}

// Same message for wrong username and wrong password (docs/12 §6).
const ADULT_MESSAGES: Record<LoginFailure | "UNKNOWN", string> = {
  INVALID: "Tên đăng nhập hoặc mật khẩu không đúng.",
  LOCKED: "Tài khoản tạm khoá 10 phút vì nhập sai nhiều lần. Vui lòng thử lại sau.",
  THROTTLED: "Bạn thử quá nhiều lần. Đợi một phút rồi thử lại nhé.",
  UNKNOWN: "Không đăng nhập được lúc này. Thử lại sau nhé.",
};

const KID_MESSAGES: Record<LoginFailure | "UNKNOWN", string> = {
  INVALID: "Chưa đúng rồi, mình thử lại nhé!",
  LOCKED: "Mình nghỉ 10 phút rồi thử lại nhé. Ba mẹ đã được báo.",
  THROTTLED: "Mình nghỉ một chút rồi thử lại nhé.",
  UNKNOWN: "Có gì đó chưa ổn. Mình thử lại sau nhé.",
};

function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) return null;
  return value;
}

export async function adultLoginAction(
  _prev: AdultLoginState,
  formData: FormData,
): Promise<AdultLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!username || !password) return { error: ADULT_MESSAGES.INVALID };
  try {
    await signIn("adult", {
      username,
      password,
      remember: remember ? "true" : "false",
      redirect: false,
    });
  } catch (err) {
    return { error: ADULT_MESSAGES[failureOf(err)] };
  }
  // Redirect straight to the role home (or the forced password change) — no hop through "/".
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { role: true, mustChangePassword: true },
  });
  const home = user ? homeFor(user) : "/";
  redirect(user?.mustChangePassword ? home : (safeNext(formData.get("next")) ?? home));
}

export async function kidLoginAction(input: {
  userId: string;
  pin: string[];
}): Promise<{ error?: string }> {
  if (!input.userId || input.pin.length !== 4) return { error: KID_MESSAGES.INVALID };
  try {
    await signIn("kid-login", { userId: input.userId, pin: input.pin.join(","), redirect: false });
  } catch (err) {
    return { error: KID_MESSAGES[failureOf(err)] };
  }
  redirect("/kid/home");
}
