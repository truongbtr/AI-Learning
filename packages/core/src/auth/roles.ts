/** Three roles on one User table (docs/12 §1). */
export type Role = "ADMIN" | "PARENT" | "CHILD";

export type Area = "kid" | "parent" | "admin";

/** Which areas of the site each role may enter (docs/02 §6). */
export function roleAllowsArea(role: Role, area: Area): boolean {
  switch (area) {
    case "admin":
      return role === "ADMIN";
    case "parent":
      return role === "ADMIN" || role === "PARENT";
    case "kid":
      // ADMIN may open /kid in preview mode (docs/12 §1); PARENT may not.
      return role === "CHILD" || role === "ADMIN";
  }
}

export interface Principal {
  role: Role;
  /** Student profile id when role = CHILD. */
  studentId?: string | null;
  /** Student ids linked through StudentGuardian when role = PARENT/ADMIN. */
  guardianStudentIds?: readonly string[];
}

/**
 * Server-side rule for any endpoint touching a student's data:
 * CHILD only its own student; PARENT only linked students; ADMIN everything.
 */
export function canAccessStudent(principal: Principal, targetStudentId: string): boolean {
  if (!targetStudentId) return false;
  switch (principal.role) {
    case "ADMIN":
      return true;
    case "PARENT":
      return (principal.guardianStudentIds ?? []).includes(targetStudentId);
    case "CHILD":
      return principal.studentId === targetStudentId;
  }
}
