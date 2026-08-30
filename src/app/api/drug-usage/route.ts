import { NextRequest, NextResponse } from "next/server";
import { isDrugUsageMockMode } from "@/lib/hira/client";
import { searchDrugUsage } from "@/lib/hira/drugUsage";
import { HiraApiError } from "@/lib/hira/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  try {
    const result = await searchDrugUsage({
      yearMonth: sp.get("yearMonth") ?? undefined,
      drugCode: sp.get("drugCode") ?? undefined,
      sidoCd: sp.get("sidoCd") ?? undefined,
      keyword: sp.get("keyword") ?? undefined,
    });
    return NextResponse.json({ ...result, mock: isDrugUsageMockMode() });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "의약품 사용정보 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
