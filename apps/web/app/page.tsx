import { redirect } from "next/navigation";
import { getSessionUser, homeFor } from "@/lib/auth/session";

/** "/" sends everyone to the right place for their role (proxy already redirects guests to /login). */
export default async function RootPage() {
  const user = await getSessionUser();
  redirect(user ? homeFor(user) : "/login");
}
