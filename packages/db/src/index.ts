import { PrismaClient } from "../generated/client";

export * from "../generated/client";
export * from "./content/export";
export * from "./content/import";
export * from "./content/stats";
export * from "./mastery/service";
export * from "./session";
export * from "./skills/import";
export * from "./skills/search";

const globalForPrisma = globalThis as unknown as { __mtctPrisma?: PrismaClient };

/** One PrismaClient per process (survives Next.js hot reload in dev). */
export const prisma: PrismaClient =
  globalForPrisma.__mtctPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__mtctPrisma = prisma;
