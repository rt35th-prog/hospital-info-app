import { NextRequest, NextResponse } from "next/server";
import { diseaseStatsSourceNote, isDiseaseStatsSample, loadDiseaseStats } from "@/lib/diseaseStats";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const visitType = sp.get("visitType");
  const sortBy = sp.get("sortBy") === "avg" ? "avgCostPerPatient" : "totalCost";

  let items = loadDiseaseStats();
  if (visitType && visitType !== "전체") {
    items = items.filter((d) => d.visitType === visitType);
  }
  items = [...items].sort((a, b) => b[sortBy] - a[sortBy]);

  return NextResponse.json({
    items,
    isSample: isDiseaseStatsSample(),
    note: isDiseaseStatsSample() ? diseaseStatsSourceNote() : null,
  });
}
