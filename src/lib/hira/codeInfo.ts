import { fetchHiraApi, isMockMode } from "./client";
import { pickField } from "./field-utils";

/**
 * 건강보험심사평가원_병원코드정보서비스(codeInfoService)의 주소코드조회(getAddrCodeList).
 * addrTp=2(시군구) + sidoCd(6자리, 필수)로 호출하면 그 시도에 속한 시군구 코드/이름
 * 목록을 준다. 병원정보서비스의 sgguCd가 바로 이 코드 체계다(활용가이드로 확인).
 */
export interface AddrCode {
  code: string;
  name: string;
}

export async function fetchSgguList(sidoCd: string): Promise<AddrCode[]> {
  if (isMockMode() || !sidoCd) return [];

  const result = await fetchHiraApi("codeInfo", "getAddrCodeList", {
    addrTp: 2,
    sidoCd,
    numOfRows: 200,
  });

  return result.items.map((item) => ({
    code: pickField(item, ["addrCd"]) ?? "",
    name: pickField(item, ["addrCdNm"]) ?? "",
  }));
}
