import { NextRequest, NextResponse } from "next/server";
import { isMockMode } from "@/lib/hira/client";
import { distinctItemNames, searchNonPayment } from "@/lib/hira/nonpayment";
import { HiraApiError } from "@/lib/hira/types";

/**
 * 지역(sidoCd/sgguCd) 내 비급여 항목을 모두 조회한 뒤,
 * itemName이 주어지면 해당 항목만 병원별 가격순으로 정렬해 반환하고,
 * 없으면 선택 가능한 항목명 목록만 반환한다.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const sidoCd = sp.get("sidoCd") ?? undefined;
  const sgguCd = sp.get("sgguCd") ?? undefined;
  const itemName = sp.get("itemName") ?? undefined;

  try {
    const result = await searchNonPayment({ sidoCd, sgguCd, numOfRows: 500 });
    const availableItemNames = distinctItemNames(result.items);

    if (!itemName) {
      return NextResponse.json({ availableItemNames, items: [], mock: isMockMode() });
    }

    const items = result.items
      .filter((i) => i.itemName === itemName)
      .sort((a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity));

    return NextResponse.json({ availableItemNames, items, mock: isMockMode() });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "비급여 진료비 비교 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
