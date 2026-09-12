import { healthReport, prisma } from "@mtct/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — the one endpoint that stays public (docs/08 pha 0 acceptance, pha 8 việc 3).
 *
 * Public because it is what you reach for when nothing else works: the Cloudflare Tunnel is up but
 * the page is blank, or the family is on a phone away from home and wants to know whether the
 * machine at home is still alive. It gives away nothing an attacker can use — no names, no counts
 * of children, no paths beyond the volume the files sit on.
 *
 * 200 when the database answers, 503 when it does not, whatever else is amber: a monitor should
 * page for "the database is gone", not for "the backup is eleven hours old".
 */
export async function GET() {
  const report = await healthReport(prisma);
  return NextResponse.json(report, { status: report.db.ok ? 200 : 503 });
}
