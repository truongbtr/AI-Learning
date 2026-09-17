import { PrismaClient } from "../generated/client";

export * from "../generated/client";
export * from "./admin/dashboard";
export * from "./auth/bypass";
export * from "./chat";
export * from "./city";
export * from "./content/export";
export * from "./content/import";
export * from "./content/lexicon";
export * from "./content/stats";
export * from "./content/syllables";
export * from "./diary";
export * from "./intake";
export * from "./kid";
export * from "./lexeme/progress";
export * from "./maintenance/export-student";
export * from "./maintenance/reset-learning";
export * from "./maintenance/test-parents";
export * from "./maintenance/test-students";
export * from "./mastery/recompute";
export * from "./mastery/service";
export * from "./ops";
export * from "./parent";
export * from "./session";
export * from "./skills/import";
export * from "./skills/search";
export * from "./syllable/service";
export * from "./vocab/service";

const globalForPrisma = globalThis as unknown as { __mtctPrisma?: PrismaClient };

/** One PrismaClient per process (survives Next.js hot reload in dev). */
export const prisma: PrismaClient =
  globalForPrisma.__mtctPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.__mtctPrisma = prisma;
