import { NextResponse } from "next/server";
import { isMockMode } from "@/lib/hira/client";
import { searchNonPayment } from "@/lib/hira/nonpayment";
import { HiraApiError } from "@/lib/hira/types";

export async function GET(_request: Request, ctx: RouteContext<"/api/hospitals/[ykiho]/nonpayment">) {
  const { ykiho } = await ctx.params;
  try {
    const result = await searchNonPayment({ ykiho, numOfRows: 200 });
    return NextResponse.json({ ...result, mock: isMockMode() });
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "비급여 진료비 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
