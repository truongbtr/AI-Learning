import { prisma } from "@mtct/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WORKER_STALE_MS = 6 * 60 * 1000;

/** GET /api/health → { db: "ok", worker: { lastPing, ok } } (docs/08 pha 0 acceptance). */
export async function GET() {
  let db: "ok" | "error" = "ok";
  let lastPing: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ping = await prisma.setting.findUnique({ where: { key: "worker.lastPing" } });
    const value = ping?.value as { at?: string } | null;
    lastPing = value?.at ?? null;
  } catch (err) {
    console.error("[health] db check failed", err);
    db = "error";
  }
  const ageMs = lastPing ? Date.now() - new Date(lastPing).getTime() : null;
  const workerOk = ageMs !== null && ageMs <= WORKER_STALE_MS;
  const body = {
    status: db === "ok" && workerOk ? "ok" : db === "ok" ? "degraded" : "error",
    db,
    worker: {
      lastPing,
      ageSeconds: ageMs === null ? null : Math.round(ageMs / 1000),
      ok: workerOk,
    },
    time: new Date().toISOString(),
  };
  return NextResponse.json(body, { status: db === "ok" ? 200 : 503 });
}
