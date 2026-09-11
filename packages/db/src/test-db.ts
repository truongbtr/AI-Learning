/**
 * Helpers for the integration tests: a PrismaClient against the dev database and a throw-away
 * Student (with its CHILD user) that is deleted again afterwards. Tests skip themselves when no
 * database is reachable, so `pnpm test` still passes on a machine without Docker running.
 */
import { PrismaClient } from "../generated/client";

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

let client: PrismaClient | null = null;

export function testDb(): PrismaClient {
  if (!client) client = new PrismaClient({ log: ["error"] });
  return client;
}

export async function databaseReachable(): Promise<boolean> {
  if (!hasDatabaseUrl) return false;
  try {
    await testDb().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectTestDb(): Promise<void> {
  if (client) await client.$disconnect();
  client = null;
}

export interface TempStudent {
  id: string;
  userId: string;
  slug: string;
}

/** Creates an isolated student for one test file; `removeTempStudent` cascades everything away. */
export async function createTempStudent(label: string): Promise<TempStudent> {
  const db = testDb();
  const slug = `test-${label}-${Date.now().toString(36)}`;
  const user = await db.user.create({
    data: {
      username: slug,
      displayName: `Test ${label}`,
      role: "CHILD",
      isActive: false, // never usable for a real login
    },
  });
  const student = await db.student.create({
    data: {
      userId: user.id,
      slug,
      fullName: `Test ${label}`,
      nickname: `Test ${label}`,
      birthDate: new Date(Date.UTC(2020, 0, 1)),
      grade: 1,
      className: "1B3",
      schoolYear: "2026-2027",
      isActive: false,
    },
  });
  return { id: student.id, userId: user.id, slug };
}

export async function removeTempStudent(s: TempStudent | null): Promise<void> {
  if (!s) return;
  const db = testDb();
  await db.student.deleteMany({ where: { id: s.id } });
  await db.user.deleteMany({ where: { id: s.userId } });
}
