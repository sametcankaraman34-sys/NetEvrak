import { NextResponse } from "next/server";

import { loadAccountingBasicTemplate } from "@/lib/rules/loadAccountingBasicTemplate";

export async function GET() {
  try {
    const template = await loadAccountingBasicTemplate();
    return NextResponse.json({ ok: true, template }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "TEMPLATE_LOAD_FAILED" },
      { status: 500 }
    );
  }
}

