import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/hira/client";
import { searchOpCloList } from "@/lib/hira/opCloInfo";
import { HiraApiError } from "@/lib/hira/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const yearMonth = sp.get("yearMonth");
  if (!yearMonth) {
    return NextResponse.json({ error: "yearMonth(기준년월, YYYYMM)가 필요합니다." }, { status: 400 });
  }

  try {
    const result = await searchOpCloList({
      yearMonth,
      yadmTp: (sp.get("yadmTp") as "0" | "1" | "2" | null) ?? undefined,
      opCloTp: (sp.get("opCloTp") as "0" | "1" | "2" | "3" | null) ?? undefined,
      sidoCd: sp.get("sidoCd") ?? undefined,
    });
    return NextResponse.json({ ...result, mock: isMockMode() });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "개폐업 정보 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
