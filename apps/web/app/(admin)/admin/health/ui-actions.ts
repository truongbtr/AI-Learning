"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { guardPage } from "@/lib/auth/session";
import { UI_COOKIE, UI_COOKIE_MAX_AGE } from "@/lib/kid/ui-mode";

/**
 * "Bật thành phố trên máy này" / "Tắt" (Pha 10b việc 6). Only an ADMIN, only this browser: the
 * cookie outlives logging out, so a parent can switch the child's own device on the real domain
 * and hand it over, while every other device keeps `KID_UI`.
 */
export async function setCityOnThisDevice(formData: FormData): Promise<void> {
  const user = await guardPage("admin");
  if (user.role !== "ADMIN") return;
  const store = await cookies();
  if (formData.get("mode") === "city") {
    store.set(UI_COOKIE, "city", {
      maxAge: UI_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  } else {
    store.delete(UI_COOKIE);
  }
  revalidatePath("/admin/health");
}
