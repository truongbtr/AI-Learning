import { guardPage } from "@/lib/auth/session";

/** Kid area: only CHILD (ADMIN in preview mode). Checked again here besides proxy.ts. */
export default async function KidLayout({ children }: { children: React.ReactNode }) {
  await guardPage("kid");
  return <div className="kid-world text-slate-800">{children}</div>;
}
