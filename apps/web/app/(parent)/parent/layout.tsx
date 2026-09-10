import { AdultFrame } from "@/components/admin/adult-frame";
import { guardPage } from "@/lib/auth/session";

/** Parent area: PARENT or ADMIN. Checked again here besides proxy.ts. */
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await guardPage("parent");
  return <AdultFrame user={user}>{children}</AdultFrame>;
}
