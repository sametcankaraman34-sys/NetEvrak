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

    const rows: string[] = [];
    rows.push("section,code,label,status,reason,field_key,field_label,field_value,confidence,is_valid");
    for (const item of report.checklist) {
      rows.push(
        `checklist,${escapeCsv(item.code)},${escapeCsv(item.label)},${item.status},${escapeCsv(item.reason)},,,,`
      );
    }
    for (const field of report.fieldResults) {
      rows.push(
        `field,${escapeCsv(field.documentType)},,,,${
          escapeCsv("")
        },${escapeCsv(field.fieldKey)},${escapeCsv(field.fieldLabel)},${escapeCsv(field.fieldValue)},${field.confidence.toFixed(
          2
        )},${field.isValid}`
      );
    }

    const fileName = `report_${report.case.id}.csv`;
    return new NextResponse(rows.join("\n"), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    captureError(err, { route: "GET /api/cases/:caseId/export/excel" });
    return NextResponse.json({ error: "EXPORT_EXCEL_FAILED" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  const normalized = value.replace(/"/g, '""');
  return `"${normalized}"`;
}

