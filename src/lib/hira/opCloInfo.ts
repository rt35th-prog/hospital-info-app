import { fetchHiraApi, isMockMode } from "./client";
import { pickField } from "./field-utils";
import { mockOpCloList } from "./mock";
import type { OpCloRecord, PagedResult } from "./types";

/**
 * 건강보험심사평가원_요양기관개폐업정보조회서비스, getHospPharmacyOpCloList1
 * (병원약국개폐업목록조회). 요청 파라미터는 활용신청 상세기능정보로 확인했다:
 * crtrYm(기준년월, 필수로 추정), yadmTp(0전체/1병원/2약국),
 * opCloTp(0전체/1개업/2폐업/3휴업), sidoCd(6자리).
 *
 * 응답 필드명은 확인할 방법이 없었다(참고문서 없음, 포털 미리보기도 오류).
 * 다른 서비스들의 명명 관례를 따를 것으로 가정해 후보 필드명으로 파싱한다.
 */
function toOpCloRecord(item: Record<string, unknown>): OpCloRecord {
  return {
    ykiho: pickField(item, ["ykiho"]) ?? null,
    name: pickField(item, ["yadmNm"]) ?? "",
    institutionType: pickField(item, ["yadmTpNm", "clCdNm"]) ?? null,
    statusName: pickField(item, ["opCloTpNm", "opCloTpCdNm"]) ?? null,
    address: pickField(item, ["addr"]) ?? null,
    tel: pickField(item, ["telno"]) ?? null,
    baseYearMonth: pickField(item, ["crtrYm"]) ?? null,
  };
}

export interface OpCloSearchParams {
  yearMonth: string;
  yadmTp?: "0" | "1" | "2";
  opCloTp?: "0" | "1" | "2" | "3";
  sidoCd?: string;
  pageNo?: number;
  numOfRows?: number;
}

export async function searchOpCloList(params: OpCloSearchParams): Promise<PagedResult<OpCloRecord>> {
  if (isMockMode()) {
    const items = mockOpCloList();
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const result = await fetchHiraApi("opCloInfo", "getHospPharmacyOpCloList1", {
    crtrYm: params.yearMonth,
    yadmTp: params.yadmTp,
    opCloTp: params.opCloTp,
    sidoCd: params.sidoCd,
    pageNo: params.pageNo,
    numOfRows: params.numOfRows ?? 50,
  });

  return {
    items: result.items.map(toOpCloRecord),
    pageNo: result.pageNo,
    numOfRows: result.numOfRows,
    totalCount: result.totalCount,
  };
}
