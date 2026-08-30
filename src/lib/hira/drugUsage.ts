import { fetchHiraApiAtUrl, isDrugUsageMockMode } from "./client";
import { pickField, pickNumberField } from "./field-utils";
import { mockDrugUsage } from "./mock";
import type { DrugUsageStat, PagedResult } from "./types";

/**
 * 건강보험심사평가원_의약품사용정보조회서비스 (data.go.kr 15047819).
 *
 * 급여의약품의 약효분류군/ATC코드/성분별 사용량을 진료년월·지역·기관종별·상병별로
 * 조회하는 서비스로, 12개 오퍼레이션으로 구성돼 있다. 정확한 오퍼레이션명과
 * 요청 파라미터를 문서로 확인하지 못했기 때문에, 아래 값들은 환경변수로만
 * 지정하도록 해뒀다 — HIRA_DRUG_USAGE_BASE_URL과 HIRA_DRUG_USAGE_OPERATION을
 * 둘 다 설정하기 전까지는 항상 mock 데이터로 동작한다(isDrugUsageMockMode 참고).
 *
 * 실제 연동 시 data.go.kr의 "활용신청 상세기능정보"에 나온 End Point와 오퍼레이션명,
 * 파라미터명을 그대로 넣고 아래 toDrugUsageStat의 필드 후보만 맞추면 된다.
 */
function toDrugUsageStat(item: Record<string, unknown>): DrugUsageStat {
  return {
    drugName: pickField(item, ["gnlNmCd", "ingdNm", "efcyGrpNm", "atcNm", "drugNm"]) ?? "",
    drugCode: pickField(item, ["atcCd", "efcyGrpCd", "gnlNmCd"]) ?? "",
    yearMonth: pickField(item, ["mdcareYm", "diagYm", "yearMonth"]) ?? "",
    sidoName: pickField(item, ["sidoNm", "sidoCdNm"]) ?? null,
    clinicType: pickField(item, ["clCdNm", "instNm"]) ?? null,
    usageCount: pickNumberField(item, ["useCnt", "useAmt", "cnt"]),
    usageAmount: pickNumberField(item, ["useCost", "amt", "cost"]),
  };
}

export interface DrugUsageSearchParams {
  yearMonth?: string;
  keyword?: string;
  pageNo?: number;
  numOfRows?: number;
}

export async function searchDrugUsage(params: DrugUsageSearchParams): Promise<PagedResult<DrugUsageStat>> {
  if (isDrugUsageMockMode()) {
    const items = mockDrugUsage({ keyword: params.keyword });
    return { items, pageNo: 1, numOfRows: items.length, totalCount: items.length };
  }

  const baseUrl = process.env.HIRA_DRUG_USAGE_BASE_URL!;
  const operation = process.env.HIRA_DRUG_USAGE_OPERATION!;
  const result = await fetchHiraApiAtUrl(baseUrl, operation, {
    mdcareYm: params.yearMonth,
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
