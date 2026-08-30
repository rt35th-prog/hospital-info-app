import { fetchHiraApi, isDrugUsageMockMode } from "./client";
import { pickField, pickNumberField } from "./field-utils";
import { mockDrugUsage } from "./mock";
import type { DrugUsageStat, PagedResult } from "./types";

/**
 * 건강보험심사평가원_의약품사용정보조회서비스 (data.go.kr 15047819)의
 * "성분별지역별사용량목록조회"(getCmpnAreaList1.2) 오퍼레이션.
 *
 * 요청 파라미터(data.go.kr 활용신청 상세기능정보에서 확인):
 * - diagYm: 진료년월 (예: 202001)
 * - gnlNmCd: 성분코드 (예: 100701ACH) — 건강보험심사평가원 약제급여목록표 등에서 확인 가능
 * - insupTp: 보험자구분 (0:전체, 4:건강보험, 5:의료급여, 7:보훈)
 * - cpmdPrscTp: 조제기준/처방기준 구분 (01:조제기준, 02:처방기준)
 * - sidoCd/sgguCd: 시도/시군구코드 — 병원코드정보서비스 > 주소코드조회(getAddrCodeList)
 *   기준 코드이며, 병원정보서비스(hospInfoServicev2)의 2자리 시도코드와는 체계가 다르다.
 *   여기서는 2자리 코드 뒤에 "0000"을 붙인 값으로 근사한다(예: 서울 11 -> 110000).
 *   정확한 시군구코드까지는 확인하지 못해 sgguCd는 비워둔다.
 *
 * 응답 필드명은 문서로 확인하지 못해 후보 필드명으로 방어적으로 파싱한다.
 * 실제 호출 결과가 다르면 아래 candidate 배열만 조정하면 된다.
 */
function toDrugUsageStat(item: Record<string, unknown>): DrugUsageStat {
  return {
    drugName: pickField(item, ["gnlNm", "gnlNmCd", "ingdNm", "drugNm"]) ?? "",
    drugCode: pickField(item, ["gnlNmCd", "atcCd"]) ?? "",
    yearMonth: pickField(item, ["diagYm", "mdcareYm", "yearMonth"]) ?? "",
    sidoName: pickField(item, ["sidoNm", "sidoCdNm"]) ?? null,
    sgguName: pickField(item, ["sgguNm", "sgguCdNm"]) ?? null,
    usageCount: pickNumberField(item, ["useQty", "useCnt", "cnt"]),
    usageAmount: pickNumberField(item, ["useAmt", "useCost", "amt"]),
  };
}

/** 2자리 시도코드(regions.ts)를 이 API가 쓰는 6자리 코드로 근사 변환한다. */
function toDrugUsageSidoCd(sidoCd2: string): string {
  return `${sidoCd2}0000`;
}

export interface DrugUsageSearchParams {
  yearMonth?: string;
  /** 성분코드(gnlNmCd). 예: 100701ACH */
  drugCode?: string;
  /** 2자리 시도코드(regions.ts 기준). 내부적으로 6자리로 변환해 요청한다. */
  sidoCd?: string;
  keyword?: string;
  pageNo?: number;
  numOfRows?: number;
}

export async function searchDrugUsage(params: DrugUsageSearchParams): Promise<PagedResult<DrugUsageStat>> {
  if (isDrugUsageMockMode()) {
    const items = mockDrugUsage({ keyword: params.keyword });
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const result = await fetchHiraApi("drugUsage", "getCmpnAreaList1.2", {
    diagYm: params.yearMonth,
    gnlNmCd: params.drugCode,
    sidoCd: params.sidoCd ? toDrugUsageSidoCd(params.sidoCd) : undefined,
    insupTp: "0",
    cpmdPrscTp: "01",
    pageNo: params.pageNo,
    numOfRows: params.numOfRows ?? 50,
  });

  const items = result.items
    .map(toDrugUsageStat)
    .filter((d) => !params.keyword || d.drugName.includes(params.keyword));

  return {
    items,
    pageNo: result.pageNo,
    numOfRows: result.numOfRows,
    totalCount: result.totalCount,
  };
}
