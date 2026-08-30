import { NextRequest, NextResponse } from "next/server";
import { fetchSgguList } from "@/lib/hira/codeInfo";
import { HiraApiError } from "@/lib/hira/types";

/** 주어진 시도(sidoCd, 6자리)에 속한 시군구 코드/이름 목록. */
export async function GET(request: NextRequest) {
  const sidoCd = request.nextUrl.searchParams.get("sidoCd");
  if (!sidoCd) return NextResponse.json({ items: [] });

  try {
    const items = await fetchSgguList(sidoCd);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "시군구 목록 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
