import { PrismaClient } from "../generated/client";

export * from "../generated/client";

const globalForPrisma = globalThis as unknown as { __mtctPrisma?: PrismaClient };

/** One PrismaClient per process (survives Next.js hot reload in dev). */
export const prisma: PrismaClient =
  globalForPrisma.__mtctPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__mtctPrisma = prisma;
