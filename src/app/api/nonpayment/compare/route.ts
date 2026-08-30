import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/hira/client";
import { searchNonPaymentByItem } from "@/lib/hira/nonpayment";
import { HiraApiError } from "@/lib/hira/types";

/** 선택된 비급여 항목(itemCode)을 파는 병원들을 지역/종별로 좁혀 가격순으로 비교한다. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const itemCode = sp.get("itemCode");
  if (!itemCode) {
    return NextResponse.json({ error: "itemCode가 필요합니다." }, { status: 400 });
  }

  try {
    const result = await searchNonPaymentByItem({
      itemCode,
      sidoCd: sp.get("sidoCd") ?? undefined,
      sgguCd: sp.get("sgguCd") ?? undefined,
      clCd: sp.get("clCd") ?? undefined,
      yadmNm: sp.get("yadmNm") ?? undefined,
    });

    const items = [...result.items].sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));
    return NextResponse.json({ ...result, items, mock: isMockMode() });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "비급여 진료비 비교 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
