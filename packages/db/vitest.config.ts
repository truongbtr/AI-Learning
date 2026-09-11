import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    passWithNoTests: true,
    // Integration tests share one PostgreSQL; run files one after another.
    fileParallelism: false,
    setupFiles: ["src/test-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
