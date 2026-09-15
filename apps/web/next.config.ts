import { existsSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Load the repo-root .env for local runs (Docker passes real env vars; override: false keeps them).
const rootEnv = join(__dirname, "..", "..", ".env");
if (existsSync(rootEnv)) loadEnv({ path: rootEnv, override: false, quiet: true });

const isProd = process.env.NODE_ENV === "production";

// Security headers (docs/12 §6, NFR-05). CSP stays "basic": Next needs inline scripts/styles.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob: data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not let Next write AGENTS.md/CLAUDE.md into apps/web — the repo root CLAUDE.md is the rulebook.
  agentRules: false,
  // Pure-TS workspace packages are compiled by Next; the DB package is a prebuilt CommonJS external.
  transpilePackages: ["@mtct/core", "@mtct/content", "@mtct/city"],
  serverExternalPackages: ["@mtct/db", "@prisma/client", "@node-rs/argon2"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
