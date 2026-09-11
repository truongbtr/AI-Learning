import { inboxCounts, prisma } from "@mtct/db";
import { guardianStudentIds } from "@/lib/auth/session";
import { visibleSections } from "@/lib/nav";
import type { SessionUser } from "@/types/next-auth";
import { AdminShell } from "./admin-shell";

const ROLE_LABEL = { ADMIN: "Quản trị", PARENT: "Phụ huynh", CHILD: "Con" } as const;

/** Server wrapper used by the (admin) and (parent) layouts: role-aware menu + account chip. */
export async function AdultFrame({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  // The badge on "Hộp thư duyệt": everything waiting for this grown-up, on every page.
  const studentIds = user.role === "ADMIN" ? null : await guardianStudentIds(user.id);
  const counts = await inboxCounts(prisma, studentIds);
  return (
    <AdminShell
      badges={{ inbox: counts.total }}
      sections={visibleSections(user.role)}
      user={{
        displayName: user.displayName,
        roleLabel: ROLE_LABEL[user.role],
        avatarKey: user.avatarKey,
      }}
    >
      {children}
    </AdminShell>
  );
}
