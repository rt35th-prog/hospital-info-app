import { NextRequest, NextResponse } from "next/server";
import { searchNonPaymentCatalog } from "@/lib/hira/nonpayment";
import { HiraApiError } from "@/lib/hira/types";

/** 비급여 항목명 자동완성. 이름으로 itemCode를 몰라도 찾을 수 있게 해준다. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const items = await searchNonPaymentCatalog(q);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "비급여 항목 검색 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
