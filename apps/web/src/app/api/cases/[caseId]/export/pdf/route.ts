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

    const lines = [
      `NetEvrak Case Report`,
      `Case: ${report.case.id} (${report.case.sector})`,
      `Profile: ${report.profileLabel}`,
      `Uploaded: ${report.summary.uploadedCount}`,
      `PASS: ${report.summary.passCount} | REVIEW: ${report.summary.reviewCount} | FAIL: ${report.summary.failCount} | MISSING: ${report.summary.missingCount}`,
      "Missing Documents:",
      ...report.missingDocuments.map((d) => `- ${d.label}`),
    ];
    const pdf = createSimplePdf(lines);
    const fileName = `report_${report.case.id}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    captureError(err, { route: "GET /api/cases/:caseId/export/pdf" });
    return NextResponse.json({ error: "EXPORT_PDF_FAILED" }, { status: 500 });
  }
}

function createSimplePdf(lines: string[]): Uint8Array {
  const textOps = lines
    .slice(0, 35)
    .map((line, idx) => `${idx === 0 ? "72 760 Td" : "0 -16 Td"} (${escapePdf(line)}) Tj`)
    .join("\n");
  const contentStream = `BT\n/F1 12 Tf\n${textOps}\nET`;

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n"
  );
  objects.push(
    `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  );
  objects.push("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function escapePdf(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

