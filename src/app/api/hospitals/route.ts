import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/hira/client";
import { searchHospitals } from "@/lib/hira/hospitals";
import { HiraApiError } from "@/lib/hira/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  try {
    const result = await searchHospitals({
      sidoCd: sp.get("sidoCd") ?? undefined,
      sgguCd: sp.get("sgguCd") ?? undefined,
      dgsbjtCd: sp.get("dgsbjtCd") ?? undefined,
      yadmNm: sp.get("yadmNm") ?? undefined,
      pageNo: sp.get("pageNo") ? Number(sp.get("pageNo")) : undefined,
      numOfRows: sp.get("numOfRows") ? Number(sp.get("numOfRows")) : 20,
    });
    return NextResponse.json({ ...result, mock: isMockMode() });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "병원 검색 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
