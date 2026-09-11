// Integration tests need the repo-root .env (DATABASE_URL). Loaded before any test file runs.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";

const rootEnv = join(__dirname, "..", "..", "..", ".env");
if (existsSync(rootEnv)) config({ path: rootEnv, override: false, quiet: true });
