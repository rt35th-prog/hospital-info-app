import { NextResponse } from "next/server";
import { getHospital } from "@/lib/hira/hospitals";
import { HiraApiError } from "@/lib/hira/types";

export async function GET(_request: Request, ctx: RouteContext<"/api/hospitals/[ykiho]">) {
  const { ykiho } = await ctx.params;
  try {
    const hospital = await getHospital(ykiho);
    if (!hospital) {
      return NextResponse.json({ error: "병원을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json(hospital);
  } catch (err) {
    const message = err instanceof HiraApiError ? err.message : "병원 상세 조회 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
