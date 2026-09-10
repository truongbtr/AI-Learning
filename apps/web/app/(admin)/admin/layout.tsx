import { AdultFrame } from "@/components/admin/adult-frame";
import { guardPage } from "@/lib/auth/session";

/** Admin area: ADMIN only. Checked again here besides proxy.ts. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await guardPage("admin");
  return <AdultFrame user={user}>{children}</AdultFrame>;
}
