import { fetchHiraApi, isMockMode } from "./client";
import { pickField, pickNumberField } from "./field-utils";
import { mockGetHospital, mockSearchHospitals } from "./mock";
import { HiraApiError } from "./types";
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
  clCd?: string;
  yadmNm?: string;
  pageNo?: number;
  numOfRows?: number;
}

export async function searchHospitals(params: HospitalSearchParams): Promise<PagedResult<Hospital>> {
  if (isMockMode()) {
    const items = mockSearchHospitals({ sidoCd: params.sidoCd, name: params.yadmNm });
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const result = await fetchHiraApi("hospInfo", "getHospBasisList", {
    sidoCd: params.sidoCd,
    sgguCd: params.sgguCd,
    dgsbjtCd: params.dgsbjtCd,
    clCd: params.clCd,
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

  // 병원정보서비스(getHospBasisList)는 요청 파라미터 목록에 ykiho가 없어 단건 조회를
  // 지원하지 않는다(data.go.kr 활용신청 상세기능정보로 확인). 그래서 병원 상세 화면은
  // 검색 목록에서 클릭할 때 넘겨받은 정보를 그대로 쓰고, 이 함수는 그 정보가 없을 때만
  // (예: 상세 페이지 새로고침) 호출돼 명확한 안내 에러를 낸다.
  throw new HiraApiError(
    "병원정보서비스는 병원 단건 조회(ykiho)를 지원하지 않습니다. 병원 검색 목록에서 다시 선택해주세요.",
  );
}
