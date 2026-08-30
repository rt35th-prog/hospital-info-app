import { fetchHiraApi, isMockMode } from "./client";
import { pickField, pickNumberField } from "./field-utils";
import { mockGetHospital, mockSearchHospitals } from "./mock";
import type { Hospital, PagedResult } from "./types";

function toHospital(item: Record<string, unknown>): Hospital {
  return {
    ykiho: pickField(item, ["ykiho"]) ?? "",
    name: pickField(item, ["yadmNm"]) ?? "이름없음",
    clinicType: pickField(item, ["clCdNm"]) ?? "",
    sidoName: pickField(item, ["sidoCdNm"]) ?? "",
    sgguName: pickField(item, ["sgguCdNm"]) ?? "",
    address: pickField(item, ["addr"]) ?? "",
    tel: pickField(item, ["telno"]) ?? null,
    homepage: pickField(item, ["hospUrl"]) ?? null,
    establishedDate: pickField(item, ["estbDd"]) ?? null,
    doctorTotalCount: pickNumberField(item, ["drTotCnt"]),
    latitude: pickNumberField(item, ["YPos", "yPos"]),
    longitude: pickNumberField(item, ["XPos", "xPos"]),
  };
}

export interface HospitalSearchParams {
  sidoCd?: string;
  sgguCd?: string;
  dgsbjtCd?: string;
  yadmNm?: string;
  pageNo?: number;
  numOfRows?: number;
}

export async function searchHospitals(params: HospitalSearchParams): Promise<PagedResult<Hospital>> {
  if (isMockMode()) {
    const items = mockSearchHospitals({ sidoCd: params.sidoCd, name: params.yadmNm });
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const result = await fetchHiraApi("hospInfo", "getHospBasisList1", {
    sidoCd: params.sidoCd,
    sgguCd: params.sgguCd,
    dgsbjtCd: params.dgsbjtCd,
    yadmNm: params.yadmNm,
    pageNo: params.pageNo,
    numOfRows: params.numOfRows,
  });

  return {
    items: result.items.map(toHospital),
    pageNo: result.pageNo,
    numOfRows: result.numOfRows,
    totalCount: result.totalCount,
  };
}

export async function getHospital(ykiho: string): Promise<Hospital | undefined> {
  if (isMockMode()) {
    return mockGetHospital(ykiho);
  }

  // ykiho를 단건 조회 필터로 사용할 수 있다는 가정 하에 작성했다(다른 HIRA API들과 동일한
  // 관례). 실제 응답에서 동작하지 않으면 목록을 pageNo/numOfRows로 순회하며 찾아야 한다.
  const result = await fetchHiraApi("hospInfo", "getHospBasisList1", { ykiho, numOfRows: 1 });
  const item = result.items[0];
  return item ? toHospital(item) : undefined;
}
