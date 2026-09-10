import { visibleSections } from "@/lib/nav";
import type { SessionUser } from "@/types/next-auth";
import { AdminShell } from "./admin-shell";

const ROLE_LABEL = { ADMIN: "Quản trị", PARENT: "Phụ huynh", CHILD: "Con" } as const;

/** Server wrapper used by the (admin) and (parent) layouts: role-aware menu + account chip. */
export function AdultFrame({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  return (
    <AdminShell
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
