import { NextResponse } from "next/server";

import { getPrismaOrNull } from "@/lib/db/prisma";
import { captureError } from "@/lib/monitoring";
import { buildCaseReport } from "@/features/report/services/buildCaseReport";

export async function GET(
  req: Request,
  context: { params: { caseId: string } }
) {
  try {
    const caseId = context.params.caseId;
    if (!caseId) {
      return NextResponse.json({ error: "CASE_ID_REQUIRED" }, { status: 400 });
    }

    const profileCode = new URL(req.url).searchParams.get("profile") ?? undefined;
    const report = await buildCaseReport({
      caseId,
      profileCode,
      prisma: getPrismaOrNull(),
    });
    if (!report) {
      return NextResponse.json({ error: "CASE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, report }, { status: 200 });
  } catch (err) {
    captureError(err, { route: "GET /api/cases/:caseId/report" });
    return NextResponse.json({ error: "REPORT_FETCH_FAILED" }, { status: 500 });
  }
}

