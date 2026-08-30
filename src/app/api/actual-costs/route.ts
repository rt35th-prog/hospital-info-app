import { NextRequest, NextResponse } from "next/server";
import {
  ACTUAL_COST_DATASETS,
  actualCostDatasetMeta,
  loadActualCostStats,
  type ActualCostDatasetKey,
} from "@/lib/actualCostStats";

const VALID_KEYS = ACTUAL_COST_DATASETS.map((d) => d.key);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const key = sp.get("dataset") as ActualCostDatasetKey | null;
  const sortBy = sp.get("sortBy") === "patient" ? "patientCount" : "totalCost";
  const keyword = sp.get("q")?.trim();

  if (!key || !VALID_KEYS.includes(key)) {
    return NextResponse.json({ error: "유효한 dataset 파라미터가 필요합니다." }, { status: 400 });
  }

  let items = loadActualCostStats(key);
  if (keyword) {
    items = items.filter((i) => i.label.includes(keyword));
  }
  items = [...items].sort((a, b) => b[sortBy] - a[sortBy]);

  return NextResponse.json({ items, meta: actualCostDatasetMeta(key) });
}
